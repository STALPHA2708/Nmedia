// SQLite setup for Nomedia Production (fallback when PostgreSQL is not available)
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const dbPath = './nomedia.db';

// Ensure directory exists
const dir = dirname(dbPath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);

async function setupSQLiteDatabase() {
  console.log('🚀 Setting up SQLite database...');
  
  try {
    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');
    
    // Create departments table
    db.exec(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create contract_types table
    db.exec(`
      CREATE TABLE IF NOT EXISTS contract_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        is_permanent BOOLEAN DEFAULT 0,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create employees table
    db.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        address TEXT,
        position TEXT,
        department_id INTEGER REFERENCES departments(id),
        salary DECIMAL(10,2),
        hire_date DATE NOT NULL,
        contract_type TEXT,
        contract_start_date DATE,
        contract_end_date DATE,
        contract_file_name TEXT,
        contract_file_path TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'guest')),
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        phone TEXT,
        avatar_url TEXT,
        last_login DATETIME,
        permissions TEXT, -- JSON string for array
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create projects table
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        client_name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pre_production' CHECK (status IN ('pre_production', 'production', 'post_production', 'completed')),
        priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        budget DECIMAL(12,2) NOT NULL,
        spent DECIMAL(12,2) DEFAULT 0,
        start_date DATE NOT NULL,
        deadline DATE NOT NULL,
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        project_type TEXT,
        deliverables TEXT, -- JSON string for array
        notes TEXT,
        client_contact_name TEXT,
        client_contact_email TEXT,
        client_contact_phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create project_team_members table for many-to-many relationship
    db.exec(`
      CREATE TABLE IF NOT EXISTS project_team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        start_date DATE,
        end_date DATE,
        hourly_rate DECIMAL(10,2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, employee_id)
      )
    `);

    // Create invoices table
    db.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT NOT NULL UNIQUE,
        client TEXT NOT NULL,
        client_ice TEXT,
        project TEXT NOT NULL,
        project_id INTEGER REFERENCES projects(id),
        amount DECIMAL(12,2) NOT NULL,
        tax_amount DECIMAL(12,2) NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
        profit_margin DECIMAL(5,2),
        estimated_costs DECIMAL(12,2),
        team_members TEXT, -- JSON string for array
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create invoice_items table
    db.exec(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        total DECIMAL(10,2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create expenses table
    db.exec(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER REFERENCES employees(id),
        project_id INTEGER REFERENCES projects(id),
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        receipt_file TEXT,
        expense_date DATE NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        approved_by INTEGER REFERENCES users(id),
        approved_at DATETIME,
        rejection_reason TEXT,
        reimbursement_date DATE,
        reimbursement_method TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ All tables created successfully');
    
    // Insert sample departments
    const insertDept = db.prepare('INSERT OR IGNORE INTO departments (name, description) VALUES (?, ?)');
    insertDept.run('Production', 'Équipe de production audiovisuelle');
    insertDept.run('Technique', 'Équipe technique et matériel');
    insertDept.run('Post-Production', 'Montage et finalisation');
    insertDept.run('Direction', 'Direction et management');
    insertDept.run('Commercial', 'Ventes et relations clients');
    
    // Insert contract types
    const insertContract = db.prepare('INSERT OR IGNORE INTO contract_types (name, is_permanent, description) VALUES (?, ?, ?)');
    insertContract.run('CDI', 1, 'Contrat à Durée Indéterminée');
    insertContract.run('CDD', 0, 'Contrat à Durée Déterminée');
    insertContract.run('Freelance', 0, 'Travailleur indépendant');
    insertContract.run('Stage', 0, 'Stage étudiant');
    insertContract.run('Consultant', 0, 'Consultant externe');
    
    // Insert sample employees
    const insertEmployee = db.prepare(`
      INSERT OR IGNORE INTO employees
      (first_name, last_name, email, phone, address, position, department_id, salary, hire_date, contract_type, contract_start_date, contract_end_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertEmployee.run('Alice', 'Martin', 'alice.martin@nomedia.ma', '+212 6 12 34 56 78', 'Casablanca, Maroc', 'Réalisatrice', 1, 45000, '2023-01-15', 'CDI', '2023-01-15', null, 'active');
    insertEmployee.run('Bob', 'Dupont', 'bob.dupont@nomedia.ma', '+212 6 23 45 67 89', 'Rabat, Maroc', 'Cameraman', 2, 35000, '2023-03-20', 'CDD 12 mois', '2023-03-20', '2024-03-20', 'active');
    insertEmployee.run('Carol', 'Leroy', 'carol.leroy@nomedia.ma', '+212 6 34 56 78 90', 'Casablanca, Maroc', 'Monteuse', 3, 38000, '2023-02-10', 'CDI', '2023-02-10', null, 'active');
    insertEmployee.run('David', 'Chen', 'david.chen@nomedia.ma', '+212 6 45 67 89 01', 'Casablanca, Maroc', 'Producteur', 4, 55000, '2022-11-05', 'Freelance 6 mois', '2022-11-05', '2023-05-05', 'active');
    
    // Insert sample projects
    const insertProject = db.prepare(`
      INSERT OR IGNORE INTO projects 
      (name, client_name, description, status, priority, budget, spent, start_date, deadline, progress, project_type, deliverables, notes, client_contact_name, client_contact_email, client_contact_phone) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertProject.run('Spot TV - Luxury Brand', 'Maison Deluxe', 'Production d\'un spot télévisé de 30 secondes pour une marque de luxe', 'production', 'high', 85000, 55250, '2024-01-10', '2024-02-15', 65, 'publicite', JSON.stringify(['Spot TV 30s', 'Version web', 'Making-of']), 'Tournage en studio et en extérieur', 'Sophie Dubois', 'sophie@maison-deluxe.com', '+212 5 22 33 44 55');
    insertProject.run('Documentaire Corporate', 'TechCorp', 'Documentaire de 15 minutes sur l\'histoire et les valeurs de l\'entreprise', 'post_production', 'medium', 45000, 38000, '2023-12-01', '2024-01-30', 80, 'documentaire', JSON.stringify(['Documentaire 15min', 'Trailer 2min']), 'Interviews avec les dirigeants et employés', 'Jean Techno', 'jean@techcorp.ma', '+212 5 22 11 22 33');
    insertProject.run('Campagne Publicitaire', 'FashionHouse', 'Série de 5 vidéos pour campagne publicitaire multi-canaux', 'pre_production', 'high', 120000, 12000, '2024-01-20', '2024-03-10', 25, 'publicite', JSON.stringify(['5 vidéos produits', 'Adaptation réseaux sociaux', 'Assets photos']), 'Campagne automne-hiver 2024', 'Marie Fashion', 'marie@fashionhouse.ma', '+212 5 22 44 55 66');

    // Insert sample invoices
    const insertInvoice = db.prepare(`
      INSERT OR IGNORE INTO invoices
      (invoice_number, client, project, project_id, amount, tax_amount, total_amount, issue_date, due_date, status, profit_margin, estimated_costs, team_members, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertInvoice.run('NOM-2024-001', 'Maison Deluxe', 'Spot TV - Luxury Brand', 1, 85000, 17000, 102000, '2024-01-15', '2024-02-15', 'paid', 35, 55250, JSON.stringify(['Alice Martin', 'Bob Dupont']), 'Facture pour spot TV de luxe');
    insertInvoice.run('NOM-2024-002', 'TechCorp', 'Documentaire Corporate', 2, 45000, 9000, 54000, '2024-01-01', '2024-02-01', 'pending', 40, 27000, JSON.stringify(['David Chen', 'Carol Leroy']), 'Facture pour documentaire corporate');
    insertInvoice.run('NOM-2024-003', 'FashionHouse', 'Campagne Publicitaire', 3, 120000, 24000, 144000, '2024-01-25', '2024-02-25', 'draft', 30, 84000, JSON.stringify(['Alice Martin', 'Bob Dupont', 'Carol Leroy']), 'Facture pour campagne multi-canaux');

    // Insert sample project team members
    const insertProjectTeamMember = db.prepare(`
      INSERT OR IGNORE INTO project_team_members
      (project_id, employee_id, role, start_date, end_date, hourly_rate)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    // Project 1: Spot TV - Luxury Brand
    insertProjectTeamMember.run(1, 1, 'Directeur de Production', '2024-01-10', null, 250);
    insertProjectTeamMember.run(1, 2, 'Caméra & Montage', '2024-01-10', '2024-02-15', 200);

    // Project 2: Documentaire Corporate
    insertProjectTeamMember.run(2, 3, 'Directeur Artistique', '2023-12-01', '2024-01-30', 180);
    insertProjectTeamMember.run(2, 4, 'Assistant Production', '2023-12-01', '2024-01-30', 120);

    // Project 3: Campagne Publicitaire
    insertProjectTeamMember.run(3, 1, 'Chef de Projet', '2024-01-20', null, 250);
    insertProjectTeamMember.run(3, 2, 'Réalisateur', '2024-01-20', null, 300);
    insertProjectTeamMember.run(3, 3, 'Directeur Artistique', '2024-01-20', null, 180);

    // Insert sample expenses
    const insertExpense = db.prepare(`
      INSERT OR IGNORE INTO expenses
      (employee_id, project_id, category, description, amount, expense_date, status, receipt_file)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertExpense.run(1, 1, 'Transport', 'Taxi pour le tournage spot TV', 150, '2024-01-12', 'approved', null);
    insertExpense.run(2, 1, 'Repas', 'Repas équipe tournage - Jour 1', 480, '2024-01-12', 'approved', 'recu_repas_01.pdf');
    insertExpense.run(3, 2, 'Matériel', 'Location matériel éclairage documentaire', 850, '2024-01-05', 'pending', null);
    insertExpense.run(1, null, 'Formation', 'Formation Adobe Premiere Pro', 750, '2024-01-20', 'pending', 'facture_formation.pdf');
    insertExpense.run(4, 3, 'Communication', 'Frais téléphone campagne publicitaire', 120, '2024-01-22', 'approved', null);
    insertExpense.run(2, null, 'Transport', 'Essence véhicule de service', 95, '2024-01-25', 'rejected', 'facture_essence.pdf');
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const insertUser = db.prepare('INSERT OR IGNORE INTO users (name, email, password_hash, role, status, phone, permissions) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertUser.run('Admin Principal', 'admin@nomedia.ma', hashedPassword, 'admin', 'active', '+212 6 12 34 56 78', JSON.stringify(['all']));
    
    console.log('✅ Sample data inserted successfully');
    console.log('');
    console.log('🎉 SQLite Database setup complete!');
    console.log('');
    console.log('📋 Admin Login Credentials:');
    console.log('   Email: admin@nomedia.ma');
    console.log('   Password: admin123');
    console.log('');
    console.log('📊 Sample Data Created:');
    console.log('   • 5 Departments');
    console.log('   • 4 Employees');
    console.log('   • 3 Projects');
    console.log('   • 5 Contract Types');
    console.log('   • 1 Admin User');
    console.log('');
    console.log('💾 Database file: ' + dbPath);
    
  } catch (error) {
    console.error('❌ Error setting up SQLite database:', error);
  } finally {
    db.close();
  }
}

setupSQLiteDatabase();
