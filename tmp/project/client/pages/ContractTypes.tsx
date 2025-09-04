import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Briefcase, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
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
import { AdminOnly } from "@/components/RoleGuard";

export default function ContractTypes() {
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
      if (selectedContractType) {
        await contractTypeApi.update(selectedContractType.id, formData);
        toast({
          title: "Succès",
          description: "Type de contrat modifié avec succès",
        });
      } else {
        await contractTypeApi.create(formData);
        toast({
          title: "Succès",
          description: "Type de contrat créé avec succès",
        });
      }
      
      setDialogOpen(false);
      resetForm();
      await loadContractTypes();
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
        title: "Succès",
        description: "Type de contrat supprimé avec succès",
      });
      setDeleteDialogOpen(false);
      setSelectedContractType(null);
      await loadContractTypes();
    } catch (error) {
      handleApiError(error, toast);
    }
  };

  const openDeleteDialog = (contractType: ContractType) => {
    setSelectedContractType(contractType);
    setDeleteDialogOpen(true);
  };

  const filteredContractTypes = contractTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminOnly>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nomedia-blue"></div>
        </div>
      </AdminOnly>
    );
  }

  return (
    <AdminOnly>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Types de Contrats</h1>
              <p className="text-gray-600">Gérez les différents types de contrats pour vos employés</p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Type de Contrat
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                    <Label htmlFor="name">Nom du type de contrat</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="ex: CDI, CDD, Stage..."
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_permanent"
                      checked={formData.is_permanent}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_permanent: checked })}
                    />
                    <Label htmlFor="is_permanent">Contrat permanent</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description du type de contrat..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Enregistrement..." : selectedContractType ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher un type de contrat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Contract Types Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Types de Contrats
                <Badge variant="secondary">{filteredContractTypes.length}</Badge>
              </CardTitle>
              <CardDescription>
                Liste des types de contrats disponibles pour vos employés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredContractTypes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Employés</TableHead>
                      <TableHead>Créé le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContractTypes.map((contractType) => (
                      <TableRow key={contractType.id}>
                        <TableCell className="font-medium">
                          {contractType.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant={contractType.is_permanent ? "default" : "secondary"}>
                            {contractType.is_permanent ? "Permanent" : "Temporaire"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <span className="text-sm text-gray-600 line-clamp-2">
                            {contractType.description || "Aucune description"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            <Users className="mr-1 h-3 w-3" />
                            {contractType.employee_count || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {formatDate(contractType.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(contractType)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
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
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">Aucun type de contrat</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? "Aucun résultat trouvé." : "Commencez par créer un type de contrat."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le type de contrat "{selectedContractType?.name}" ?
              Cette action est irréversible.
              {selectedContractType && (selectedContractType.employee_count || 0) > 0 && (
                <AlertDescription className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                  ⚠️ Attention : 
                  Ce type de contrat est utilisé par {selectedContractType.employee_count} employé(s).
                  Vous devez d'abord modifier leurs contrats avant de pouvoir supprimer ce type.
                </AlertDescription>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
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
    </AdminOnly>
  );
}
