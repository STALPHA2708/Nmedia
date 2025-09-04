-- Create database schema for Nomedia Production

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  client VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pré-Production',
  priority VARCHAR(20) DEFAULT 'medium',
  budget DECIMAL(12,2) NOT NULL,
  spent DECIMAL(12,2) DEFAULT 0.00,
  progress INTEGER DEFAULT 0,
  start_date DATE,
  deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  position VARCHAR(100),
  salary DECIMAL(10,2),
  hire_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  contract_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  salary DECIMAL(10,2),
  file_path VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project team assignments
CREATE TABLE IF NOT EXISTS project_employees (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  role VARCHAR(100),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, employee_id)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id),
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  receipt_path VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  pdf_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI summaries table
CREATE TABLE IF NOT EXISTS ai_summaries (
  id SERIAL PRIMARY KEY,
  document_type VARCHAR(50) NOT NULL,
  document_id INTEGER,
  original_text TEXT,
  summary TEXT,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO projects (name, description, client, status, priority, budget, spent, progress, start_date, deadline) VALUES
('Spot TV - Luxury Brand', 'Production d''un spot télévisé de 30 secondes pour une marque de luxe', 'Maison Deluxe', 'En Production', 'high', 850000.00, 552500.00, 65, '2024-01-10', '2024-02-15'),
('Documentaire Corporate', 'Documentaire de 15 minutes sur l''histoire et les valeurs de l''entreprise', 'TechCorp', 'Post-Production', 'medium', 450000.00, 380000.00, 80, '2023-12-01', '2024-01-30'),
('Campagne Publicitaire', 'Série de 5 vidéos pour campagne publicitaire multi-canaux', 'FashionHouse', 'Pré-Production', 'high', 1200000.00, 120000.00, 25, '2024-01-20', '2024-03-10'),
('Vidéo Formation', 'Modules de formation e-learning interactifs', 'EduPlus', 'Terminé', 'low', 250000.00, 245000.00, 100, '2023-11-15', '2024-01-05');

INSERT INTO employees (first_name, last_name, email, position, salary, hire_date) VALUES
('Alice', 'Martin', 'alice.martin@nomedia.ma', 'Réalisatrice', 45000.00, '2023-01-15'),
('Bob', 'Dupont', 'bob.dupont@nomedia.ma', 'Cadreur', 35000.00, '2023-03-20'),
('Carol', 'Leroy', 'carol.leroy@nomedia.ma', 'Monteuse', 38000.00, '2023-02-10'),
('David', 'Chen', 'david.chen@nomedia.ma', 'Producteur', 55000.00, '2022-11-05'),
('Eve', 'Moreau', 'eve.moreau@nomedia.ma', 'Scripte', 32000.00, '2023-05-12'),
('Frank', 'Petit', 'frank.petit@nomedia.ma', 'Directeur Photo', 48000.00, '2022-09-18'),
('Grace', 'Bernard', 'grace.bernard@nomedia.ma', 'Chef Opératrice Son', 42000.00, '2023-01-08'),
('Henri', 'Roux', 'henri.roux@nomedia.ma', 'Assistant Réalisateur', 28000.00, '2023-06-25'),
('Irene', 'Blanc', 'irene.blanc@nomedia.ma', 'Costumière', 30000.00, '2023-04-03'),
('Julie', 'Fabre', 'julie.fabre@nomedia.ma', 'Graphiste', 36000.00, '2023-07-14'),
('Kevin', 'Durand', 'kevin.durand@nomedia.ma', 'Ingénieur Son', 40000.00, '2022-12-01');

-- Assign employees to projects
INSERT INTO project_employees (project_id, employee_id, role) VALUES
(1, 1, 'Réalisatrice'),
(1, 2, 'Cadreur'),
(1, 3, 'Monteuse'),
(2, 4, 'Producteur'),
(2, 5, 'Scripte'),
(3, 6, 'Directeur Photo'),
(3, 7, 'Chef Opératrice Son'),
(3, 8, 'Assistant Réalisateur'),
(3, 9, 'Costumière'),
(4, 10, 'Graphiste'),
(4, 11, 'Ingénieur Son');

INSERT INTO expenses (project_id, employee_id, category, description, amount, expense_date) VALUES
(1, 1, 'Équipement', 'Location caméra RED', 25000.00, '2024-01-15'),
(1, 2, 'Transport', 'Déplacement équipe', 3500.00, '2024-01-20'),
(2, 4, 'Post-Production', 'Montage et étalonnage', 45000.00, '2024-01-05'),
(3, 6, 'Matériel', 'Éclairage professionnel', 18000.00, '2024-01-25'),
(1, 3, 'Divers', 'Catering équipe', 8500.00, '2024-01-18');

INSERT INTO invoices (project_id, invoice_number, client_name, amount, tax_amount, total_amount, issue_date, due_date, status) VALUES
(4, 'NOM-2024-001', 'EduPlus', 250000.00, 50000.00, 300000.00, '2024-01-06', '2024-02-06', 'paid'),
(2, 'NOM-2024-002', 'TechCorp', 450000.00, 90000.00, 540000.00, '2024-01-31', '2024-03-01', 'pending'),
(1, 'NOM-2024-003', 'Maison Deluxe', 850000.00, 170000.00, 1020000.00, '2024-02-15', '2024-03-15', 'pending');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
