import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeeApi } from "@/lib/api";
import type { Employee, CreateEmployeeRequest } from "@shared/api";
import { useToast } from "@/hooks/use-toast";

// Query keys for better cache management
export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (filters: string) => [...employeeKeys.lists(), { filters }] as const,
  details: () => [...employeeKeys.all, "detail"] as const,
  detail: (id: number) => [...employeeKeys.details(), id] as const,
  stats: () => [...employeeKeys.all, "stats"] as const,
};

/**
 * Hook to fetch all employees with automatic caching and refetching
 */
export function useEmployees() {
  return useQuery({
    queryKey: employeeKeys.lists(),
    queryFn: async () => {
      const response = await employeeApi.getAll();
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single employee by ID
 */
export function useEmployee(id: number) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: async () => {
      const response = await employeeApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch employee statistics
 */
export function useEmployeeStats() {
  return useQuery({
    queryKey: employeeKeys.stats(),
    queryFn: async () => {
      const response = await employeeApi.getStats();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new employee with optimistic updates
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateEmployeeRequest) => {
      const response = await employeeApi.create(data);
      return response.data;
    },
    onMutate: async (newEmployee) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: employeeKeys.lists() });

      // Snapshot the previous value
      const previousEmployees = queryClient.getQueryData<Employee[]>(
        employeeKeys.lists()
      );

      // Optimistically update to the new value
      if (previousEmployees) {
        const optimisticEmployee: Employee = {
          id: Date.now(), // Temporary ID
          first_name: newEmployee.firstName,
          last_name: newEmployee.lastName,
          email: newEmployee.email,
          phone: newEmployee.phone,
          address: newEmployee.address,
          position: newEmployee.position,
          department_id: newEmployee.departmentId,
          salary: newEmployee.salary,
          hire_date: newEmployee.hireDate,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          contract_type: newEmployee.contractType,
          contract_start_date: newEmployee.contractStartDate,
          contract_end_date: newEmployee.contractEndDate,
          contract_status: "active",
          active_projects: 0,
          department_name: "",
        };

        queryClient.setQueryData<Employee[]>(employeeKeys.lists(), (old) => [
          ...(old || []),
          optimisticEmployee,
        ]);
      }

      // Return context with the snapshot
      return { previousEmployees };
    },
    onError: (err, newEmployee, context) => {
      // Rollback to the previous value on error
      if (context?.previousEmployees) {
        queryClient.setQueryData(employeeKeys.lists(), context.previousEmployees);
      }

      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la création de l'employé",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "✅ Employé créé avec succès",
        description: `${variables.firstName} ${variables.lastName} a été ajouté à l'équipe`,
      });
    },
    onSettled: async () => {
      // Always refetch after error or success to sync with server
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: employeeKeys.stats() }),
      ]);
    },
  });
}

/**
 * Hook to update an existing employee with optimistic updates
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateEmployeeRequest>;
    }) => {
      const response = await employeeApi.update(id, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: employeeKeys.lists() });
      await queryClient.cancelQueries({ queryKey: employeeKeys.detail(id) });

      const previousEmployees = queryClient.getQueryData<Employee[]>(
        employeeKeys.lists()
      );

      // Optimistically update the employee in the list
      if (previousEmployees) {
        queryClient.setQueryData<Employee[]>(employeeKeys.lists(), (old) =>
          old?.map((emp) =>
            emp.id === id
              ? {
                  ...emp,
                  first_name: data.firstName ?? emp.first_name,
                  last_name: data.lastName ?? emp.last_name,
                  email: data.email ?? emp.email,
                  phone: data.phone ?? emp.phone,
                  address: data.address ?? emp.address,
                  position: data.position ?? emp.position,
                  department_id: data.departmentId ?? emp.department_id,
                  salary: data.salary ?? emp.salary,
                  updated_at: new Date().toISOString(),
                }
              : emp
          ) || []
        );
      }

      return { previousEmployees };
    },
    onError: (err, variables, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(employeeKeys.lists(), context.previousEmployees);
      }

      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la modification",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Employé mis à jour avec succès",
      });
    },
    onSettled: async (data, error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.id) }),
        queryClient.invalidateQueries({ queryKey: employeeKeys.stats() }),
      ]);
    },
  });
}

/**
 * Hook to delete an employee with optimistic updates
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      await employeeApi.delete(id);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: employeeKeys.lists() });

      const previousEmployees = queryClient.getQueryData<Employee[]>(
        employeeKeys.lists()
      );

      // Optimistically remove from the list
      if (previousEmployees) {
        queryClient.setQueryData<Employee[]>(
          employeeKeys.lists(),
          (old) => old?.filter((emp) => emp.id !== id) || []
        );
      }

      return { previousEmployees };
    },
    onError: (err, id, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(employeeKeys.lists(), context.previousEmployees);
      }

      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la suppression",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Employé supprimé avec succès",
      });
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: employeeKeys.stats() }),
      ]);
    },
  });
}
