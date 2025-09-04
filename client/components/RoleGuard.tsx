import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  fallback?: ReactNode;
  hideContent?: boolean;
}

export function RoleGuard({ 
  children, 
  allowedRoles = [], 
  requiredPermissions = [],
  fallback,
  hideContent = false 
}: RoleGuardProps) {
  const { user, hasRole, hasPermission } = useAuth();

  if (!user) {
    return hideContent ? null : (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Vous devez être connecté pour accéder à cette fonctionnalité.
        </AlertDescription>
      </Alert>
    );
  }

  // Check roles
  const hasRequiredRole = allowedRoles.length === 0 || hasRole(allowedRoles);
  
  // Check permissions
  const hasRequiredPermissions = requiredPermissions.length === 0 || 
    requiredPermissions.every(permission => hasPermission(permission));

  if (!hasRequiredRole || !hasRequiredPermissions) {
    if (hideContent) {
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

// Specific guards for common restrictions

export function AdminOnly({ children, fallback, hideContent = false }: {
  children: ReactNode;
  fallback?: ReactNode;
  hideContent?: boolean;
}) {
  return (
    <RoleGuard 
      allowedRoles={['admin']} 
      fallback={fallback}
      hideContent={hideContent}
    >
      {children}
    </RoleGuard>
  );
}

export function AdminOrManagerOnly({ children, fallback, hideContent = false }: {
  children: ReactNode;
  fallback?: ReactNode;
  hideContent?: boolean;
}) {
  return (
    <RoleGuard 
      allowedRoles={['admin', 'manager']} 
      fallback={fallback}
      hideContent={hideContent}
    >
      {children}
    </RoleGuard>
  );
}

export function NoManagerAccess({ children, fallback, hideContent = false }: {
  children: ReactNode;
  fallback?: ReactNode;
  hideContent?: boolean;
}) {
  const { user } = useAuth();
  
  if (user?.role === 'manager') {
    if (hideContent) {
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Cette fonctionnalité n'est pas disponible pour les managers.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

// Manager restrictions for invoices
export function InvoiceManagerRestriction({ children, action = 'action', hideContent = false }: {
  children: ReactNode;
  action?: string;
  hideContent?: boolean;
}) {
  const { user } = useAuth();
  
  if (user?.role === 'manager') {
    if (hideContent) {
      return null;
    }

    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Les managers ne peuvent pas {action} les factures.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
