// Quick database initialization to ensure all tables exist
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const dbPath = './nomedia.db';

// Ensure directory exists
const dir = dirname(dbPath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);

async function initDatabase() {
  console.log('🚀 Initializing database tables...');
  
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
    
    // Create employees table with contract fields
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
        deliverables TEXT,
        notes TEXT,
        client_contact_name TEXT,
        client_contact_email TEXT,
        client_contact_phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create project_team_members table
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
    
    // Add some basic contract types if they don't exist
    const contractTypesCount = db.prepare('SELECT COUNT(*) as count FROM contract_types').get();
    if (contractTypesCount.count === 0) {
      const insertContract = db.prepare(`
        INSERT INTO contract_types (name, is_permanent, description) VALUES (?, ?, ?)
      `);
      insertContract.run('CDI', 1, 'Contrat à Durée Indéterminée');
      insertContract.run('CDD', 0, 'Contrat à Durée Déterminée');
      insertContract.run('Stage', 0, 'Stage étudiant');
      insertContract.run('Freelance', 0, 'Travailleur indépendant');
      insertContract.run('Consultant', 0, 'Consultant externe');
      console.log('✅ Added basic contract types');
    }
    
    // Add some basic departments if they don't exist
    const departmentsCount = db.prepare('SELECT COUNT(*) as count FROM departments').get();
    if (departmentsCount.count === 0) {
      const insertDept = db.prepare(`
        INSERT INTO departments (name, description) VALUES (?, ?)
      `);
      insertDept.run('Production', 'Équipe de production audiovisuelle');
      insertDept.run('Post-Production', 'Montage et effets spéciaux');
      insertDept.run('Administration', 'Gestion administrative et comptable');
      insertDept.run('Commercial', 'Développement commercial et relations clients');
      console.log('✅ Added basic departments');
    }
    
    console.log('✅ Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    db.close();
  }
}

initDatabase();
