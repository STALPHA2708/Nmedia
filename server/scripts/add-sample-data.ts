import { pool } from '../config/database';
import bcrypt from 'bcrypt';

async function addSampleData() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // First ensure schema exists
    await client.query('CREATE SCHEMA IF NOT EXISTS nomedia');

    // Create all tables first
    await client.query(`
      CREATE TABLE IF NOT EXISTS nomedia.departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

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

    // Check if departments exist, if not create them
    const deptCheck = await client.query('SELECT COUNT(*) FROM nomedia.departments');
    if (parseInt(deptCheck.rows[0].count) === 0) {
      console.log('Adding sample departments...');
      await client.query(`
        INSERT INTO nomedia.departments (name, description) VALUES
        ('Production', 'Équipe de production audiovisuelle'),
        ('Technique', 'Équipe technique et matériel'),
        ('Post-Production', 'Montage et finalisation'),
        ('Direction', 'Direction et management'),
        ('Commercial', 'Ventes et relations clients')
      `);
    }

    // Check if contract types exist, if not create them
    const contractCheck = await client.query('SELECT COUNT(*) FROM nomedia.contract_types');
    if (parseInt(contractCheck.rows[0].count) === 0) {
      console.log('Adding sample contract types...');
      await client.query(`
        INSERT INTO nomedia.contract_types (name, is_permanent, description) VALUES
        ('CDI', true, 'Contrat à Durée Indéterminée'),
        ('CDD', false, 'Contrat à Durée Déterminée'),
        ('Freelance', false, 'Travailleur indépendant'),
        ('Stage', false, 'Stage étudiant'),
        ('Consultant', false, 'Consultant externe')
      `);
    }

    // Check if employees exist, if not create them
    const empCheck = await client.query('SELECT COUNT(*) FROM nomedia.employees');
    if (parseInt(empCheck.rows[0].count) === 0) {
      console.log('Adding sample employees...');
      await client.query(`
        INSERT INTO nomedia.employees (first_name, last_name, email, phone, address, position, department_id, salary, hire_date, status) VALUES
        ('Alice', 'Martin', 'alice.martin@nomedia.ma', '+212 6 12 34 56 78', 'Casablanca, Maroc', 'Réalisatrice', 1, 45000, '2023-01-15', 'active'),
        ('Bob', 'Dupont', 'bob.dupont@nomedia.ma', '+212 6 23 45 67 89', 'Rabat, Maroc', 'Cameraman', 2, 35000, '2023-03-20', 'active'),
        ('Carol', 'Leroy', 'carol.leroy@nomedia.ma', '+212 6 34 56 78 90', 'Casablanca, Maroc', 'Monteuse', 3, 38000, '2023-02-10', 'active'),
        ('David', 'Chen', 'david.chen@nomedia.ma', '+212 6 45 67 89 01', 'Casablanca, Maroc', 'Producteur', 4, 55000, '2022-11-05', 'active'),
        ('Eva', 'Rodriguez', 'eva.rodriguez@nomedia.ma', '+212 6 56 78 90 12', 'Casablanca, Maroc', 'Ingénieure Son', 2, 40000, '2023-04-15', 'active')
      `);
    }

    // Check if projects exist, if not create them
    const projCheck = await client.query('SELECT COUNT(*) FROM nomedia.projects');
    if (parseInt(projCheck.rows[0].count) === 0) {
      console.log('Adding sample projects...');
      await client.query(`
        INSERT INTO nomedia.projects (name, client_name, description, status, priority, budget, spent, start_date, deadline, progress, project_type, deliverables, notes, client_contact_name, client_contact_email, client_contact_phone) VALUES
        ('Spot TV - Luxury Brand', 'Maison Deluxe', 'Production d''un spot télévisé de 30 secondes pour une marque de luxe', 'production', 'high', 85000, 55250, '2024-01-10', '2024-02-15', 65, 'publicite', ARRAY['Spot TV 30s', 'Version web', 'Making-of'], 'Tournage en studio et en extérieur', 'Sophie Dubois', 'sophie@maison-deluxe.com', '+212 5 22 33 44 55'),
        ('Documentaire Corporate', 'TechCorp', 'Documentaire de 15 minutes sur l''histoire et les valeurs de l''entreprise', 'post_production', 'medium', 45000, 38000, '2023-12-01', '2024-01-30', 80, 'documentaire', ARRAY['Documentaire 15min', 'Trailer 2min'], 'Interviews avec les dirigeants et employés', 'Jean Techno', 'jean@techcorp.ma', '+212 5 22 11 22 33'),
        ('Campagne Publicitaire', 'FashionHouse', 'Série de 5 vidéos pour campagne publicitaire multi-canaux', 'pre_production', 'high', 120000, 12000, '2024-01-20', '2024-03-10', 25, 'publicite', ARRAY['5 vidéos produits', 'Adaptation réseaux sociaux', 'Assets photos'], 'Campagne automne-hiver 2024', 'Marie Fashion', 'marie@fashionhouse.ma', '+212 5 22 44 55 66')
      `);
    }

    // Check if admin user exists, if not create one
    const userCheck = await client.query('SELECT COUNT(*) FROM nomedia.users WHERE email = $1', ['admin@nomedia.ma']);
    if (parseInt(userCheck.rows[0].count) === 0) {
      console.log('Adding admin user...');
      // Create admin user with default password: "admin123"
      const hashedPassword = await bcrypt.hash('admin123', 10);

      await client.query(`
        INSERT INTO nomedia.users (name, email, password_hash, role, status, phone, permissions) VALUES
        ('Admin Principal', 'admin@nomedia.ma', $1, 'admin', 'active', '+212 6 12 34 56 78', ARRAY['all'])
      `, [hashedPassword]);
    }

    await client.query('COMMIT');
    console.log('Sample data added successfully!');
    console.log('Admin login: admin@nomedia.ma / admin123');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding sample data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  addSampleData()
    .then(() => {
      console.log('Sample data script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Sample data script failed:', error);
      process.exit(1);
    });
}

export { addSampleData };
