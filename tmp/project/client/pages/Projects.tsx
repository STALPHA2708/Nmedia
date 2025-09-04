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
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Euro,
  Users,
  Clock,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectForm } from "@/components/ProjectForm";
import { projectApi, employeeApi, handleApiError, formatCurrency, formatDate, apiRequest } from "@/lib/api";
import type { Project, Employee } from "@shared/api";
import { useToast } from "@/hooks/use-toast";

const getStatusColor = (status: string) => {
  switch (status) {
    case "production":
      return "bg-nomedia-blue/10 text-nomedia-blue border-nomedia-blue/20";
    case "post_production":
      return "bg-nomedia-orange/10 text-nomedia-orange border-nomedia-orange/20";
    case "pre_production":
      return "bg-nomedia-purple/10 text-nomedia-purple border-nomedia-purple/20";
    case "completed":
      return "bg-nomedia-green/10 text-nomedia-green border-nomedia-green/20";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatStatus = (status: string) => {
  switch (status) {
    case "pre_production":
      return "Pré-Production";
    case "production":
      return "En Production";
    case "post_production":
      return "Post-Production";
    case "completed":
      return "Terminé";
    default:
      return status;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "destructive";
    case "medium":
      return "default";
    case "low":
      return "secondary";
    default:
      return "default";
  }
};

const formatPriority = (priority: string) => {
  switch (priority) {
    case "high":
      return "Urgent";
    case "medium":
      return "Moyen";
    case "low":
      return "Faible";
    default:
      return priority;
  }
};

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const { toast } = useToast();

  // Load data on component mount
  useEffect(() => {
    loadProjects();
    loadEmployees();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectApi.getAll();
      setProjects(response.data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await employeeApi.getAll();
      console.log('Employee API response:', response);
      setEmployees(response.data || []);
      console.log('Loaded employees:', response.data || []);
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  const handleCreateProject = async (formData: any) => {
    try {
      setCreating(true);
      console.log('Creating project with form data:', formData);

      // Basic validation
      if (!formData.name || !formData.client || !formData.description) {
        throw new Error('Veuillez remplir tous les champs obligatoires (nom, client, description)');
      }

      if (!formData.budget || formData.budget <= 0) {
        throw new Error('Le budget doit être supérieur �� 0');
      }

      if (!formData.deadline || !formData.startDate) {
        throw new Error('Veuillez sélectionner les dates de début et de fin');
      }

      // Transform form data to API format
      const projectData = {
        name: formData.name.trim(),
        client: formData.client.trim(),
        description: formData.description.trim(),
        budget: Number(formData.budget),
        startDate: formData.startDate,
        deadline: formData.deadline,
        status: (() => {
          switch(formData.status) {
            case 'Pré-Production': return 'pre_production';
            case 'En Production': return 'production';
            case 'Post-Production': return 'post_production';
            case 'Terminé': return 'completed';
            default: return 'pre_production';
          }
        })(),
        priority: formData.priority || 'medium',
        projectType: formData.projectType || 'production',
        deliverables: formData.deliverables || [],
        notes: formData.notes || '',
        clientContact: formData.clientContact || { name: '', email: '', phone: '' },
        teamMembers: formData.teamMembers?.filter((member: any) => member.employeeId).map((member: any) => ({
          employeeId: Number(member.employeeId),
          role: member.role,
          startDate: member.startDate,
          endDate: member.endDate,
          hourlyRate: member.hourlyRate ? Number(member.hourlyRate) : null,
        })) || [],
      };

      console.log('Sending project data to API:', projectData);

      // Test direct API call
      const response = await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData)
      });

      console.log('Raw API response:', response);

      if (response && response.success) {
        console.log('Project created successfully:', response.data);
        await loadProjects();
        setIsCreateDialogOpen(false);

        toast({
          title: "Succès",
          description: "Projet créé avec succès",
        });
      } else {
        console.error('Project creation failed:', response);
        throw new Error(response?.message || 'Échec de la création du projet');
      }
    } catch (error) {
      console.error('Project creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur de création",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProject = async (formData: any) => {
    if (!editingProject) return;
    
    try {
      setUpdating(true);
      
      const projectData = {
        name: formData.name,
        client: formData.client,
        description: formData.description,
        budget: formData.budget,
        startDate: formData.startDate,
        deadline: formData.deadline,
        status: (() => {
          switch(formData.status) {
            case 'Pré-Production': return 'pre_production';
            case 'En Production': return 'production';
            case 'Post-Production': return 'post_production';
            case 'Terminé': return 'completed';
            default: return 'pre_production';
          }
        })(),
        priority: formData.priority,
        projectType: formData.projectType,
        deliverables: formData.deliverables,
        notes: formData.notes,
        clientContact: formData.clientContact,
        progress: formData.progress || editingProject.progress,
        spent: formData.spent || editingProject.spent,
      };

      await projectApi.update(editingProject.id, projectData);
      await loadProjects();
      setIsEditDialogOpen(false);
      setEditingProject(null);
      
      toast({
        title: "Succès",
        description: "Projet mis à jour avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    try {
      setDeleting(projectId);
      await projectApi.delete(projectId);
      await loadProjects();
      setSelectedProject(null);
      
      toast({
        title: "Succès",
        description: "Projet supprimé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const getContractStatusColor = (compliance: number) => {
    if (compliance >= 100) return "text-nomedia-green";
    if (compliance >= 70) return "text-nomedia-orange";
    return "text-destructive";
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des projets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Projets</h1>
          <p className="text-lg text-muted-foreground">
            Gérez vos projets audiovisuels avec équipes et contrats
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          console.log('Project dialog state changing to:', open);
          setIsCreateDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Projet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Cr��er un nouveau projet</DialogTitle>
              <DialogDescription>
                Configurez votre projet avec équipe et contrats pour un suivi
                complet
              </DialogDescription>
            </DialogHeader>
            <ProjectForm
              onSubmit={handleCreateProject}
              onCancel={() => setIsCreateDialogOpen(false)}
              employees={employees}
              isSubmitting={creating}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un projet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pre_production">Pré-Production</SelectItem>
              <SelectItem value="production">En Production</SelectItem>
              <SelectItem value="post_production">Post-Production</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 auto-rows-fr">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow flex flex-col h-full">
            <CardHeader className="flex-none">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                  <CardDescription className="truncate">{project.client_name}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-2 flex-shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setSelectedProject(project)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Voir détails
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      Gérer contrats
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleEditProject(project)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?`)) {
                          handleDeleteProject(project.id);
                        }
                      }}
                      disabled={deleting === project.id}
                    >
                      {deleting === project.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={getStatusColor(project.status)}
                >
                  {formatStatus(project.status)}
                </Badge>
                <Badge variant={getPriorityColor(project.priority)}>
                  {formatPriority(project.priority)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Budget</span>
                  <span>{formatCurrency(project.budget)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Dépensé</span>
                  <span>{formatCurrency(project.spent)}</span>
                </div>
                <Progress
                  value={(project.spent / project.budget) * 100}
                  className="h-1"
                />
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{formatDate(project.deadline)}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3 flex-shrink-0" />
                  <span>{project.team_member_count || 0} personnes</span>
                </div>
              </div>

              {/* Contract Compliance */}
              <div className="space-y-2 mt-auto">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Contrats
                  </span>
                  <span
                    className={getContractStatusColor(
                      project.contracts_compliance || 0,
                    )}
                  >
                    {project.contracts_compliance || 0}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={project.contracts_compliance || 0}
                    className="h-2 flex-1"
                  />
                  {(project.contracts_compliance || 0) === 100 ? (
                    <CheckCircle className="h-4 w-4 text-nomedia-green flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                size="sm"
                onClick={() => setSelectedProject(project)}
              >
                Voir le projet
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Aucun projet trouvé avec les critères de recherche actuels.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Modifier le projet</DialogTitle>
            <DialogDescription>
              Modifiez les informations du projet
            </DialogDescription>
          </DialogHeader>
          {editingProject && (
            <ProjectForm
              onSubmit={handleUpdateProject}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingProject(null);
              }}
              employees={employees}
              isSubmitting={updating}
              initialData={{
                name: editingProject.name,
                client: editingProject.client_name,
                description: editingProject.description,
                budget: editingProject.budget,
                startDate: editingProject.start_date,
                deadline: editingProject.deadline,
                status: formatStatus(editingProject.status),
                priority: editingProject.priority,
                projectType: editingProject.project_type,
                deliverables: editingProject.deliverables || [],
                notes: editingProject.notes,
                clientContact: {
                  name: editingProject.client_contact_name,
                  email: editingProject.client_contact_email,
                  phone: editingProject.client_contact_phone,
                },
                progress: editingProject.progress,
                spent: editingProject.spent,
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Project Details Dialog */}
      {selectedProject && (
        <Dialog
          open={!!selectedProject}
          onOpenChange={() => setSelectedProject(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{selectedProject.name}</DialogTitle>
              <DialogDescription>
                Détails du projet et suivi des contrats
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="team">Équipe</TabsTrigger>
                <TabsTrigger value="contracts">Contrats</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations Projet</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Client</label>
                        <p className="font-medium">{selectedProject.client_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <p className="text-sm">{selectedProject.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Statut</label>
                          <Badge
                            variant="outline"
                            className={getStatusColor(selectedProject.status)}
                          >
                            {formatStatus(selectedProject.status)}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Priorité</label>
                          <Badge
                            variant={getPriorityColor(selectedProject.priority)}
                          >
                            {formatPriority(selectedProject.priority)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Budget & Progression</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progression</span>
                          <span>{selectedProject.progress}%</span>
                        </div>
                        <Progress value={selectedProject.progress} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Budget utilisé</span>
                          <span>
                            {(
                              (selectedProject.spent / selectedProject.budget) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            (selectedProject.spent / selectedProject.budget) *
                            100
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="text-sm font-medium">Budget Total</label>
                          <p className="font-medium">
                            {formatCurrency(selectedProject.budget)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Dépensé</label>
                          <p className="font-medium">
                            {formatCurrency(selectedProject.spent)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Membres de l'Équipe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedProject.team_members?.map(
                        (member: any, index: number) => (
                          <Card key={index} className="border">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold">{member.employee_name}</h4>
                                <Badge variant="outline">{member.role}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                {member.contract_status === "verified" && (
                                  <CheckCircle className="h-4 w-4 text-nomedia-green" />
                                )}
                                {member.contract_status === "uploaded" && (
                                  <Clock className="h-4 w-4 text-nomedia-orange" />
                                )}
                                {member.contract_status === "pending" && (
                                  <AlertTriangle className="h-4 w-4 text-destructive" />
                                )}
                                <span className="text-sm text-muted-foreground">
                                  {member.contract_status === "verified" &&
                                    "Contrat v��rifié"}
                                  {member.contract_status === "uploaded" &&
                                    "En cours de vérification"}
                                  {member.contract_status === "pending" &&
                                    "Contrat manquant"}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ),
                      ) || (
                        <p className="text-muted-foreground col-span-2 text-center py-4">
                          Aucun membre d'équipe assigné
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contracts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>État des Contrats</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Conformité:
                        </span>
                        <Badge
                          variant={
                            (selectedProject.contracts_compliance || 0) === 100
                              ? "default"
                              : "destructive"
                          }
                        >
                          {selectedProject.contracts_compliance || 0}%
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedProject.team_members?.length > 0 ? (
                      <div className="space-y-4">
                        {selectedProject.team_members.map(
                          (member: any, index: number) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold">
                                    {member.employee_name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {member.role}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {member.contract_status === "verified" && (
                                    <>
                                      <CheckCircle className="h-5 w-5 text-nomedia-green" />
                                      <Badge
                                        variant="outline"
                                        className="bg-nomedia-green/10 text-nomedia-green"
                                      >
                                        Vérifié
                                      </Badge>
                                    </>
                                  )}
                                  {member.contract_status === "uploaded" && (
                                    <>
                                      <Clock className="h-5 w-5 text-nomedia-orange" />
                                      <Badge
                                        variant="outline"
                                        className="bg-nomedia-orange/10 text-nomedia-orange"
                                      >
                                        En révision
                                      </Badge>
                                    </>
                                  )}
                                  {member.contract_status === "pending" && (
                                    <>
                                      <AlertTriangle className="h-5 w-5 text-destructive" />
                                      <Badge variant="destructive">
                                        Manquant
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>

                              {member.contract_status === "pending" && (
                                <div className="mt-3 p-3 bg-destructive/5 rounded border border-destructive/20">
                                  <p className="text-sm text-destructive">
                                    ⚠️ Action requise: Le contrat de{" "}
                                    {member.employee_name} doit être uploadé pour assurer
                                    la conformité du projet.
                                  </p>
                                </div>
                              )}
                            </div>
                          ),
                        )}

                        {(selectedProject.contracts_compliance || 0) < 100 && (
                          <div className="mt-6 p-4 bg-destructive/5 rounded border border-destructive/20">
                            <h4 className="font-semibold text-destructive mb-2">
                              Actions Requises
                            </h4>
                            <p className="text-sm text-destructive">
                              {
                                selectedProject.team_members?.filter(
                                  (m: any) => m.contract_status === "pending",
                                ).length || 0
                              }{" "}
                              contrat(s) manquant(s). Veuillez vous assurer que
                              tous les membres de l'équipe ont des contrats
                              signés et uploadés pour la traçabilité légale.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Aucune information de contrat disponible pour ce projet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
