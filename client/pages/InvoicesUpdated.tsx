import React, { useState, useMemo, useCallback, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceForm } from "@/components/InvoiceForm";
import { generateInvoicePDF, downloadInvoiceCSV } from "@/lib/pdf-utils";
import { InvoiceManagerRestriction } from "@/components/RoleGuard";
import {
  Plus,
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Printer,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/api";
import type { Invoice } from "@shared/api";
import { useToast } from "@/hooks/use-toast";
import { useInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from "@/hooks/useInvoices";
import { useVirtualization } from "@/hooks/useVirtualization";

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

export default function InvoicesUpdated() {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statusChangeInvoice, setStatusChangeInvoice] = useState<Invoice | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const { toast } = useToast();

  // Cleanup effect - reset all dialogs when navigating away
  useEffect(() => {
    return () => {
      setIsCreateDialogOpen(false);
      setSelectedInvoice(null);
      setStatusChangeInvoice(null);
      setIsStatusDialogOpen(false);
      setNewStatus("");
    };
  }, [location.pathname]);

  // React Query hooks
  const { data: invoices = [], isLoading: loading } = useInvoices();
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const deleteInvoiceMutation = useDeleteInvoice();

  const creating = createInvoiceMutation.isPending;
  const deleting = deleteInvoiceMutation.variables as number | null;

  // Safe dialog close
  const handleCloseInvoiceDialog = useCallback(() => {
    setSelectedInvoice(null);
  }, []);

  const handleCloseStatusDialog = useCallback(() => {
    setIsStatusDialogOpen(false);
    // Clear data after a brief delay to allow dialog animation
    setTimeout(() => {
      setStatusChangeInvoice(null);
      setNewStatus("");
    }, 150);
  }, []);

  const handleCreateInvoice = (formData: any) => {
    console.log('Creating invoice with data:', formData);

    // Validate required fields
    if (!formData.client || !formData.project || !formData.items || formData.items.length === 0) {
      toast({
        title: "Validation échouée",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    // Transform to match CreateInvoiceRequest type (mixed case)
    const invoiceData = {
      invoiceNumber: formData.invoiceNumber,
      client: formData.client,
      clientIce: formData.clientIce,
      project: formData.project,
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      status: formData.status || "draft",
      amount: formData.amount || 0,
      taxAmount: formData.taxAmount || 0,
      totalAmount: formData.totalAmount || 0,
      items: formData.items.map((item: any) => ({
        description: item.description,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        total: item.total
      })),
      teamMembers: formData.teamMembers || [],
      notes: formData.notes || "",
    };

    console.log('Transformed invoice data:', invoiceData);

    // Close dialog IMMEDIATELY
    setIsCreateDialogOpen(false);

    // Fire mutation in background
    createInvoiceMutation.mutate(invoiceData);
  };

  const handleDeleteInvoice = (invoiceId: number) => {
    // Close dialog IMMEDIATELY
    setSelectedInvoice(null);

    // Fire deletion in background
    deleteInvoiceMutation.mutate(invoiceId);
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    try {
      generateInvoicePDF(invoice, "client");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du PDF",
        variant: "destructive",
      });
    }
  };

  const handleDownloadCSV = () => {
    try {
      downloadInvoiceCSV(filteredInvoices);
      toast({
        title: "Succès",
        description: "Export CSV téléchargé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'export CSV",
        variant: "destructive",
      });
    }
  };

  const handleChangeStatus = useCallback((invoice: Invoice) => {
    setStatusChangeInvoice(invoice);
    setNewStatus(invoice.status);
    setIsStatusDialogOpen(true);
  }, []);

  const handleUpdateStatus = useCallback(() => {
    if (!statusChangeInvoice || !newStatus) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un statut",
        variant: "destructive",
      });
      return;
    }

    // Don't update if status hasn't changed
    if (newStatus === statusChangeInvoice.status) {
      handleCloseStatusDialog();
      return;
    }

    // Store values before closing
    const invoiceId = statusChangeInvoice.id;
    const statusToUpdate = newStatus;

    // Close dialog IMMEDIATELY
    setIsStatusDialogOpen(false);

    // Fire mutation in background - don't wait for it
    updateInvoiceMutation.mutate({
      id: invoiceId,
      data: { status: statusToUpdate as any }
    }, {
      onSuccess: () => {
        toast({
          title: "Statut mis à jour",
          description: `Le statut de la facture a été changé vers "${formatStatus(statusToUpdate)}".`,
        });
      }
    });

    // Clear state after dialog animation
    setTimeout(() => {
      setStatusChangeInvoice(null);
      setNewStatus("");
    }, 150);
  }, [statusChangeInvoice, newStatus, toast, updateInvoiceMutation, formatStatus]);

  // Memoize filtered invoices to prevent unnecessary recalculations
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoice_number?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        invoice.client?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        invoice.project?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = filterStatus === "all" || invoice.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, debouncedSearch, filterStatus]);

  // Use virtualization for large lists
  const {
    items: displayedInvoices,
    currentPage,
    totalPages,
    totalItems,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    goToNextPage,
    goToPreviousPage,
  } = useVirtualization({ items: filteredInvoices, itemsPerPage: 12 });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des factures...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Factures</h1>
          <p className="text-lg text-muted-foreground">
            Gérez vos factures et suivez les paiements clients
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadCSV}
            disabled={filteredInvoices.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <InvoiceManagerRestriction>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-md">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle Facture
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle facture</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations de la facture
                  </DialogDescription>
                </DialogHeader>
                <InvoiceForm
                  onSubmit={handleCreateInvoice}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </InvoiceManagerRestriction>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une facture..."
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
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="paid">Payée</SelectItem>
              <SelectItem value="overdue">En retard</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pagination Info */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Affichage de {((currentPage - 1) * 12) + 1} à {Math.min(currentPage * 12, totalItems)} sur {totalItems} factures
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={!hasPreviousPage}
              >
                Précédent
              </Button>
              <span className="text-sm">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={!hasNextPage}
              >
                Suivant
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Invoices Grid */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {displayedInvoices.map((invoice) => {
          if (!invoice || !invoice.id) return null;
          return (
          <Card key={invoice.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{invoice.invoice_number || 'N/A'}</CardTitle>
                  <CardDescription>{invoice.client || 'N/A'}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedInvoice(invoice)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Voir détails
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePrintInvoice(invoice)}>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimer PDF
                    </DropdownMenuItem>
                    <InvoiceManagerRestriction>
                      <DropdownMenuItem onClick={() => handleChangeStatus(invoice)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Changer statut
                      </DropdownMenuItem>
                    </InvoiceManagerRestriction>
                    <InvoiceManagerRestriction>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          if (confirm(`Êtes-vous sûr de vouloir supprimer la facture "${invoice.invoice_number}" ?`)) {
                            handleDeleteInvoice(invoice.id);
                          }
                        }}
                        disabled={deleting === invoice.id}
                      >
                        {deleting === invoice.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Supprimer
                      </DropdownMenuItem>
                    </InvoiceManagerRestriction>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusColor(invoice.status || 'draft')}>
                  {getStatusIcon(invoice.status || 'draft')}
                  <span className="ml-1">{formatStatus(invoice.status || 'draft')}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Projet:</span>
                  <span className="font-medium truncate ml-2">{invoice.project || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Montant HT:</span>
                  <span className="font-medium">{formatCurrency(invoice.amount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total TTC:</span>
                  <span className="font-bold">{formatCurrency(invoice.total_amount || 0)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Émission:</span>
                  <div>{invoice.issue_date ? formatDate(invoice.issue_date) : 'N/A'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Échéance:</span>
                  <div>{invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}</div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => setSelectedInvoice(invoice)}
              >
                Voir la facture
              </Button>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {totalItems === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {invoices.length === 0 
                ? "Aucune facture créée pour le moment."
                : "Aucune facture trouvée avec les critères de recherche actuels."
              }
            </p>
            {invoices.length === 0 && (
              <InvoiceManagerRestriction>
                <Button
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer votre première facture
                </Button>
              </InvoiceManagerRestriction>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invoice Details Dialog */}
      {selectedInvoice && (
        <Dialog
          open={!!selectedInvoice}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseInvoiceDialog();
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Facture {selectedInvoice.invoice_number}</DialogTitle>
              <DialogDescription>
                Détails complets de la facture
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="details">Détails</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Invoice Overview Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations Facture</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Numéro</label>
                        <p className="font-medium">{selectedInvoice.invoice_number}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Date d'émission</label>
                        <p>{formatDate(selectedInvoice.issue_date)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Date d'échéance</label>
                        <p>{formatDate(selectedInvoice.due_date)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Statut</label>
                        <Badge variant="outline" className={getStatusColor(selectedInvoice.status)}>
                          {formatStatus(selectedInvoice.status)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Informations Client</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Client</label>
                        <p className="font-medium">{selectedInvoice.client}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">ICE</label>
                        <p>{selectedInvoice.client_ice}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Projet</label>
                        <p>{selectedInvoice.project}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Totaux</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Montant HT:</span>
                        <span className="font-medium">{formatCurrency(selectedInvoice.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TVA (20%):</span>
                        <span className="font-medium">{formatCurrency(selectedInvoice.tax_amount)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total TTC:</span>
                        <span>{formatCurrency(selectedInvoice.total_amount)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Prestations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Prix Unitaire</TableHead>
                          <TableHead className="text-center">Quantité</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items?.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unit_price)}
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.total)}
                            </TableCell>
                          </TableRow>
                        )) || (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              Aucune prestation détaillée
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {selectedInvoice.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedInvoice.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => handlePrintInvoice(selectedInvoice)}
                className="flex-1"
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimer PDF
              </Button>
              <Button variant="outline" onClick={handleCloseInvoiceDialog}>
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Status Change Dialog */}
      <Dialog
        open={isStatusDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseStatusDialog();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Changer le statut de la facture</DialogTitle>
            <DialogDescription>
              Facture: {statusChangeInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Nouveau statut</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">📝 Brouillon</SelectItem>
                  <SelectItem value="pending">⏰ En attente</SelectItem>
                  <SelectItem value="paid">✅ Payée</SelectItem>
                  <SelectItem value="overdue">⚠️ En retard</SelectItem>
                  <SelectItem value="cancelled">❌ Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleCloseStatusDialog}
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={newStatus === statusChangeInvoice?.status}
              >
                Changer le statut
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
