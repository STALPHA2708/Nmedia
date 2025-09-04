-- Script d'initialisation de la base de données Nomedia Production
-- Ce script sera exécuté automatiquement lors du premier démarrage

-- Création des extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Création du schéma principal
CREATE SCHEMA IF NOT EXISTS nomedia;

-- Table des départements
CREATE TABLE nomedia.departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des types de contrats
CREATE TABLE nomedia.contract_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_permanent BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des employés
CREATE TABLE nomedia.employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    position VARCHAR(100),
    department_id INTEGER REFERENCES nomedia.departments(id),
    salary DECIMAL(10,2),
    hire_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des contrats
CREATE TABLE nomedia.contracts (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES nomedia.employees(id) ON DELETE CASCADE,
    contract_type_id INTEGER REFERENCES nomedia.contract_types(id),
    start_date DATE NOT NULL,
    end_date DATE,
    salary DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
    contract_file_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des projets
CREATE TABLE nomedia.projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    client_name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pre_production' CHECK (status IN ('pre_production', 'production', 'post_production', 'completed')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    budget DECIMAL(12,2) NOT NULL,
    spent DECIMAL(12,2) DEFAULT 0,
    start_date DATE NOT NULL,
    deadline DATE NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    project_type VARCHAR(50),
    deliverables TEXT[],
    notes TEXT,
    client_contact_name VARCHAR(100),
    client_contact_email VARCHAR(100),
    client_contact_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des assignations de projets
CREATE TABLE nomedia.project_assignments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES nomedia.projects(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES nomedia.employees(id) ON DELETE CASCADE,
    role VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    hourly_rate DECIMAL(8,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, employee_id)
);

-- Table des utilisateurs (pour l'authentification)
CREATE TABLE nomedia.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'guest')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    phone VARCHAR(20),
    avatar_url TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    permissions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des factures
CREATE TABLE nomedia.invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    client VARCHAR(200) NOT NULL,
    client_ice VARCHAR(50),
    project VARCHAR(200) NOT NULL,
    project_id INTEGER REFERENCES nomedia.projects(id),
    amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
    profit_margin DECIMAL(5,2),
    estimated_costs DECIMAL(12,2),
    team_members TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des items de facture
CREATE TABLE nomedia.invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES nomedia.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paiements employés pour les factures
CREATE TABLE nomedia.invoice_employee_payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES nomedia.invoices(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES nomedia.employees(id),
    employee_name VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    department VARCHAR(100),
    role_in_project VARCHAR(100),
    hourly_rate DECIMAL(8,2),
    hours_allocated INTEGER,
    cost_allocation DECIMAL(10,2),
    base_salary DECIMAL(10,2),
    overtime_hours INTEGER DEFAULT 0,
    overtime_rate DECIMAL(8,2),
    overtime_payment DECIMAL(10,2) DEFAULT 0,
    bonus_amount DECIMAL(10,2) DEFAULT 0,
    bonus_reason TEXT,
    expense_reimbursements DECIMAL(10,2) DEFAULT 0,
    total_payment DECIMAL(10,2) NOT NULL,
    payment_date DATE,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
    payment_method VARCHAR(50),
    bank_details VARCHAR(200),
    taxes_withheld DECIMAL(10,2) DEFAULT 0,
    net_payment DECIMAL(10,2) NOT NULL,
    contract_type VARCHAR(50),
    performance_bonus DECIMAL(10,2) DEFAULT 0,
    project_completion_bonus DECIMAL(10,2) DEFAULT 0,
    travel_allowance DECIMAL(10,2) DEFAULT 0,
    equipment_allowance DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des dépenses
CREATE TABLE nomedia.expenses (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES nomedia.employees(id),
    project_id INTEGER REFERENCES nomedia.projects(id),
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    receipt_file VARCHAR(255),
    expense_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by INTEGER REFERENCES nomedia.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    reimbursement_date DATE,
    reimbursement_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sessions d'authentification
CREATE TABLE nomedia.auth_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES nomedia.users(id) ON DELETE CASCADE,
    device VARCHAR(200),
    browser VARCHAR(200),
    ip_address INET,
    location VARCHAR(200),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création des index pour optimiser les performances
CREATE INDEX idx_employees_department ON nomedia.employees(department_id);
CREATE INDEX idx_employees_status ON nomedia.employees(status);
CREATE INDEX idx_projects_status ON nomedia.projects(status);
CREATE INDEX idx_projects_priority ON nomedia.projects(priority);
CREATE INDEX idx_projects_client ON nomedia.projects(client_name);
CREATE INDEX idx_project_assignments_project ON nomedia.project_assignments(project_id);
CREATE INDEX idx_project_assignments_employee ON nomedia.project_assignments(employee_id);
CREATE INDEX idx_invoices_status ON nomedia.invoices(status);
CREATE INDEX idx_invoices_client ON nomedia.invoices(client);
CREATE INDEX idx_invoices_project ON nomedia.invoices(project_id);
CREATE INDEX idx_users_email ON nomedia.users(email);
CREATE INDEX idx_users_role ON nomedia.users(role);
CREATE INDEX idx_expenses_employee ON nomedia.expenses(employee_id);
CREATE INDEX idx_expenses_project ON nomedia.expenses(project_id);
CREATE INDEX idx_expenses_status ON nomedia.expenses(status);
CREATE INDEX idx_auth_sessions_user ON nomedia.auth_sessions(user_id);

-- Fonctions pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION nomedia.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON nomedia.departments FOR EACH ROW EXECUTE FUNCTION nomedia.update_updated_at_column();
CREATE TRIGGER update_contract_types_updated_at BEFORE UPDATE ON nomedia.contract_types FOR EACH ROW EXECUTE FUNCTION nomedia.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON nomedia.employees FOR EACH ROW EXECUTE FUNCTION nomedia.update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON nomedia.contracts FOR EACH ROW EXECUTE FUNCTION nomedia.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON nomedia.projects FOR EACH ROW EXECUTE FUNCTION nomedia.update_updated_at_column();
CREATE TRIGGER update_project_assignments_updated_at BEFORE UPDATE ON nomedia.project_assignments FOR EACH ROW EXECUTE FUNCTION nomedia.update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON nomedia.users FOR EACH ROW EXECUTE FUNCTION nomedia.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON nomedia.invoices FOR EACH ROW EXECUTE FUNCTION nomedia.update_updated_at_column();
CREATE TRIGGER update_invoice_employee_payments_updated_at BEFORE UPDATE ON nomedia.invoice_employee_payments FOR EACH ROW EXECUTE FUNCTION nomedia.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON nomedia.expenses FOR EACH ROW EXECUTE FUNCTION nomedia.update_updated_at_column();

-- Insertion des départements
INSERT INTO nomedia.departments (name, description) VALUES
('Production', 'Équipe de production audiovisuelle'),
('Technique', 'Équipe technique et matériel'),
('Post-Production', 'Montage et finalisation'),
('Direction', 'Direction et management'),
('Commercial', 'Ventes et relations clients');

-- Insertion des types de contrats
INSERT INTO nomedia.contract_types (name, is_permanent, description) VALUES
('CDI', true, 'Contrat à Durée Indéterminée'),
('CDD', false, 'Contrat à Durée Déterminée'),
('Freelance', false, 'Travailleur indépendant'),
('Stage', false, 'Stage étudiant'),
('Consultant', false, 'Consultant externe');

-- Insertion d'un utilisateur admin par défaut
INSERT INTO nomedia.users (name, email, password_hash, role, status, phone, permissions) VALUES
('Admin Principal', 'admin@nomedia.ma', '$2a$10$rOq7K8K9mQJQJ9QJ9QJ9QuxvNBk7dGJp0N9kQ9J9Q9J9Q9J9Q9J9Q', 'admin', 'active', '+212 6 12 34 56 78', ARRAY['all']);

-- Accordage des permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA nomedia TO nomedia_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA nomedia TO nomedia_user;
GRANT ALL PRIVILEGES ON SCHEMA nomedia TO nomedia_user;
