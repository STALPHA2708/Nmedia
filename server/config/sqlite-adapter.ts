import sqlite3 from 'sqlite3';
import { join } from 'path';
import { DatabaseAdapter, DatabaseConfig, DatabaseType, DatabaseResult } from './database-interface';

export class SQLiteAdapter implements DatabaseAdapter {
  private db: sqlite3.Database;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.initializeDatabase();
  }

  private initializeDatabase() {
    const dbPath = this.config.path || join(process.cwd(), 'nomedia.db');
    
    console.log('🗄️ Connecting to SQLite database:', dbPath);

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening SQLite database:', err.message);
        throw err;
      } else {
        console.log('✅ Connected to SQLite database');
        // Enable foreign key constraints
        this.db.run('PRAGMA foreign_keys = ON');
      }
    });
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      console.log('🔍 SQLite Query:', sql.substring(0, 100) + '...', params);
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('❌ SQLite query error:', err);
          reject(err);
        } else {
          console.log('✅ Query returned', rows?.length || 0, 'rows');
          resolve(rows || []);
        }
      });
    });
  }

  async run(sql: string, params: any[] = []): Promise<DatabaseResult> {
    return new Promise((resolve, reject) => {
      console.log('🔧 SQLite Run:', sql.substring(0, 100) + '...', params);
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('❌ SQLite run error:', err);
          reject(err);
        } else {
          console.log('✅ Query affected', this.changes, 'rows, lastID:', this.lastID);
          resolve({
            lastInsertRowid: this.lastID,
            changes: this.changes,
            rowCount: this.changes,
            rows: []
          });
        }
      });
    });
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('🔍 SQLite Get:', sql.substring(0, 100) + '...', params);
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('❌ SQLite get error:', err);
          reject(err);
        } else {
          console.log('✅ Get returned:', row ? 'row found' : 'no row');
          resolve(row);
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          console.error('❌ Error closing SQLite database:', err);
          reject(err);
        } else {
          console.log('✅ SQLite database connection closed');
          resolve();
        }
      });
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health');
      return result[0]?.health === 1;
    } catch (error) {
      console.error('SQLite health check failed:', error);
      return false;
    }
  }

  getDatabaseType(): DatabaseType {
    return DatabaseType.SQLITE;
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🔧 Initializing SQLite database...');
      
      await this.createTables();
      await this.initializeDemoData();
      
      console.log('✅ SQLite database initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ SQLite initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
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
      )`,

      // Departments table
      `CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        budget REAL DEFAULT 0,
        manager_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (manager_id) REFERENCES employees(id)
      )`,

      // Contract types table
      `CREATE TABLE IF NOT EXISTS contract_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        is_permanent INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Employees table
      `CREATE TABLE IF NOT EXISTS employees (
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
      )`,

      // Projects table
      `CREATE TABLE IF NOT EXISTS projects (
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
      )`,

      // Project team members table
      `CREATE TABLE IF NOT EXISTS project_team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        employee_id INTEGER NOT NULL,
        role TEXT,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (employee_id) REFERENCES employees(id),
        UNIQUE(project_id, employee_id)
      )`,

      // Expenses table
      `CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT,
        date DATE NOT NULL,
        project_id INTEGER,
        employee_id INTEGER,
        receipt_url TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (employee_id) REFERENCES employees(id)
      )`,

      // Invoices table
      `CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        client_name TEXT NOT NULL,
        client_email TEXT,
        project_id INTEGER,
        amount REAL NOT NULL,
        tax_amount REAL DEFAULT 0,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'draft',
        due_date DATE,
        issue_date DATE NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )`
    ];

    for (const tableSQL of tables) {
      await this.run(tableSQL);
    }
  }

  private async initializeDemoData(): Promise<void> {
    // Check if demo data already exists
    const userCount = await this.get('SELECT COUNT(*) as count FROM users');
    if (userCount?.count > 0) {
      console.log('Demo data already exists, skipping initialization');
      return;
    }

    console.log('Creating demo data...');
    
    // Create demo admin user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash('admin123', 10);
    
    await this.run(`
      INSERT INTO users (email, password_hash, name, role, status, permissions)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'admin@nomedia.ma',
      hashedPassword,
      'Admin Principal',
      'admin',
      'active',
      JSON.stringify(['all'])
    ]);

    // Create additional demo users
    const demoUsers = [
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
        name: 'Karim',
        role: 'user',
        password: 'karim123',
        permissions: ['projects', 'expenses']
      }
    ];

    for (const user of demoUsers) {
      const userHashedPassword = await bcrypt.default.hash(user.password, 10);
      await this.run(`
        INSERT INTO users (email, password_hash, name, role, status, permissions)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        user.email,
        userHashedPassword,
        user.name,
        user.role,
        'active',
        JSON.stringify(user.permissions)
      ]);
    }

    // Create demo departments
    const departments = [
      { name: 'Production', description: 'Équipe de production audiovisuelle', budget: 100000 },
      { name: 'Post-Production', description: 'Montage et finalisation des projets', budget: 50000 },
      { name: 'Administratif', description: 'Gestion administrative et commerciale', budget: 30000 },
      { name: 'Technique', description: 'Support technique et équipements', budget: 75000 }
    ];

    for (const dept of departments) {
      await this.run(`
        INSERT INTO departments (name, description, budget)
        VALUES (?, ?, ?)
      `, [dept.name, dept.description, dept.budget]);
    }

    // Create demo contract types
    const contractTypes = [
      { name: 'CDI', description: 'Contrat à Durée Indéterminée', is_permanent: 1 },
      { name: 'CDD', description: 'Contrat à Durée Déterminée', is_permanent: 0 },
      { name: 'Stage', description: 'Contrat de Stage', is_permanent: 0 },
      { name: 'Freelance', description: 'Contrat Freelance/Indépendant', is_permanent: 0 }
    ];

    for (const ct of contractTypes) {
      await this.run(`
        INSERT INTO contract_types (name, description, is_permanent)
        VALUES (?, ?, ?)
      `, [ct.name, ct.description, ct.is_permanent]);
    }

    // Create demo projects
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
        project_type: 'Publicité'
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
        project_type: 'Documentaire'
      }
    ];

    for (const proj of projects) {
      await this.run(`
        INSERT INTO projects (
          name, client_name, description, status, priority, budget, spent,
          start_date, deadline, progress, project_type
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        proj.name, proj.client_name, proj.description, proj.status, proj.priority,
        proj.budget, proj.spent, proj.start_date, proj.deadline, proj.progress,
        proj.project_type
      ]);
    }

    console.log('✅ SQLite demo data created successfully');
  }

  // Transaction support using SQLite transactions
  async transaction<T>(callback: (adapter: SQLiteAdapter) => Promise<T>): Promise<T> {
    await this.run('BEGIN TRANSACTION');
    try {
      console.log('🔄 SQLite transaction started');
      const result = await callback(this);
      await this.run('COMMIT');
      console.log('✅ SQLite transaction committed');
      return result;
    } catch (error) {
      await this.run('ROLLBACK');
      console.error('❌ SQLite transaction rolled back:', error);
      throw error;
    }
  }
}
