import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  requiredPermissions = [] 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nomedia-blue mx-auto"></div>
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="max-w-md mx-auto text-center space-y-6 p-6">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Accès Restreint</h2>
            <p className="text-muted-foreground">
              Votre rôle <span className="font-medium">"{user?.role}"</span> ne vous permet pas d'accéder à cette section.
            </p>
            <p className="text-sm text-muted-foreground">
              Rôles requis: {requiredRoles.join(", ")}
            </p>
          </div>
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  // Check permission requirements
  if (requiredPermissions.length > 0 && !requiredPermissions.every(permission => hasPermission(permission))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="max-w-md mx-auto text-center space-y-6 p-6">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Permissions Insuffisantes</h2>
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions nécessaires pour accéder à cette section.
            </p>
            <p className="text-sm text-muted-foreground">
              Permissions requises: {requiredPermissions.join(", ")}
            </p>
          </div>
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Role-based route configurations
export const ROLE_PERMISSIONS = {
  admin: {
    roles: ['admin'],
    permissions: ['all']
  },
  manager: {
    roles: ['admin', 'manager'],
    permissions: ['manage_projects', 'view_employees', 'view_invoices', 'manage_expenses']
  },
  employee: {
    roles: ['admin', 'manager', 'employee'],
    permissions: ['view_projects', 'view_own_data']
  },
  user: {
    roles: ['admin', 'manager', 'employee', 'user'],
    permissions: ['view_dashboard', 'view_own_invoices']
  },
  client: {
    roles: ['admin', 'manager', 'client'],
    permissions: ['view_invoices']
  }
};
