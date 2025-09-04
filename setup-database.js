// Simple database setup script for Nomedia Production
// This will create all necessary tables and sample data

import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcrypt';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres', // Connect to default database first
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

async function setupDatabase() {
  console.log('🚀 Starting database setup...');
  
  let client = new Client(dbConfig);
  
  try {
    // Connect to default database
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Create nomedia_production database if it doesn't exist
    try {
      await client.query(`CREATE DATABASE nomedia_production`);
      console.log('✅ Created nomedia_production database');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('✅ Database nomedia_production already exists');
      } else {
        throw error;
      }
    }
    
    await client.end();
    
    // Now connect to the nomedia_production database
    client = new Client({
      ...dbConfig,
      database: 'nomedia_production'
    });
    
    await client.connect();
    console.log('✅ Connected to nomedia_production database');
    
    // Create schema
    await client.query(`CREATE SCHEMA IF NOT EXISTS nomedia`);
    console.log('✅ Created nomedia schema');
    
    // Create departments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS nomedia.departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create contract types table
    await client.query(`
      CREATE TABLE IF NOT EXISTS nomedia.contract_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        is_permanent BOOLEAN DEFAULT FALSE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create employees table
    await client.query(`
      CREATE TABLE IF NOT EXISTS nomedia.employees (
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
      )
    `);
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS nomedia.users (
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
      )
    `);
    
    // Create projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS nomedia.projects (
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
      )
    `);
    
    // Create invoices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS nomedia.invoices (
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
      )
    `);
    
    // Create invoice items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS nomedia.invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES nomedia.invoices(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        total DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create expenses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS nomedia.expenses (
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
      )
    `);
    
    console.log('✅ All tables created successfully');
    
    // Insert sample departments
    await client.query(`
      INSERT INTO nomedia.departments (name, description) VALUES
      ('Production', 'Équipe de production audiovisuelle'),
      ('Technique', 'Équipe technique et matériel'),
      ('Post-Production', 'Montage et finalisation'),
      ('Direction', 'Direction et management'),
      ('Commercial', 'Ventes et relations clients')
      ON CONFLICT (name) DO NOTHING
    `);
    
    // Insert contract types
    await client.query(`
      INSERT INTO nomedia.contract_types (name, is_permanent, description) VALUES
      ('CDI', true, 'Contrat à Durée Indéterminée'),
      ('CDD', false, 'Contrat à Durée Déterminée'),
      ('Freelance', false, 'Travailleur indépendant'),
      ('Stage', false, 'Stage étudiant'),
      ('Consultant', false, 'Consultant externe')
      ON CONFLICT (name) DO NOTHING
    `);
    
    // Insert sample employees
    await client.query(`
      INSERT INTO nomedia.employees (first_name, last_name, email, phone, address, position, department_id, salary, hire_date, status) VALUES
      ('Alice', 'Martin', 'alice.martin@nomedia.ma', '+212 6 12 34 56 78', 'Casablanca, Maroc', 'Réalisatrice', 1, 45000, '2023-01-15', 'active'),
      ('Bob', 'Dupont', 'bob.dupont@nomedia.ma', '+212 6 23 45 67 89', 'Rabat, Maroc', 'Cameraman', 2, 35000, '2023-03-20', 'active'),
      ('Carol', 'Leroy', 'carol.leroy@nomedia.ma', '+212 6 34 56 78 90', 'Casablanca, Maroc', 'Monteuse', 3, 38000, '2023-02-10', 'active'),
      ('David', 'Chen', 'david.chen@nomedia.ma', '+212 6 45 67 89 01', 'Casablanca, Maroc', 'Producteur', 4, 55000, '2022-11-05', 'active')
      ON CONFLICT (email) DO NOTHING
    `);
    
    // Insert sample projects
    await client.query(`
      INSERT INTO nomedia.projects (name, client_name, description, status, priority, budget, spent, start_date, deadline, progress, project_type, deliverables, notes, client_contact_name, client_contact_email, client_contact_phone) VALUES
      ('Spot TV - Luxury Brand', 'Maison Deluxe', 'Production d''un spot télévisé de 30 secondes pour une marque de luxe', 'production', 'high', 85000, 55250, '2024-01-10', '2024-02-15', 65, 'publicite', ARRAY['Spot TV 30s', 'Version web', 'Making-of'], 'Tournage en studio et en extérieur', 'Sophie Dubois', 'sophie@maison-deluxe.com', '+212 5 22 33 44 55'),
      ('Documentaire Corporate', 'TechCorp', 'Documentaire de 15 minutes sur l''histoire et les valeurs de l''entreprise', 'post_production', 'medium', 45000, 38000, '2023-12-01', '2024-01-30', 80, 'documentaire', ARRAY['Documentaire 15min', 'Trailer 2min'], 'Interviews avec les dirigeants et employés', 'Jean Techno', 'jean@techcorp.ma', '+212 5 22 11 22 33'),
      ('Campagne Publicitaire', 'FashionHouse', 'Série de 5 vidéos pour campagne publicitaire multi-canaux', 'pre_production', 'high', 120000, 12000, '2024-01-20', '2024-03-10', 25, 'publicite', ARRAY['5 vidéos produits', 'Adaptation réseaux sociaux', 'Assets photos'], 'Campagne automne-hiver 2024', 'Marie Fashion', 'marie@fashionhouse.ma', '+212 5 22 44 55 66')
      ON CONFLICT DO NOTHING
    `);
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO nomedia.users (name, email, password_hash, role, status, phone, permissions) VALUES
      ('Admin Principal', 'admin@nomedia.ma', $1, 'admin', 'active', '+212 6 12 34 56 78', ARRAY['all'])
      ON CONFLICT (email) DO NOTHING
    `, [hashedPassword]);
    
    console.log('✅ Sample data inserted successfully');
    console.log('');
    console.log('🎉 Database setup complete!');
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
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('💡 Connection refused. Please make sure PostgreSQL is running.');
      console.log('   If you don\'t have PostgreSQL installed:');
      console.log('   1. Download from: https://www.postgresql.org/download/');
      console.log('   2. Install with default settings');
      console.log('   3. Remember your password');
      console.log('   4. Update your .env file with the correct credentials');
    }
  } finally {
    await client.end();
  }
}

setupDatabase();
