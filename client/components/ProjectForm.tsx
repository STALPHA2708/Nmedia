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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";

interface ProjectFormData {
  name: string;
  client: string;
  description: string;
  budget: number;
  startDate: string;
  deadline: string;
  status: string;
  priority: string;
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

    // Validate required fields
    if (!formData.name.trim()) {
      alert("Le nom du projet est requis.");
      return;
    }

    if (!formData.client.trim()) {
      alert("Le nom du client est requis.");
      return;
    }

    if (!formData.description.trim()) {
      alert("La description du projet est requise.");
      return;
    }

    if (!formData.budget || formData.budget <= 0) {
      alert("Le budget doit être supérieur à 0.");
      return;
    }

    if (!formData.startDate) {
      alert("La date de début est requise.");
      return;
    }

    if (!formData.deadline) {
      alert("La date limite est requise.");
      return;
    }

    // Validate dates
    if (formData.deadline < formData.startDate) {
      alert("La date limite ne peut pas être antérieure à la date de début.");
      return;
    }

    console.log('Submitting simplified project form:', formData);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">Général</TabsTrigger>
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
                    min="1"
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
                    min={formData.startDate}
                  />
                </div>
              </div>
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
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
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
