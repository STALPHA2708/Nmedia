const { run, query, get, close } = require('./server/config/sqlite-database');

async function initializeSQLiteDatabase() {
  try {
    console.log('🔧 Initializing SQLite database...\n');

    // Create departments table
    await run(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Departments table created/verified');

    // Create contract types table
    await run(`
      CREATE TABLE IF NOT EXISTS contract_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        is_permanent INTEGER DEFAULT 0,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Contract types table created/verified');

    // Create employees table with contract fields
    await run(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        address TEXT,
        position TEXT,
        department_id INTEGER REFERENCES departments(id),
        salary REAL,
        hire_date DATE,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
        avatar_url TEXT,
        contract_type TEXT,
        contract_start_date DATE,
        contract_end_date DATE,
        contract_file_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Employees table created/verified');

    // Create projects table
    await run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        client_name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pre_production' CHECK (status IN ('pre_production', 'production', 'post_production', 'completed')),
        priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        budget REAL DEFAULT 0,
        spent REAL DEFAULT 0,
        start_date DATE,
        deadline DATE,
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        project_type TEXT,
        deliverables TEXT DEFAULT '[]',
        notes TEXT,
        client_contact_name TEXT,
        client_contact_email TEXT,
        client_contact_phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Projects table created/verified');

    // Create project team members table
    await run(`
      CREATE TABLE IF NOT EXISTS project_team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        role TEXT,
        start_date DATE,
        end_date DATE,
        hourly_rate REAL,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Project team members table created/verified');

    // Create expenses table
    await run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER REFERENCES projects(id),
        employee_id INTEGER REFERENCES employees(id),
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        expense_date DATE NOT NULL,
        receipt_url TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Expenses table created/verified');

    // Create invoices table
    await run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT NOT NULL UNIQUE,
        client TEXT NOT NULL,
        client_ice TEXT,
        project TEXT NOT NULL,
        project_id INTEGER REFERENCES projects(id),
        amount REAL NOT NULL DEFAULT 0,
        tax_amount REAL NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL DEFAULT 0,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'overdue')),
        profit_margin REAL,
        estimated_costs REAL,
        team_members TEXT DEFAULT '[]',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Invoices table created/verified');

    // Create invoice items table
    await run(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        unit_price REAL NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        total REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Invoice items table created/verified');

    // Create users table for authentication
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        first_name TEXT,
        last_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created/verified');

    // Insert default departments
    console.log('\n📁 Creating default departments...');
    const departments = [
      ['Production', 'Équipe de production audiovisuelle'],
      ['Technique', 'Équipe technique et matériel'],
      ['Post-Production', 'Montage et finalisation'],
      ['Direction', 'Direction et management'],
      ['Administration', 'Administration et RH'],
      ['Marketing', 'Marketing et communication'],
      ['Commercial', 'Équipe commerciale']
    ];

    for (const [name, description] of departments) {
      try {
        await run(
          'INSERT OR IGNORE INTO departments (name, description) VALUES (?, ?)',
          [name, description]
        );
        console.log(`✓ Department: ${name}`);
      } catch (err) {
        console.log(`- Department already exists: ${name}`);
      }
    }

    // Insert default contract types
    console.log('\n📝 Creating default contract types...');
    const contractTypes = [
      ['CDI', 1, 'Contrat à Durée Indéterminée'],
      ['CDD', 0, 'Contrat à Durée Déterminée'],
      ['Freelance', 0, 'Travailleur indépendant'],
      ['Stage', 0, 'Stage étudiant'],
      ['Interim', 0, 'Contrat intérimaire'],
      ['Consultant', 0, 'Consultant externe'],
      ['Apprentissage', 0, 'Contrat d\'apprentissage']
    ];

    for (const [name, is_permanent, description] of contractTypes) {
      try {
        await run(
          'INSERT OR IGNORE INTO contract_types (name, is_permanent, description) VALUES (?, ?, ?)',
          [name, is_permanent, description]
        );
        console.log(`✓ Contract type: ${name}`);
      } catch (err) {
        console.log(`- Contract type already exists: ${name}`);
      }
    }

    // Verify setup
    console.log('\n📊 Verifying database setup...');
    const deptCount = await get('SELECT COUNT(*) as count FROM departments');
    const contractCount = await get('SELECT COUNT(*) as count FROM contract_types');
    const empCount = await get('SELECT COUNT(*) as count FROM employees');
    const projCount = await get('SELECT COUNT(*) as count FROM projects');

    console.log(`✓ Departments: ${deptCount.count}`);
    console.log(`✓ Contract types: ${contractCount.count}`);
    console.log(`✓ Employees: ${empCount.count}`);
    console.log(`✓ Projects: ${projCount.count}`);

    console.log('\n✅ SQLite database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Error initializing SQLite database:', error);
    throw error;
  } finally {
    // Don't close the database connection here as it might be used elsewhere
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeSQLiteDatabase()
    .then(() => {
      console.log('\n🎉 Database ready for use!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeSQLiteDatabase };
