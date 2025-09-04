import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import {
  Plus,
  Search,
  Filter,
  Receipt,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Camera,
  Car,
  Utensils,
  Zap,
  Building,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

// Interfaces
interface Expense {
  id: number;
  employee_id: number;
  project_id: number | null;
  category: string;
  description: string;
  amount: number;
  receipt_file: string | null;
  expense_date: string;
  status: "pending" | "approved" | "rejected";
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  reimbursement_date: string | null;
  reimbursement_method: string | null;
  created_at: string;
  updated_at: string;
  employee_name: string;
  project_name: string | null;
  approved_by_name: string | null;
}

interface Project {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  name?: string;
}

const categories = [
  { value: "Transport", icon: Car, color: "text-nomedia-green" },
  { value: "Hébergement", icon: Building, color: "text-blue-500" },
  { value: "Repas", icon: Utensils, color: "text-green-500" },
  { value: "Matériel", icon: Building, color: "text-nomedia-orange" },
  { value: "Communication", icon: Camera, color: "text-nomedia-blue" },
  { value: "Formation", icon: FileText, color: "text-nomedia-purple" },
  { value: "Bureautique", icon: Receipt, color: "text-nomedia-gray" },
  { value: "Marketing", icon: TrendingUp, color: "text-purple-500" },
  { value: "Autre", icon: MoreHorizontal, color: "text-gray-500" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-nomedia-green/10 text-nomedia-green border-nomedia-green/20";
    case "pending":
      return "bg-nomedia-orange/10 text-nomedia-orange border-nomedia-orange/20";
    case "rejected":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "draft":
      return "bg-nomedia-gray/10 text-nomedia-gray border-nomedia-gray/20";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatStatus = (status: string) => {
  switch (status) {
    case "approved":
      return "Approuvée";
    case "pending":
      return "En attente";
    case "rejected":
      return "Rejetée";
    case "draft":
      return "Brouillon";
    default:
      return status;
  }
};

const getCategoryIcon = (category: string) => {
  const cat = categories.find((c) => c.value === category);
  return cat ? cat.icon : Receipt;
};

const getCategoryColor = (category: string) => {
  const cat = categories.find((c) => c.value === category);
  return cat ? cat.color : "text-gray-500";
};

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    employee_id: "",
    project_id: "",
    category: "",
    description: "",
    amount: "",
    expense_date: "",
    receipt_file: "",
  });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [expensesRes, projectsRes, employeesRes] = await Promise.all([
          apiRequest("/expenses"),
          apiRequest("/projects"),
          apiRequest("/employees"),
        ]);

        if (expensesRes.success)
          setExpenses(Array.isArray(expensesRes.data) ? expensesRes.data : []);
        if (projectsRes.success) setProjects(projectsRes.data);
        if (employeesRes.success) {
          const employeesWithName = employeesRes.data.map((emp: Employee) => ({
            ...emp,
            name: `${emp.first_name} ${emp.last_name}`,
          }));
          setEmployees(employeesWithName);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredExpenses = (Array.isArray(expenses) ? expenses : []).filter(
    (expense) => {
      const matchesSearch =
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.employee_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (expense.project_name &&
          expense.project_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesProject =
        filterProject === "all" ||
        expense.project_id?.toString() === filterProject;
      const matchesCategory =
        filterCategory === "all" || expense.category === filterCategory;
      const matchesStatus =
        filterStatus === "all" || expense.status === filterStatus;

      return (
        matchesSearch && matchesProject && matchesCategory && matchesStatus
      );
    },
  );

  // Calculate statistics
  const totalExpenses = filteredExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0,
  );
  const approvedExpenses = filteredExpenses
    .filter((exp) => exp.status === "approved")
    .reduce((sum, exp) => sum + exp.amount, 0);
  const pendingExpenses = filteredExpenses
    .filter((exp) => exp.status === "pending")
    .reduce((sum, exp) => sum + exp.amount, 0);
  const thisMonthExpenses = expenses
    .filter((exp) => {
      const expDate = new Date(exp.expense_date);
      const now = new Date();
      return (
        expDate.getMonth() === now.getMonth() &&
        expDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, exp) => sum + exp.amount, 0);

  // Handle form submission
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Submitting expense form:", formData);

    // Basic validation
    if (!formData.category?.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une catégorie",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description?.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une description",
        variant: "destructive",
      });
      return;
    }

    if (!formData.amount || !formData.expense_date) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir le montant et la date",
        variant: "destructive",
      });
      return;
    }

    // Validate amount
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être un nombre positif",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const expenseData = {
        employee_id: formData.employee_id ? Number(formData.employee_id) : null,
        project_id: formData.project_id ? Number(formData.project_id) : null,
        category: formData.category.trim(),
        description: formData.description.trim(),
        amount: amount,
        expense_date: formData.expense_date,
        receipt_file: formData.receipt_file?.trim() || null,
      };

      console.log("Sending expense data to API:", expenseData);

      const response = await apiRequest("/expenses", {
        method: "POST",
        body: JSON.stringify(expenseData),
      });

      console.log("Raw expense API response:", response);

      if (response && response.success) {
        toast({
          title: "Succès",
          description: "Dépense créée avec succès",
        });
        setIsCreateDialogOpen(false);
        setFormData({
          employee_id: "",
          project_id: "",
          category: "",
          description: "",
          amount: "",
          expense_date: "",
          receipt_file: "",
        });
        // Reload expenses
        const expensesRes = await apiRequest("/expenses");
        if (expensesRes.success)
          setExpenses(Array.isArray(expensesRes.data) ? expensesRes.data : []);
      } else {
        throw new Error(
          response?.message || "Échec de la création de la dépense",
        );
      }
    } catch (error) {
      console.error("Error creating expense:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la création";
      toast({
        title: "Erreur de création",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle expense deletion
  const handleDeleteExpense = async (expense: Expense) => {
    if (!expense || deleting === expense.id) {
      return; // Prevent multiple deletions
    }

    try {
      setDeleting(expense.id);
      setIsUpdating(true);

      console.log(`🗑️ Deleting expense ${expense.id}...`);

      const response = await apiRequest(`/expenses/${expense.id}`, {
        method: "DELETE",
      });

      if (response.success) {
        console.log(`✅ Expense ${expense.id} deleted successfully`);

        toast({
          title: "Succès",
          description: "Dépense supprimée avec succès",
        });

        // Close dialog first
        setExpenseToDelete(null);

        // Reload expenses from server to ensure consistency (inlined to avoid function dependency)
        try {
          const expensesRes = await apiRequest("/expenses");
          if (expensesRes.success) {
            setExpenses(Array.isArray(expensesRes.data) ? expensesRes.data : []);
          }
        } catch (reloadError) {
          console.error("Error reloading expenses:", reloadError);
          // Continue anyway - deletion was successful
        }

      } else {
        throw new Error(response.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
      setIsUpdating(false);
    }
  };

  // Handle expense approval
  const handleApproveExpense = async (expense: Expense) => {
    try {
      const response = await apiRequest(`/expenses/${expense.id}/approve`, {
        method: "PUT",
      });

      if (response.success) {
        toast({
          title: "Succès",
          description: "Dépense approuvée avec succès",
        });
        // Update expense status
        setExpenses(
          (Array.isArray(expenses) ? expenses : []).map((exp) =>
            exp.id === expense.id
              ? { ...exp, status: "approved" as const }
              : exp,
          ),
        );
        setSelectedExpense(null);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Error approving expense:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'approbation",
        variant: "destructive",
      });
    }
  };

  // Handle expense rejection
  const handleRejectExpense = async (expense: Expense) => {
    try {
      const response = await apiRequest(`/expenses/${expense.id}/reject`, {
        method: "PUT",
        body: JSON.stringify({
          rejection_reason: "Rejetée par l'administrateur",
        }),
      });

      if (response.success) {
        toast({
          title: "Succès",
          description: "Dépense rejetée avec succès",
        });
        // Update expense status
        setExpenses(
          (Array.isArray(expenses) ? expenses : []).map((exp) =>
            exp.id === expense.id
              ? { ...exp, status: "rejected" as const }
              : exp,
          ),
        );
        setSelectedExpense(null);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Error rejecting expense:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Erreur lors du rejet",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nomedia-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des dépenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ marginTop: "-24px", paddingTop: 0 }}>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dépenses</h1>
          <p className="text-muted-foreground">
            Suivez et gérez toutes les dépenses par projet
          </p>
        </div>
        <div className="flex gap-2">
          {user?.role === "admin" && filteredExpenses.length > 0 && (
            <Button
              variant="destructive"
              onClick={async () => {
                // Check if we're in development environment
                const isDevelopment = window.location.hostname === 'localhost';

                if (!isDevelopment) {
                  toast({
                    title: "Fonctionnalité indisponible",
                    description: "La suppression en lot n'est disponible qu'en développement local. Déployez la dernière version pour l'utiliser en production.",
                    variant: "destructive",
                  });
                  return;
                }

                if (confirm(`Supprimer TOUTES les ${filteredExpenses.length} dépenses visibles? Cette action est irréversible.`)) {
                  try {
                    const expenseIds = filteredExpenses.map(exp => exp.id);
                    const response = await apiRequest("/expenses/bulk", {
                      method: "DELETE",
                      body: JSON.stringify({ expenseIds }),
                    });

                    if (response.success) {
                      // Reload expenses (inlined to avoid function dependency)
                      try {
                        const expensesRes = await apiRequest("/expenses");
                        if (expensesRes.success) {
                          setExpenses(Array.isArray(expensesRes.data) ? expensesRes.data : []);
                        }
                      } catch (reloadError) {
                        console.error("Error reloading expenses after bulk delete:", reloadError);
                      }

                      toast({
                        title: "Succès",
                        description: `${response.data.deletedCount} dépense(s) supprimée(s)`,
                      });
                    }
                  } catch (error) {
                    console.error("Bulk delete error:", error);
                    toast({
                      title: "Erreur",
                      description: "Erreur lors de la suppression - Endpoint non disponible en production",
                      variant: "destructive",
                    });
                  }
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer Tout {!window.location.hostname.includes('localhost') && '(Dev seulement)'}
            </Button>
          )}
          <Button
            onClick={() => {
              console.log("💰 Opening expense dialog...");
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Dépense
          </Button>
        </div>

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              // Reset form when dialog closes
              setFormData({
                employee_id: "",
                project_id: "",
                category: "",
                description: "",
                amount: "",
                expense_date: "",
                receipt_file: "",
              });
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter une nouvelle dépense</DialogTitle>
              <DialogDescription>
                Enregistrez une dépense pour un projet
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                console.log("Form submit triggered");
                console.log("Current form data:", formData);
                handleCreateExpense(e);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Projet (optionnel)</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        project_id: value === "none" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucun projet (optionnel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          Aucun projet - Dépense générale
                        </div>
                      </SelectItem>
                      {projects.length > 0 ? (
                        projects
                          .filter((project) => project.id)
                          .map((project) => (
                            <SelectItem
                              key={project.id}
                              value={project.id.toString()}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-nomedia-blue"></div>
                                {project.name}
                              </div>
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="none" disabled>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                            Aucun projet disponible
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee">Employé (optionnel)</Label>
                  <Select
                    value={formData.employee_id}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        employee_id: value === "none" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assigné automatiquement (optionnel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          Aucun employé spécifique
                        </div>
                      </SelectItem>
                      {employees.length > 0 ? (
                        employees
                          .filter((employee) => employee.id)
                          .map((employee) => (
                            <SelectItem
                              key={employee.id}
                              value={employee.id.toString()}
                            >
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-nomedia-green" />
                                {employee.name}
                              </div>
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="none" disabled>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4 text-gray-300" />
                            Aucun employé disponible
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select
                    required
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => {
                        const Icon = category.icon;
                        return (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${category.color}`} />
                              {category.value}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant (MAD) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1500"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez la dépense en détail..."
                  className="h-20"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expenseDate">Date de la dépense *</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expense_date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt">Justificatif (optionnel)</Label>
                <Input
                  id="receipt"
                  type="text"
                  placeholder="Nom ou chemin du fichier justificatif"
                  value={formData.receipt_file}
                  onChange={(e) =>
                    setFormData({ ...formData, receipt_file: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Pour l'instant, veuillez indiquer le nom du fichier. L'upload
                  sera ajouté prochainement.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setFormData({
                      employee_id: "",
                      project_id: "",
                      category: "",
                      description: "",
                      amount: "",
                      expense_date: "",
                      receipt_file: "",
                    });
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Création..." : "Créer la dépense"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Dépenses
            </CardTitle>
            <DollarSign className="h-4 w-4 text-nomedia-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalExpenses.toLocaleString()} MAD
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredExpenses.length} dépenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
            <TrendingUp className="h-4 w-4 text-nomedia-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvedExpenses.toLocaleString()} MAD
            </div>
            <p className="text-xs text-muted-foreground">
              {totalExpenses > 0
                ? Math.round((approvedExpenses / totalExpenses) * 100)
                : 0}
              % du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <TrendingDown className="h-4 w-4 text-nomedia-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingExpenses.toLocaleString()} MAD
            </div>
            <p className="text-xs text-muted-foreground">
              {expenses.filter((exp) => exp.status === "pending").length}{" "}
              dépenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce Mois</CardTitle>
            <Receipt className="h-4 w-4 text-nomedia-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {thisMonthExpenses.toLocaleString()} MAD
            </div>
            <p className="text-xs text-muted-foreground">
              +15% vs mois dernier
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une dépense..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              {projects
                .filter((project) => project.id)
                .map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.value}
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
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvées</SelectItem>
              <SelectItem value="rejected">Rejetées</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des dépenses</CardTitle>
          <CardDescription>
            Toutes les dépenses enregistrées par projet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Projet</TableHead>
                <TableHead>Employé</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => {
                const CategoryIcon = getCategoryIcon(expense.category);
                return (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {new Date(expense.expense_date).toLocaleDateString(
                        "fr-FR",
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {expense.project_name || "Aucun projet"}
                    </TableCell>
                    <TableCell>{expense.employee_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CategoryIcon
                          className={`h-4 w-4 ${getCategoryColor(expense.category)}`}
                        />
                        <span>{expense.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {expense.description}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {expense.amount.toLocaleString()} MAD
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(expense.status)}
                      >
                        {formatStatus(expense.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setSelectedExpense(expense)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          {expense.receipt_file && (
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Télécharger justificatif
                            </DropdownMenuItem>
                          )}
                          {expense.status === "pending" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleApproveExpense(expense)}
                                className="text-nomedia-green"
                              >
                                Approuver
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRejectExpense(expense)}
                                className="text-destructive"
                              >
                                Rejeter
                              </DropdownMenuItem>
                            </>
                          )}
                          {(expense.status === "pending" || user?.role === "admin") && (
                            <DropdownMenuItem
                              onClick={() => setExpenseToDelete(expense)}
                              className="text-destructive"
                              disabled={deleting === expense.id || isUpdating}
                            >
                              {deleting === expense.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                                  Suppression...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {user?.role === "admin" && expense.status !== "pending"
                                    ? `Supprimer (${expense.status})`
                                    : "Supprimer"}
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expense Detail Modal */}
      {selectedExpense && (
        <Dialog
          open={!!selectedExpense}
          onOpenChange={() => setSelectedExpense(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Détails de la dépense #{selectedExpense.id}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Projet
                  </Label>
                  <p className="font-medium">
                    {selectedExpense.project_name || "Aucun projet"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Employé
                  </Label>
                  <p className="font-medium">{selectedExpense.employee_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Catégorie
                  </Label>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const CategoryIcon = getCategoryIcon(
                        selectedExpense.category,
                      );
                      return (
                        <CategoryIcon
                          className={`h-4 w-4 ${getCategoryColor(selectedExpense.category)}`}
                        />
                      );
                    })()}
                    <span className="font-medium">
                      {selectedExpense.category}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Montant
                  </Label>
                  <p className="font-bold text-lg">
                    {selectedExpense.amount.toLocaleString()} MAD
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Description
                </Label>
                <p className="mt-1">{selectedExpense.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Date de dépense
                  </Label>
                  <p className="font-medium">
                    {new Date(selectedExpense.expense_date).toLocaleDateString(
                      "fr-FR",
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Statut
                  </Label>
                  <Badge
                    variant="outline"
                    className={getStatusColor(selectedExpense.status)}
                  >
                    {formatStatus(selectedExpense.status)}
                  </Badge>
                </div>
              </div>

              {selectedExpense.receipt_file && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Justificatif
                  </Label>
                  <p className="font-medium">{selectedExpense.receipt_file}</p>
                </div>
              )}

              {selectedExpense.approved_by_name && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Approuvé par
                    </Label>
                    <p className="font-medium">
                      {selectedExpense.approved_by_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Date d'approbation
                    </Label>
                    <p className="font-medium">
                      {selectedExpense.approved_at
                        ? new Date(
                            selectedExpense.approved_at,
                          ).toLocaleDateString("fr-FR")
                        : "-"}
                    </p>
                  </div>
                </div>
              )}

              {selectedExpense.rejection_reason && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Raison du rejet
                  </Label>
                  <p className="font-medium text-destructive">
                    {selectedExpense.rejection_reason}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                {selectedExpense.receipt_file && (
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger justificatif
                  </Button>
                )}
                {selectedExpense.status === "pending" && (
                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant="outline"
                      className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                      onClick={() => handleRejectExpense(selectedExpense)}
                    >
                      Rejeter
                    </Button>
                    <Button
                      className="bg-nomedia-green hover:bg-nomedia-green/90"
                      onClick={() => handleApproveExpense(selectedExpense)}
                    >
                      Approuver
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {expenseToDelete && (
        <AlertDialog
          open={!!expenseToDelete}
          onOpenChange={() => setExpenseToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action
                est irréversible.
                <br />
                <br />
                <strong>Dépense:</strong> {expenseToDelete.description}
                <br />
                <strong>Montant:</strong>{" "}
                {expenseToDelete.amount.toLocaleString()} MAD
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setExpenseToDelete(null)}
                disabled={deleting === expenseToDelete?.id || isUpdating}
              >
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteExpense(expenseToDelete)}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleting === expenseToDelete?.id || isUpdating}
              >
                {deleting === expenseToDelete?.id || isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Suppression...
                  </>
                ) : (
                  "Supprimer"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {filteredExpenses.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Aucune dépense trouvée avec les critères de recherche actuels.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
