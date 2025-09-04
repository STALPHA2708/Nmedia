import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Check, 
  Crown, 
  Zap, 
  Shield, 
  Users, 
  FolderOpen, 
  HardDrive,
  Mail,
  Phone,
  Building,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { safeFetch } from "@/lib/error-handler";

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: number;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxUsers: number;
  maxProjects: number;
  maxStorage: number;
  features: PlanFeature[];
  popular?: boolean;
  icon: React.ReactNode;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Parfait pour les petites équipes',
    priceMonthly: 2500,
    priceYearly: 25000,
    maxUsers: 5,
    maxProjects: 20,
    maxStorage: 10,
    icon: <Zap className="h-6 w-6" />,
    features: [
      { name: 'Gestion de projets', included: true },
      { name: 'Équipe', included: true, limit: 5 },
      { name: 'Facturation basique', included: true },
      { name: 'Support email', included: true },
      { name: 'Analytics avancés', included: false },
      { name: 'API access', included: false },
      { name: 'Branding personnalisé', included: false }
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Idéal pour équipes en croissance',
    priceMonthly: 4500,
    priceYearly: 45000,
    maxUsers: 15,
    maxProjects: 999999,
    maxStorage: 50,
    popular: true,
    icon: <Crown className="h-6 w-6" />,
    features: [
      { name: 'Tout du plan Starter', included: true },
      { name: 'Projets illimités', included: true },
      { name: 'Gestion des dépenses', included: true },
      { name: 'Analytics avancés', included: true },
      { name: 'Support prioritaire', included: true },
      { name: 'API access', included: false },
      { name: 'Branding personnalisé', included: false }
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solution complète organisations',
    priceMonthly: 8500,
    priceYearly: 85000,
    maxUsers: 999999,
    maxProjects: 999999,
    maxStorage: 200,
    icon: <Shield className="h-6 w-6" />,
    features: [
      { name: 'Tout du plan Professional', included: true },
      { name: 'Utilisateurs illimités', included: true },
      { name: 'Branding personnalisé', included: true },
      { name: 'API complet', included: true },
      { name: 'Sécurité avancée', included: true },
      { name: 'Support dédié', included: true },
      { name: 'Intégrations personnalisées', included: true }
    ]
  }
];

export default function SaaSSignup() {
  const [step, setStep] = useState(1);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Organization info
    organizationName: '',
    slug: '',
    industry: '',
    size: '',
    // Admin user info
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Billing info
    billingEmail: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Maroc',
    taxNumber: '',
    // Agreements
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from organization name
    if (field === 'organizationName' && typeof value === 'string') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getYearlyDiscount = (monthly: number, yearly: number) => {
    const yearlyEquivalent = monthly * 12;
    const discount = ((yearlyEquivalent - yearly) / yearlyEquivalent) * 100;
    return Math.round(discount);
  };

  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return !!selectedPlan;
      case 2:
        return !!(formData.organizationName && formData.slug && formData.industry && formData.size);
      case 3:
        return !!(
          formData.firstName &&
          formData.lastName &&
          formData.email &&
          formData.password &&
          formData.confirmPassword &&
          formData.password === formData.confirmPassword
        );
      case 4:
        return !!(
          formData.billingEmail &&
          formData.address &&
          formData.city &&
          formData.country &&
          formData.agreeTerms &&
          formData.agreePrivacy
        );
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    } else {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs requis.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      const signupData = {
        plan: selectedPlan,
        billingCycle,
        organization: {
          name: formData.organizationName,
          slug: formData.slug,
          industry: formData.industry,
          size: formData.size,
          address: formData.address,
          email: formData.billingEmail,
          tax_number: formData.taxNumber
        },
        user: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone
        },
        billing: {
          email: formData.billingEmail,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          taxNumber: formData.taxNumber
        }
      };

      const result = await safeFetch('/api/saas/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });

      toast({
        title: "Compte créé avec succès!",
        description: "Bienvenue sur Nomedia Production. Votre période d'essai a commencé."
      });

      // Redirect to onboarding or dashboard
      navigate('/onboarding');
    } catch (error) {
      toast({
        title: "Erreur lors de l'inscription",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nomedia-blue/5 to-nomedia-purple/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Créez votre espace Nomedia
          </h1>
          <p className="text-xl text-muted-foreground">
            Commencez votre essai gratuit de 14 jours
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((num) => (
              <React.Fragment key={num}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= num 
                    ? 'bg-nomedia-blue text-white' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step > num ? <Check className="h-4 w-4" /> : num}
                </div>
                {num < 4 && (
                  <div className={`w-8 h-0.5 ${
                    step > num ? 'bg-nomedia-blue' : 'bg-muted'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {step === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Choisissez votre plan</CardTitle>
                  <CardDescription>
                    Vous pouvez changer de plan à tout moment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Billing Toggle */}
                  <div className="flex justify-center mb-8">
                    <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}>
                      <TabsList className="grid w-fit grid-cols-2">
                        <TabsTrigger value="monthly">Mensuel</TabsTrigger>
                        <TabsTrigger value="yearly" className="relative">
                          Annuel 
                          <Badge variant="secondary" className="ml-1 text-xs">-17%</Badge>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Plans Grid */}
                  <div className="grid md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                      <Card 
                        key={plan.id}
                        className={`relative cursor-pointer transition-all duration-200 ${
                          selectedPlan === plan.id 
                            ? 'ring-2 ring-nomedia-blue shadow-lg scale-105' 
                            : 'hover:shadow-md'
                        } ${plan.popular ? 'border-nomedia-blue' : ''}`}
                        onClick={() => setSelectedPlan(plan.id)}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-nomedia-blue text-white">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Populaire
                            </Badge>
                          </div>
                        )}
                        
                        <CardHeader className="text-center">
                          <div className="flex justify-center mb-2">
                            {plan.icon}
                          </div>
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                          
                          <div className="mt-4">
                            <div className="text-3xl font-bold">
                              {formatPrice(billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {billingCycle === 'monthly' ? '/mois' : '/an'}
                            </div>
                            {billingCycle === 'yearly' && (
                              <div className="text-xs text-nomedia-green">
                                Économisez {getYearlyDiscount(plan.priceMonthly, plan.priceYearly)}%
                              </div>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Limits */}
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{plan.maxUsers === 999999 ? 'Illimité' : plan.maxUsers} utilisateurs</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FolderOpen className="h-4 w-4 text-muted-foreground" />
                              <span>{plan.maxProjects === 999999 ? 'Illimité' : plan.maxProjects} projets</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <HardDrive className="h-4 w-4 text-muted-foreground" />
                              <span>{plan.maxStorage}GB stockage</span>
                            </div>
                          </div>

                          {/* Features */}
                          <div className="space-y-2">
                            {plan.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                {feature.included ? (
                                  <Check className="h-4 w-4 text-nomedia-green" />
                                ) : (
                                  <div className="h-4 w-4" />
                                )}
                                <span className={feature.included ? '' : 'text-muted-foreground'}>
                                  {feature.name}
                                  {feature.limit && ` (${feature.limit})`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Informations sur votre organisation</CardTitle>
                <CardDescription>
                  Ces informations nous aident à personnaliser votre expérience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Nom de l'organisation *</Label>
                    <Input
                      id="organizationName"
                      value={formData.organizationName}
                      onChange={(e) => handleInputChange('organizationName', e.target.value)}
                      placeholder="Nomedia Production"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL de votre espace *</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                        https://
                      </span>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => handleInputChange('slug', e.target.value)}
                        className="rounded-l-none"
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-input bg-muted text-muted-foreground text-sm">
                        .nomedia.ma
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Secteur d'activité *</Label>
                    <RadioGroup value={formData.industry} onValueChange={(v) => handleInputChange('industry', v)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="audiovisual" id="audiovisual" />
                        <Label htmlFor="audiovisual">Production audiovisuelle</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="advertising" id="advertising" />
                        <Label htmlFor="advertising">Publicité</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="events" id="events" />
                        <Label htmlFor="events">Événementiel</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other">Autre</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">Taille de l'équipe *</Label>
                    <RadioGroup value={formData.size} onValueChange={(v) => handleInputChange('size', v)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="startup" id="startup" />
                        <Label htmlFor="startup">1-5 personnes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="small" id="small" />
                        <Label htmlFor="small">6-15 personnes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medium" id="medium" />
                        <Label htmlFor="medium">16-50 personnes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="large" id="large" />
                        <Label htmlFor="large">50+ personnes</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Créez votre compte administrateur</CardTitle>
                <CardDescription>
                  Vous serez le propriétaire de cette organisation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+212 6 XX XX XX XX"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    />
                  </div>
                </div>

                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <Alert>
                    <AlertDescription>
                      Les mots de passe ne correspondent pas.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Informations de facturation</CardTitle>
                <CardDescription>
                  Pour votre abonnement après la période d'essai
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingEmail">Email de facturation *</Label>
                    <Input
                      id="billingEmail"
                      type="email"
                      value={formData.billingEmail}
                      onChange={(e) => handleInputChange('billingEmail', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taxNumber">Numéro fiscal (ICE)</Label>
                    <Input
                      id="taxNumber"
                      value={formData.taxNumber}
                      onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Pays *</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      disabled
                    />
                  </div>
                </div>

                {/* Agreements */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeTerms"
                      checked={formData.agreeTerms}
                      onCheckedChange={(checked) => handleInputChange('agreeTerms', checked as boolean)}
                    />
                    <Label htmlFor="agreeTerms" className="text-sm">
                      J'accepte les <a href="/terms" className="text-nomedia-blue hover:underline">conditions d'utilisation</a> *
                    </Label>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreePrivacy"
                      checked={formData.agreePrivacy}
                      onCheckedChange={(checked) => handleInputChange('agreePrivacy', checked as boolean)}
                    />
                    <Label htmlFor="agreePrivacy" className="text-sm">
                      J'accepte la <a href="/privacy" className="text-nomedia-blue hover:underline">politique de confidentialité</a> *
                    </Label>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeMarketing"
                      checked={formData.agreeMarketing}
                      onCheckedChange={(checked) => handleInputChange('agreeMarketing', checked as boolean)}
                    />
                    <Label htmlFor="agreeMarketing" className="text-sm">
                      Je souhaite recevoir des emails sur les nouveautés et conseils (optionnel)
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              Précédent
            </Button>
            
            {step < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!validateStep(step)}
              >
                Suivant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!validateStep(step) || loading}
              >
                {loading ? "Création..." : "Créer mon compte"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
