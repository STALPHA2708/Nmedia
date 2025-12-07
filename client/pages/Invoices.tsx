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
import { invoiceApi, handleApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Invoice } from "@shared/api";

// Removed mock data - now using real API

const getStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-nomedia-green/10 text-nomedia-green border-nomedia-green/20";
    case "pending":
      return "bg-nomedia-orange/10 text-nomedia-orange border-nomedia-orange/20";
    case "overdue":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "draft":
      return "bg-nomedia-gray/10 text-nomedia-gray border-nomedia-gray/20";
    default:
      return "bg-gray-100 text-gray-800";
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
    default:
      return status;
  }
};

// Customer Invoice Template Component
const CustomerInvoiceTemplate = ({ invoice }: { invoice: any }) => (
  <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg">
    {/* Header with Logo */}
    <div className="flex justify-between items-start mb-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F7a25a5293015472896bb7679c041e95e%2F27c40508f6d34af887b8f7974a28d0f3?format=webp&width=800"
            alt="Nomedia Production"
            className="h-16"
          />
        </div>
        <p className="text-sm text-gray-600">
          Adresse : 123, Rue Emile Zola, Casablanca
          <br />
          Tél : 212 522408888 / Fax : 212 522 608839 DXM : 212 661119900 / 212
          661436394
          <br />
          Email : contact@nomedianord.com / contact@nomedianord.com
          <br />
          ICE : 000000225004917 / IF : 33265750 / RC : 642540 / CNSS : BANK OF
          AFRICA - 011 780 000002000001407 26
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm">
          Casablanca : Le{" "}
          {new Date(invoice.issueDate).toLocaleDateString("fr-FR")}
        </p>
      </div>
    </div>

    {/* Client Info */}
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-2">Client : {invoice.client}</h2>
      <p className="text-sm">ICE : {invoice.clientIce}</p>
    </div>

    {/* Invoice Number */}
    <div className="mb-8">
      <h2 className="text-lg font-bold">Facture : {invoice.invoiceNumber}</h2>
    </div>

    {/* Items Table */}
    <div className="mb-8">
      <table className="w-full border-collapse border border-gray-400">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-400 p-3 text-left">
              Désignation
            </th>
            <th className="border border-gray-400 p-3 text-center">
              Prix unitaire
            </th>
            <th className="border border-gray-400 p-3 text-center">Qté</th>
            <th className="border border-gray-400 p-3 text-center">
              Prix Total H.T
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item: any, index: number) => (
            <tr key={index}>
              <td className="border border-gray-400 p-3">{item.description}</td>
              <td className="border border-gray-400 p-3 text-center">
                {item.unitPrice.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                })}
              </td>
              <td className="border border-gray-400 p-3 text-center">
                {item.quantity}
              </td>
              <td className="border border-gray-400 p-3 text-center">
                {item.total.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
          <tr>
            <td
              colSpan={3}
              className="border border-gray-400 p-3 text-center font-bold"
            >
              TOTAL H.T
            </td>
            <td className="border border-gray-400 p-3 text-center font-bold">
              {invoice.amount.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
              })}{" "}
              DH
            </td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="border border-gray-400 p-3 text-center font-bold"
            >
              T.V.A 20 %
            </td>
            <td className="border border-gray-400 p-3 text-center font-bold">
              {invoice.taxAmount.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
              })}{" "}
              DH
            </td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="border border-gray-400 p-3 text-center font-bold"
            >
              TOTAL T.T.C
            </td>
            <td className="border border-gray-400 p-3 text-center font-bold">
              {invoice.totalAmount.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
              })}{" "}
              DH
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Footer */}
    <div className="text-center mb-8">
      <p className="font-bold">
        ARRETE LA PRESENTE FACTURE A LA SOMME DE :<br />
        {numberToWords(invoice.totalAmount)} DIRHAMS TTC.
      </p>
    </div>

    {/* Signature */}
    <div className="flex justify-end">
      <div className="text-center">
        <p className="mb-4">La Direction</p>
        <div className="w-32 h-20 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
          Signature & Cachet
        </div>
      </div>
    </div>
  </div>
);

// Admin Invoice Template Component
const AdminInvoiceTemplate = ({ invoice }: { invoice: any }) => (
  <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg">
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-nomedia-blue mb-2">
        FACTURE ADMINISTRATIVE
      </h1>
      <p className="text-gray-600">Détails complets pour usage interne</p>
    </div>

    {/* Invoice Header */}
    <div className="grid grid-cols-2 gap-8 mb-8">
      <div>
        <h3 className="font-bold mb-2">Informations Facture</h3>
        <p>
          <strong>Numéro:</strong> {invoice.invoiceNumber}
        </p>
        <p>
          <strong>Date d'émission:</strong>{" "}
          {new Date(invoice.issueDate).toLocaleDateString("fr-FR")}
        </p>
        <p>
          <strong>Date d'échéance:</strong>{" "}
          {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
        </p>
        <p>
          <strong>Statut:</strong>{" "}
          <span
            className={`px-2 py-1 rounded text-xs ${getStatusColor(invoice.status)}`}
          >
            {formatStatus(invoice.status)}
          </span>
        </p>
      </div>
      <div>
        <h3 className="font-bold mb-2">Client</h3>
        <p>
          <strong>Nom:</strong> {invoice.client}
        </p>
        <p>
          <strong>ICE:</strong> {invoice.clientIce}
        </p>
        <p>
          <strong>Projet:</strong> {invoice.project}
        </p>
      </div>
    </div>

    {/* Detailed Items */}
    <div className="mb-8">
      <h3 className="font-bold mb-4">Détail des prestations</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Prix Unitaire</TableHead>
            <TableHead className="text-center">Quantité</TableHead>
            <TableHead className="text-right">Total HT</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoice.items.map((item: any, index: number) => (
            <TableRow key={index}>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-right">
                {item.unitPrice.toLocaleString()} MAD
              </TableCell>
              <TableCell className="text-center">{item.quantity}</TableCell>
              <TableCell className="text-right">
                {item.total.toLocaleString()} MAD
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    {/* Totals */}
    <div className="bg-gray-50 p-6 rounded-lg mb-8">
      <div className="flex justify-between mb-2">
        <span>Sous-total HT:</span>
        <span className="font-medium">
          {invoice.amount.toLocaleString()} MAD
        </span>
      </div>
      <div className="flex justify-between mb-2">
        <span>TVA (20%):</span>
        <span className="font-medium">
          {invoice.taxAmount.toLocaleString()} MAD
        </span>
      </div>
      <div className="flex justify-between text-lg font-bold border-t pt-2">
        <span>Total TTC:</span>
        <span>{invoice.totalAmount.toLocaleString()} MAD</span>
      </div>
    </div>

    {/* Team Information */}
    {invoice.teamMembers && invoice.teamMembers.length > 0 && (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-nomedia-blue">Équipe Projet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {invoice.teamMembers.map((member: string, index: number) => (
              <div key={index} className="p-3 bg-nomedia-blue/5 rounded-lg">
                <p className="font-medium text-sm">{member}</p>
                <p className="text-xs text-muted-foreground">
                  Membre de l'équipe
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Internal Notes */}
    <div className="bg-nomedia-blue/5 p-6 rounded-lg">
      <h4 className="font-bold text-nomedia-blue mb-4">
        Analyse Financière & Notes Internes
      </h4>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h5 className="font-semibold mb-2">Analyse Financière</h5>
          <p className="text-sm text-gray-600">
            • Marge brute: {(invoice.amount * 0.3).toLocaleString()} MAD (30%)
            <br />• Coûts de production estimés:{" "}
            {(invoice.amount * 0.7).toLocaleString()} MAD
            <br />• ROI projeté:{" "}
            {invoice.amount > 0 ? (((invoice.amount * 0.3) / invoice.amount) * 100).toFixed(1) : "0.0"}%
            <br />• Délai de paiement:{" "}
            {Math.ceil(
              (new Date(invoice.dueDate).getTime() -
                new Date(invoice.issueDate).getTime()) /
                (1000 * 60 * 60 * 24),
            )}{" "}
            jours
          </p>
        </div>
        <div>
          <h5 className="font-semibold mb-2">Informations Projet</h5>
          <p className="text-sm text-gray-600">
            • Responsable projet: {invoice.teamMembers?.[0] || "À définir"}
            <br />• Date de paiement prévue:{" "}
            {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
            <br />• Statut commercial: {formatStatus(invoice.status)}
            <br />• Référence interne: {invoice.invoiceNumber}
          </p>
        </div>
      </div>
      {invoice.notes && (
        <div className="mt-4 pt-4 border-t border-nomedia-blue/20">
          <h5 className="font-semibold mb-2">Notes Additionnelles</h5>
          <p className="text-sm text-gray-600">{invoice.notes}</p>
        </div>
      )}
    </div>
  </div>
);

// Helper function to convert numbers to words (simplified)
const numberToWords = (num: number): string => {
  // This is a simplified version - in production you'd want a complete French number-to-words converter
  const ones = [
    "",
    "UN",
    "DEUX",
    "TROIS",
    "QUATRE",
    "CINQ",
    "SIX",
    "SEPT",
    "HUIT",
    "NEUF",
  ];
  if (num < 10) return ones[num];
  if (num < 100) return `${Math.floor(num / 10) * 10} ${ones[num % 10]}`.trim();
  return `${Math.floor(num / 1000)} MILLE ${Math.floor((num % 1000) / 100)} CENT ${num % 100}`.trim();
};

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"customer" | "admin">("customer");
  const [invoicesList, setInvoicesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const { toast } = useToast();

  // Load invoices on mount
  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceApi.getAll();
      console.log("Invoices loaded:", response.data);
      setInvoicesList(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error loading invoices:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les factures",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (formData: any) => {
    try {
      setCreating(true);
      console.log("Creating invoice with form data:", formData);

      // Validate required fields
      if (!formData.client || !formData.project || !formData.invoiceNumber) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      if (!formData.items || formData.items.length === 0) {
        throw new Error("Veuillez ajouter au moins un article");
      }

      // Transform form data to API format
      const invoiceData = {
        invoiceNumber: formData.invoiceNumber,
        client: formData.client,
        clientIce: formData.clientIce || "",
        project: formData.project,
        amount: formData.amount || 0,
        taxAmount: formData.taxAmount || 0,
        totalAmount: formData.totalAmount || 0,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        status: formData.status || "draft",
        items: formData.items || [],
        teamMembers: formData.teamMembers || [],
        notes: formData.notes || "",
      };

      console.log("Sending invoice data to API:", invoiceData);

      const response = await invoiceApi.create(invoiceData);

      if (response && response.success) {
        console.log("Invoice created successfully:", response.data);
        await loadInvoices();
        setIsCreateDialogOpen(false);

        toast({
          title: "Succès",
          description: "Facture créée avec succès",
        });
      } else {
        throw new Error(response?.message || "Échec de la création de la facture");
      }
    } catch (error) {
      console.error("Invoice creation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast({
        title: "Erreur de création",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (!invoiceId) return;

    try {
      setDeleting(invoiceId);
      console.log(`Deleting invoice ${invoiceId}...`);

      await invoiceApi.delete(invoiceId);

      toast({
        title: "Succès",
        description: "Facture supprimée avec succès",
      });

      // Reload invoices to get complete updated data
      try {
        const invoicesRes = await invoiceApi.getAll();
        if (invoicesRes.success) {
          setInvoicesList(Array.isArray(invoicesRes.data) ? invoicesRes.data : []);
        }
      } catch (reloadError) {
        console.error("Error reloading invoices:", reloadError);
      }

      setSelectedInvoice(null);
    } catch (error) {
      console.error("Delete invoice error:", error);
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusChange = async (invoiceId: number, newStatus: string) => {
    if (!invoiceId) {
      toast({
        title: "Erreur",
        description: "ID de facture manquant",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true); // Show loading state
      console.log(`🔄 Changing invoice ${invoiceId} status to ${newStatus}`);

      // IMPORTANT: Only send status field, no other data
      const updateData = { status: newStatus };
      console.log('📤 Sending update:', updateData);

      const response = await invoiceApi.update(invoiceId, updateData);

      if (response && response.success) {
        console.log("✅ Status updated successfully:", response.data);

        toast({
          title: "Succès",
          description: `Statut mis à jour: ${formatStatus(newStatus)}`,
        });

        // Reload invoices to get complete updated data from server
        try {
          setLoading(true);
          const invoicesRes = await invoiceApi.getAll();
          if (invoicesRes.success && Array.isArray(invoicesRes.data)) {
            setInvoicesList(invoicesRes.data);
            console.log(`✅ Reloaded ${invoicesRes.data.length} invoices`);
          }
        } catch (reloadError) {
          console.error("Error reloading invoices:", reloadError);
          // Don't show error toast, status was updated successfully
        } finally {
          setLoading(false);
        }
      } else {
        throw new Error(response?.message || "Échec de la mise à jour du statut");
      }
    } catch (error) {
      console.error("❌ Status change error:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreating(false); // Hide loading state
    }
  };

  const handleDownloadPDF = (invoice: any, type: "client" | "admin") => {
    generateInvoicePDF(invoice, type);
  };

  const handleDownloadCSV = () => {
    downloadInvoiceCSV(filteredInvoices);
  };

  const filteredInvoices = (Array.isArray(invoicesList) ? invoicesList : []).filter((invoice) => {
    if (!invoice) return false; // Safety check

    const matchesSearch =
      (invoice.client || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.invoiceNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.project || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Chargement des factures...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Facturation</h1>
          <p className="text-lg text-muted-foreground">
            Gérez vos factures clients avec des modèles professionnels
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownloadCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button size="lg" className="shadow-md" onClick={() => {
            console.log("📄 Opening create invoice dialog");
            setIsCreateDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Facture
          </Button>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle facture</DialogTitle>
                <DialogDescription>
                  Remplissez les informations de facturation pour générer votre
                  facture
                </DialogDescription>
              </DialogHeader>
              {creating ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Création de la facture...</span>
                </div>
              ) : (
                <InvoiceForm
                  onSubmit={handleCreateInvoice}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
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
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoice List */}
      <div className="grid gap-6">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {invoice.invoiceNumber}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={getStatusColor(invoice.status)}
                    >
                      {getStatusIcon(invoice.status)}
                      <span className="ml-1">
                        {formatStatus(invoice.status)}
                      </span>
                    </Badge>
                  </div>
                  <CardDescription>
                    {invoice.client} - {invoice.project}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Prévisualiser
                    </DropdownMenuItem>
                    <InvoiceManagerRestriction action="télécharger" hideContent>
                      <DropdownMenuItem
                        onClick={() => handleDownloadPDF(invoice, "client")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PDF Client
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownloadPDF(invoice, "admin")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PDF Admin
                      </DropdownMenuItem>
                    </InvoiceManagerRestriction>
                    <DropdownMenuItem>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer par email
                    </DropdownMenuItem>
                    <InvoiceManagerRestriction action="modifier" hideContent>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>

                      {/* Status Change Submenu */}
                      <div className="px-2 py-1.5 text-sm font-semibold">
                        Changer le statut
                      </div>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(invoice.id, "draft")}
                        disabled={invoice.status === "draft"}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Brouillon
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(invoice.id, "pending")}
                        disabled={invoice.status === "pending"}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        En attente
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(invoice.id, "paid")}
                        disabled={invoice.status === "paid"}
                        className="text-nomedia-green"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Payée
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(invoice.id, "overdue")}
                        disabled={invoice.status === "overdue"}
                        className="text-nomedia-orange"
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        En retard
                      </DropdownMenuItem>

                      <div className="h-px bg-border my-1" />

                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          const invoiceId = invoice.id;
                          if (!invoiceId) {
                            toast({
                              title: "Erreur",
                              description: "ID de facture manquant",
                              variant: "destructive",
                            });
                            return;
                          }
                          if (confirm(`Êtes-vous sûr de vouloir supprimer la facture "${invoice.invoiceNumber}" ?`)) {
                            handleDeleteInvoice(invoiceId);
                          }
                        }}
                        disabled={deleting === invoice.id}
                      >
                        {deleting === invoice.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Suppression...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </>
                        )}
                      </DropdownMenuItem>
                    </InvoiceManagerRestriction>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date d'émission</p>
                  <p className="font-medium">
                    {new Date(invoice.issueDate).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Échéance</p>
                  <p className="font-medium">
                    {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Montant HT</p>
                  <p className="font-medium">
                    {invoice.amount.toLocaleString()} MAD
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total TTC</p>
                  <p className="font-bold text-lg">
                    {invoice.totalAmount.toLocaleString()} MAD
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <Dialog
          open={!!selectedInvoice}
          onOpenChange={() => setSelectedInvoice(null)}
        >
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>
                  Prévisualisation Facture {selectedInvoice.invoiceNumber}
                </DialogTitle>
                <div className="flex gap-2">
                  <Tabs
                    value={viewMode}
                    onValueChange={(value: any) => setViewMode(value)}
                  >
                    <TabsList>
                      <TabsTrigger value="customer">Client</TabsTrigger>
                      <TabsTrigger value="admin">Admin</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPDF(selectedInvoice, "client")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    PDF Client
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPDF(selectedInvoice, "admin")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    PDF Admin
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="mt-4">
              {viewMode === "customer" ? (
                <CustomerInvoiceTemplate invoice={selectedInvoice} />
              ) : (
                <AdminInvoiceTemplate invoice={selectedInvoice} />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {filteredInvoices.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Aucune facture trouvée avec les critères de recherche actuels.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
