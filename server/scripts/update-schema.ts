import { db, run, query, get } from '../config/sqlite-database';

console.log('🚀 Starting Nomedia Production Database Schema Update...');

// Function to check if table exists
function tableExists(tableName: string): boolean {
  const result = get(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name=?
  `, [tableName]);
  return !!result;
}

// Function to check if column exists
function columnExists(tableName: string, columnName: string): boolean {
  const columns = query(`PRAGMA table_info(${tableName})`);
  return columns.some((col: any) => col.name === columnName);
}

// Function to check if index exists
function indexExists(indexName: string): boolean {
  const result = get(`
    SELECT name FROM sqlite_master 
    WHERE type='index' AND name=?
  `, [indexName]);
  return !!result;
}

try {
  console.log('📋 Checking and updating database schema...');

  // 1. Create or update departments table
  if (!tableExists('departments')) {
    console.log('📁 Creating departments table...');
    run(`
      CREATE TABLE departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        manager_id INTEGER,
        budget DECIMAL(10,2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
      )
    `);

    // Insert default departments
    const defaultDepartments = [
      ['Production', 'Équipe de production audiovisuelle', null, 100000],
      ['Post-Production', 'Équipe de montage et post-production', null, 80000],
      ['Administration', 'Équipe administrative et finances', null, 50000],
      ['Commercial', 'Équipe commerciale et développement', null, 60000],
      ['Technique', 'Équipe technique et maintenance', null, 40000]
    ];

    for (const dept of defaultDepartments) {
      run(`
        INSERT INTO departments (name, description, manager_id, budget)
        VALUES (?, ?, ?, ?)
      `, dept);
    }
    console.log('✅ Departments table created with default data');
  }

  // 2. Create or update contract_types table
  if (!tableExists('contract_types')) {
    console.log('📄 Creating contract_types table...');
    run(`
      CREATE TABLE contract_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        duration_months INTEGER,
        is_renewable BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default contract types
    const defaultContractTypes = [
      ['CDI', 'Contrat à Durée Indéterminée', null, 1],
      ['CDD', 'Contrat à Durée Déterminée', 12, 1],
      ['Freelance', 'Contrat Freelance', 6, 1],
      ['Stage', 'Convention de Stage', 6, 0],
      ['Consultant', 'Contrat de Consultation', 3, 1]
    ];

    for (const contract of defaultContractTypes) {
      run(`
        INSERT INTO contract_types (name, description, duration_months, is_renewable)
        VALUES (?, ?, ?, ?)
      `, contract);
    }
    console.log('✅ Contract types table created with default data');
  }

  // 3. Create or update employees table
  if (!tableExists('employees')) {
    console.log('👥 Creating employees table...');
    run(`
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        address TEXT,
        position TEXT NOT NULL,
        department_id INTEGER,
        salary DECIMAL(10,2) NOT NULL,
        hire_date DATE NOT NULL,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
        avatar_url TEXT,
        contract_type TEXT,
        contract_start_date DATE,
        contract_end_date DATE,
        contract_file_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Employees table created');
  } else {
    // Add missing columns if they don't exist
    if (!columnExists('employees', 'contract_type')) {
      run(`ALTER TABLE employees ADD COLUMN contract_type TEXT`);
      console.log('✅ Added contract_type column to employees');
    }
    if (!columnExists('employees', 'contract_start_date')) {
      run(`ALTER TABLE employees ADD COLUMN contract_start_date DATE`);
      console.log('✅ Added contract_start_date column to employees');
    }
    if (!columnExists('employees', 'contract_end_date')) {
      run(`ALTER TABLE employees ADD COLUMN contract_end_date DATE`);
      console.log('✅ Added contract_end_date column to employees');
    }
    if (!columnExists('employees', 'contract_file_name')) {
      run(`ALTER TABLE employees ADD COLUMN contract_file_name TEXT`);
      console.log('✅ Added contract_file_name column to employees');
    }
  }

  // 4. Create or update projects table
  if (!tableExists('projects')) {
    console.log('🎬 Creating projects table...');
    run(`
      CREATE TABLE projects (
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
        project_type TEXT DEFAULT 'production',
        deliverables TEXT, -- JSON array of deliverables
        notes TEXT,
        client_contact_name TEXT,
        client_contact_email TEXT,
        client_contact_phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Projects table created');
  } else {
    // Add missing columns if they don't exist
    if (!columnExists('projects', 'project_type')) {
      run(`ALTER TABLE projects ADD COLUMN project_type TEXT DEFAULT 'production'`);
      console.log('✅ Added project_type column to projects');
    }
    if (!columnExists('projects', 'deliverables')) {
      run(`ALTER TABLE projects ADD COLUMN deliverables TEXT`);
      console.log('✅ Added deliverables column to projects');
    }
    if (!columnExists('projects', 'notes')) {
      run(`ALTER TABLE projects ADD COLUMN notes TEXT`);
      console.log('✅ Added notes column to projects');
    }
  }

  // 5. Create project_team_members table (for future employee assignment)
  if (!tableExists('project_team_members')) {
    console.log('👷 Creating project_team_members table...');
    run(`
      CREATE TABLE project_team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        employee_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        hourly_rate DECIMAL(8,2),
        start_date DATE,
        end_date DATE,
        contract_status TEXT DEFAULT 'pending' CHECK (contract_status IN ('pending', 'uploaded', 'verified')),
        contract_file_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        UNIQUE(project_id, employee_id)
      )
    `);
    console.log('✅ Project team members table created');
  }

  // 6. Create expenses table
  if (!tableExists('expenses')) {
    console.log('💰 Creating expenses table...');
    run(`
      CREATE TABLE expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        employee_id INTEGER,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        expense_date DATE NOT NULL,
        receipt_file_name TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        approved_by INTEGER,
        approved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
        FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Expenses table created');
  }

  // 7. Create invoices table
  if (!tableExists('invoices')) {
    console.log('🧾 Creating invoices table...');
    run(`
      CREATE TABLE invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        project_id INTEGER,
        client_name TEXT NOT NULL,
        client_email TEXT,
        client_address TEXT,
        amount DECIMAL(12,2) NOT NULL,
        tax_amount DECIMAL(12,2) DEFAULT 0,
        total_amount DECIMAL(12,2) NOT NULL,
        invoice_date DATE NOT NULL,
        due_date DATE NOT NULL,
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
        payment_date DATE,
        items TEXT, -- JSON array of invoice items
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Invoices table created');
  }

  // 8. Create users table for authentication
  if (!tableExists('users')) {
    console.log('🔐 Creating users table...');
    run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
        is_active BOOLEAN DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create demo accounts with correct schema
    const bcrypt = require('bcrypt');

    const demoAccounts = [
      {
        email: 'admin@nomedia.ma',
        name: 'Admin Principal',
        role: 'admin',
        password: 'admin123'
      },
      {
        email: 'david.chen@nomedia.ma',
        name: 'David Chen',
        role: 'manager',
        password: 'manager123'
      },
      {
        email: 'alice.martin@nomedia.ma',
        name: 'Alice Martin',
        role: 'user',
        password: 'user123'
      },
      {
        email: 'test@test.com',
        name: 'Test User',
        role: 'user',
        password: 'password'
      }
    ];

    for (const account of demoAccounts) {
      const hashedPassword = bcrypt.hashSync(account.password, 10);

      // Check if user already exists
      const existing = get('SELECT id FROM users WHERE email = ?', [account.email]);

      if (!existing) {
        run(`
          INSERT INTO users (email, password_hash, name, role, status, permissions, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [account.email, hashedPassword, account.name, account.role, 'active', JSON.stringify([])]);

        console.log(`✅ Created demo user: ${account.name} (${account.email})`);
      } else {
        // Update existing user with correct password
        run(`
          UPDATE users SET password_hash = ?, name = ?, role = ?, status = 'active'
          WHERE email = ?
        `, [hashedPassword, account.name, account.role, account.email]);

        console.log(`🔄 Updated demo user: ${account.name} (${account.email})`);
      }
    }

    console.log('✅ Users table created with demo accounts');
    console.log('🔑 Demo logins:');
    console.log('   👑 Admin: admin@nomedia.ma / admin123');
    console.log('   👔 Manager: david.chen@nomedia.ma / manager123');
    console.log('   👤 User: alice.martin@nomedia.ma / user123');
    console.log('   🧪 Test: test@test.com / password');
  }

  // 9. Create database indexes for performance
  console.log('🔍 Creating database indexes...');
  
  const indexes = [
    ['idx_employees_email', 'CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email)'],
    ['idx_employees_department', 'CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id)'],
    ['idx_projects_client', 'CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_name)'],
    ['idx_projects_status', 'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)'],
    ['idx_project_team_project', 'CREATE INDEX IF NOT EXISTS idx_project_team_project ON project_team_members(project_id)'],
    ['idx_project_team_employee', 'CREATE INDEX IF NOT EXISTS idx_project_team_employee ON project_team_members(employee_id)'],
    ['idx_expenses_project', 'CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id)'],
    ['idx_expenses_employee', 'CREATE INDEX IF NOT EXISTS idx_expenses_employee ON expenses(employee_id)'],
    ['idx_invoices_project', 'CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id)'],
    ['idx_invoices_status', 'CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)']
  ];

  for (const [indexName, sql] of indexes) {
    if (!indexExists(indexName)) {
      run(sql);
      console.log(`✅ Created index: ${indexName}`);
    }
  }

  // 10. Create triggers for automatic timestamp updates
  console.log('⚡ Creating database triggers...');
  
  const triggers = [
    `CREATE TRIGGER IF NOT EXISTS update_employees_timestamp 
     AFTER UPDATE ON employees 
     BEGIN 
       UPDATE employees SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
     END`,
    `CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
     AFTER UPDATE ON projects 
     BEGIN 
       UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
     END`,
    `CREATE TRIGGER IF NOT EXISTS update_project_team_timestamp 
     AFTER UPDATE ON project_team_members 
     BEGIN 
       UPDATE project_team_members SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
     END`,
    `CREATE TRIGGER IF NOT EXISTS update_expenses_timestamp 
     AFTER UPDATE ON expenses 
     BEGIN 
       UPDATE expenses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
     END`,
    `CREATE TRIGGER IF NOT EXISTS update_invoices_timestamp 
     AFTER UPDATE ON invoices 
     BEGIN 
       UPDATE invoices SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
     END`
  ];

  for (const trigger of triggers) {
    run(trigger);
  }
  console.log('✅ Database triggers created');

  // 11. Validate existing data and fix inconsistencies
  console.log('🔧 Validating and fixing data inconsistencies...');

  // Update any NULL statuses in employees
  run(`UPDATE employees SET status = 'active' WHERE status IS NULL`);
  
  // Update any NULL statuses in projects
  run(`UPDATE projects SET status = 'pre_production' WHERE status IS NULL`);
  run(`UPDATE projects SET priority = 'medium' WHERE priority IS NULL`);
  run(`UPDATE projects SET progress = 0 WHERE progress IS NULL`);
  run(`UPDATE projects SET spent = 0 WHERE spent IS NULL`);

  console.log('✅ Data validation completed');

  // 12. Display database statistics
  console.log('\n📊 Database Statistics:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━��━━━━━━━━━━━━━━');
  
  const stats = [
    ['👥 Employees', get(`SELECT COUNT(*) as count FROM employees`)?.count || 0],
    ['🏢 Departments', get(`SELECT COUNT(*) as count FROM departments`)?.count || 0],
    ['📄 Contract Types', get(`SELECT COUNT(*) as count FROM contract_types`)?.count || 0],
    ['🎬 Projects', get(`SELECT COUNT(*) as count FROM projects`)?.count || 0],
    ['👷 Team Assignments', get(`SELECT COUNT(*) as count FROM project_team_members`)?.count || 0],
    ['💰 Expenses', get(`SELECT COUNT(*) as count FROM expenses`)?.count || 0],
    ['🧾 Invoices', get(`SELECT COUNT(*) as count FROM invoices`)?.count || 0],
    ['🔐 Users', get(`SELECT COUNT(*) as count FROM users`)?.count || 0]
  ];

  for (const [label, count] of stats) {
    console.log(`${label}: ${count}`);
  }

  console.log('\n🎉 Database schema update completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━���━━━━━━━━━━━');
  console.log('✅ System is now ready for daily usage');
  console.log('🔑 Admin login: admin@nomedia.ma / admin123');
  console.log('🚀 Start the server and begin using Nomedia Production!');

} catch (error) {
  console.error('❌ Error updating database schema:', error);
  process.exit(1);
}
