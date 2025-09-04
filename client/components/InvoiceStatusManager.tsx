import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  ChevronDown,
} from "lucide-react";

interface InvoiceStatusManagerProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-nomedia-green/10 text-nomedia-green border-nomedia-green/20";
    case "pending":
      return "bg-nomedia-orange/10 text-nomedia-orange border-nomedia-orange/20";
    case "overdue":
      return "bg-red-100 text-red-800 border-red-200";
    case "draft":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "cancelled":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatStatus = (status: string) => {
  switch (status) {
    case "paid":
      return "Payée";
    case "pending":
      return "En attente";
    case "overdue":
      return "En retard";
    case "draft":
      return "Brouillon";
    case "cancelled":
      return "Annulée";
    default:
      return status;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "paid":
      return <CheckCircle className="h-4 w-4" />;
    case "pending":
      return <Clock className="h-4 w-4" />;
    case "overdue":
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const statusOptions = [
  { value: "draft", label: "📝 Brouillon", description: "Facture en cours de création" },
  { value: "pending", label: "⏰ En attente", description: "Envoyée au client, paiement attendu" },
  { value: "paid", label: "✅ Payée", description: "Paiement reçu et confirmé" },
  { value: "overdue", label: "⚠️ En retard", description: "Échéance dépassée" },
  { value: "cancelled", label: "❌ Annulée", description: "Facture annulée" },
];

export function InvoiceStatusManager({ 
  currentStatus, 
  onStatusChange, 
  disabled = false 
}: InvoiceStatusManagerProps) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={getStatusColor(currentStatus)}>
        {getStatusIcon(currentStatus)}
        <span className="ml-1">{formatStatus(currentStatus)}</span>
      </Badge>
      
      {!disabled && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Changer
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {statusOptions.map((status) => (
              <DropdownMenuItem
                key={status.value}
                onClick={() => onStatusChange(status.value)}
                disabled={status.value === currentStatus}
                className="flex flex-col items-start p-3"
              >
                <div className="flex items-center gap-2 font-medium">
                  {status.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {status.description}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export { getStatusColor, formatStatus, getStatusIcon };
