// SaaS-specific type definitions for multi-tenant architecture

export interface Organization {
  id: number;
  name: string;
  slug: string; // URL-friendly identifier (e.g., "nomedia-prod")
  domain?: string; // Custom domain (e.g., "app.nomedia.ma")
  logo_url?: string;
  address: string;
  phone?: string;
  email: string;
  website?: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  timezone: string;
  locale: string;
  currency: string;
  tax_number?: string;
  billing_email: string;
  status: 'active' | 'suspended' | 'cancelled' | 'trial';
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
  // Billing info
  subscription_id?: string;
  plan_id: number;
  billing_cycle: 'monthly' | 'yearly';
  next_billing_date?: string;
  // Limits based on plan
  max_users: number;
  max_projects: number;
  max_storage_gb: number;
  // Features enabled
  features: string[]; // JSON array of enabled features
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string; // 'starter', 'professional', 'enterprise'
  description: string;
  price_monthly: number; // Price in MAD
  price_yearly: number; // Price in MAD (usually discounted)
  currency: string;
  // Limits
  max_users: number;
  max_projects: number;
  max_storage_gb: number;
  // Features
  features: PlanFeature[];
  // Metadata
  is_popular: boolean;
  is_active: boolean;
  trial_days: number;
  created_at: string;
  updated_at: string;
}

export interface PlanFeature {
  id: number;
  name: string;
  description: string;
  feature_key: string; // Used in code to check permissions
  is_included: boolean;
  limit?: number; // For features with limits
  category: 'core' | 'advanced' | 'enterprise' | 'integrations';
}

export interface Subscription {
  id: number;
  organization_id: number;
  plan_id: number;
  status: 'active' | 'cancelled' | 'past_due' | 'trial' | 'paused';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  trial_start?: string;
  trial_end?: string;
  amount: number;
  currency: string;
  // Payment info
  payment_method_id?: string;
  last_payment_date?: string;
  next_payment_date?: string;
  payment_status: 'paid' | 'pending' | 'failed' | 'cancelled';
  // Usage tracking
  usage: SubscriptionUsage;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionUsage {
  users_count: number;
  projects_count: number;
  storage_used_gb: number;
  api_calls_count?: number;
  last_calculated_at: string;
}

export interface Invoice {
  id: number;
  organization_id: number;
  subscription_id: number;
  invoice_number: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  paid_date?: string;
  payment_method?: string;
  // Line items
  line_items: InvoiceLineItem[];
  // Billing details
  billing_address: BillingAddress;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  period_start?: string;
  period_end?: string;
}

export interface BillingAddress {
  company_name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  tax_number?: string;
}

export interface OrganizationInvitation {
  id: number;
  organization_id: number;
  email: string;
  role: 'admin' | 'manager' | 'user';
  invited_by: number; // user_id
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

// Enhanced User with organization context
export interface SaaSUser extends User {
  organization_id: number;
  organization?: Organization;
  is_organization_owner: boolean;
  joined_organization_at: string;
}

// Organization settings
export interface OrganizationSettings {
  organization_id: number;
  // Branding
  primary_color?: string;
  logo_url?: string;
  custom_domain?: string;
  // Notifications
  email_notifications: boolean;
  slack_webhook_url?: string;
  // Security
  enforce_2fa: boolean;
  password_policy: 'basic' | 'strong' | 'enterprise';
  session_timeout_minutes: number;
  // Features
  enabled_modules: string[];
  // Integrations
  integrations: OrganizationIntegration[];
  updated_at: string;
}

export interface OrganizationIntegration {
  name: string;
  type: 'accounting' | 'payment' | 'email' | 'storage' | 'analytics';
  config: Record<string, any>;
  is_active: boolean;
  connected_at: string;
}

// SaaS Analytics
export interface SaaSAnalytics {
  organization_id: number;
  period: string; // 'daily', 'weekly', 'monthly'
  date: string;
  metrics: {
    active_users: number;
    projects_created: number;
    invoices_generated: number;
    revenue_generated: number;
    storage_used: number;
    api_calls: number;
  };
}

// Onboarding flow
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  is_required: boolean;
  is_completed: boolean;
  order: number;
}

export interface OnboardingProgress {
  organization_id: number;
  current_step: number;
  completed_steps: string[];
  started_at: string;
  completed_at?: string;
  is_completed: boolean;
}

// Feature flags and limits
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  type: 'boolean' | 'number' | 'string';
  default_value: any;
  is_active: boolean;
}

// API requests with tenant context
export interface TenantContext {
  organization_id: number;
  organization_slug: string;
  user_id: number;
  user_role: string;
  subscription_status: string;
  plan_features: string[];
}
