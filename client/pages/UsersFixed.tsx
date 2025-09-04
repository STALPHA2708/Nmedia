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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  Filter,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Shield,
  Loader2,
} from "lucide-react";
import { userApi, formatDate, handleApiError } from "@/lib/api";
import type { User, CreateUserRequest } from "@shared/api";
import { useToast } from "@/hooks/use-toast";
import { AdminOnly } from "@/components/RoleGuard";

// Status and role formatting functions
const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "inactive":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "suspended":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatStatus = (status: string) => {
  switch (status) {
    case "active":
      return "Actif";
    case "inactive":
      return "Inactif";
    case "suspended":
      return "Suspendu";
    default:
      return status;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case "admin":
      return "bg-red-100 text-red-800 border-red-200";
    case "manager":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "user":
      return "bg-green-100 text-green-800 border-green-200";
    case "guest":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatRole = (role: string) => {
  switch (role) {
    case "admin":
      return "Administrateur";
    case "manager":
      return "Manager";
    case "user":
      return "Utilisateur";
    case "guest":
      return "Invité";
    default:
      return role;
  }
};

interface UserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  phone: string;
  sendWelcomeEmail: boolean;
}

const CreateUserForm = ({ 
  onSubmit, 
  onCancel, 
  isSubmitting 
}: {
  onSubmit: (data: CreateUserRequest) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    phone: "",
    sendWelcomeEmail: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const userData: CreateUserRequest = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role as any,
        phone: formData.phone || undefined,
        sendWelcomeEmail: formData.sendWelcomeEmail,
      };
      
      onSubmit(userData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom complet *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? "border-red-500" : ""}
            placeholder="John Doe"
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={errors.email ? "border-red-500" : ""}
            placeholder="john.doe@nomedia.ma"
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={errors.password ? "border-red-500" : ""}
            placeholder="Minimum 8 caractères"
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer mot de passe *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className={errors.confirmPassword ? "border-red-500" : ""}
            placeholder="Répéter le mot de passe"
          />
          {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Rôle *</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrateur</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="user">Utilisateur</SelectItem>
              <SelectItem value="guest">Invité</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+212 6XX XXX XXX"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="sendWelcomeEmail"
          checked={formData.sendWelcomeEmail}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, sendWelcomeEmail: !!checked })
          }
        />
        <Label htmlFor="sendWelcomeEmail" className="text-sm">
          Envoyer un email de bienvenue avec les informations de connexion
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Créer l'utilisateur
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default function UsersFixed() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getAll();
      setUsers(response.data || []);
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

  const handleCreateUser = async (userData: CreateUserRequest) => {
    try {
      setCreating(true);
      await userApi.create(userData);
      await loadUsers();
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Succès",
        description: "Utilisateur créé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userName}" ?`)) {
      try {
        setDeleting(userId);
        await userApi.delete(userId);
        await loadUsers();
        
        toast({
          title: "Succès",
          description: "Utilisateur supprimé avec succès",
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
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <AdminOnly>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Chargement des utilisateurs...</span>
        </div>
      </AdminOnly>
    );
  }

  return (
    <AdminOnly>
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Single Header Section */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Gestion des Utilisateurs
              </h1>
              <p className="text-muted-foreground">
                Gérer les comptes utilisateurs et leurs permissions
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                  <DialogDescription>
                    Ajoutez un nouvel utilisateur au système avec ses permissions
                  </DialogDescription>
                </DialogHeader>
                <CreateUserForm
                  onSubmit={handleCreateUser}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isSubmitting={creating}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="guest">Invité</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Utilisateurs ({filteredUsers.length})
            </CardTitle>
            <CardDescription>
              Liste de tous les utilisateurs du système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          {user.phone && (
                            <p className="text-sm text-muted-foreground">
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRoleColor(user.role)}>
                        <Shield className="mr-1 h-3 w-3" />
                        {formatRole(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(user.status)}>
                        {user.status === "active" ? (
                          <UserCheck className="mr-1 h-3 w-3" />
                        ) : (
                          <UserX className="mr-1 h-3 w-3" />
                        )}
                        {formatStatus(user.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.last_login
                        ? formatDate(user.last_login)
                        : "Jamais connecté"}
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir profil
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={deleting === user.id}
                          >
                            {deleting === user.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Aucun utilisateur trouvé avec les critères de recherche actuels.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminOnly>
  );
}
