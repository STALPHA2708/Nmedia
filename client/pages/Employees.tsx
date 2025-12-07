import React, { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { useLocation } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  Filter,
  Users,
  FileText,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Briefcase,
  CreditCard,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  employeeApi,
  departmentApi,
  contractTypeApi,
  handleApiError,
  formatCurrency,
  formatDate,
} from "@/lib/api";
import type { Employee, Department, ContractType } from "@shared/api";
import { useToast } from "@/hooks/use-toast";
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDepartments";
import { useContractTypes } from "@/hooks/useContractTypes";

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

export default function Employees() {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 300); // Debounced search for performance
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("personal");
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const { toast } = useToast();

  // Cleanup effect - reset all dialogs and states when navigating away
  useEffect(() => {
    return () => {
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      setEditingEmployee(null);
      setCurrentTab("personal");
    };
  }, [location.pathname]);

  // React Query hooks - automatic caching and refetching
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments();
  const { data: contractTypes = [] } = useContractTypes();
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();

  const loading = employeesLoading || departmentsLoading;
  const creating = createEmployeeMutation.isPending;
  const updating = updateEmployeeMutation.isPending;
  const deleting = deleteEmployeeMutation.isPending ? (deleteEmployeeMutation.variables as number) : null;

  // Form state for new employee
  const [newEmployee, setNewEmployee] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    position: "",
    department: "",
    salary: "",
    hireDate: "",
    contractType: "",
    contractStartDate: "",
    contractEndDate: "",
    contractFile: null as File | null,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Debug dialog state
  useEffect(() => {
    console.log("🔘 Dialog state changed:", isCreateDialogOpen);
  }, [isCreateDialogOpen]);

  // Validation function
  const validateForm = () => {
    console.log("🔍 Starting form validation with data:", newEmployee);
    const errors: Record<string, string> = {};

    if (!newEmployee.firstName.trim())
      errors.firstName = "Le prénom est obligatoire";
    if (!newEmployee.lastName.trim())
      errors.lastName = "Le nom est obligatoire";
    if (!newEmployee.email.trim()) {
      errors.email = "L'email est obligatoire";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmployee.email)) {
      errors.email = "Format d'email invalide";
    }
    if (!newEmployee.phone.trim()) {
      errors.phone = "Le téléphone est obligatoire";
    } else if (newEmployee.phone.trim().length < 8) {
      errors.phone = "Le numéro de téléphone doit contenir au moins 8 chiffres";
    }
    if (!newEmployee.address.trim())
      errors.address = "L'adresse est obligatoire";
    if (!newEmployee.position.trim())
      errors.position = "Le poste est obligatoire";
    if (!newEmployee.department)
      errors.department = "Le département est obligatoire";
    if (!newEmployee.salary || parseFloat(newEmployee.salary) <= 0)
      errors.salary = "Le salaire doit être supérieur à 0";
    if (!newEmployee.hireDate)
      errors.hireDate = "La date d'embauche est obligatoire";
    if (!newEmployee.contractType)
      errors.contractType = "Le type de contrat est obligatoire";
    if (!newEmployee.contractStartDate)
      errors.contractStartDate = "La date de début du contrat est obligatoire";

    // Validate contract end date for temporary contracts
    if (
      (newEmployee.contractType === "CDD" ||
        newEmployee.contractType === "Stage") &&
      !newEmployee.contractEndDate
    ) {
      errors.contractEndDate =
        "La date de fin est obligatoire pour les CDD et stages";
    }

    // Contract file is optional - can be uploaded later
    // if (!newEmployee.contractFile)
    //   errors.contractFile = "Le fichier de contrat est obligatoire";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create employee function
  const handleCreateEmployee = async () => {
    console.log("handleCreateEmployee called - starting creation process");
    console.log("Current form data:", newEmployee);
    console.log("Available departments:", departments);
    console.log("Available contract types:", contractTypes);

    if (!validateForm()) {
      console.log("Form validation failed:", formErrors);
      toast({
        title: "Erreurs de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive",
      });
      return;
    }
    console.log("Form validation passed");

    // Check if email already exists in the current employee list
    const emailExists = employees.find(
      (emp) =>
        emp.email.toLowerCase() === newEmployee.email.toLowerCase().trim(),
    );

    if (emailExists) {
      toast({
        title: "Email déjà utilisé",
        description: `L'email ${newEmployee.email} est déj�� utilisé par ${emailExists.first_name} ${emailExists.last_name}`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Note: loading state is automatically managed by createEmployeeMutation.isPending

      const departmentId = parseInt(newEmployee.department);

      if (isNaN(departmentId)) {
        throw new Error("Département invalide sélectionné");
      }

      const employeeData = {
        firstName: newEmployee.firstName.trim(),
        lastName: newEmployee.lastName.trim(),
        email: newEmployee.email.trim().toLowerCase(),
        phone: newEmployee.phone.trim(),
        address: newEmployee.address.trim(),
        position: newEmployee.position.trim(),
        departmentId: departmentId,
        salary: parseFloat(newEmployee.salary),
        hireDate: newEmployee.hireDate,
        contractType: newEmployee.contractType || undefined,
        contractStartDate: newEmployee.contractStartDate || undefined,
        contractEndDate: newEmployee.contractEndDate || undefined,
        contractFileName: newEmployee.contractFile?.name || undefined,
      };

      console.log("Creating employee with data:", employeeData);
      await createEmployeeMutation.mutateAsync(employeeData);
      console.log("Employee creation completed successfully");

      // Reset form
      setNewEmployee({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        position: "",
        department: "",
        salary: "",
        hireDate: "",
        contractType: "",
        contractStartDate: "",
        contractEndDate: "",
        contractFile: null,
      });
      setFormErrors({});
      setCurrentTab("personal");
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Employee creation error:", error);

      // Enhanced error handling for specific validation errors
      let errorMessage = handleApiError(error);

      // Check if it's a duplicate email error
      if (error instanceof Error && error.message.includes("400 Bad Request")) {
        try {
          // Try to parse the error response for more specific error
          const errorResponse = JSON.parse(
            error.message.split("Response: ")[1] || "{}",
          );
          if (
            errorResponse.message &&
            errorResponse.message.includes("existe déjà")
          ) {
            errorMessage = `L'email ${newEmployee.email} est déjà utilisé par un autre employé. Veuillez utiliser un email différent.`;
          } else if (errorResponse.message) {
            errorMessage = errorResponse.message;
          }
        } catch (parseError) {
          // If parsing fails, check for common validation errors
          if (errorMessage.includes("département")) {
            errorMessage = "Veuillez sélectionner un département valide.";
          } else if (errorMessage.includes("email")) {
            errorMessage =
              "Cet email est déjà utilisé. Veuillez en choisir un autre.";
          }
        }
      }

      toast({
        title: "Erreur de création",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Edit employee function
  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setNewEmployee({
      firstName: employee.first_name,
      lastName: employee.last_name,
      email: employee.email,
      phone: employee.phone,
      address: employee.address,
      position: employee.position,
      department: employee.department_id?.toString() || "",
      salary: employee.salary.toString(),
      hireDate: employee.hire_date,
      contractType: employee.contract_type || "",
      contractStartDate: employee.contract_start_date || "",
      contractEndDate: employee.contract_end_date || "",
      contractFile: null,
    });
    setCurrentTab("personal");
    setIsEditDialogOpen(true);
  };

  // Update employee function
  const handleUpdateEmployee = async () => {
    if (!validateForm() || !editingEmployee) {
      return;
    }

    try {
      const departmentId = parseInt(newEmployee.department);

      const employeeData = {
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        email: newEmployee.email,
        phone: newEmployee.phone,
        address: newEmployee.address,
        position: newEmployee.position,
        departmentId: departmentId,
        salary: parseFloat(newEmployee.salary),
        hireDate: newEmployee.hireDate,
        contractType: newEmployee.contractType,
        contractStartDate: newEmployee.contractStartDate,
        contractEndDate: newEmployee.contractEndDate || undefined,
        contractFileName: newEmployee.contractFile?.name,
        status: editingEmployee.status, // Keep existing status
      };

      await updateEmployeeMutation.mutateAsync({
        id: editingEmployee.id,
        data: employeeData
      });

      // Reset form
      setNewEmployee({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        position: "",
        department: "",
        salary: "",
        hireDate: "",
        contractType: "",
        contractStartDate: "",
        contractEndDate: "",
        contractFile: null,
      });
      setFormErrors({});
      setCurrentTab("personal");
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error("Employee update error:", error);
      // Error is handled by the mutation hook
    }
  };

  // Delete employee function
  const handleDeleteEmployee = async (employeeId: number) => {
    try {
      await deleteEmployeeMutation.mutateAsync(employeeId);
      setSelectedEmployee(null);
    } catch (error) {
      console.error("Employee delete error:", error);
      // Error is handled by the mutation hook
    }
  };

  // Contract handling functions
  const handleViewContract = (employee: Employee) => {
    if (!employee.contract_file_name) {
      toast({
        title: "Aucun contrat",
        description: "Aucun contrat n'est disponible pour cet employé",
        variant: "destructive",
      });
      return;
    }

    // Create a mock PDF viewer URL (in production, this would be a real file URL)
    const contractUrl = `/api/employees/${employee.id}/contract/view`;

    // Open in new tab
    window.open(contractUrl, "_blank");

    toast({
      title: "Ouverture du contrat",
      description: `Affichage du contrat de ${employee.first_name} ${employee.last_name}`,
    });
  };

  const handleDownloadContract = (employee: Employee) => {
    if (!employee.contract_file_name) {
      toast({
        title: "Aucun contrat",
        description: "Aucun contrat n'est disponible pour cet employé",
        variant: "destructive",
      });
      return;
    }

    // Create download URL
    const contractUrl = `/api/employees/${employee.id}/contract/download`;

    // Create invisible download link
    const link = document.createElement("a");
    link.href = contractUrl;
    link.download = `contrat_${employee.first_name}_${employee.last_name}.pdf`;
    link.style.display = "none";

    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Téléchargement démarré",
      description: `Téléchargement du contrat de ${employee.first_name} ${employee.last_name}`,
    });
  };

  const filteredEmployees = (Array.isArray(employees) ? employees : []).filter(
    (employee) => {
      const matchesSearch =
        (employee.first_name || "")
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase()) ||
        (employee.last_name || "")
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase()) ||
        (employee.email || "")
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase()) ||
        (employee.position || "")
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase());

      const matchesDepartment =
        filterDepartment === "all" ||
        employee.department_id?.toString() === filterDepartment;
      const matchesStatus =
        filterStatus === "all" || employee.status === filterStatus;

      return matchesSearch && matchesDepartment && matchesStatus;
    },
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des employés...</span>
      </div>
    );
  }

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
          style={{ zIndex: 10, position: 'relative', pointerEvents: 'auto' }}
          onClick={() => {
            console.log("🔘 EMPLOYEE BUTTON CLICKED!");
            alert("Employee button clicked!");
            setIsCreateDialogOpen(true);
            console.log("🔘 Dialog should be open now");
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvel Employé
        </Button>

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            console.log("🔘 Dialog onOpenChange triggered with:", open);
            setIsCreateDialogOpen(open);
          }}
        >
          <DialogContent
            className="max-w-4xl max-h-[90vh] overflow-auto fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
            style={{ zIndex: 9999 }}
          >
            <DialogHeader>
              <DialogTitle>Ajouter un nouvel employé</DialogTitle>
              <DialogDescription>
                Remplissez toutes les informations obligatoires de l'employé
              </DialogDescription>
            </DialogHeader>
            <Tabs
              value={currentTab}
              onValueChange={setCurrentTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Personnel *</TabsTrigger>
                <TabsTrigger value="professional">Professionnel *</TabsTrigger>
                <TabsTrigger value="contract">Contrat *</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
                      placeholder="Prénom"
                      value={newEmployee.firstName}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          firstName: e.target.value,
                        })
                      }
                      className={
                        formErrors.firstName ? "border-destructive" : ""
                      }
                    />
                    {formErrors.firstName && (
                      <p className="text-sm text-destructive">
                        {formErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      placeholder="Nom de famille"
                      value={newEmployee.lastName}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          lastName: e.target.value,
                        })
                      }
                      className={
                        formErrors.lastName ? "border-destructive" : ""
                      }
                    />
                    {formErrors.lastName && (
                      <p className="text-sm text-destructive">
                        {formErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@nomedia.ma"
                      value={newEmployee.email}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          email: e.target.value,
                        })
                      }
                      className={formErrors.email ? "border-destructive" : ""}
                    />
                    {formErrors.email && (
                      <p className="text-sm text-destructive">
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      placeholder="+212 6 XX XX XX XX"
                      value={newEmployee.phone}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          phone: e.target.value,
                        })
                      }
                      className={formErrors.phone ? "border-destructive" : ""}
                    />
                    {formErrors.phone && (
                      <p className="text-sm text-destructive">
                        {formErrors.phone}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Format: +212 6XX XXX XXX ou 06XX XXX XXX
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse *</Label>
                  <Textarea
                    id="address"
                    placeholder="Adresse complète (rue, ville, code postal)"
                    className={`h-20 ${formErrors.address ? "border-destructive" : ""}`}
                    value={newEmployee.address}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        address: e.target.value,
                      })
                    }
                  />
                  {formErrors.address && (
                    <p className="text-sm text-destructive">
                      {formErrors.address}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="professional" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">Poste *</Label>
                    <Input
                      id="position"
                      placeholder="Ex: Réalisateur, Cadreur, Monteur..."
                      value={newEmployee.position}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          position: e.target.value,
                        })
                      }
                      className={
                        formErrors.position ? "border-destructive" : ""
                      }
                    />
                    {formErrors.position && (
                      <p className="text-sm text-destructive">
                        {formErrors.position}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Département *</Label>
                    <select
                      id="department"
                      value={newEmployee.department}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, department: e.target.value })
                      }
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        formErrors.department ? "border-destructive" : ""
                      }`}
                    >
                      <option value="">Sélectionner un département</option>
                      {departments.length > 0 ? (
                        departments.map((dept) => (
                          <option key={dept.id} value={dept.id.toString()}>
                            {dept.name} {dept.employee_count ? `(${dept.employee_count} employés)` : ''}
                          </option>
                        ))
                      ) : (
                        // Always show fallback departments to ensure user can make a selection
                        <>
                          <option value="1">Production</option>
                          <option value="2">Post-Production</option>
                          <option value="3">Administratif</option>
                          <option value="4">Technique</option>
                        </>
                      )}
                    </select>
                    {formErrors.department && (
                      <p className="text-sm text-destructive">
                        {formErrors.department}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salaire mensuel (MAD) *</Label>
                    <Input
                      id="salary"
                      type="number"
                      placeholder="35000"
                      min="0"
                      value={newEmployee.salary}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          salary: e.target.value,
                        })
                      }
                      className={formErrors.salary ? "border-destructive" : ""}
                    />
                    {formErrors.salary && (
                      <p className="text-sm text-destructive">
                        {formErrors.salary}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Salaire brut mensuel en dirhams
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">Date d'embauche *</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={newEmployee.hireDate}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          hireDate: e.target.value,
                        })
                      }
                      className={
                        formErrors.hireDate ? "border-destructive" : ""
                      }
                    />
                    {formErrors.hireDate && (
                      <p className="text-sm text-destructive">
                        {formErrors.hireDate}
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contract" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractType">Type de contrat *</Label>
                    <select
                      id="contractType"
                      value={newEmployee.contractType}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, contractType: e.target.value })
                      }
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        formErrors.contractType ? "border-destructive" : ""
                      }`}
                    >
                      <option value="">Type de contrat</option>
                      {contractTypes.length > 0 ? (
                        contractTypes.map((type) => (
                          <option key={type.id} value={type.name}>
                            {type.name}{type.description ? ` - ${type.description}` : ''}
                          </option>
                        ))
                      ) : (
                        // Always show fallback contract types to ensure user can make a selection
                        <>
                          <option value="CDI">CDI - Contrat à Durée Indéterminée</option>
                          <option value="CDD">CDD - Contrat à Durée Déterminée</option>
                          <option value="Stage">Stage - Contrat de Stage</option>
                          <option value="Freelance">Freelance - Contrat Freelance/Indépendant</option>
                          <option value="Consultant">Consultant - Contrat de Consultation</option>
                        </>
                      )}
                    </select>
                    {formErrors.contractType && (
                      <p className="text-sm text-destructive">
                        {formErrors.contractType}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractStartDate">
                      Date de d��but du contrat *
                    </Label>
                    <Input
                      id="contractStartDate"
                      type="date"
                      value={newEmployee.contractStartDate}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          contractStartDate: e.target.value,
                        })
                      }
                      className={
                        formErrors.contractStartDate ? "border-destructive" : ""
                      }
                    />
                    {formErrors.contractStartDate && (
                      <p className="text-sm text-destructive">
                        {formErrors.contractStartDate}
                      </p>
                    )}
                  </div>
                </div>

                {(newEmployee.contractType === "CDD" ||
                  newEmployee.contractType === "Stage") && (
                  <div className="space-y-2">
                    <Label htmlFor="contractEndDate">
                      Date de fin du contrat
                    </Label>
                    <Input
                      id="contractEndDate"
                      type="date"
                      value={newEmployee.contractEndDate}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          contractEndDate: e.target.value,
                        })
                      }
                      className={
                        formErrors.contractEndDate ? "border-destructive" : ""
                      }
                    />
                    {formErrors.contractEndDate && (
                      <p className="text-sm text-destructive">
                        {formErrors.contractEndDate}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Obligatoire pour les CDD et stages
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="contractFile">
                    Contrat PDF scanné (optionnel)
                  </Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      formErrors.contractFile
                        ? "border-destructive bg-destructive/5"
                        : newEmployee.contractFile
                          ? "border-nomedia-green bg-nomedia-green/5"
                          : "border-gray-300"
                    }`}
                  >
                    <Upload
                      className={`mx-auto h-12 w-12 ${
                        newEmployee.contractFile
                          ? "text-nomedia-green"
                          : "text-gray-400"
                      }`}
                    />
                    {newEmployee.contractFile ? (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-nomedia-green">
                          ✓ {newEmployee.contractFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(
                            newEmployee.contractFile.size /
                            1024 /
                            1024
                          ).toFixed(2)}{" "}
                          MB
                        </p>
                        <Button
                          variant="outline"
                          className="mt-2"
                          onClick={() =>
                            setNewEmployee({
                              ...newEmployee,
                              contractFile: null,
                            })
                          }
                        >
                          Changer le fichier
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Glissez-déposez le fichier PDF ou cliquez pour
                          sélectionner
                        </p>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && file.type === "application/pdf") {
                              setNewEmployee({
                                ...newEmployee,
                                contractFile: file,
                              });
                            } else {
                              alert(
                                "Veuillez sélectionner un fichier PDF valide",
                              );
                            }
                          }}
                          className="hidden"
                          id="contract-upload"
                        />
                        <Button
                          variant="outline"
                          className="mt-2"
                          onClick={() =>
                            document.getElementById("contract-upload")?.click()
                          }
                        >
                          Choisir un fichier PDF
                        </Button>
                      </div>
                    )}
                  </div>
                  {formErrors.contractFile && (
                    <p className="text-sm text-destructive">
                      {formErrors.contractFile}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Formats acceptés: PDF uniquement. Taille max: 10MB
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between gap-3 mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                * Champs obligatoires
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setNewEmployee({
                      firstName: "",
                      lastName: "",
                      email: "",
                      phone: "",
                      address: "",
                      position: "",
                      department: "",
                      salary: "",
                      hireDate: "",
                      contractType: "",
                      contractStartDate: "",
                      contractEndDate: "",
                      contractFile: null,
                    });
                    setFormErrors({});
                    setCurrentTab("personal");
                  }}
                  disabled={creating}
                >
                  Annuler
                </Button>
                <Button onClick={handleCreateEmployee} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Créer l'employé"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'employé</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'employé
            </DialogDescription>
          </DialogHeader>
          <Tabs
            value={currentTab}
            onValueChange={setCurrentTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personnel *</TabsTrigger>
              <TabsTrigger value="professional">Professionnel *</TabsTrigger>
              <TabsTrigger value="contract">Contrat *</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">Prénom *</Label>
                  <Input
                    id="edit-firstName"
                    placeholder="Prénom"
                    value={newEmployee.firstName}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        firstName: e.target.value,
                      })
                    }
                    className={formErrors.firstName ? "border-destructive" : ""}
                  />
                  {formErrors.firstName && (
                    <p className="text-sm text-destructive">
                      {formErrors.firstName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Nom *</Label>
                  <Input
                    id="edit-lastName"
                    placeholder="Nom de famille"
                    value={newEmployee.lastName}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        lastName: e.target.value,
                      })
                    }
                    className={formErrors.lastName ? "border-destructive" : ""}
                  />
                  {formErrors.lastName && (
                    <p className="text-sm text-destructive">
                      {formErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder="email@nomedia.ma"
                    value={newEmployee.email}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        email: e.target.value,
                      })
                    }
                    className={formErrors.email ? "border-destructive" : ""}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-destructive">
                      {formErrors.email}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Téléphone *</Label>
                  <Input
                    id="edit-phone"
                    placeholder="+212 6 XX XX XX XX"
                    value={newEmployee.phone}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        phone: e.target.value,
                      })
                    }
                    className={formErrors.phone ? "border-destructive" : ""}
                  />
                  {formErrors.phone && (
                    <p className="text-sm text-destructive">
                      {formErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address">Adresse *</Label>
                <Textarea
                  id="edit-address"
                  placeholder="Adresse complète"
                  className={`h-20 ${formErrors.address ? "border-destructive" : ""}`}
                  value={newEmployee.address}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      address: e.target.value,
                    })
                  }
                />
                {formErrors.address && (
                  <p className="text-sm text-destructive">
                    {formErrors.address}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="professional" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-position">Poste *</Label>
                  <Input
                    id="edit-position"
                    placeholder="Ex: Réalisateur, Cadreur..."
                    value={newEmployee.position}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        position: e.target.value,
                      })
                    }
                    className={formErrors.position ? "border-destructive" : ""}
                  />
                  {formErrors.position && (
                    <p className="text-sm text-destructive">
                      {formErrors.position}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Département *</Label>
                  <Select
                    value={newEmployee.department}
                    onValueChange={(value) =>
                      setNewEmployee({ ...newEmployee, department: value })
                    }
                  >
                    <SelectTrigger
                      className={
                        formErrors.department ? "border-destructive" : ""
                      }
                    >
                      <SelectValue placeholder="Sélectionner un département" />
                    </SelectTrigger>
                    <SelectContent className="z-50 max-h-96 overflow-y-auto">
                      {departments.length > 0 ? (
                        departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name} {dept.employee_count ? `(${dept.employee_count} employés)` : ''}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="1">Production</SelectItem>
                          <SelectItem value="2">Post-Production</SelectItem>
                          <SelectItem value="3">Administratif</SelectItem>
                          <SelectItem value="4">Technique</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {formErrors.department && (
                    <p className="text-sm text-destructive">
                      {formErrors.department}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-salary">Salaire mensuel (MAD) *</Label>
                  <Input
                    id="edit-salary"
                    type="number"
                    placeholder="35000"
                    min="0"
                    value={newEmployee.salary}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        salary: e.target.value,
                      })
                    }
                    className={formErrors.salary ? "border-destructive" : ""}
                  />
                  {formErrors.salary && (
                    <p className="text-sm text-destructive">
                      {formErrors.salary}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-hireDate">Date d'embauche *</Label>
                  <Input
                    id="edit-hireDate"
                    type="date"
                    value={newEmployee.hireDate}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        hireDate: e.target.value,
                      })
                    }
                    className={formErrors.hireDate ? "border-destructive" : ""}
                  />
                  {formErrors.hireDate && (
                    <p className="text-sm text-destructive">
                      {formErrors.hireDate}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contract" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-contractType">Type de contrat *</Label>
                  <Select
                    value={newEmployee.contractType}
                    onValueChange={(value) =>
                      setNewEmployee({ ...newEmployee, contractType: value })
                    }
                  >
                    <SelectTrigger
                      className={
                        formErrors.contractType ? "border-destructive" : ""
                      }
                    >
                      <SelectValue placeholder="Type de contrat" />
                    </SelectTrigger>
                    <SelectContent className="z-50 max-h-96 overflow-y-auto">
                      {contractTypes.length > 0 ? (
                        contractTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}{type.description ? ` - ${type.description}` : ''}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="CDI">CDI - Contrat à Durée Indéterminée</SelectItem>
                          <SelectItem value="CDD">CDD - Contrat à Durée Déterminée</SelectItem>
                          <SelectItem value="Stage">Stage - Contrat de Stage</SelectItem>
                          <SelectItem value="Freelance">Freelance - Contrat Freelance/Indépendant</SelectItem>
                          <SelectItem value="Consultant">Consultant - Contrat de Consultation</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {formErrors.contractType && (
                    <p className="text-sm text-destructive">
                      {formErrors.contractType}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contractStartDate">
                    Date de début du contrat *
                  </Label>
                  <Input
                    id="edit-contractStartDate"
                    type="date"
                    value={newEmployee.contractStartDate}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        contractStartDate: e.target.value,
                      })
                    }
                    className={
                      formErrors.contractStartDate ? "border-destructive" : ""
                    }
                  />
                  {formErrors.contractStartDate && (
                    <p className="text-sm text-destructive">
                      {formErrors.contractStartDate}
                    </p>
                  )}
                </div>
              </div>

              {(newEmployee.contractType === "CDD" ||
                newEmployee.contractType === "Stage") && (
                <div className="space-y-2">
                  <Label htmlFor="edit-contractEndDate">
                    Date de fin du contrat
                  </Label>
                  <Input
                    id="edit-contractEndDate"
                    type="date"
                    value={newEmployee.contractEndDate}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        contractEndDate: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Contrat actuel</Label>
                {editingEmployee?.contract_file_name ? (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {editingEmployee.contract_file_name}
                      </span>
                      <Badge variant="outline" className="ml-auto">
                        Actuel
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun contrat uploadé
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between gap-3 mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              * Champs obligatoires
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingEmployee(null);
                  setNewEmployee({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    address: "",
                    position: "",
                    department: "",
                    salary: "",
                    hireDate: "",
                    contractType: "",
                    contractStartDate: "",
                    contractEndDate: "",
                    contractFile: null,
                  });
                  setFormErrors({});
                  setCurrentTab("personal");
                }}
                disabled={updating}
              >
                Annuler
              </Button>
              <Button onClick={handleUpdateEmployee} disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Modification...
                  </>
                ) : (
                  "Modifier l'employé"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
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
            <div className="text-2xl font-bold">
              {
                (Array.isArray(employees) ? employees : []).filter(
                  (emp) => emp.status === "active",
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {employees.length > 0
                ? Math.round(
                    ((Array.isArray(employees) ? employees : []).filter(
                      (emp) => emp.status === "active",
                    ).length /
                      (Array.isArray(employees) ? employees : []).length) *
                      100,
                  )
                : 0}
              % du total
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
              {formatCurrency(
                employees
                  .filter((emp) => emp.status === "active")
                  .reduce((sum, emp) => sum + emp.salary, 0),
              )}
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
              <SelectItem value="all">Tous les d��partements</SelectItem>
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
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 auto-rows-fr">
        {filteredEmployees.map((employee, index) => (
          <Card
            key={employee.id || `employee-${index}`}
            className="hover:shadow-md transition-shadow"
          >
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
                <DropdownMenu
                  open={openDropdownId === employee.id}
                  onOpenChange={(open) => setOpenDropdownId(open ? employee.id : null)}
                >
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setOpenDropdownId(null);
                        setSelectedEmployee(employee);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Voir profil
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setOpenDropdownId(null);
                        handleEditEmployee(employee);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setOpenDropdownId(null);
                        setSelectedEmployee(employee);
                        // Set to contracts tab
                        setTimeout(() => {
                          const contractsTab = document.querySelector(
                            '[data-value="contracts"]',
                          ) as HTMLElement;
                          if (contractsTab) contractsTab.click();
                        }, 100);
                      }}
                    >
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
                      onClick={() => {
                        setOpenDropdownId(null);
                        if (
                          confirm(
                            `Êtes-vous sûr de vouloir supprimer ${employee.first_name} ${employee.last_name} ?`,
                          )
                        ) {
                          handleDeleteEmployee(employee.id);
                        }
                      }}
                      disabled={deleting === employee.id}
                    >
                      {deleting === employee.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Badge
                variant="outline"
                className={getStatusColor(employee.status)}
              >
                {formatStatus(employee.status)}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{employee.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{employee.address}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Embauché le {formatDate(employee.hire_date)}</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Salaire</span>
                  <span className="font-bold">
                    {formatCurrency(employee.salary)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">
                    Département
                  </span>
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
                <div className="flex justify-between items-center">
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
                      <Badge
                        variant="outline"
                        className="text-xs text-gray-500"
                      >
                        Non uploadé
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <Dialog
          open={!!selectedEmployee}
          onOpenChange={() => setSelectedEmployee(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>
                Profil de {selectedEmployee.first_name}{" "}
                {selectedEmployee.last_name}
              </DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="contracts">Contrats</TabsTrigger>
                <TabsTrigger value="projects">Projets</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations personnelles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <strong>Email:</strong> {selectedEmployee.email}
                      </div>
                      <div>
                        <strong>Téléphone:</strong> {selectedEmployee.phone}
                      </div>
                      <div>
                        <strong>Adresse:</strong> {selectedEmployee.address}
                      </div>
                      <div>
                        <strong>Date d'embauche:</strong>{" "}
                        {formatDate(selectedEmployee.hire_date)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Informations professionnelles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <strong>Poste:</strong> {selectedEmployee.position}
                      </div>
                      <div>
                        <strong>Département:</strong>{" "}
                        {selectedEmployee.department_name}
                      </div>
                      <div>
                        <strong>Salaire:</strong>{" "}
                        {formatCurrency(selectedEmployee.salary)} /mois
                      </div>
                      <div>
                        <strong>Statut:</strong>{" "}
                        <Badge
                          className={getStatusColor(selectedEmployee.status)}
                        >
                          {formatStatus(selectedEmployee.status)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="contracts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>
                        Contrat {selectedEmployee.contract_type || "Non défini"}
                      </CardTitle>
                      <div className="flex gap-2">
                        {selectedEmployee.contract_file_name ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDownloadContract(selectedEmployee)
                              }
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Télécharger
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleViewContract(selectedEmployee)
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Voir
                            </Button>
                          </>
                        ) : (
                          <Badge variant="secondary">
                            <FileText className="mr-1 h-3 w-3" />
                            Aucun contrat uploadé
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong>Date de début:</strong>{" "}
                          {selectedEmployee.contract_start_date
                            ? formatDate(selectedEmployee.contract_start_date)
                            : "Non définie"}
                        </div>
                        <div>
                          <strong>Date de fin:</strong>{" "}
                          {selectedEmployee.contract_end_date
                            ? formatDate(selectedEmployee.contract_end_date)
                            : "Indéterminée"}
                        </div>
                        <div>
                          <strong>Salaire:</strong>{" "}
                          {formatCurrency(selectedEmployee.salary)}
                        </div>
                        <div>
                          <strong>Statut:</strong>{" "}
                          <Badge
                            variant={
                              selectedEmployee.contract_status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {selectedEmployee.contract_status || "actif"}
                          </Badge>
                        </div>
                      </div>

                      {selectedEmployee.contract_file_name && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-green-600" />
                            <div className="flex-1">
                              <h4 className="font-medium text-green-800">
                                Contrat disponible
                              </h4>
                              <p className="text-sm text-green-700">
                                📄 {selectedEmployee.contract_file_name}
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                Uploadé le{" "}
                                {selectedEmployee.updated_at
                                  ? formatDate(selectedEmployee.updated_at)
                                  : "Date inconnue"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleViewContract(selectedEmployee)
                                }
                                className="border-green-300 hover:bg-green-100"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDownloadContract(selectedEmployee)
                                }
                                className="border-green-300 hover:bg-green-100"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects" className="space-y-4">
                <div className="grid gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Projets actifs</h4>
                          <p className="text-sm text-muted-foreground">
                            Rôle: {selectedEmployee.position}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {selectedEmployee.active_projects || 0} projets
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Aucun employé trouvé avec les critères de recherche actuels.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
