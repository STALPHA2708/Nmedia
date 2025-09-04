// Use real SQLite database implementation
console.log("🗄️ Loading real SQLite database configuration");

export { query, get, run, db, close } from "./real-sqlite-database";

// Initialize database with demo data
export async function initializeDatabase() {
  console.log("🔧 Initializing SQLite database...");

  const { run: dbRun, get: dbGet } = await import('./real-sqlite-database');

  try {
    // Create users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        status TEXT NOT NULL DEFAULT 'active',
        permissions TEXT NOT NULL DEFAULT '[]',
        phone TEXT,
        avatar_url TEXT,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create departments table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        budget REAL DEFAULT 0,
        manager_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (manager_id) REFERENCES employees(id)
      )
    `);

    // Create contract_types table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS contract_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        is_permanent INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create employees table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        position TEXT,
        department_id INTEGER,
        salary REAL DEFAULT 0,
        contract_type TEXT,
        hire_date DATE,
        status TEXT DEFAULT 'active',
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        address TEXT,
        notes TEXT,
        avatar_url TEXT,
        contract_start_date DATE,
        contract_end_date DATE,
        contract_file_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id)
      )
    `);

    // Add missing columns to existing employees table if they don't exist
    const addColumnIfNotExists = async (tableName: string, columnName: string, columnType: string) => {
      try {
        await dbRun(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`);
        console.log(`✅ Added column ${columnName} to ${tableName} table`);
      } catch (error) {
        // Column probably already exists, which is fine
        if (error.message.includes('duplicate column name')) {
          console.log(`ℹ️ Column ${columnName} already exists in ${tableName} table`);
        } else {
          console.log(`⚠️ Could not add column ${columnName} to ${tableName}: ${error.message}`);
        }
      }
    };

    // Add missing contract columns if they don't exist
    await addColumnIfNotExists('employees', 'avatar_url', 'TEXT');
    await addColumnIfNotExists('employees', 'contract_start_date', 'DATE');
    await addColumnIfNotExists('employees', 'contract_end_date', 'DATE');
    await addColumnIfNotExists('employees', 'contract_file_name', 'TEXT');

    // Create projects table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        client_name TEXT,
        description TEXT,
        status TEXT DEFAULT 'active',
        priority TEXT DEFAULT 'medium',
        budget REAL DEFAULT 0,
        spent REAL DEFAULT 0,
        start_date DATE,
        deadline DATE,
        progress INTEGER DEFAULT 0,
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

    // Create project_team_members table for many-to-many relationship
    await dbRun(`
      CREATE TABLE IF NOT EXISTS project_team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        employee_id INTEGER NOT NULL,
        role TEXT,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (employee_id) REFERENCES employees(id),
        UNIQUE(project_id, employee_id)
      )
    `);

    // Always check and create missing users
    console.log("🔧 Checking for missing demo accounts...");

    const bcrypt = (await import('bcryptjs')).default;

      const demoAccounts = [
        {
          email: 'admin@nomedia.ma',
          name: 'Admin Principal',
          role: 'admin',
          password: 'admin123',
          permissions: ['all']
        },
        {
          email: 'mohammed@nomedia.ma',
          name: 'Mohammed',
          role: 'admin',
          password: 'mohammed123',
          permissions: ['all']
        },
        {
          email: 'zineb@nomedia.ma',
          name: 'Zineb',
          role: 'manager',
          password: 'zineb123',
          permissions: ['projects', 'employees', 'invoices', 'expenses']
        },
        {
          email: 'karim@nomedia.ma',
          name: 'User',
          role: 'user',
          password: 'karim123',
          permissions: ['projects', 'expenses']
        },
        {
          email: 'invite@nomedia.ma',
          name: 'Invité',
          role: 'guest',
          password: 'invite123',
          permissions: ['projects']
        },
        {
          email: 'david.chen@nomedia.ma',
          name: 'David Chen',
          role: 'manager',
          password: 'manager123',
          permissions: ['projects', 'employees', 'invoices']
        },
        {
          email: 'alice.martin@nomedia.ma',
          name: 'Alice Martin',
          role: 'user',
          password: 'user123',
          permissions: ['projects', 'expenses']
        }
      ];

      for (const account of demoAccounts) {
        try {
          // Check if this specific user already exists
          const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [account.email]);

          if (existingUser) {
            console.log(`⚠️  User ${account.email} already exists, skipping...`);
            continue;
          }

          const hashedPassword = await bcrypt.hash(account.password, 10);

          await dbRun(`
            INSERT INTO users (email, password_hash, name, role, status, permissions, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            account.email,
            hashedPassword,
            account.name,
            account.role,
            'active',
            JSON.stringify(account.permissions)
          ]);

          console.log(`✅ Created demo account: ${account.email}`);
        } catch (error) {
          console.error(`❌ Error creating user ${account.email}:`, error.message);
        }
      }

    // Create demo departments if they don't exist
    const departmentCount = await dbGet('SELECT COUNT(*) as count FROM departments');
    if (departmentCount.count === 0) {
      console.log("🔧 Creating demo departments...");

      const departments = [
        { name: 'Production', description: 'Équipe de production audiovisuelle', budget: 100000 },
        { name: 'Post-Production', description: 'Montage et finalisation des projets', budget: 50000 },
        { name: 'Administratif', description: 'Gestion administrative et commerciale', budget: 30000 },
        { name: 'Technique', description: 'Support technique et équipements', budget: 75000 }
      ];

      for (const dept of departments) {
        await dbRun(`
          INSERT INTO departments (name, description, budget, created_at, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [dept.name, dept.description, dept.budget]);
        console.log(`✅ Created department: ${dept.name}`);
      }
    }

    // Create demo contract types if they don't exist
    const contractTypeCount = await dbGet('SELECT COUNT(*) as count FROM contract_types');
    if (contractTypeCount.count === 0) {
      console.log("🔧 Creating demo contract types...");

      const contractTypes = [
        { name: 'CDI', description: 'Contrat à Durée Indéterminée', is_permanent: 1 },
        { name: 'CDD', description: 'Contrat à Durée Déterminée', is_permanent: 0 },
        { name: 'Stage', description: 'Contrat de Stage', is_permanent: 0 },
        { name: 'Freelance', description: 'Contrat Freelance/Indépendant', is_permanent: 0 },
        { name: 'Consultant', description: 'Contrat de Consultation', is_permanent: 0 }
      ];

      for (const ct of contractTypes) {
        await dbRun(`
          INSERT INTO contract_types (name, description, is_permanent, created_at, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [ct.name, ct.description, ct.is_permanent]);
        console.log(`✅ Created contract type: ${ct.name}`);
      }
    }

    // Create demo employees if they don't exist
    const employeeCount = await dbGet('SELECT COUNT(*) as count FROM employees');
    if (employeeCount.count === 0) {
      console.log("🔧 Creating demo employees...");

      const employees = [
        {
          first_name: 'Admin',
          last_name: 'Principal',
          email: 'admin@nomedia.ma',
          phone: '+212 6 12 34 56 78',
          position: 'Directeur Général',
          department_id: 3,
          salary: 80000,
          contract_type: 'CDI',
          hire_date: '2023-01-01',
          status: 'active'
        },
        {
          first_name: 'David',
          last_name: 'Chen',
          email: 'david.chen@nomedia.ma',
          phone: '+212 6 23 45 67 89',
          position: 'Chef de Production',
          department_id: 1,
          salary: 60000,
          contract_type: 'CDI',
          hire_date: '2023-02-01',
          status: 'active'
        },
        {
          first_name: 'Alice',
          last_name: 'Martin',
          email: 'alice.martin@nomedia.ma',
          phone: '+212 6 34 56 78 90',
          position: 'Monteur Vidéo',
          department_id: 2,
          salary: 45000,
          contract_type: 'CDI',
          hire_date: '2023-03-01',
          status: 'active'
        }
      ];

      for (const emp of employees) {
        await dbRun(`
          INSERT INTO employees (
            first_name, last_name, email, phone, position, department_id,
            salary, contract_type, hire_date, status, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          emp.first_name, emp.last_name, emp.email, emp.phone, emp.position,
          emp.department_id, emp.salary, emp.contract_type, emp.hire_date, emp.status
        ]);
        console.log(`✅ Created employee: ${emp.first_name} ${emp.last_name}`);
      }
    }

    // Create demo projects if they don't exist
    const projectCount = await dbGet('SELECT COUNT(*) as count FROM projects');
    if (projectCount.count === 0) {
      console.log("🔧 Creating demo projects...");

      const projects = [
        {
          name: 'Campagne Publicitaire Marrakech Events',
          client_name: 'Marrakech Events',
          description: 'Production d\'un spot publicitaire pour la promotion des événements culturels de Marrakech',
          status: 'active',
          priority: 'high',
          budget: 25000,
          spent: 15000,
          start_date: '2024-01-15',
          deadline: '2024-03-01',
          progress: 60,
          project_type: 'Publicité',
          deliverables: 'Spot TV 30s, Version web, Making-of',
          client_contact_name: 'Youssef Benali',
          client_contact_email: 'y.benali@marrakechevents.ma',
          client_contact_phone: '+212 5 24 12 34 56'
        },
        {
          name: 'Documentaire "Atlas Stories"',
          client_name: 'Morocco Discovery',
          description: 'Documentaire sur les traditions berbères dans l\'Atlas marocain',
          status: 'planning',
          priority: 'medium',
          budget: 40000,
          spent: 5000,
          start_date: '2024-02-01',
          deadline: '2024-06-15',
          progress: 15,
          project_type: 'Documentaire',
          deliverables: 'Documentaire 52min, Bande-annonce, Dossier de presse',
          client_contact_name: 'Sophie Dubois',
          client_contact_email: 's.dubois@moroccodiscovery.com',
          client_contact_phone: '+33 1 45 67 89 10'
        }
      ];

      for (const proj of projects) {
        await dbRun(`
          INSERT INTO projects (
            name, client_name, description, status, priority, budget, spent,
            start_date, deadline, progress, project_type, deliverables,
            client_contact_name, client_contact_email, client_contact_phone,
            created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          proj.name, proj.client_name, proj.description, proj.status, proj.priority,
          proj.budget, proj.spent, proj.start_date, proj.deadline, proj.progress,
          proj.project_type, proj.deliverables, proj.client_contact_name,
          proj.client_contact_email, proj.client_contact_phone
        ]);
        console.log(`✅ Created project: ${proj.name}`);
      }
    }

    console.log("✅ SQLite database initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize SQLite database:", error);
    throw error;
  }
}
