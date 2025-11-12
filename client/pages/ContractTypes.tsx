import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Briefcase, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { contractTypeApi, handleApiError, formatDate } from "@/lib/api";
import type { ContractType } from "@shared/api";
import { useToast } from "@/hooks/use-toast";

export default function ContractTypes() {
  const location = useLocation();
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedContractType, setSelectedContractType] = useState<ContractType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_permanent: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Cleanup effect - reset all dialogs when navigating away
  useEffect(() => {
    return () => {
      setDialogOpen(false);
      setDeleteDialogOpen(false);
      setSelectedContractType(null);
      setFormErrors({});
    };
  }, [location.pathname]);

  useEffect(() => {
    loadContractTypes();
  }, []);

  const loadContractTypes = async () => {
    try {
      setLoading(true);
      const response = await contractTypeApi.getAll();
      setContractTypes(response.data || []);
    } catch (error) {
      handleApiError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Le nom du type de contrat est obligatoire";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Le nom doit contenir au moins 2 caractères";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      is_permanent: false,
    });
    setFormErrors({});
    setSelectedContractType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const contractTypeData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_permanent: formData.is_permanent,
      };

      if (selectedContractType) {
        // Update existing contract type
        await contractTypeApi.update(selectedContractType.id, contractTypeData);
        toast({
          title: "Type de contrat mis à jour",
          description: `Le type de contrat "${contractTypeData.name}" a été mis à jour avec succès.`,
        });
      } else {
        // Create new contract type
        await contractTypeApi.create(contractTypeData);
        toast({
          title: "Type de contrat créé",
          description: `Le type de contrat "${contractTypeData.name}" a été créé avec succès.`,
        });
      }

      setDialogOpen(false);
      resetForm();
      loadContractTypes();
    } catch (error) {
      handleApiError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (contractType: ContractType) => {
    setSelectedContractType(contractType);
    setFormData({
      name: contractType.name,
      description: contractType.description || "",
      is_permanent: contractType.is_permanent || false,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedContractType) return;

    try {
      await contractTypeApi.delete(selectedContractType.id);
      toast({
        title: "Type de contrat supprimé",
        description: `Le type de contrat "${selectedContractType.name}" a été supprimé avec succès.`,
      });
      setDeleteDialogOpen(false);
      setSelectedContractType(null);
      loadContractTypes();
    } catch (error) {
      handleApiError(error, toast);
    }
  };

  const openDeleteDialog = (contractType: ContractType) => {
    setSelectedContractType(contractType);
    setDeleteDialogOpen(true);
  };

  const filteredContractTypes = contractTypes.filter((contractType) =>
    contractType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contractType.description && contractType.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const permanentTypes = contractTypes.filter(ct => ct.is_permanent);
  const temporaryTypes = contractTypes.filter(ct => !ct.is_permanent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Types de Contrats</h1>
          <p className="text-muted-foreground">
            Gérez les types de contrats pour vos employés
          </p>
        </div>
        <Button
          onClick={() => {
            console.log("📋 Opening create contract type dialog");
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Type
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedContractType ? "Modifier le type de contrat" : "Nouveau type de contrat"}
              </DialogTitle>
              <DialogDescription>
                {selectedContractType 
                  ? "Modifiez les informations du type de contrat" 
                  : "Créez un nouveau type de contrat pour vos employés"
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du type de contrat *</Label>
                <Input
                  id="name"
                  placeholder="ex: CDI, CDD, Freelance, Stage..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? "border-destructive" : ""}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Description du type de contrat..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_permanent"
                  checked={formData.is_permanent}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_permanent: checked === true })}
                />
                <Label htmlFor="is_permanent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Contrat permanent (CDI)
                </Label>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {selectedContractType ? "Modification..." : "Cr��ation..."}
                    </div>
                  ) : (
                    selectedContractType ? "Modifier" : "Créer"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Types</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contractTypes.length}</div>
            <p className="text-xs text-muted-foreground">Types de contrats disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contrats Permanents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permanentTypes.length}</div>
            <p className="text-xs text-muted-foreground">CDI et ��quivalents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contrats Temporaires</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{temporaryTypes.length}</div>
            <p className="text-xs text-muted-foreground">CDD, stages, freelance</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Types de Contrats</CardTitle>
          <CardDescription>
            Gérez et organisez les types de contrats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un type de contrat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredContractTypes.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "Aucun type de contrat trouvé" : "Aucun type de contrat"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "Essayez de modifier vos critères de recherche"
                  : "Commencez par créer votre premier type de contrat"
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un type de contrat
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Employés</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContractTypes.map((contractType) => (
                    <TableRow key={contractType.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          {contractType.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={contractType.is_permanent ? "default" : "secondary"}
                          className={contractType.is_permanent 
                            ? "bg-nomedia-green/10 text-nomedia-green border-nomedia-green/20" 
                            : "bg-nomedia-orange/10 text-nomedia-orange border-nomedia-orange/20"
                          }
                        >
                          {contractType.is_permanent ? "Permanent" : "Temporaire"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {contractType.description ? (
                            <span className="text-sm text-muted-foreground">
                              {contractType.description.length > 60 
                                ? `${contractType.description.substring(0, 60)}...`
                                : contractType.description
                              }
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Aucune description
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {contractType.employee_count || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(contractType.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(contractType)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(contractType)}
                            disabled={(contractType.employee_count || 0) > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le type de contrat "{selectedContractType?.name}" ?
              Cette action est irréversible.
              {(selectedContractType?.employee_count || 0) > 0 && (
                <div className="mt-4 p-3 bg-destructive/10 rounded border border-destructive/20">
                  <p className="text-sm text-destructive">
                    Ce type de contrat est utilisé par {selectedContractType?.employee_count} employé(s).
                    Vous devez d'abord modifier leurs contrats avant de pouvoir supprimer ce type.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedContractType(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={(selectedContractType?.employee_count || 0) > 0}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
