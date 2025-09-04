import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Upload,
  FileText,
  User,
  Calendar,
  Euro,
  Users,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  Loader2,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  hourlyRate?: number;
  startDate: string;
  endDate?: string;
  employeeId?: number;
}

interface ProjectFormData {
  name: string;
  client: string;
  description: string;
  budget: number;
  startDate: string;
  deadline: string;
  status: string;
  priority: string;
  teamMembers: TeamMember[];
  clientContact: {
    name: string;
    email: string;
    phone: string;
  };
  projectType: string;
  deliverables: string[];
  notes: string;
  progress?: number;
  spent?: number;
}

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
  initialData?: Partial<ProjectFormData>;
  employees?: any[];
  isSubmitting?: boolean;
}

export function ProjectForm({
  onSubmit,
  onCancel,
  initialData,
  employees = [],
  isSubmitting = false,
}: ProjectFormProps) {
  const [currentTab, setCurrentTab] = useState("general");
  const [formData, setFormData] = useState<ProjectFormData>(() => ({
    name: initialData?.name || "",
    client: initialData?.client || "",
    description: initialData?.description || "",
    budget: initialData?.budget || 0,
    startDate: initialData?.startDate || new Date().toISOString().split("T")[0],
    deadline: initialData?.deadline || "",
    status: initialData?.status || "Pré-Production",
    priority: initialData?.priority || "medium",
    teamMembers: initialData?.teamMembers || [],
    clientContact: {
      name: initialData?.clientContact?.name || "",
      email: initialData?.clientContact?.email || "",
      phone: initialData?.clientContact?.phone || "",
    },
    projectType: initialData?.projectType || "production",
    deliverables: initialData?.deliverables || [],
    notes: initialData?.notes || "",
    progress: initialData?.progress || 0,
    spent: initialData?.spent || 0,
  }));

  const [newDeliverable, setNewDeliverable] = useState("");

  const generateMemberId = () =>
    `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: generateMemberId(),
      name: "",
      role: "",
      email: "",
      phone: "",
      startDate: formData.startDate,
      endDate: formData.deadline,
      employeeId: undefined,
    };
    setFormData({
      ...formData,
      teamMembers: [...formData.teamMembers, newMember],
    });
  };

  const updateTeamMember = (
    id: string,
    field: keyof TeamMember,
    value: any,
  ) => {
    setFormData({
      ...formData,
      teamMembers: formData.teamMembers.map((member) =>
        member.id === id ? { ...member, [field]: value } : member,
      ),
    });
  };

  const removeTeamMember = (id: string) => {
    setFormData({
      ...formData,
      teamMembers: formData.teamMembers.filter((member) => member.id !== id),
    });
  };



  const addDeliverable = () => {
    if (newDeliverable.trim()) {
      setFormData({
        ...formData,
        deliverables: [...formData.deliverables, newDeliverable.trim()],
      });
      setNewDeliverable("");
    }
  };

  const removeDeliverable = (index: number) => {
    setFormData({
      ...formData,
      deliverables: formData.deliverables.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.client || !formData.description || !formData.budget || !formData.deadline) {
      alert("Veuillez remplir tous les champs obligatoires (nom, client, description, budget, deadline).");
      return;
    }

    // Validate dates
    if (formData.deadline < formData.startDate) {
      alert("La date limite ne peut pas être antérieure à la date de début.");
      return;
    }

    // Team members are optional for project creation
    if (formData.teamMembers.length > 0) {
      // Validate team members have required fields
      const invalidMembers = formData.teamMembers.filter(
        (m) => !m.employeeId || !m.role
      );
      if (invalidMembers.length > 0) {
        alert("Tous les membres d'équipe doivent avoir un employé et un rôle assignés. Veuillez compléter tous les membres ou les supprimer.");
        setCurrentTab("team"); // Switch to team tab to show the issue
        return;
      }


    }

    console.log('Submitting project form data:', formData);
    onSubmit(formData);
  };



  const calculateTotalBudget = () => {
    const teamCost = formData.teamMembers.reduce((total, member) => {
      if (member.hourlyRate && member.startDate && member.endDate) {
        const startDate = new Date(member.startDate);
        const endDate = new Date(member.endDate);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const estimatedHours = diffDays * 8; // 8 hours per day
        return total + member.hourlyRate * estimatedHours;
      }
      return total;
    }, 0);
    return teamCost;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="team">Équipe</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
        </TabsList>

        {/* General Information Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations Générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom du Projet *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Spot TV - Marque Luxe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client">Client *</Label>
                  <Input
                    id="client"
                    value={formData.client}
                    onChange={(e) =>
                      setFormData({ ...formData, client: e.target.value })
                    }
                    placeholder="Nom du client"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description du Projet *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Décrivez le projet en détail..."
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="projectType">Type de Projet</Label>
                  <Select
                    value={formData.projectType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, projectType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="post-production">
                        Post-Production
                      </SelectItem>
                      <SelectItem value="documentaire">Documentaire</SelectItem>
                      <SelectItem value="publicite">Publicité</SelectItem>
                      <SelectItem value="formation">Formation</SelectItem>
                      <SelectItem value="evenementiel">Événementiel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pré-Production">
                        Pré-Production
                      </SelectItem>
                      <SelectItem value="En Production">
                        En Production
                      </SelectItem>
                      <SelectItem value="Post-Production">
                        Post-Production
                      </SelectItem>
                      <SelectItem value="Terminé">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priorité</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="clientContactName">Nom du Contact</Label>
                  <Input
                    id="clientContactName"
                    value={formData.clientContact.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        clientContact: {
                          ...formData.clientContact,
                          name: e.target.value,
                        },
                      })
                    }
                    placeholder="Nom du responsable"
                  />
                </div>
                <div>
                  <Label htmlFor="clientContactEmail">Email</Label>
                  <Input
                    id="clientContactEmail"
                    type="email"
                    value={formData.clientContact.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        clientContact: {
                          ...formData.clientContact,
                          email: e.target.value,
                        },
                      })
                    }
                    placeholder="email@client.com"
                  />
                </div>
                <div>
                  <Label htmlFor="clientContactPhone">Téléphone</Label>
                  <Input
                    id="clientContactPhone"
                    value={formData.clientContact.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        clientContact: {
                          ...formData.clientContact,
                          phone: e.target.value,
                        },
                      })
                    }
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Management Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Équipe du Projet</CardTitle>
                <Button
                  type="button"
                  onClick={addTeamMember}
                  size="sm"
                  disabled={!employees || employees.length === 0}
                  title={!employees || employees.length === 0 ? "Créez d'abord des employés" : ""}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un membre
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {employees && employees.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-yellow-800 font-medium">Aucun employé disponible</h4>
                      <p className="text-yellow-700 text-sm mt-1">
                        Vous devez d'abord créer des employés avant de pouvoir les assigner à un projet.
                        Rendez-vous dans la section "Employés" pour ajouter des membres à votre équipe.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {formData.teamMembers.length > 0 && (
                <div className="p-3 bg-muted rounded-lg mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Membres:</span>
                      <span className="ml-2">{formData.teamMembers.length}</span>
                    </div>

                    <div>
                      <span className="font-medium">Budget ��quipe:</span>
                      <span className="ml-2">{calculateTotalBudget().toLocaleString()} MAD</span>
                    </div>
                  </div>
                </div>
              )}

              {formData.teamMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun membre d'équipe ajouté.</p>
                  <p className="text-sm">
                    Cliquez sur "Ajouter un membre" pour commencer.
                  </p>
                  <p className="text-xs mt-2 text-nomedia-blue">
                    ⚠️ L'équipe est optionnelle, mais si vous ajoutez des membres,
                    vous devez sélectionner un employé et un rôle pour chacun.
                  </p>
                </div>
              ) : (
                formData.teamMembers.map((member) => (
                  <Card
                    key={member.id}
                    className="border-l-4 border-l-nomedia-blue bg-nomedia-blue/5 transition-all duration-200"
                  >
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="sm:col-span-2 lg:col-span-2">
                          <Label className="text-red-600">
                            Employé *
                            {!member.employeeId && (
                              <span className="text-xs ml-1">(Requis)</span>
                            )}
                          </Label>
                          <Select
                            value={member.employeeId?.toString() || ""}
                            onValueChange={(value) => {
                              console.log('Selected employee ID:', value);
                              if (value && value !== "no-employees") {
                                const employee = employees.find(e => e.id.toString() === value);
                                console.log('Found employee:', employee);
                                if (employee) {
                                  updateTeamMember(member.id, "employeeId", employee.id);
                                  updateTeamMember(member.id, "name", `${employee.first_name} ${employee.last_name}`);
                                  updateTeamMember(member.id, "email", employee.email || '');
                                  updateTeamMember(member.id, "phone", employee.phone || '');
                                }
                              } else {
                                // Clear employee data if none selected
                                updateTeamMember(member.id, "employeeId", undefined);
                                updateTeamMember(member.id, "name", "");
                                updateTeamMember(member.id, "email", "");
                                updateTeamMember(member.id, "phone", "");
                              }
                            }}
                          >
                            <SelectTrigger className={`w-full ${!member.employeeId ? 'border-red-300 bg-red-50' : ''}`}>
                              <SelectValue placeholder="Sélectionner un employé *" />
                            </SelectTrigger>
                            <SelectContent>
                              {employees && employees.length > 0 ? (
                                employees.map((employee) => (
                                  <SelectItem key={employee.id} value={employee.id.toString()}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {employee.first_name} {employee.last_name}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {employee.position} - {employee.email}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-employees" disabled>
                                  Aucun employé disponible - Créez d'abord des employés
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-1 lg:col-span-1">
                          <Label className="text-red-600">
                            Rôle/Fonction *
                            {!member.role && (
                              <span className="text-xs ml-1">(Requis)</span>
                            )}
                          </Label>
                          <Select
                            value={member.role}
                            onValueChange={(value) =>
                              updateTeamMember(member.id, "role", value)
                            }
                          >
                            <SelectTrigger className={`w-full ${!member.role ? 'border-red-300 bg-red-50' : ''}`}>
                              <SelectValue placeholder="Rôle *" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="directeur">Directeur</SelectItem>
                              <SelectItem value="producteur">Producteur</SelectItem>
                              <SelectItem value="realisateur">Réalisateur</SelectItem>
                              <SelectItem value="cameraman">Cameraman</SelectItem>
                              <SelectItem value="monteur">Monteur</SelectItem>
                              <SelectItem value="ingenieur-son">Ingénieur Son</SelectItem>
                              <SelectItem value="assistant">Assistant</SelectItem>
                              <SelectItem value="script">Script</SelectItem>
                              <SelectItem value="eclairagiste">Éclairagiste</SelectItem>
                              <SelectItem value="maquilleur">Maquilleur</SelectItem>
                              <SelectItem value="autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-1 lg:col-span-1">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={member.email}
                            onChange={(e) =>
                              updateTeamMember(
                                member.id,
                                "email",
                                e.target.value,
                              )
                            }
                            placeholder="email@exemple.com"
                            className="w-full"
                            readOnly={!!member.employeeId}
                          />
                        </div>
                        <div className="sm:col-span-1 lg:col-span-1">
                          <Label>Téléphone</Label>
                          <Input
                            value={member.phone}
                            onChange={(e) =>
                              updateTeamMember(
                                member.id,
                                "phone",
                                e.target.value,
                              )
                            }
                            placeholder="+212 6XX XXX XXX"
                            className="w-full"
                            readOnly={!!member.employeeId}
                          />
                        </div>
                        <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTeamMember(member.id)}
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span className="sm:hidden lg:inline">Supprimer</span>
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        <div>
                          <Label>Taux Horaire (MAD)</Label>
                          <Input
                            type="number"
                            value={member.hourlyRate || ""}
                            onChange={(e) =>
                              updateTeamMember(
                                member.id,
                                "hourlyRate",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            placeholder="150"
                            className="w-full"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <Label>Date de Début</Label>
                          <Input
                            type="date"
                            value={member.startDate}
                            onChange={(e) =>
                              updateTeamMember(
                                member.id,
                                "startDate",
                                e.target.value,
                              )
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label>Date de Fin</Label>
                          <Input
                            type="date"
                            value={member.endDate || ""}
                            onChange={(e) =>
                              updateTeamMember(
                                member.id,
                                "endDate",
                                e.target.value,
                              )
                            }
                            className="w-full"
                            min={member.startDate}
                          />
                        </div>
                        <div>
                          <Label>Estimation Budget</Label>
                          <div className="p-2 bg-muted rounded text-sm">
                            {(() => {
                              if (member.hourlyRate && member.startDate && member.endDate) {
                                const start = new Date(member.startDate);
                                const end = new Date(member.endDate);
                                const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                const hours = days * 8; // 8h per day
                                const cost = member.hourlyRate * hours;
                                return `${cost.toLocaleString()} MAD`;
                              }
                              return "Non calculé";
                            })()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>



        {/* Planning Tab */}
        <TabsContent value="planning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Planning & Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="budget">Budget Total (MAD) *</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        budget: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="500000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">Date de Début *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deadline">Date Limite *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {calculateTotalBudget() > 0 && (
                <div className="p-4 bg-nomedia-blue/5 rounded-lg">
                  <h4 className="font-semibold mb-2">
                    Estimation Coûts Équipe
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Coût estimé équipe:{" "}
                    {calculateTotalBudget().toLocaleString()} MAD
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Budget restant:{" "}
                    {(
                      formData.budget - calculateTotalBudget()
                    ).toLocaleString()}{" "}
                    MAD
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Livrables</CardTitle>
                <div className="flex gap-2">
                  <Input
                    value={newDeliverable}
                    onChange={(e) => setNewDeliverable(e.target.value)}
                    placeholder="Ajouter un livrable..."
                    className="w-48"
                  />
                  <Button type="button" onClick={addDeliverable} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {formData.deliverables.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucun livrable défini
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.deliverables.map((deliverable, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <span>{deliverable}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDeliverable(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes Additionnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Informations supplémentaires, contraintes, exigences spéciales..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex gap-4 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialData ? "Mise à jour..." : "Création..."}
            </>
          ) : (
            initialData ? "Mettre à jour le Projet" : "Créer le Projet"
          )}
        </Button>
      </div>
    </form>
  );
}
