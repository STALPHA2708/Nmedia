import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import { useDebounce } from "use-debounce";

// Custom hooks
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDepartments";
import { useContractTypes } from "@/hooks/useContractTypes";

// Components
import { EmployeeStats } from "@/components/employees/EmployeeStats";
import { EmployeeCard } from "@/components/employees/EmployeeCard";
import { EmployeeSkeletonGrid } from "@/components/employees/EmployeeCardSkeleton";

import type { Employee } from "@shared/api";

/**
 * Optimized Employees page with React Query, debouncing, and component splitting
 */
export default function EmployeesOptimized() {
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Debounce search for better performance
  const [debouncedSearch] = useDebounce(searchTerm, 300);

  // React Query hooks
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments();
  const { data: contractTypes = [] } = useContractTypes();

  // Mutations
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();

  // Handlers
  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
  };

  const handleEditEmployee = (employee: Employee) => {
    // TODO: Open edit dialog
    console.log("Edit employee:", employee);
  };

  const handleDeleteEmployee = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteEmployeeMutation.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewContracts = (employee: Employee) => {
    setSelectedEmployee(employee);
    // TODO: Navigate to contracts tab
  };

  // Filtered employees with debounced search
  const filteredEmployees = React.useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch =
        employee.first_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        employee.last_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        employee.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        employee.position?.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesDepartment =
        filterDepartment === "all" ||
        employee.department_id?.toString() === filterDepartment;

      const matchesStatus =
        filterStatus === "all" || employee.status === filterStatus;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, debouncedSearch, filterDepartment, filterStatus]);

  const isLoading = employeesLoading || departmentsLoading;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Équipe</h1>
          <p className="text-lg text-muted-foreground">
            Gérez votre équipe, contrats et affectations aux projets
          </p>
        </div>
        <Button
          size="lg"
          className="shadow-md"
          onClick={() => {
            // TODO: Open create dialog
            console.log("Create new employee");
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvel Employé
        </Button>
      </div>

      {/* Stats Cards */}
      {!isLoading && (
        <EmployeeStats employees={employees} departments={departments} />
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un employé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Département" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les départements</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Inactifs</SelectItem>
              <SelectItem value="on_leave">En congé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Employee Grid */}
      {isLoading ? (
        <EmployeeSkeletonGrid count={6} />
      ) : filteredEmployees.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 auto-rows-fr">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onView={handleViewEmployee}
              onEdit={handleEditEmployee}
              onDelete={handleDeleteEmployee}
              onViewContracts={handleViewContracts}
              isDeleting={deletingId === employee.id}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || filterDepartment !== "all" || filterStatus !== "all"
                ? "Aucun employé trouvé avec les critères de recherche actuels."
                : "Aucun employé enregistré. Commencez par ajouter un nouvel employé."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
