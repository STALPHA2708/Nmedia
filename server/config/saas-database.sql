-- Multi-tenant SaaS database schema for Nomedia Production Platform

-- 1. Organizations (Tenants) - Core table
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE, -- URL-friendly identifier
  domain VARCHAR(255) UNIQUE, -- Custom domain
  logo_url TEXT,
  address TEXT NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  industry VARCHAR(100),
  size VARCHAR(20) CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  timezone VARCHAR(50) DEFAULT 'Africa/Casablanca',
  locale VARCHAR(10) DEFAULT 'fr-MA',
  currency VARCHAR(3) DEFAULT 'MAD',
  tax_number VARCHAR(50),
  billing_email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial')),
  trial_ends_at TIMESTAMP,
  subscription_id VARCHAR(255),
  plan_id INTEGER,
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  next_billing_date TIMESTAMP,
  max_users INTEGER DEFAULT 5,
  max_projects INTEGER DEFAULT 10,
  max_storage_gb INTEGER DEFAULT 10,
  features JSON, -- Array of enabled features
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Subscription Plans
CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MAD',
  max_users INTEGER NOT NULL,
  max_projects INTEGER NOT NULL,
  max_storage_gb INTEGER NOT NULL,
  features JSON NOT NULL, -- Array of plan features
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  trial_days INTEGER DEFAULT 14,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Subscriptions
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES subscription_plans(id),
  status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('active', 'cancelled', 'past_due', 'trial', 'paused')),
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MAD',
  payment_method_id VARCHAR(255),
  last_payment_date TIMESTAMP,
  next_payment_date TIMESTAMP,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'failed', 'cancelled')),
  usage_data JSON, -- Current usage statistics
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. SaaS Invoices (different from client invoices)
CREATE TABLE saas_invoices (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES subscriptions(id),
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MAD',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_method VARCHAR(100),
  line_items JSON NOT NULL, -- Invoice line items
  billing_address JSON NOT NULL, -- Billing address details
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Organization Invitations
CREATE TABLE organization_invitations (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  invited_by INTEGER REFERENCES users(id),
  token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Organization Settings
CREATE TABLE organization_settings (
  organization_id INTEGER PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  primary_color VARCHAR(7), -- Hex color
  logo_url TEXT,
  custom_domain VARCHAR(255),
  email_notifications BOOLEAN DEFAULT TRUE,
  slack_webhook_url TEXT,
  enforce_2fa BOOLEAN DEFAULT FALSE,
  password_policy VARCHAR(20) DEFAULT 'basic' CHECK (password_policy IN ('basic', 'strong', 'enterprise')),
  session_timeout_minutes INTEGER DEFAULT 480, -- 8 hours
  enabled_modules JSON, -- Array of enabled modules
  integrations JSON, -- External integrations config
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. SaaS Analytics
CREATE TABLE saas_analytics (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  date DATE NOT NULL,
  metrics JSON NOT NULL, -- Usage metrics
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, period, date)
);

-- 8. Feature Flags
CREATE TABLE feature_flags (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) DEFAULT 'boolean' CHECK (type IN ('boolean', 'number', 'string')),
  default_value TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Onboarding Progress
CREATE TABLE onboarding_progress (
  organization_id INTEGER PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  completed_steps JSON DEFAULT '[]', -- Array of completed step IDs
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  is_completed BOOLEAN DEFAULT FALSE
);

-- Add organization_id to existing tables for multi-tenancy
-- This transforms all existing tables to be tenant-aware

-- Update users table
ALTER TABLE users ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN is_organization_owner BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN joined_organization_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update all existing business tables
ALTER TABLE departments ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE employees ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE projects ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE invoices ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE expenses ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE contract_types ADD COLUMN organization_id INTEGER REFERENCES organizations(id);

-- Create indexes for performance
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_subscriptions_org_id ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_departments_organization_id ON departments(organization_id);
CREATE INDEX idx_employees_organization_id ON employees(organization_id);
CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX idx_expenses_organization_id ON expenses(organization_id);
CREATE INDEX idx_saas_invoices_org_id ON saas_invoices(organization_id);
CREATE INDEX idx_analytics_org_date ON saas_analytics(organization_id, date);

-- Row Level Security (RLS) for data isolation
-- Enable RLS on all tenant tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (example for departments)
CREATE POLICY tenant_isolation_departments ON departments
  FOR ALL
  TO authenticated_users
  USING (organization_id = current_setting('app.current_organization_id')::INTEGER);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, max_users, max_projects, max_storage_gb, features) VALUES
(
  'Starter', 
  'starter', 
  'Parfait pour les petites équipes de production', 
  2500.00, 
  25000.00,
  5, 
  20, 
  10,
  '["basic_projects", "basic_team", "basic_invoicing", "email_support"]'
),
(
  'Professional', 
  'professional', 
  'Idéal pour les sociétés de production en croissance', 
  4500.00, 
  45000.00,
  15, 
  999999, 
  50,
  '["unlimited_projects", "advanced_team", "advanced_invoicing", "expense_management", "analytics", "priority_support"]'
),
(
  'Enterprise', 
  'enterprise', 
  'Solution complète pour les grandes organisations', 
  8500.00, 
  85000.00,
  999999, 
  999999, 
  200,
  '["unlimited_everything", "custom_branding", "api_access", "advanced_security", "custom_integrations", "dedicated_support"]'
);

-- Insert default feature flags
INSERT INTO feature_flags (key, name, description, type, default_value) VALUES
('analytics_dashboard', 'Analytics Dashboard', 'Advanced analytics and reporting', 'boolean', 'false'),
('api_access', 'API Access', 'Access to REST API', 'boolean', 'false'),
('custom_branding', 'Custom Branding', 'Custom logo and colors', 'boolean', 'false'),
('priority_support', 'Priority Support', 'Priority customer support', 'boolean', 'false'),
('advanced_security', 'Advanced Security', 'Enhanced security features', 'boolean', 'false'),
('unlimited_storage', 'Unlimited Storage', 'No storage limits', 'boolean', 'false');

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_settings_updated_at BEFORE UPDATE ON organization_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
