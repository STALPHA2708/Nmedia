import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Organization, Subscription, SubscriptionUsage } from '@shared/saas-types';
import { safeFetch } from '@/lib/error-handler';

interface OrganizationContextType {
  organization: Organization | null;
  subscription: Subscription | null;
  usage: SubscriptionUsage | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateOrganization: (data: Partial<Organization>) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  hasFeature: (featureKey: string) => boolean;
  canUseFeature: (featureKey: string, currentUsage?: number) => boolean;
  getRemainingQuota: (resource: 'users' | 'projects' | 'storage') => number;
  getUsagePercentage: (resource: 'users' | 'projects' | 'storage') => number;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load organization data on mount
  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load organization, subscription, and usage data
      const [orgData, subData, usageData] = await Promise.all([
        safeFetch<Organization>('/api/organization/current'),
        safeFetch<Subscription>('/api/organization/subscription'),
        safeFetch<SubscriptionUsage>('/api/organization/usage')
      ]);

      setOrganization(orgData);
      setSubscription(subData);
      setUsage(usageData);
    } catch (err) {
      console.error('Failed to load organization data:', err);
      setError('Failed to load organization data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrganization = async (data: Partial<Organization>) => {
    try {
      const updatedOrg = await safeFetch<Organization>('/api/organization/current', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setOrganization(updatedOrg);
    } catch (err) {
      console.error('Failed to update organization:', err);
      throw err;
    }
  };

  const refreshSubscription = async () => {
    try {
      const [subData, usageData] = await Promise.all([
        safeFetch<Subscription>('/api/organization/subscription'),
        safeFetch<SubscriptionUsage>('/api/organization/usage')
      ]);
      setSubscription(subData);
      setUsage(usageData);
    } catch (err) {
      console.error('Failed to refresh subscription:', err);
      throw err;
    }
  };

  const hasFeature = (featureKey: string): boolean => {
    if (!organization?.features) return false;
    return organization.features.includes(featureKey) || organization.features.includes('all');
  };

  const canUseFeature = (featureKey: string, currentUsage?: number): boolean => {
    // Check if feature is enabled
    if (!hasFeature(featureKey)) return false;

    // Check subscription status
    if (!subscription) return false;
    if (!['active', 'trial'].includes(subscription.status)) return false;

    // Check trial expiration
    if (subscription.status === 'trial' && subscription.trial_end) {
      const trialEnd = new Date(subscription.trial_end);
      if (trialEnd < new Date()) return false;
    }

    // Check usage limits if provided
    if (currentUsage !== undefined && usage) {
      switch (featureKey) {
        case 'unlimited_users':
          return currentUsage < organization!.max_users;
        case 'unlimited_projects':
          return currentUsage < organization!.max_projects;
        case 'unlimited_storage':
          return usage.storage_used_gb < organization!.max_storage_gb;
        default:
          return true;
      }
    }

    return true;
  };

  const getRemainingQuota = (resource: 'users' | 'projects' | 'storage'): number => {
    if (!organization || !usage) return 0;

    switch (resource) {
      case 'users':
        return Math.max(0, organization.max_users - usage.users_count);
      case 'projects':
        return Math.max(0, organization.max_projects - usage.projects_count);
      case 'storage':
        return Math.max(0, organization.max_storage_gb - usage.storage_used_gb);
      default:
        return 0;
    }
  };

  const getUsagePercentage = (resource: 'users' | 'projects' | 'storage'): number => {
    if (!organization || !usage) return 0;

    switch (resource) {
      case 'users':
        return organization.max_users > 0 ? (usage.users_count / organization.max_users) * 100 : 0;
      case 'projects':
        return organization.max_projects > 0 ? (usage.projects_count / organization.max_projects) * 100 : 0;
      case 'storage':
        return organization.max_storage_gb > 0 ? (usage.storage_used_gb / organization.max_storage_gb) * 100 : 0;
      default:
        return 0;
    }
  };

  const contextValue: OrganizationContextType = {
    organization,
    subscription,
    usage,
    isLoading,
    error,
    updateOrganization,
    refreshSubscription,
    hasFeature,
    canUseFeature,
    getRemainingQuota,
    getUsagePercentage,
  };

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}

// Hook for checking feature access with UI feedback
export function useFeatureAccess(featureKey: string) {
  const { hasFeature, canUseFeature, subscription } = useOrganization();
  
  const isEnabled = hasFeature(featureKey);
  const canUse = canUseFeature(featureKey);
  
  const getUpgradeMessage = () => {
    if (!isEnabled) {
      return `Cette fonctionnalité nécessite un plan supérieur. Mettez à niveau votre abonnement pour y accéder.`;
    }
    if (!canUse) {
      if (subscription?.status === 'trial') {
        return `Votre période d'essai a expiré. Abonnez-vous pour continuer à utiliser cette fonctionnalité.`;
      }
      return `Limite d'utilisation atteinte. Mettez à niveau votre plan pour continuer.`;
    }
    return null;
  };

  return {
    isEnabled,
    canUse,
    upgradeMessage: getUpgradeMessage(),
    requiresUpgrade: !isEnabled || !canUse
  };
}

// Hook for checking usage limits with warnings
export function useUsageLimits() {
  const { organization, usage, getUsagePercentage, getRemainingQuota } = useOrganization();

  const getUsersStatus = () => {
    const percentage = getUsagePercentage('users');
    const remaining = getRemainingQuota('users');
    
    return {
      current: usage?.users_count || 0,
      limit: organization?.max_users || 0,
      remaining,
      percentage,
      isNearLimit: percentage >= 80,
      isAtLimit: percentage >= 100,
      warningMessage: percentage >= 90 
        ? `Attention: ${remaining} utilisateurs restants`
        : percentage >= 80 
        ? `${remaining} utilisateurs restants`
        : null
    };
  };

  const getProjectsStatus = () => {
    const percentage = getUsagePercentage('projects');
    const remaining = getRemainingQuota('projects');
    
    return {
      current: usage?.projects_count || 0,
      limit: organization?.max_projects || 0,
      remaining,
      percentage,
      isNearLimit: percentage >= 80,
      isAtLimit: percentage >= 100,
      warningMessage: percentage >= 90 
        ? `Attention: ${remaining} projets restants`
        : percentage >= 80 
        ? `${remaining} projets restants`
        : null
    };
  };

  const getStorageStatus = () => {
    const percentage = getUsagePercentage('storage');
    const remaining = getRemainingQuota('storage');
    
    return {
      current: usage?.storage_used_gb || 0,
      limit: organization?.max_storage_gb || 0,
      remaining,
      percentage,
      isNearLimit: percentage >= 80,
      isAtLimit: percentage >= 100,
      warningMessage: percentage >= 90 
        ? `Attention: ${remaining.toFixed(1)}GB restants`
        : percentage >= 80 
        ? `${remaining.toFixed(1)}GB restants`
        : null
    };
  };

  return {
    users: getUsersStatus(),
    projects: getProjectsStatus(),
    storage: getStorageStatus()
  };
}

// Component wrapper for feature gating
interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback = null, 
  showUpgradePrompt = false 
}: FeatureGateProps) {
  const { isEnabled, canUse, upgradeMessage } = useFeatureAccess(feature);

  if (!isEnabled || !canUse) {
    if (showUpgradePrompt && upgradeMessage) {
      return (
        <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
          <p className="text-sm text-orange-800">{upgradeMessage}</p>
          <button className="mt-2 text-sm text-orange-600 hover:text-orange-800 underline">
            Mettre à niveau
          </button>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
