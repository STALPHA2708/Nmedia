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
import { Plus, Trash2, Calendar } from "lucide-react";

interface InvoiceItem {
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

interface InvoiceFormData {
  invoiceNumber: string;
  client: string;
  clientIce: string;
  project: string;
  issueDate: string;
  dueDate: string;
  status?: string;
  items: InvoiceItem[];
  teamMembers?: string[];
  notes?: string;
}

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => void;
  onCancel: () => void;
}

export function InvoiceForm({ onSubmit, onCancel }: InvoiceFormProps) {
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: `NOM-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
    client: "",
    clientIce: "",
    project: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    status: "draft",
    items: [
      {
        description: "",
        unitPrice: 0,
        quantity: 1,
        total: 0,
      },
    ],
    teamMembers: [],
    notes: "",
  });

  const calculateItemTotal = (unitPrice: number, quantity: number) => {
    return unitPrice * quantity;
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.2; // 20% TVA
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "unitPrice" || field === "quantity") {
      newItems[index].total = calculateItemTotal(
        field === "unitPrice" ? value : newItems[index].unitPrice,
        field === "quantity" ? value : newItems[index].quantity,
      );
    }

    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          description: "",
          unitPrice: 0,
          quantity: 1,
          total: 0,
        },
      ],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invoiceData = {
      ...formData,
      amount: calculateSubtotal(),
      taxAmount: calculateTax(),
      totalAmount: calculateTotal(),
      status: formData.status || "draft",
    };
    onSubmit(invoiceData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Nom du Client *</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) =>
                  setFormData({ ...formData, client: e.target.value })
                }
                placeholder="Ex: STE NEW GENERATION PICTURES"
                required
              />
            </div>
            <div>
              <Label htmlFor="clientIce">ICE Client *</Label>
              <Input
                id="clientIce"
                value={formData.clientIce}
                onChange={(e) =>
                  setFormData({ ...formData, clientIce: e.target.value })
                }
                placeholder="Ex: 000515592000068"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="project">Nom du Projet *</Label>
            <Input
              id="project"
              value={formData.project}
              onChange={(e) =>
                setFormData({ ...formData, project: e.target.value })
              }
              placeholder="Ex: DOUBLAGE MINI SERIE ATTAR"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle>Détails de la Facture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Numéro de Facture</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceNumber: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status || "draft"}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as any })
                }
              >
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
            <div>
              <Label htmlFor="issueDate">Date d'émission</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) =>
                  setFormData({ ...formData, issueDate: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Date d'échéance</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Articles/Services</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un article
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg"
            >
              <div className="md:col-span-5">
                <Label>Description</Label>
                <Textarea
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, "description", e.target.value)
                  }
                  placeholder="Description du service..."
                  className="min-h-[60px]"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label>Prix Unitaire (MAD)</Label>
                <Input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(
                      index,
                      "unitPrice",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label>Quantité</Label>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", parseInt(e.target.value) || 1)
                  }
                  min="1"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label>Total (MAD)</Label>
                <Input
                  value={item.total.toFixed(2)}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(index)}
                  disabled={formData.items.length === 1}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Team Members (for admin version) */}
      <Card>
        <CardHeader>
          <CardTitle>Équipe Projet (Optionnel)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.teamMembers?.join(", ") || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                teamMembers: e.target.value
                  .split(",")
                  .map((name) => name.trim())
                  .filter((name) => name),
              })
            }
            placeholder="Noms des membres de l'équipe séparés par des virgules..."
            className="min-h-[80px]"
          />
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes Internes (Optionnel)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes || ""}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Notes pour usage interne..."
            className="min-h-[80px]"
          />
        </CardContent>
      </Card>

      {/* Totals Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Récapitulatif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Sous-total HT:</span>
              <span className="font-medium">
                {calculateSubtotal().toFixed(2)} MAD
              </span>
            </div>
            <div className="flex justify-between">
              <span>TVA (20%):</span>
              <span className="font-medium">
                {calculateTax().toFixed(2)} MAD
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total TTC:</span>
              <span>{calculateTotal().toFixed(2)} MAD</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">Créer la Facture</Button>
      </div>
    </form>
  );
}
