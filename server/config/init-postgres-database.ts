import { query, run, get } from "./postgres-database";

export async function initializePostgreSQLDatabase() {
  try {
    console.log("🔧 Initializing PostgreSQL database schema...");

    // Test connection first
    await run("SELECT 1");
    console.log("✅ PostgreSQL connection successful");

    // Create users table first (needed for authentication)
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        phone VARCHAR(50),
        avatar_url TEXT,
        last_login TIMESTAMP,
        permissions JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create departments table
    await run(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create contract types table
    await run(`
      CREATE TABLE IF NOT EXISTS contract_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        is_permanent BOOLEAN DEFAULT FALSE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create employees table with all necessary columns
    await run(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50),
        address TEXT,
        position VARCHAR(255),
        department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
        salary DECIMAL(10,2),
        hire_date DATE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
        avatar_url TEXT,
        contract_type VARCHAR(100),
        contract_start_date DATE,
        contract_end_date DATE,
        contract_file_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create projects table
    await run(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pre_production' CHECK (status IN ('pre_production', 'production', 'post_production', 'completed')),
        priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        budget DECIMAL(12,2) DEFAULT 0,
        spent DECIMAL(12,2) DEFAULT 0,
        start_date DATE,
        deadline DATE,
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        project_type VARCHAR(100),
        deliverables JSONB DEFAULT '[]',
        notes TEXT,
        client_contact_name VARCHAR(255),
        client_contact_email VARCHAR(255),
        client_contact_phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create project team members table
    await run(`
      CREATE TABLE IF NOT EXISTS project_team_members (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        role VARCHAR(100),
        start_date DATE,
        end_date DATE,
        hourly_rate DECIMAL(8,2),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, employee_id)
      )
    `);

    // Create expenses table
    await run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        expense_date DATE NOT NULL,
        receipt_url TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create invoices table
    await run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(100) NOT NULL UNIQUE,
        client VARCHAR(255) NOT NULL,
        client_ice VARCHAR(100),
        project VARCHAR(255) NOT NULL,
        project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'overdue')),
        profit_margin DECIMAL(5,2),
        estimated_costs DECIMAL(12,2),
        team_members JSONB DEFAULT '[]',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create invoice items table
    await run(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        total DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await run(`
      CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_name);
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id);
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_expenses_employee ON expenses(employee_id);
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);
    `);

    console.log("✓ Database tables and indexes created/verified");

    // Insert default departments
    const departments = [
      ["Production", "Équipe de production audiovisuelle"],
      ["Technique", "Équipe technique et matériel"],
      ["Post-Production", "Montage et finalisation"],
      ["Direction", "Direction et management"],
      ["Administration", "Administration et RH"],
      ["Marketing", "Marketing et communication"],
      ["Commercial", "Équipe commerciale"],
    ];

    for (const [name, description] of departments) {
      await run(
        "INSERT INTO departments (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING",
        [name, description],
      );
    }

    // Insert default contract types
    const contractTypes = [
      ["CDI", true, "Contrat à Durée Indéterminée"],
      ["CDD", false, "Contrat à Durée Déterminée"],
      ["Freelance", false, "Travailleur indépendant"],
      ["Stage", false, "Stage étudiant"],
      ["Interim", false, "Contrat intérimaire"],
      ["Consultant", false, "Consultant externe"],
      ["Apprentissage", false, "Contrat d'apprentissage"],
    ];

    for (const [name, is_permanent, description] of contractTypes) {
      await run(
        "INSERT INTO contract_types (name, is_permanent, description) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING",
        [name, is_permanent, description],
      );
    }

    console.log("✓ Default data inserted");

    // Verify setup
    const deptCount = await get("SELECT COUNT(*) as count FROM departments");
    const contractCount = await get(
      "SELECT COUNT(*) as count FROM contract_types",
    );

    console.log(
      `✅ PostgreSQL database initialized - ${deptCount.count} departments, ${contractCount.count} contract types`,
    );

    // No demo users - real database only

    return true;
  } catch (error) {
    console.error("❌ PostgreSQL database initialization failed:", error);
    throw error;
  }
}
