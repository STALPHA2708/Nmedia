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
import { useAuth } from "@/contexts/AuthContext";
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
import { invoiceApi, formatCurrency, formatDate, handleApiError } from "@/lib/api";
import type { Invoice } from "@shared/api";
import { useToast } from "@/hooks/use-toast";

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
  const { hasRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceApi.getAll();
      setInvoices(response.data || []);
    } catch (error) {
      console.error("Error loading invoices:", error);
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (formData: any) => {
    try {
      setCreating(true);
      console.log('Creating invoice with data:', formData);
      
      const response = await invoiceApi.create(formData);
      console.log('Invoice creation response:', response);
      
      if (response.success) {
        await loadInvoices();
        setIsCreateDialogOpen(false);
        toast({
          title: "Succès",
          description: "Facture créée avec succès",
        });
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    try {
      setDeleting(invoiceId);
      await invoiceApi.delete(invoiceId);
      await loadInvoices();
      setSelectedInvoice(null);
      
      toast({
        title: "Succès",
        description: "Facture supprimée avec succès",
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

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.project?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
          {hasRole('admin') ? (
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
          ) : (
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
          )}
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

      {/* Invoices Grid */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
                  <CardDescription>{invoice.client}</CardDescription>
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
                    {hasRole('admin') ? (
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
                    ) : (
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
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusColor(invoice.status)}>
                  {getStatusIcon(invoice.status)}
                  <span className="ml-1">{formatStatus(invoice.status)}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Projet:</span>
                  <span className="font-medium truncate ml-2">{invoice.project}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Montant HT:</span>
                  <span className="font-medium">{formatCurrency(invoice.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total TTC:</span>
                  <span className="font-bold">{formatCurrency(invoice.total_amount)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Émission:</span>
                  <div>{formatDate(invoice.issue_date)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Échéance:</span>
                  <div>{formatDate(invoice.due_date)}</div>
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
        ))}
      </div>

      {filteredInvoices.length === 0 && (
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
              hasRole('admin') ? (
                <Button
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer votre première facture
                </Button>
              ) : (
                <InvoiceManagerRestriction>
                  <Button
                    className="mt-4"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Créer votre première facture
                  </Button>
                </InvoiceManagerRestriction>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Invoice Details Dialog */}
      {selectedInvoice && (
        <Dialog
          open={!!selectedInvoice}
          onOpenChange={() => setSelectedInvoice(null)}
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
              <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
