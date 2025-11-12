import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/api";
import type { Employee } from "@shared/api";

interface EmployeeCardProps {
  employee: Employee;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (id: number) => void;
  onViewContracts: (employee: Employee) => void;
  isDeleting?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-nomedia-green/10 text-nomedia-green border-nomedia-green/20";
    case "inactive":
      return "bg-nomedia-gray/10 text-nomedia-gray border-nomedia-gray/20";
    case "on_leave":
      return "bg-nomedia-orange/10 text-nomedia-orange border-nomedia-orange/20";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatStatus = (status: string) => {
  switch (status) {
    case "active":
      return "Actif";
    case "inactive":
      return "Inactif";
    case "on_leave":
      return "En congé";
    default:
      return status;
  }
};

const getInitials = (firstName: string, lastName: string) => {
  const first = (firstName || "").charAt(0);
  const last = (lastName || "").charAt(0);
  return `${first}${last}`.toUpperCase() || "??";
};

/**
 * Employee card component with optimized rendering
 */
export const EmployeeCard = React.memo(function EmployeeCard({
  employee,
  onView,
  onEdit,
  onDelete,
  onViewContracts,
  isDeleting = false,
}: EmployeeCardProps) {
  const handleDelete = () => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer ${employee.first_name} ${employee.last_name} ?`
      )
    ) {
      onDelete(employee.id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={employee.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-nomedia-blue to-nomedia-purple text-white">
                {getInitials(employee.first_name, employee.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {employee.first_name} {employee.last_name}
              </CardTitle>
              <CardDescription>{employee.position}</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(employee)}>
                <Eye className="mr-2 h-4 w-4" />
                Voir profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(employee)}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewContracts(employee)}>
                <FileText className="mr-2 h-4 w-4" />
                Contrats
                {employee.contract_file_name && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    PDF
                  </Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Badge variant="outline" className={getStatusColor(employee.status)}>
          {formatStatus(employee.status)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{employee.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span>{employee.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{employee.address}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>Embauché le {formatDate(employee.hire_date)}</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Salaire</span>
            <span className="font-bold">{formatCurrency(employee.salary)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Département</span>
            <span className="text-sm">{employee.department_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Projets actifs
            </span>
            <span className="text-sm font-medium">
              {employee.active_projects || 0}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-muted-foreground">Contrat</span>
            <div className="flex items-center gap-2">
              {employee.contract_file_name ? (
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-800"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  PDF
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-gray-500">
                  Non uploadé
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
