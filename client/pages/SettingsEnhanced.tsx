import React, { useState, useEffect } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalization } from "@/contexts/LocalizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { userApi, authApi, handleApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { User, CreateUserRequest, AuthSession } from "@shared/api";
import {
  Settings as SettingsIcon,
  Building,
  Users,
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
  Plus,
  AlertTriangle,
  Clock,
  Edit,
  UserPlus,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  RefreshCw,
  Copy,
  LogIn,
  UserCheck,
  Shield as ShieldIcon,
} from "lucide-react";

export default function SettingsEnhanced() {
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
  
  const { user: currentUser, hasRole, hasPermission, logout } = useAuth();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // State for users and sessions
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<AuthSession[]>([]);

  // Password management states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [newUserPassword, setNewUserPassword] = useState({
    password: "",
    confirmPassword: "",
    generatePassword: true,
  });

  const [userCredentials, setUserCredentials] = useState<{ [key: number]: { email: string; tempPassword?: string } }>({});

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

  const [newUser, setNewUser] = useState<CreateUserRequest>({
    name: "",
    email: "",
    role: "user",
    phone: "",
    sendWelcomeEmail: true,
  });

  const [systemStats] = useState({
    storageUsed: 65,
    backupStatus: "success" as const,
    lastBackup: "Il y a 2 heures",
    uptime: "99.9%",
    activeUsers: 12,
    version: "1.2.4",
  });

  // Load users and sessions on component mount
  useEffect(() => {
    if (hasRole('admin')) {
      loadUsers();
    }
    loadSessions();
  }, []);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await userApi.getAll();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const response = await authApi.getSessions();
      if (response.success && response.data) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Generate secure password
  const generateSecurePassword = (): string => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    // Ensure at least one of each type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // Uppercase
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // Lowercase
    password += "0123456789"[Math.floor(Math.random() * 10)]; // Number
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // Special char
    
    // Fill the rest
    for (let i = 4; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleCreateUser = async () => {
    try {
      setLoading(true);
      
      // Validate password if not auto-generating
      if (!newUserPassword.generatePassword) {
        if (newUserPassword.password !== newUserPassword.confirmPassword) {
          toast({
            title: "Erreur",
            description: "Les mots de passe ne correspondent pas",
            variant: "destructive",
          });
          return;
        }
        if (newUserPassword.password.length < 8) {
          toast({
            title: "Erreur",
            description: "Le mot de passe doit contenir au moins 8 caractères",
            variant: "destructive",
          });
          return;
        }
      }

      const password = newUserPassword.generatePassword 
        ? generateSecurePassword() 
        : newUserPassword.password;

      const userData = {
        ...newUser,
        password,
      };

      const response = await userApi.create(userData);
      if (response.success && response.data) {
        // Store credentials for display
        setUserCredentials(prev => ({
          ...prev,
          [response.data.id]: {
            email: response.data.email,
            tempPassword: password,
          }
        }));

        toast({
          title: "Succès",
          description: `Utilisateur créé avec succès. ${newUserPassword.generatePassword ? 'Mot de passe généré automatiquement.' : ''}`,
        });
        
        setIsCreateUserOpen(false);
        setNewUser({
          name: "",
          email: "",
          role: "user",
          phone: "",
          sendWelcomeEmail: true,
        });
        setNewUserPassword({
          password: "",
          confirmPassword: "",
          generatePassword: true,
        });
        await loadUsers();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      const response = await userApi.delete(userToDelete.id);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Utilisateur supprimé avec succès",
        });
        setIsDeleteUserOpen(false);
        setUserToDelete(null);
        await loadUsers();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      
      if (response.success) {
        toast({
          title: "Succès",
          description: "Mot de passe modifié avec succès",
        });
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetUserPassword = async () => {
    if (!userToResetPassword) return;

    try {
      setLoading(true);
      const newPassword = generateSecurePassword();
      
      // In a real implementation, this would call an API to reset the password
      // For demo purposes, we'll just show the new password
      setUserCredentials(prev => ({
        ...prev,
        [userToResetPassword.id]: {
          email: userToResetPassword.email,
          tempPassword: newPassword,
        }
      }));

      toast({
        title: "Succès",
        description: "Mot de passe réinitialisé avec succès",
      });
      
      setIsResetPasswordOpen(false);
      setUserToResetPassword(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la réinitialisation du mot de passe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      const response = await authApi.terminateSession(sessionId);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Session terminée avec succès",
        });
        await loadSessions();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Informations copiées dans le presse-papiers",
    });
  };

  const validatePasswordStrength = (password: string) => {
    const criteria = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    
    const score = Object.values(criteria).filter(Boolean).length;
    return {
      score,
      criteria,
      strength: score < 3 ? 'Faible' : score < 5 ? 'Moyen' : 'Fort'
    };
  };

  const formatUserStatus = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'suspended':
        return 'Suspendu';
      default:
        return status;
    }
  };

  const formatUserRole = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'manager':
        return 'Manager';
      case 'user':
        return 'Utilisateur';
      case 'guest':
        return 'Invité';
      default:
        return role;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-nomedia-green" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'suspended':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const passwordStrength = validatePasswordStrength(passwordForm.newPassword);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
          Configurez votre application et gérez les paramètres de l'entreprise
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 p-1 bg-muted rounded-lg text-xs sm:text-sm">
          <TabsTrigger
            value="company"
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Entreprise</span>
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Sécurité</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
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
                        : "https://cdn.builder.io/api/v1/image/assets%2F7a25a5293015472896bb7679c041e95e%2F27c40508f6d34af887b8f7974a28d0f3?format=webp&width=800"
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

              {/* Company form fields */}
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={companyInfo.email}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, email: e.target.value })
                    }
                  />
                </div>
              </div>

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

        {/* Enhanced Users Management with Password/Login Section */}
        <TabsContent value="users" className="space-y-6">
          {hasRole('admin') ? (
            <>
              {/* User Management Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                <Card className="xl:col-span-2 shadow-md border-0">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Gestion des utilisateurs</CardTitle>
                        <CardDescription>
                          Gérez les accès et permissions des utilisateurs
                        </CardDescription>
                      </div>
                      <Dialog
                        open={isCreateUserOpen}
                        onOpenChange={setIsCreateUserOpen}
                      >
                        <DialogTrigger asChild>
                          <Button className="shadow-md">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Nouvel utilisateur
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                            <DialogDescription>
                              Ajoutez un nouveau membre à l'équipe avec ses identifiants de connexion
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6">
                            {/* User Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="userName">Nom complet</Label>
                                <Input
                                  id="userName"
                                  value={newUser.name}
                                  onChange={(e) =>
                                    setNewUser({ ...newUser, name: e.target.value })
                                  }
                                  placeholder="Prénom Nom"
                                />
                              </div>
                              <div>
                                <Label htmlFor="userEmail">Email (Login)</Label>
                                <Input
                                  id="userEmail"
                                  type="email"
                                  value={newUser.email}
                                  onChange={(e) =>
                                    setNewUser({
                                      ...newUser,
                                      email: e.target.value,
                                    })
                                  }
                                  placeholder="email@nomedia.ma"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="userRole">Rôle</Label>
                                <Select
                                  value={newUser.role}
                                  onValueChange={(value: any) =>
                                    setNewUser({ ...newUser, role: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">
                                      Administrateur
                                    </SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="user">
                                      Utilisateur
                                    </SelectItem>
                                    <SelectItem value="guest">Invité</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="userPhone">Téléphone</Label>
                                <Input
                                  id="userPhone"
                                  value={newUser.phone || ""}
                                  onChange={(e) =>
                                    setNewUser({
                                      ...newUser,
                                      phone: e.target.value,
                                    })
                                  }
                                  placeholder="+212 6XX XXX XXX"
                                />
                              </div>
                            </div>

                            {/* Password Section */}
                            <Card className="bg-muted/50">
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Key className="h-5 w-5" />
                                  Configuration du mot de passe
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="generatePassword"
                                    checked={newUserPassword.generatePassword}
                                    onCheckedChange={(checked) =>
                                      setNewUserPassword({ ...newUserPassword, generatePassword: checked })
                                    }
                                  />
                                  <Label htmlFor="generatePassword">
                                    Générer un mot de passe sécurisé automatiquement
                                  </Label>
                                </div>

                                {!newUserPassword.generatePassword && (
                                  <div className="space-y-3">
                                    <div>
                                      <Label htmlFor="newUserPassword">Mot de passe</Label>
                                      <div className="relative">
                                        <Input
                                          id="newUserPassword"
                                          type={showNewPassword ? "text" : "password"}
                                          placeholder="Mot de passe sécurisé"
                                          value={newUserPassword.password}
                                          onChange={(e) =>
                                            setNewUserPassword({
                                              ...newUserPassword,
                                              password: e.target.value,
                                            })
                                          }
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="absolute right-0 top-0 h-full px-3 py-2"
                                          onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                          {showNewPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                          ) : (
                                            <Eye className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <Label htmlFor="confirmUserPassword">Confirmer le mot de passe</Label>
                                      <Input
                                        id="confirmUserPassword"
                                        type="password"
                                        placeholder="Confirmer le mot de passe"
                                        value={newUserPassword.confirmPassword}
                                        onChange={(e) =>
                                          setNewUserPassword({
                                            ...newUserPassword,
                                            confirmPassword: e.target.value,
                                          })
                                        }
                                      />
                                    </div>

                                    {newUserPassword.password && (
                                      <div className="text-xs space-y-1">
                                        <p className="font-medium">Force du mot de passe: {validatePasswordStrength(newUserPassword.password).strength}</p>
                                        <div className="space-y-1">
                                          {Object.entries(validatePasswordStrength(newUserPassword.password).criteria).map(([key, met]) => (
                                            <div key={key} className={`flex items-center gap-2 ${met ? 'text-green-600' : 'text-red-600'}`}>
                                              {met ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                              <span className="capitalize">{key}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            <div className="flex items-center space-x-2">
                              <Switch
                                id="sendWelcomeEmail"
                                checked={newUser.sendWelcomeEmail || false}
                                onCheckedChange={(checked) =>
                                  setNewUser({ ...newUser, sendWelcomeEmail: checked })
                                }
                              />
                              <Label htmlFor="sendWelcomeEmail">
                                Envoyer un email de bienvenue avec les identifiants
                              </Label>
                            </div>

                            <div className="flex justify-end gap-3">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsCreateUserOpen(false);
                                  setNewUserPassword({
                                    password: "",
                                    confirmPassword: "",
                                    generatePassword: true,
                                  });
                                }}
                                disabled={loading}
                              >
                                Annuler
                              </Button>
                              <Button
                                onClick={handleCreateUser}
                                disabled={loading}
                              >
                                {loading ? "Création..." : "Créer l'utilisateur"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {usersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nomedia-blue"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {users.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback className="bg-gradient-to-br from-nomedia-blue to-nomedia-purple text-white font-semibold">
                                  {user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {user.email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Dernière connexion: {user.last_login 
                                    ? formatDate(user.last_login)
                                    : "Jamais"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <Badge
                                  variant={
                                    user.role === "admin"
                                      ? "default"
                                      : "outline"
                                  }
                                >
                                  {formatUserRole(user.role)}
                                </Badge>
                                <div className="flex items-center gap-1 mt-1">
                                  {getStatusIcon(user.status)}
                                  <span className="text-xs text-muted-foreground">
                                    {formatUserStatus(user.status)}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Login Credentials Display */}
                              {userCredentials[user.id] && (
                                <Card className="p-3 bg-nomedia-blue/5 border-nomedia-blue">
                                  <div className="text-xs space-y-1">
                                    <p className="font-medium">Identifiants de connexion:</p>
                                    <div className="flex items-center gap-2">
                                      <span>Email: {userCredentials[user.id].email}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(userCredentials[user.id].email)}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    {userCredentials[user.id].tempPassword && (
                                      <div className="flex items-center gap-2">
                                        <span>Mot de passe: {userCredentials[user.id].tempPassword}</span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => copyToClipboard(userCredentials[user.id].tempPassword!)}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              )}

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setUserToResetPassword(user);
                                    setIsResetPasswordOpen(true);
                                  }}
                                  title="Réinitialiser le mot de passe"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setIsDeleteUserOpen(true);
                                  }}
                                  disabled={user.id === currentUser?.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-md border-0">
                  <CardHeader>
                    <CardTitle>Statistiques & Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Utilisateurs actifs</span>
                        <span className="font-medium">
                          {users.filter((u) => u.status === "active").length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Administrateurs</span>
                        <span className="font-medium">
                          {users.filter((u) => u.role === "admin").length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Managers</span>
                        <span className="font-medium">
                          {users.filter((u) => u.role === "manager").length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Utilisateurs</span>
                        <span className="font-medium">
                          {users.filter((u) => u.role === "user").length}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-medium">Actions rapides</h4>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left"
                          onClick={() => setIsCreateUserOpen(true)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Ajouter un utilisateur
                        </Button>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <Download className="mr-2 h-4 w-4" />
                          Exporter la liste
                        </Button>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <Mail className="mr-2 h-4 w-4" />
                          Envoyer les identifiants
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Password & Login Management Section */}
              <Card className="shadow-md border-0 border-l-4 border-l-nomedia-blue">
                <CardHeader>
                  <CardTitle className="text-nomedia-blue flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Gestion des Mots de Passe et Connexions
                  </CardTitle>
                  <CardDescription>
                    Gérez les accès, mots de passe et sessions de connexion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Password Management */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Gestion des Mots de Passe
                      </h4>
                      
                      <Card className="p-4 bg-muted/50">
                        <h5 className="font-medium mb-3">Changer votre mot de passe</h5>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="currentPassword" className="text-xs">Mot de passe actuel</Label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="Mot de passe actuel"
                                value={passwordForm.currentPassword}
                                onChange={(e) =>
                                  setPasswordForm({
                                    ...passwordForm,
                                    currentPassword: e.target.value,
                                  })
                                }
                                className="text-sm"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="newPassword" className="text-xs">Nouveau mot de passe</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              placeholder="Nouveau mot de passe"
                              value={passwordForm.newPassword}
                              onChange={(e) =>
                                setPasswordForm({
                                  ...passwordForm,
                                  newPassword: e.target.value,
                                })
                              }
                              className="text-sm"
                            />
                            {passwordForm.newPassword && (
                              <div className="mt-1">
                                <div className="flex items-center gap-2 text-xs">
                                  <span>Force:</span>
                                  <Badge 
                                    variant={passwordStrength.strength === 'Fort' ? 'default' : passwordStrength.strength === 'Moyen' ? 'secondary' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {passwordStrength.strength}
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="confirmPassword" className="text-xs">Confirmer le mot de passe</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              placeholder="Confirmer le mot de passe"
                              value={passwordForm.confirmPassword}
                              onChange={(e) =>
                                setPasswordForm({
                                  ...passwordForm,
                                  confirmPassword: e.target.value,
                                })
                              }
                              className="text-sm"
                            />
                          </div>

                          <Button 
                            size="sm"
                            onClick={handleChangePassword}
                            disabled={loading}
                            className="w-full"
                          >
                            <Key className="mr-2 h-3 w-3" />
                            {loading ? "Modification..." : "Changer le mot de passe"}
                          </Button>
                        </div>
                      </Card>

                      <Card className="p-4 bg-orange-50 border-orange-200">
                        <h5 className="font-medium mb-2 text-orange-800">Politique de sécurité</h5>
                        <ul className="text-xs text-orange-700 space-y-1">
                          <li>• Minimum 8 caractères</li>
                          <li>• Majuscules et minuscules</li>
                          <li>• Au moins un chiffre</li>
                          <li>• Au moins un caractère spécial</li>
                          <li>• Changement recommandé tous les 90 jours</li>
                        </ul>
                      </Card>
                    </div>

                    {/* Session Management */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Sessions Actives
                      </h4>
                      
                      {sessionsLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-nomedia-blue"></div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sessions.slice(0, 3).map((session) => (
                            <Card key={session.id} className={`p-3 ${session.is_current ? 'bg-nomedia-blue/5 border-nomedia-blue' : ''}`}>
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{session.device}</p>
                                    {session.is_current && (
                                      <Badge variant="default" className="text-xs">Actuelle</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {session.browser} - {session.location}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    IP: {session.ip_address} • {formatDate(session.last_activity)}
                                  </p>
                                </div>
                                {!session.is_current && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleTerminateSession(session.id)}
                                    className="text-xs px-2 py-1 h-auto"
                                  >
                                    Déconnecter
                                  </Button>
                                )}
                              </div>
                            </Card>
                          ))}
                          
                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Eye className="mr-2 h-3 w-3" />
                              Voir toutes
                            </Button>
                            <Button variant="destructive" size="sm" className="flex-1">
                              <LogIn className="mr-2 h-3 w-3" />
                              Déconnecter tout
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Login Test Section */}
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-800 flex items-center gap-2 text-lg">
                        <UserCheck className="h-5 w-5" />
                        Test des Identifiants
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-green-700">
                        Utilisez cette section pour tester les identifiants de connexion créés
                      </p>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        {users.slice(0, 3).map((user) => (
                          <Card key={user.id} className="p-3 bg-white border-green-200">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs bg-green-100 text-green-800">
                                    {user.name.split(" ").map((n) => n[0]).join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{user.name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <p>Email: {user.email}</p>
                                <p>Rôle: {formatUserRole(user.role)}</p>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full text-xs"
                                onClick={() => {
                                  // In a real implementation, this could open a test login modal
                                  toast({
                                    title: "Test de connexion",
                                    description: `Simulation de connexion pour ${user.email}`,
                                  });
                                }}
                              >
                                <LogIn className="mr-1 h-3 w-3" />
                                Tester
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="shadow-md border-0">
              <CardContent className="text-center py-8">
                <ShieldIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Accès Restreint</h3>
                <p className="text-muted-foreground">
                  Vous n'avez pas les permissions nécessaires pour gérer les utilisateurs.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Other tabs would continue here */}
        {/* Security, Notifications, Appearance, System tabs... */}
        <TabsContent value="security" className="space-y-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Section Sécurité</h3>
            <p className="text-muted-foreground">
              Configuration de sécurité avancée - À implémenter
            </p>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Section Notifications</h3>
            <p className="text-muted-foreground">
              Gestion des notifications - À implémenter
            </p>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Section Apparence</h3>
            <p className="text-muted-foreground">
              Personnalisation de l'interface - À implémenter
            </p>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Section Système</h3>
            <p className="text-muted-foreground">
              Paramètres système - À implémenter
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur "{userToDelete?.name}" ?
              Cette action est irréversible et supprimera toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Confirmation Dialog */}
      <AlertDialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser le mot de passe</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir réinitialiser le mot de passe pour "{userToResetPassword?.name}" ?
              Un nouveau mot de passe sécurisé sera généré automatiquement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetUserPassword}
              disabled={loading}
            >
              {loading ? "Réinitialisation..." : "Réinitialiser"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
