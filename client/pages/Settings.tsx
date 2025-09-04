import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalization } from "@/contexts/LocalizationContext";
import {
  Settings as SettingsIcon,
  Building,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Mail,
  Phone,
  MapPin,
  Upload,
  Download,
  Save,
  Eye,
  EyeOff,
  Key,
  Trash2,
  AlertTriangle,
  Clock,
} from "lucide-react";

export default function Settings() {
  const {
    theme,
    accentColor,
    fontSize,
    setTheme,
    setAccentColor,
    setFontSize,
    actualTheme,
  } = useTheme();
  const {
    language,
    currency,
    dateFormat,
    timezone,
    setLanguage,
    setCurrency,
    setDateFormat,
    setTimezone,
    formatDate,
    formatCurrency,
  } = useLocalization();
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    projectUpdates: true,
    expenseAlerts: false,
    invoiceReminders: true,
    systemMaintenance: true,
    pushNotifications: true,
    smsNotifications: false,
    budgetAlerts: true,
    contractReminders: true,
  });

  const [companyInfo, setCompanyInfo] = useState({
    name: "Nomedia Production",
    address: "123, Rue Emile Zola, Casablanca",
    phone: "212 522408888",
    fax: "212 522 608839",
    email: "contact@nomedianord.com",
    ice: "000000225004917",
    if: "33265750",
    rc: "642540",
    cnss: "BANK OF AFRICA - 011 780 000002000001407 26",
    website: "www.nomediaproduction.ma",
    logo: null as File | null,
  });

  const [systemStats, setSystemStats] = useState({
    storageUsed: 65,
    backupStatus: "success",
    lastBackup: "Il y a 2 heures",
    uptime: "99.9%",
    activeUsers: 12,
    version: "1.2.4",
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-lg text-muted-foreground">
          Configurez votre application et gérez les paramètres de l'entreprise
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 p-1 bg-muted rounded-lg">
          <TabsTrigger
            value="company"
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Entreprise</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Sécurité</span>
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Apparence</span>
          </TabsTrigger>
          <TabsTrigger
            value="system"
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Système</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company" className="space-y-6">
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle>Informations de l'entreprise</CardTitle>
              <CardDescription>
                Gérez les informations de base de Nomedia Production
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage
                    src={
                      companyInfo.logo
                        ? URL.createObjectURL(companyInfo.logo)
                        : ""
                    }
                  />
                  <AvatarFallback className="bg-gradient-to-br from-nomedia-blue to-nomedia-purple text-white text-2xl font-bold">
                    N
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">
                    Logo de l'entreprise
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file)
                          setCompanyInfo({ ...companyInfo, logo: file });
                      }}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("logo-upload")?.click()
                      }
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Charger un logo
                    </Button>
                    {companyInfo.logo && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCompanyInfo({ ...companyInfo, logo: null })
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Formats acceptés: PNG, JPG, SVG (Max 2MB)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de l'entreprise</Label>
                  <Input
                    id="companyName"
                    value={companyInfo.name}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Site web</Label>
                  <Input
                    id="website"
                    value={companyInfo.website}
                    onChange={(e) =>
                      setCompanyInfo({
                        ...companyInfo,
                        website: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  value={companyInfo.address}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, address: e.target.value })
                  }
                  className="h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={companyInfo.phone}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fax">Fax</Label>
                  <Input
                    id="fax"
                    value={companyInfo.fax}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, fax: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={companyInfo.email}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ice">ICE</Label>
                  <Input
                    id="ice"
                    value={companyInfo.ice}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, ice: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="if">IF</Label>
                  <Input
                    id="if"
                    value={companyInfo.if}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, if: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rc">RC</Label>
                  <Input
                    id="rc"
                    value={companyInfo.rc}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, rc: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnss">CNSS</Label>
                  <Input
                    id="cnss"
                    value={companyInfo.cnss}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, cnss: e.target.value })
                    }
                  />
                </div>
              </div>

              <Alert>
                <AlertTitle>Informations importantes</AlertTitle>
                <AlertDescription>
                  Ces informations apparaîtront sur vos factures et documents
                  officiels. Assurez-vous qu'elles sont exactes.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Annuler</Button>
                <Button className="shadow-md">
                  <Save className="mr-2 h-4 w-4" />
                  Sauvegarder les modifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-md border-0">
              <CardHeader>
                <CardTitle>Préférences de notification</CardTitle>
                <CardDescription>
                  Configurez quand et comment vous souhaitez être notifié
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Notifications Email
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Notifications par email</Label>
                          <p className="text-sm text-muted-foreground">
                            Recevoir des notifications par email
                          </p>
                        </div>
                        <Switch
                          checked={notifications.emailNotifications}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              emailNotifications: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Mises à jour de projets</Label>
                          <p className="text-sm text-muted-foreground">
                            Notifications lors des changements de statut des
                            projets
                          </p>
                        </div>
                        <Switch
                          checked={notifications.projectUpdates}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              projectUpdates: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Rappels de factures</Label>
                          <p className="text-sm text-muted-foreground">
                            Rappels pour les factures en retard
                          </p>
                        </div>
                        <Switch
                          checked={notifications.invoiceReminders}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              invoiceReminders: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Rappels de contrats</Label>
                          <p className="text-sm text-muted-foreground">
                            Alertes pour les contrats manquants ou expirants
                          </p>
                        </div>
                        <Switch
                          checked={notifications.contractReminders}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              contractReminders: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Notifications Push & SMS
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Notifications push</Label>
                          <p className="text-sm text-muted-foreground">
                            Notifications sur le navigateur
                          </p>
                        </div>
                        <Switch
                          checked={notifications.pushNotifications}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              pushNotifications: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Notifications SMS</Label>
                          <p className="text-sm text-muted-foreground">
                            SMS pour les alertes urgentes
                          </p>
                        </div>
                        <Switch
                          checked={notifications.smsNotifications}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              smsNotifications: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Alertes Système
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Alertes de dépenses</Label>
                          <p className="text-sm text-muted-foreground">
                            Notifications pour les nouvelles dépenses en attente
                          </p>
                        </div>
                        <Switch
                          checked={notifications.expenseAlerts}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              expenseAlerts: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Alertes budget</Label>
                          <p className="text-sm text-muted-foreground">
                            Alertes quand le budget d'un projet dépasse 80%
                          </p>
                        </div>
                        <Switch
                          checked={notifications.budgetAlerts}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              budgetAlerts: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Maintenance système</Label>
                          <p className="text-sm text-muted-foreground">
                            Notifications de maintenance et mises à jour
                          </p>
                        </div>
                        <Switch
                          checked={notifications.systemMaintenance}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              systemMaintenance: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline">Réinitialiser</Button>
                  <Button className="shadow-md">
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder les préférences
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle>Centre de notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-nomedia-blue/5 rounded-lg">
                    <div className="w-2 h-2 bg-nomedia-blue rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Nouveau projet créé</p>
                      <p className="text-xs text-muted-foreground">
                        Il y a 2 heures
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-nomedia-orange/5 rounded-lg">
                    <div className="w-2 h-2 bg-nomedia-orange rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">
                        Budget dépassé - Spot TV
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Il y a 1 jour
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-nomedia-green/5 rounded-lg">
                    <div className="w-2 h-2 bg-nomedia-green rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Facture payée</p>
                      <p className="text-xs text-muted-foreground">
                        Il y a 2 jours
                      </p>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full" size="sm">
                  Voir toutes les notifications
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle>Changer le mot de passe</CardTitle>
                <CardDescription>
                  Mettez à jour votre mot de passe régulièrement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Entrez votre mot de passe actuel"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Nouveau mot de passe"
                  />
                  <div className="text-xs text-muted-foreground">
                    Le mot de passe doit contenir au moins 8 caractères, une
                    majuscule, une minuscule et un chiffre.
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirmer le mot de passe
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirmer le mot de passe"
                  />
                </div>

                <Button className="w-full">
                  <Key className="mr-2 h-4 w-4" />
                  Changer le mot de passe
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle>Authentification à deux facteurs</CardTitle>
                <CardDescription>
                  Sécurisez votre compte avec la 2FA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      2FA {twoFactorEnabled ? "Activé" : "Désactivé"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {twoFactorEnabled
                        ? "Votre compte est protégé par la 2FA"
                        : "Ajoutez une couche de sécurité supplémentaire"}
                    </p>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={setTwoFactorEnabled}
                  />
                </div>

                {twoFactorEnabled ? (
                  <div className="space-y-3">
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertTitle>2FA Active</AlertTitle>
                      <AlertDescription>
                        Votre compte est sécurisé avec l'authentification à deux
                        facteurs.
                      </AlertDescription>
                    </Alert>
                    <Button variant="outline" className="w-full">
                      Voir les codes de récupération
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full">
                    Configurer 2FA
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle>Sessions actives</CardTitle>
              <CardDescription>
                Gérez vos connexions actives sur différents appareils
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg bg-nomedia-blue/5">
                  <div>
                    <p className="font-medium">Session actuelle</p>
                    <p className="text-sm text-muted-foreground">
                      Chrome sur Windows - Casablanca, Maroc
                    </p>
                    <p className="text-xs text-muted-foreground">
                      IP: 196.200.xxx.xxx • Connecté maintenant
                    </p>
                  </div>
                  <Badge variant="default">Actuelle</Badge>
                </div>

                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">iPhone Safari</p>
                    <p className="text-sm text-muted-foreground">
                      Mobile Safari - Casablanca, Maroc
                    </p>
                    <p className="text-xs text-muted-foreground">
                      IP: 196.200.xxx.xxx • Il y a 2 heures
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Déconnecter
                  </Button>
                </div>

                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Firefox sur Mac</p>
                    <p className="text-sm text-muted-foreground">
                      Firefox sur macOS - Rabat, Maroc
                    </p>
                    <p className="text-xs text-muted-foreground">
                      IP: 105.159.xxx.xxx • Il y a 1 jour
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Déconnecter
                  </Button>
                </div>
              </div>

              <Separator className="my-4" />

              <Button variant="destructive" size="sm">
                Déconnecter tous les autres appareils
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle>Thème et Apparence</CardTitle>
                <CardDescription>
                  Personnalisez l'apparence de l'application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Thème de l'interface</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          value: "light" as const,
                          label: "Clair",
                          preview: "bg-white border-2 shadow-sm",
                        },
                        {
                          value: "dark" as const,
                          label: "Sombre",
                          preview: "bg-gray-900 border-2",
                        },
                        {
                          value: "system" as const,
                          label: "Système",
                          preview:
                            "bg-gradient-to-r from-white to-gray-900 border-2",
                        },
                      ].map((themeOption) => (
                        <div
                          key={themeOption.value}
                          className={`cursor-pointer rounded-lg p-3 border-2 transition-all ${
                            theme === themeOption.value
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setTheme(themeOption.value)}
                        >
                          <div
                            className={`h-12 w-full rounded ${themeOption.preview} mb-2 flex items-center justify-center`}
                          >
                            {themeOption.value === "light" && (
                              <div className="w-8 h-8 bg-gray-100 rounded border"></div>
                            )}
                            {themeOption.value === "dark" && (
                              <div className="w-8 h-8 bg-gray-800 rounded border border-gray-600"></div>
                            )}
                            {themeOption.value === "system" && (
                              <div className="flex gap-1">
                                <div className="w-4 h-8 bg-white rounded-l border"></div>
                                <div className="w-4 h-8 bg-gray-800 rounded-r border border-l-0 border-gray-600"></div>
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-medium text-center">
                            {themeOption.label}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Thème actuel:{" "}
                      {actualTheme === "dark" ? "Sombre" : "Clair"}
                      {theme === "system" && " (détecté automatiquement)"}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Couleur d'accent</Label>
                    <div className="flex gap-3">
                      {[
                        {
                          name: "Bleu",
                          value: "blue" as const,
                          color: "hsl(239, 84%, 67%)",
                        },
                        {
                          name: "Violet",
                          value: "purple" as const,
                          color: "hsl(260, 83%, 70%)",
                        },
                        {
                          name: "Vert",
                          value: "green" as const,
                          color: "hsl(142, 76%, 46%)",
                        },
                        {
                          name: "Orange",
                          value: "orange" as const,
                          color: "hsl(25, 95%, 63%)",
                        },
                      ].map((color) => (
                        <button
                          key={color.value}
                          className={`w-10 h-10 rounded-full border-4 shadow-md hover:scale-110 transition-all ${
                            accentColor === color.value
                              ? "border-foreground ring-2 ring-offset-2 ring-foreground/50"
                              : "border-white hover:border-gray-300"
                          }`}
                          style={{ backgroundColor: color.color }}
                          title={color.name}
                          onClick={() => setAccentColor(color.value)}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Couleur sélectionnée:{" "}
                      {accentColor === "blue"
                        ? "Bleu"
                        : accentColor === "purple"
                          ? "Violet"
                          : accentColor === "green"
                            ? "Vert"
                            : "Orange"}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Taille de police</Label>
                    <Select
                      value={fontSize}
                      onValueChange={(value: any) => setFontSize(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Petite (14px)</SelectItem>
                        <SelectItem value="medium">Moyenne (16px)</SelectItem>
                        <SelectItem value="large">Grande (18px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle>Localisation</CardTitle>
                <CardDescription>
                  Configurez la langue et les formats régionaux
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Langue de l'interface</Label>
                    <Select
                      value={language}
                      onValueChange={(value: any) => setLanguage(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">🇫🇷 Français</SelectItem>
                        <SelectItem value="ar">🇲🇦 العربية</SelectItem>
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                        <SelectItem value="es">🇪🇸 Español</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Langue sélectionnée:{" "}
                      {language === "fr"
                        ? "Français"
                        : language === "ar"
                          ? "العربية"
                          : language === "en"
                            ? "English"
                            : "Español"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Devise par défaut</Label>
                    <Select
                      value={currency}
                      onValueChange={(value: any) => setCurrency(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mad">
                          MAD - Dirham Marocain
                        </SelectItem>
                        <SelectItem value="eur">EUR - Euro</SelectItem>
                        <SelectItem value="usd">
                          USD - Dollar Américain
                        </SelectItem>
                        <SelectItem value="gbp">
                          GBP - Livre Sterling
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Exemple: {formatCurrency(50000)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Format de date</Label>
                    <Select
                      value={dateFormat}
                      onValueChange={(value: any) => setDateFormat(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Exemple: {formatDate(new Date())}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Fuseau horaire</Label>
                    <Select
                      value={timezone}
                      onValueChange={(value: any) => setTimezone(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morocco">
                          🇲🇦 Maroc (GMT+1)
                        </SelectItem>
                        <SelectItem value="france">
                          🇫🇷 France (GMT+1)
                        </SelectItem>
                        <SelectItem value="uk">
                          🇬🇧 Royaume-Uni (GMT+0)
                        </SelectItem>
                        <SelectItem value="usa-east">
                          🇺🇸 USA Est (GMT-5)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Fuseau sélectionné:{" "}
                      {timezone === "morocco"
                        ? "Maroc (GMT+1)"
                        : timezone === "france"
                          ? "France (GMT+1)"
                          : timezone === "uk"
                            ? "Royaume-Uni (GMT+0)"
                            : "USA Est (GMT-5)"}
                    </p>
                  </div>

                  <Alert>
                    <AlertTitle>Changements appliqués</AlertTitle>
                    <AlertDescription>
                      Les paramètres de localisation sont automatiquement
                      sauvegardés et appliqués dans toute l'application.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle>Prévisualisation</CardTitle>
              <CardDescription>
                Aperçu de l'interface avec vos paramètres actuels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-card transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Exemple de carte projet</h3>
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/20"
                  >
                    En Production
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Ceci est un aperçu de l'interface avec vos paramètres actuels.
                  Thème: {actualTheme === "dark" ? "Sombre" : "Clair"}, Couleur:{" "}
                  {accentColor === "blue"
                    ? "Bleu"
                    : accentColor === "purple"
                      ? "Violet"
                      : accentColor === "green"
                        ? "Vert"
                        : "Orange"}
                  , Taille:{" "}
                  {fontSize === "small"
                    ? "Petite"
                    : fontSize === "medium"
                      ? "Moyenne"
                      : "Grande"}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span>Budget: {formatCurrency(50000)}</span>
                  <span>Équipe: 3 personnes</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <span>Date: {formatDate(new Date())}</span>
                  <span>
                    Langue:{" "}
                    {language === "fr"
                      ? "Français"
                      : language === "ar"
                        ? "العربية"
                        : language === "en"
                          ? "English"
                          : "Español"}
                  </span>
                </div>
                <div className="mt-3">
                  <Button size="sm" className="mr-2">
                    Bouton primaire
                  </Button>
                  <Button variant="outline" size="sm">
                    Bouton secondaire
                  </Button>
                </div>
              </div>

              <Alert className="mt-4">
                <AlertTitle>Changements appliqués en temps réel</AlertTitle>
                <AlertDescription>
                  Vos modifications sont automatiquement sauvegardées et
                  appliquées à toute l'application.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTheme("system");
                    setAccentColor("blue");
                    setFontSize("medium");
                  }}
                >
                  Réinitialiser
                </Button>
                <Button className="shadow-md">
                  <Save className="mr-2 h-4 w-4" />
                  Paramètres sauvegardés
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle>État du système</CardTitle>
                <CardDescription>Surveillance en temps réel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Temps d'activité</span>
                    <Badge
                      variant="outline"
                      className="bg-nomedia-green/10 text-nomedia-green"
                    >
                      {systemStats.uptime}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Stockage utilisé</span>
                      <span>{systemStats.storageUsed}%</span>
                    </div>
                    <Progress value={systemStats.storageUsed} className="h-2" />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Utilisateurs actifs</span>
                    <span className="font-medium">
                      {systemStats.activeUsers}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Version actuelle</span>
                    <Badge variant="outline">v{systemStats.version}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-md border-0">
              <CardHeader>
                <CardTitle>Gestion système</CardTitle>
                <CardDescription>
                  Outils de maintenance et administration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Mises à jour</p>
                      <p className="text-sm text-muted-foreground">
                        Version v{systemStats.version} - Dernière vérification:
                        aujourd'hui
                      </p>
                    </div>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Vérifier les mises à jour
                    </Button>
                  </div>

                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Sauvegarde automatique</p>
                      <p className="text-sm text-muted-foreground">
                        Statut:
                        <span
                          className={`ml-1 ${systemStats.backupStatus === "success" ? "text-nomedia-green" : "text-destructive"}`}
                        >
                          {systemStats.backupStatus === "success"
                            ? "✓ Réussie"
                            : "✗ Échec"}
                        </span>
                        • {systemStats.lastBackup}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger
                      </Button>
                      <Button variant="outline" size="sm">
                        Créer
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Logs et journaux</p>
                      <p className="text-sm text-muted-foreground">
                        Accéder aux journaux d'activité système
                      </p>
                    </div>
                    <Button variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      Voir les logs
                    </Button>
                  </div>

                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Cache système</p>
                      <p className="text-sm text-muted-foreground">
                        Nettoyer le cache pour améliorer les performances
                      </p>
                    </div>
                    <Button variant="outline">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Vider le cache
                    </Button>
                  </div>

                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Base de données</p>
                      <p className="text-sm text-muted-foreground">
                        Optimiser et maintenir la base de données
                      </p>
                    </div>
                    <Button variant="outline">
                      <Database className="mr-2 h-4 w-4" />
                      Optimiser
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle>Configuration avancée</CardTitle>
              <CardDescription>Paramètres système avancés</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Performances</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Cache navigateur</Label>
                        <p className="text-sm text-muted-foreground">
                          Activer la mise en cache
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Compression</Label>
                        <p className="text-sm text-muted-foreground">
                          Compresser les ressources
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Sécurité</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>HTTPS forcé</Label>
                        <p className="text-sm text-muted-foreground">
                          Rediriger vers HTTPS
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Audit sécurité</Label>
                        <p className="text-sm text-muted-foreground">
                          Surveillance automatique
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive shadow-md">
            <CardHeader>
              <CardTitle className="text-destructive">
                Zone dangereuse
              </CardTitle>
              <CardDescription>
                Actions irréversibles - Procédez avec prudence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Attention</AlertTitle>
                <AlertDescription>
                  Les actions ci-dessous sont irréversibles et peuvent entraîner
                  une perte de données.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-destructive/20 rounded-lg p-4">
                  <h4 className="font-medium text-destructive mb-2">
                    Réinitialiser les paramètres
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Restaurer tous les paramètres par défaut
                  </p>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Réinitialiser paramètres
                  </Button>
                </div>

                <div className="border border-destructive/20 rounded-lg p-4">
                  <h4 className="font-medium text-destructive mb-2">
                    Supprimer toutes les données
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Supprime définitivement toutes les données
                  </p>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer données
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
