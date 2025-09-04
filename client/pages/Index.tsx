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
import { Progress } from "@/components/ui/progress";
import {
  FolderOpen,
  Users,
  Receipt,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Euro,
  Calendar,
  Plus,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardApi, formatCurrency, formatDate, handleApiError, apiRequest } from "@/lib/api";
import type { DashboardStats } from "@shared/api";
import { useToast } from "@/hooks/use-toast";

// Status formatting functions
const getStatusColor = (status: string) => {
  switch (status) {
    case "production":
      return "bg-nomedia-blue/10 text-nomedia-blue border-nomedia-blue/20";
    case "post_production":
      return "bg-nomedia-orange/10 text-nomedia-orange border-nomedia-orange/20";
    case "pre_production":
      return "bg-nomedia-purple/10 text-nomedia-purple border-nomedia-purple/20";
    case "completed":
      return "bg-nomedia-green/10 text-nomedia-green border-nomedia-green/20";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatStatus = (status: string) => {
  switch (status) {
    case "pre_production":
      return "Pré-Production";
    case "production":
      return "En Production";
    case "post_production":
      return "Post-Production";
    case "completed":
      return "Terminé";
    default:
      return status;
  }
};

const formatEmployeeStatus = (status: string) => {
  switch (status) {
    case "active":
      return "Actif";
    case "inactive":
      return "Inactif";
    case "on_leave":
      return "En congé";
    default:
      return status;
  }
};

const getEmployeeStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-nomedia-green/10 text-nomedia-green border-nomedia-green/20";
    case "inactive":
      return "bg-nomedia-gray/10 text-nomedia-gray border-nomedia-gray/20";
    case "on_leave":
      return "bg-nomedia-orange/10 text-nomedia-orange border-nomedia-orange/20";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "text-red-600";
    case "medium":
      return "text-yellow-600";
    case "low":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
};

// Get urgent tasks from expenses and recent activity
const getUrgentTasks = (dashboardData: DashboardStats) => {
  const tasks = [];

  // Add pending expenses as urgent tasks
  if (dashboardData.expenses?.pending_expenses > 0) {
    tasks.push({
      task: `${dashboardData.expenses.pending_expenses} note(s) de frais en attente`,
      priority: "high",
      due: "À valider"
    });
  }

  // Add overdue invoices as urgent tasks
  if (dashboardData.invoices?.overdue_invoices > 0) {
    tasks.push({
      task: `${dashboardData.invoices.overdue_invoices} facture(s) en retard`,
      priority: "high",
      due: "Urgent"
    });
  }

  // Add draft invoices
  if (dashboardData.invoices?.draft_invoices > 0) {
    tasks.push({
      task: `${dashboardData.invoices.draft_invoices} facture(s) en brouillon`,
      priority: "medium",
      due: "À finaliser"
    });
  }

  // Add projects in production that might need attention
  if (dashboardData.projects?.production_projects > 0) {
    tasks.push({
      task: `${dashboardData.projects.production_projects} projet(s) en production`,
      priority: "medium",
      due: "Suivi requis"
    });
  }

  return tasks;
};

export default function Index() {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardApi.getStats();
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        throw new Error(response.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard data loading error:', error);
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement du tableau de bord...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Impossible de charger les données du tableau de bord.</p>
        <Button onClick={loadDashboardData} className="mt-4">
          Réessayer
        </Button>
      </div>
    );
  }

  // Calculate total project budget with null checks
  const projects = dashboardData.projects || {};
  const employees = dashboardData.employees || {};
  const invoices = dashboardData.invoices || {};
  const expenses = dashboardData.expenses || {};

  const totalProjectBudget = projects.total_budget || 0;
  const totalSpent = projects.total_spent || 0;
  const budgetUtilization = totalProjectBudget > 0 ? (totalSpent / totalProjectBudget) * 100 : 0;

  // Generate stats from API data with null checks
  const stats = [
    {
      title: "Projets Actifs",
      value: (projects.total_projects || 0).toString(),
      change: `${projects.production_projects || 0} en production`,
      icon: FolderOpen,
      color: "text-nomedia-blue",
    },
    {
      title: "Équipe",
      value: (employees.total_employees || 0).toString(),
      change: `${employees.active_employees || 0} actifs`,
      icon: Users,
      color: "text-nomedia-green",
    },
    {
      title: "Budget Total",
      value: formatCurrency(totalProjectBudget),
      change: `${budgetUtilization.toFixed(1)}% utilisé`,
      icon: Receipt,
      color: "text-nomedia-orange",
    },
    {
      title: "Masse Salariale",
      value: formatCurrency(employees.total_active_payroll || 0),
      change: "Par mois",
      icon: FileText,
      color: "text-nomedia-purple",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between md:items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Tableau de Bord
          </h1>
          <p className="text-lg text-muted-foreground">
            Vue d'ensemble de Nomedia Production
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/projects">
              <FolderOpen className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Projets</span>
              <span className="sm:hidden">Voir Projets</span>
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/employees">
              <Users className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Équipe</span>
              <span className="sm:hidden">Voir Équipe</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate pr-2">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color} shrink-0`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-7">
        {/* Recent Projects - takes up more space */}
        <div className="lg:col-span-4 order-1 lg:order-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Projets Récents</CardTitle>
                <CardDescription>
                  Aperçu des derniers projets en cours
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/projects">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {(dashboardData.recentActivity || []).length > 0 ? (
                (dashboardData.recentActivity || []).slice(0, 4).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 border-b pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium leading-tight truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {activity.timestamp ? formatDate(activity.timestamp) : ''}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  Aucune activité récente
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Content */}
        <div className="lg:col-span-3 space-y-4 lg:space-y-6 order-2 lg:order-2">
          {/* Recent Team Members */}
          <Card>
            <CardHeader>
              <CardTitle>Équipe Récente</CardTitle>
              <CardDescription>Derniers employés ajoutés</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(dashboardData.recentActivity || []).filter(item => item.type === 'user').length > 0 ? (
                (dashboardData.recentActivity || []).filter(item => item.type === 'user').slice(0, 3).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between flex-wrap gap-2"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {user.title.replace('Nouvel utilisateur: ', '')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      Nouveau
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Aucun utilisateur récent
                </p>
              )}
            </CardContent>
          </Card>

          {/* Urgent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Tâches Urgentes</CardTitle>
              <CardDescription>Actions basées sur vos données</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getUrgentTasks(dashboardData).length > 0 ? (
                getUrgentTasks(dashboardData).map((task, index) => (
                  <div key={index} className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="font-medium text-sm leading-tight">{task.task}</p>
                      <p className="text-xs text-muted-foreground">{task.due}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {task.priority === "high" && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      {task.priority === "medium" && (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      {task.priority === "low" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>Aucune tâche urgente</p>
                  <p className="text-xs">Tout est à jour!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques Rapides</CardTitle>
              <CardDescription>Indicateurs clés de performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Progression moyenne</span>
                  <span className="font-medium">
                    {(projects.average_progress || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Départements actifs</span>
                  <span className="font-medium">
                    {employees.total_departments || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Budget utilisé</span>
                  <span className="font-medium">
                    {budgetUtilization.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Utilisation budgétaire</span>
                    <span className="font-medium">{budgetUtilization.toFixed(1)}%</span>
                  </div>
                  <Progress value={budgetUtilization} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>



      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link to="/projects" className="block">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderOpen className="h-5 w-5 text-nomedia-blue" />
                Gérer les Projets
              </CardTitle>
              <CardDescription className="text-sm">
                Créer, modifier et suivre vos projets audiovisuels
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link to="/employees" className="block">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-nomedia-green" />
                Gérer l'Équipe
              </CardTitle>
              <CardDescription className="text-sm">
                Ajouter des employés et gérer les contrats
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link to="/invoices" className="block">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-nomedia-purple" />
                Gérer les Factures
              </CardTitle>
              <CardDescription className="text-sm">
                Créer et suivre vos factures clients
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  );
}
