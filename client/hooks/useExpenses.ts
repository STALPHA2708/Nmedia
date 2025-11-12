import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expenseApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const expenseKeys = {
  all: ["expenses"] as const,
  lists: () => [...expenseKeys.all, "list"] as const,
  list: (filters: string) => [...expenseKeys.lists(), { filters }] as const,
  details: () => [...expenseKeys.all, "detail"] as const,
  detail: (id: number) => [...expenseKeys.details(), id] as const,
  stats: () => [...expenseKeys.all, "stats"] as const,
  categories: () => [...expenseKeys.all, "categories"] as const,
};

/**
 * Hook to fetch all expenses with caching
 */
export function useExpenses() {
  return useQuery({
    queryKey: expenseKeys.lists(),
    queryFn: async () => {
      try {
        const response = await expenseApi.getAll();
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error("Error fetching expenses:", error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while refetching
    retry: 2,
  });
}

/**
 * Hook to fetch expense statistics
 */
export function useExpenseStats() {
  return useQuery({
    queryKey: expenseKeys.stats(),
    queryFn: async () => {
      try {
        const response = await expenseApi.getStats();
        return response.data;
      } catch (error) {
        console.error("Error fetching expense stats:", error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook to fetch expense categories
 */
export function useExpenseCategories() {
  return useQuery({
    queryKey: expenseKeys.categories(),
    queryFn: async () => {
      try {
        const response = await expenseApi.getCategories();
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error("Error fetching expense categories:", error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - categories rarely change
    retry: 2,
  });
}

/**
 * Hook to create a new expense
 */
export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await expenseApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "✅ Dépense créée avec succès",
        description: "La dépense a été enregistrée",
      });
    },
    onError: (err) => {
      console.error("Error creating expense:", err);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la création de la dépense",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Fire cache invalidations without awaiting - let them run in background
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.stats() });
    },
  });
}

/**
 * Hook to update an expense
 */
export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await expenseApi.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Dépense mise à jour avec succès",
      });
    },
    onError: (err) => {
      console.error("Error updating expense:", err);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la modification",
        variant: "destructive",
      });
    },
    onSettled: (data, error, variables) => {
      // Fire cache invalidations without awaiting - let them run in background
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.stats() });
    },
  });
}

/**
 * Hook to delete an expense
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      await expenseApi.delete(id);
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Dépense supprimée avec succès",
      });
    },
    onError: (err) => {
      console.error("Error deleting expense:", err);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la suppression",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Fire cache invalidations without awaiting - let them run in background
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.stats() });
    },
  });
}

/**
 * Hook to approve an expense
 */
export function useApproveExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await expenseApi.approve(id);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Dépense approuvée avec succès",
      });
    },
    onError: (err) => {
      console.error("Error approving expense:", err);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de l'approbation",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Fire cache invalidations without awaiting - let them run in background
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.stats() });
    },
  });
}

/**
 * Hook to reject an expense
 */
export function useRejectExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await expenseApi.reject(id, reason);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Dépense rejetée",
      });
    },
    onError: (err) => {
      console.error("Error rejecting expense:", err);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors du rejet",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Fire cache invalidations without awaiting - let them run in background
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.stats() });
    },
  });
}

/**
 * Hook to bulk delete expenses
 */
export function useBulkDeleteExpenses() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (expenseIds: number[]) => {
      const response = await fetch("/api/expenses/bulk", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expenseIds }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression en lot");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Succès",
        description: `${data.data.deletedCount} dépense(s) supprimée(s)`,
      });
    },
    onError: (err) => {
      console.error("Error bulk deleting expenses:", err);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la suppression en lot",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Fire cache invalidations without awaiting - let them run in background
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.stats() });
    },
  });
}
