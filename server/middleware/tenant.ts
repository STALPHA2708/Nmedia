import { Request, Response, NextFunction } from 'express';
import { ProductionDatabase } from '../config/production-database';

// Extend Express Request type to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        organizationId: number;
        organizationSlug: string;
        subscription: any;
        user: any;
        features: string[];
      };
    }
  }
}

interface TenantMiddlewareOptions {
  required?: boolean;
  allowSuperAdmin?: boolean;
}

/**
 * Middleware to extract and validate tenant context from request
 * Supports multiple tenant identification methods:
 * 1. Subdomain (e.g., acme.nomedia.ma)
 * 2. Custom domain (e.g., app.acme.com)
 * 3. Organization slug in path (e.g., /org/acme/projects)
 * 4. User's current organization from token
 */
export function tenantMiddleware(options: TenantMiddlewareOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { required = true, allowSuperAdmin = false } = options;
      
      // Skip tenant resolution for certain routes
      if (shouldSkipTenantResolution(req.path)) {
        return next();
      }

      let organizationId: number | null = null;
      let organizationSlug: string | null = null;

      // Method 1: Extract from subdomain
      const host = req.get('host') || '';
      const subdomain = extractSubdomain(host);
      if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
        organizationSlug = subdomain;
      }

      // Method 2: Extract from custom domain
      if (!organizationSlug) {
        organizationSlug = await getOrganizationByDomain(host);
      }

      // Method 3: Extract from URL path (/org/:slug/...)
      if (!organizationSlug && req.params.orgSlug) {
        organizationSlug = req.params.orgSlug;
      }

      // Method 4: Extract from user's current organization
      if (!organizationSlug && req.user) {
        const user = req.user as any;
        if (user.organization_id) {
          organizationId = user.organization_id;
        }
      }

      // Resolve organization by slug if we have one
      if (organizationSlug && !organizationId) {
        const org = await getOrganizationBySlug(organizationSlug);
        if (org) {
          organizationId = org.id;
        }
      }

      // Handle super admin access
      if (allowSuperAdmin && req.user && (req.user as any).role === 'super_admin') {
        // Super admins can access any organization or work without tenant context
        if (organizationId) {
          const org = await getOrganizationById(organizationId);
          if (org) {
            req.tenant = await buildTenantContext(org, req.user);
          }
        }
        return next();
      }

      // Validate tenant is required
      if (required && !organizationId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required',
          code: 'TENANT_REQUIRED'
        });
      }

      // Load full organization context
      if (organizationId) {
        const organization = await getOrganizationById(organizationId);
        
        if (!organization) {
          return res.status(404).json({
            success: false,
            message: 'Organization not found',
            code: 'TENANT_NOT_FOUND'
          });
        }

        // Check organization status
        if (organization.status === 'suspended') {
          return res.status(403).json({
            success: false,
            message: 'Organization account is suspended',
            code: 'TENANT_SUSPENDED'
          });
        }

        if (organization.status === 'cancelled') {
          return res.status(403).json({
            success: false,
            message: 'Organization account is cancelled',
            code: 'TENANT_CANCELLED'
          });
        }

        // Check trial expiration
        if (organization.status === 'trial' && organization.trial_ends_at) {
          const trialEnd = new Date(organization.trial_ends_at);
          if (trialEnd < new Date()) {
            return res.status(402).json({
              success: false,
              message: 'Trial period has expired. Please upgrade your subscription.',
              code: 'TRIAL_EXPIRED'
            });
          }
        }

        // Build tenant context
        req.tenant = await buildTenantContext(organization, req.user);

        // Set database context for RLS
        if (process.env.NODE_ENV === 'production') {
          await setDatabaseContext(organizationId);
        }
      }

      next();
    } catch (error) {
      console.error('Tenant middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve tenant context',
        code: 'TENANT_ERROR'
      });
    }
  };
}

/**
 * Middleware to check if user has access to specific organization
 */
export function requireOrganizationAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.tenant || !req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const user = req.user as any;
      
      // Check if user belongs to this organization
      if (user.organization_id !== req.tenant.organizationId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this organization',
          code: 'ORGANIZATION_ACCESS_DENIED'
        });
      }

      next();
    } catch (error) {
      console.error('Organization access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify organization access',
        code: 'ACCESS_CHECK_ERROR'
      });
    }
  };
}

/**
 * Middleware to check subscription limits
 */
export function checkSubscriptionLimits(resource: 'users' | 'projects' | 'storage') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.tenant) {
        return next();
      }

      const { subscription } = req.tenant;
      
      if (!subscription || subscription.status !== 'active') {
        // Allow during trial period
        if (subscription?.status !== 'trial') {
          return res.status(402).json({
            success: false,
            message: 'Active subscription required',
            code: 'SUBSCRIPTION_REQUIRED'
          });
        }
      }

      // Check specific resource limits
      const currentUsage = await getCurrentUsage(req.tenant.organizationId);
      
      switch (resource) {
        case 'users':
          if (currentUsage.users >= subscription.max_users) {
            return res.status(402).json({
              success: false,
              message: `User limit reached (${subscription.max_users}). Please upgrade your plan.`,
              code: 'USER_LIMIT_REACHED'
            });
          }
          break;
          
        case 'projects':
          if (currentUsage.projects >= subscription.max_projects) {
            return res.status(402).json({
              success: false,
              message: `Project limit reached (${subscription.max_projects}). Please upgrade your plan.`,
              code: 'PROJECT_LIMIT_REACHED'
            });
          }
          break;
          
        case 'storage':
          if (currentUsage.storage_gb >= subscription.max_storage_gb) {
            return res.status(402).json({
              success: false,
              message: `Storage limit reached (${subscription.max_storage_gb}GB). Please upgrade your plan.`,
              code: 'STORAGE_LIMIT_REACHED'
            });
          }
          break;
      }

      next();
    } catch (error) {
      console.error('Subscription limits check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check subscription limits',
        code: 'LIMITS_CHECK_ERROR'
      });
    }
  };
}

// Helper functions
function shouldSkipTenantResolution(path: string): boolean {
  const skipPaths = [
    '/api/health',
    '/api/ping',
    '/api/auth/login',
    '/api/auth/register',
    '/api/saas/signup',
    '/api/saas/plans',
    '/api/super-admin'
  ];
  
  return skipPaths.some(skipPath => path.startsWith(skipPath));
}

function extractSubdomain(host: string): string | null {
  const parts = host.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}

async function getOrganizationByDomain(domain: string): Promise<string | null> {
  try {
    const db = ProductionDatabase.getInstance();
    const result = await db.query(
      'SELECT slug FROM organizations WHERE domain = $1 AND status = $2',
      [domain, 'active']
    );
    return result.rows[0]?.slug || null;
  } catch (error) {
    console.error('Error getting organization by domain:', error);
    return null;
  }
}

async function getOrganizationBySlug(slug: string): Promise<any> {
  try {
    const db = ProductionDatabase.getInstance();
    const result = await db.query(
      'SELECT * FROM organizations WHERE slug = $1',
      [slug]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting organization by slug:', error);
    return null;
  }
}

async function getOrganizationById(id: number): Promise<any> {
  try {
    const db = ProductionDatabase.getInstance();
    const result = await db.query(
      'SELECT * FROM organizations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting organization by ID:', error);
    return null;
  }
}

async function buildTenantContext(organization: any, user: any): Promise<any> {
  try {
    // Get subscription details
    const db = ProductionDatabase.getInstance();
    const subscriptionResult = await db.query(`
      SELECT s.*, sp.name as plan_name, sp.features, sp.max_users, sp.max_projects, sp.max_storage_gb
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.organization_id = $1 AND s.status IN ('active', 'trial')
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [organization.id]);

    const subscription = subscriptionResult.rows[0];

    return {
      organizationId: organization.id,
      organizationSlug: organization.slug,
      subscription: subscription || null,
      user: user,
      features: subscription?.features || []
    };
  } catch (error) {
    console.error('Error building tenant context:', error);
    return {
      organizationId: organization.id,
      organizationSlug: organization.slug,
      subscription: null,
      user: user,
      features: []
    };
  }
}

async function setDatabaseContext(organizationId: number): Promise<void> {
  try {
    const db = ProductionDatabase.getInstance();
    await db.query('SELECT set_config($1, $2, true)', [
      'app.current_organization_id',
      organizationId.toString()
    ]);
  } catch (error) {
    console.error('Error setting database context:', error);
  }
}

async function getCurrentUsage(organizationId: number): Promise<any> {
  try {
    const db = ProductionDatabase.getInstance();
    
    // Get current usage counts
    const usageResult = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE organization_id = $1) as users,
        (SELECT COUNT(*) FROM projects WHERE organization_id = $1) as projects,
        (SELECT COALESCE(SUM(storage_used_gb), 0) FROM saas_analytics 
         WHERE organization_id = $1 AND period = 'daily' 
         ORDER BY date DESC LIMIT 1) as storage_gb
    `, [organizationId]);

    return usageResult.rows[0] || { users: 0, projects: 0, storage_gb: 0 };
  } catch (error) {
    console.error('Error getting current usage:', error);
    return { users: 0, projects: 0, storage_gb: 0 };
  }
}

export {
  requireOrganizationAccess,
  checkSubscriptionLimits
};
