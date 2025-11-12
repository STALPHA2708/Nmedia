import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Briefcase } from "lucide-react";
import { formatCurrency } from "@/lib/api";
import type { Employee, Department } from "@shared/api";

interface EmployeeStatsProps {
  employees: Employee[];
  departments: Department[];
}

/**
 * Component to display employee statistics cards
 */
export function EmployeeStats({ employees, departments }: EmployeeStatsProps) {
  const activeEmployees = employees.filter((emp) => emp.status === "active");
  const totalSalary = activeEmployees.reduce((sum, emp) => sum + emp.salary, 0);
  const activePercentage =
    employees.length > 0
      ? Math.round((activeEmployees.length / employees.length) * 100)
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Employés
          </CardTitle>
          <Users className="h-4 w-4 text-nomedia-blue" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{employees.length}</div>
          <p className="text-xs text-muted-foreground">Total employés</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Employés Actifs
          </CardTitle>
          <Users className="h-4 w-4 text-nomedia-green" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeEmployees.length}</div>
          <p className="text-xs text-muted-foreground">
            {activePercentage}% du total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Masse Salariale
          </CardTitle>
          <CreditCard className="h-4 w-4 text-nomedia-purple" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalSalary)}
          </div>
          <p className="text-xs text-muted-foreground">Par mois</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Départements</CardTitle>
          <Briefcase className="h-4 w-4 text-nomedia-orange" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{departments.length}</div>
          <p className="text-xs text-muted-foreground">Départements actifs</p>
        </CardContent>
      </Card>
    </div>
  );
}
