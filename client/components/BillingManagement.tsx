import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  Calendar,
  Users,
  FolderOpen,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  Download,
  ExternalLink,
  Crown,
  Zap,
  Shield,
  ArrowUpCircle,
  Clock,
  Mail
} from "lucide-react";
import { useOrganization, useUsageLimits } from "@/contexts/OrganizationContext";
import { useToast } from "@/hooks/use-toast";
import { safeFetch } from "@/lib/error-handler";

interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  total_amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  paid_date?: string;
}

export default function BillingManagement() {
  const { organization, subscription, usage, refreshSubscription } = useOrganization();
  const usageLimits = useUsageLimits();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await safeFetch<Invoice[]>('/api/organization/invoices');
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'pending':
        return 'En attente';
      case 'overdue':
        return 'En retard';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trial':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'trial':
        return 'Période d\'essai';
      case 'past_due':
        return 'Paiement en retard';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'starter':
        return <Zap className="h-5 w-5" />;
      case 'professional':
        return <Crown className="h-5 w-5" />;
      case 'enterprise':
        return <Shield className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) return;

    setLoading(true);
    try {
      await safeFetch('/api/organization/subscription/cancel', {
        method: 'POST'
      });
      
      await refreshSubscription();
      toast({
        title: "Abonnement annulé",
        description: "Votre abonnement sera annulé à la fin de la période de facturation actuelle."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler l'abonnement. Contactez le support.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setLoading(true);
    try {
      await safeFetch('/api/organization/subscription/reactivate', {
        method: 'POST'
      });
      
      await refreshSubscription();
      toast({
        title: "Abonnement réactivé",
        description: "Votre abonnement a été réactivé avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de réactiver l'abonnement. Contactez le support.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: number) => {
    try {
      const response = await fetch(`/api/organization/invoices/${invoiceId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la facture.",
        variant: "destructive"
      });
    }
  };

  const isTrialExpiringSoon = () => {
    if (subscription?.status !== 'trial' || !subscription.trial_end) return false;
    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysRemaining <= 3;
  };

  const getTrialDaysRemaining = () => {
    if (!subscription?.trial_end) return 0;
    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    return Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  if (!organization || !subscription) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nomedia-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des informations de facturation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trial Warning */}
      {isTrialExpiringSoon() && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Votre période d'essai se termine dans {getTrialDaysRemaining()} jour(s). 
            <Button variant="link" className="p-0 ml-1 h-auto" onClick={() => setShowUpgradeModal(true)}>
              Mettez à niveau maintenant
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="usage">Utilisation</TabsTrigger>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getPlanIcon(subscription.plan_name)}
                Plan actuel: {subscription.plan_name}
              </CardTitle>
              <CardDescription>
                Gérez votre abonnement et votre facturation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge className={getSubscriptionStatusColor(subscription.status)}>
                    {getSubscriptionStatusText(subscription.status)}
                  </Badge>
                  {subscription.status === 'trial' && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({getTrialDaysRemaining()} jours restants)
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {formatCurrency(subscription.amount)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    /{subscription.billing_cycle === 'monthly' ? 'mois' : 'an'}
                  </div>
                </div>
              </div>

              {subscription.next_payment_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Prochain paiement: {formatDate(subscription.next_payment_date)}
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex gap-2">
                <Button onClick={() => setShowUpgradeModal(true)}>
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  Changer de plan
                </Button>
                
                {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                  <Button 
                    variant="outline" 
                    onClick={handleCancelSubscription}
                    disabled={loading}
                  >
                    Annuler l'abonnement
                  </Button>
                )}
                
                {subscription.cancel_at_period_end && (
                  <Button 
                    variant="outline" 
                    onClick={handleReactivateSubscription}
                    disabled={loading}
                  >
                    Réactiver l'abonnement
                  </Button>
                )}
              </div>

              {subscription.cancel_at_period_end && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Votre abonnement sera annulé le {formatDate(subscription.current_period_end)}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Utilisateurs</p>
                    <p className="text-2xl font-bold">
                      {usage?.users_count || 0}/{organization.max_users}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <Progress 
                  value={usageLimits.users.percentage} 
                  className="mt-3"
                  indicatorClassName={usageLimits.users.isNearLimit ? "bg-orange-500" : ""}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Projets</p>
                    <p className="text-2xl font-bold">
                      {usage?.projects_count || 0}/{organization.max_projects === 999999 ? '∞' : organization.max_projects}
                    </p>
                  </div>
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <Progress 
                  value={usageLimits.projects.percentage} 
                  className="mt-3"
                  indicatorClassName={usageLimits.projects.isNearLimit ? "bg-orange-500" : ""}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Stockage</p>
                    <p className="text-2xl font-bold">
                      {(usage?.storage_used_gb || 0).toFixed(1)}/{organization.max_storage_gb}GB
                    </p>
                  </div>
                  <HardDrive className="h-8 w-8 text-muted-foreground" />
                </div>
                <Progress 
                  value={usageLimits.storage.percentage} 
                  className="mt-3"
                  indicatorClassName={usageLimits.storage.isNearLimit ? "bg-orange-500" : ""}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Limites d'utilisation</CardTitle>
              <CardDescription>
                Suivez votre utilisation par rapport aux limites de votre plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Users Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Utilisateurs</span>
                  <span className="text-sm text-muted-foreground">
                    {usage?.users_count || 0} / {organization.max_users}
                  </span>
                </div>
                <Progress value={usageLimits.users.percentage} />
                {usageLimits.users.warningMessage && (
                  <p className="text-sm text-orange-600 mt-1">{usageLimits.users.warningMessage}</p>
                )}
              </div>

              {/* Projects Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Projets</span>
                  <span className="text-sm text-muted-foreground">
                    {usage?.projects_count || 0} / {organization.max_projects === 999999 ? 'Illimité' : organization.max_projects}
                  </span>
                </div>
                {organization.max_projects !== 999999 && (
                  <>
                    <Progress value={usageLimits.projects.percentage} />
                    {usageLimits.projects.warningMessage && (
                      <p className="text-sm text-orange-600 mt-1">{usageLimits.projects.warningMessage}</p>
                    )}
                  </>
                )}
              </div>

              {/* Storage Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Stockage</span>
                  <span className="text-sm text-muted-foreground">
                    {(usage?.storage_used_gb || 0).toFixed(1)}GB / {organization.max_storage_gb}GB
                  </span>
                </div>
                <Progress value={usageLimits.storage.percentage} />
                {usageLimits.storage.warningMessage && (
                  <p className="text-sm text-orange-600 mt-1">{usageLimits.storage.warningMessage}</p>
                )}
              </div>

              {(usageLimits.users.isNearLimit || usageLimits.projects.isNearLimit || usageLimits.storage.isNearLimit) && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Vous approchez des limites de votre plan. 
                    <Button variant="link" className="p-0 ml-1 h-auto" onClick={() => setShowUpgradeModal(true)}>
                      Mettre à niveau
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des factures</CardTitle>
              <CardDescription>
                Consultez et téléchargez vos factures
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                        <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>
                            {getStatusText(invoice.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadInvoice(invoice.id)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucune facture disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de facturation</CardTitle>
              <CardDescription>
                Gérez vos informations de facturation et de paiement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Email de facturation</h4>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{organization.billing_email}</span>
                  <Button variant="outline" size="sm">
                    Modifier
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Méthode de paiement</h4>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>•••• •••• •••• 1234</span>
                  <Button variant="outline" size="sm">
                    Modifier
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Adresse de facturation</h4>
                <div className="text-sm text-muted-foreground">
                  <p>{organization.address}</p>
                  {organization.tax_number && (
                    <p>ICE: {organization.tax_number}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="mt-2">
                  Modifier l'adresse
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
