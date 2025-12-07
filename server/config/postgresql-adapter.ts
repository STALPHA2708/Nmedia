import { Pool, PoolClient, QueryResult } from "pg";
import { DatabaseAdapter, DatabaseConfig, DatabaseType, DatabaseResult } from './database-interface';
import { sqlDialect } from './sql-dialect';

export class PostgreSQLAdapter implements DatabaseAdapter {
  private pool: Pool;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.initializePool();
  }

  private initializePool() {
    // Use connection string if provided (for services like Hostinger)
    if (this.config.connectionString) {
      this.pool = new Pool({
        connectionString: this.config.connectionString,
        ssl: this.config.ssl || (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    } else {
      // Use individual connection parameters
      this.pool = new Pool({
        host: this.config.host || 'localhost',
        port: this.config.port || 5432,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        ssl: this.config.ssl || (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    }

    // Handle pool events
    this.pool.on('error', (err) => {
      console.error('🚨 PostgreSQL pool error:', err);
    });

    this.pool.on('connect', () => {
      console.log('🔗 New PostgreSQL client connected');
    });

    console.log('🗄️ PostgreSQL adapter initialized');
    console.log(`📊 Database: ${this.config.database}@${this.config.host}:${this.config.port}`);
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      // Convert SQL if needed (from SQLite to PostgreSQL)
      const convertedSql = sqlDialect.convertParameterPlaceholders(sql, DatabaseType.SQLITE, DatabaseType.POSTGRESQL);
      
      console.log('🔍 PostgreSQL Query:', convertedSql.substring(0, 100) + '...', params);
      const result: QueryResult = await client.query(convertedSql, params);
      console.log('✅ Query returned', result.rows?.length || 0, 'rows');
      return result.rows || [];
    } catch (error) {
      console.error('❌ PostgreSQL query error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async run(sql: string, params: any[] = []): Promise<DatabaseResult> {
    const client = await this.pool.connect();
    try {
      // Convert SQL if needed (from SQLite to PostgreSQL)
      const convertedSql = sqlDialect.convertParameterPlaceholders(sql, DatabaseType.SQLITE, DatabaseType.POSTGRESQL);
      
      console.log('🔧 PostgreSQL Run:', convertedSql.substring(0, 100) + '...', params);
      
      // For INSERT operations, try to get the inserted ID
      let finalSql = convertedSql;
      if (convertedSql.trim().toUpperCase().startsWith('INSERT')) {
        // Add RETURNING id if not already present
        if (!convertedSql.toUpperCase().includes('RETURNING')) {
          finalSql = convertedSql + ' RETURNING id';
        }
      }
      
      const result: QueryResult = await client.query(finalSql, params);
      console.log('✅ Query affected', result.rowCount, 'rows');
      
      return {
        rowCount: result.rowCount || 0,
        changes: result.rowCount || 0, // SQLite compatibility
        rows: result.rows,
        lastInsertRowid: result.rows[0]?.id || null
      };
    } catch (error) {
      console.error('❌ PostgreSQL run error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const client = await this.pool.connect();
    try {
      // Convert SQL if needed (from SQLite to PostgreSQL)
      const convertedSql = sqlDialect.convertParameterPlaceholders(sql, DatabaseType.SQLITE, DatabaseType.POSTGRESQL);
      
      console.log('🔍 PostgreSQL Get:', convertedSql.substring(0, 100) + '...', params);
      const result: QueryResult = await client.query(convertedSql, params);
      const row = result.rows[0] || null;
      console.log('✅ Get returned:', row ? 'row found' : 'no row');
      return row;
    } catch (error) {
      console.error('❌ PostgreSQL get error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    console.log('✅ PostgreSQL adapter connection pool closed');
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health');
      return result[0]?.health === 1;
    } catch (error) {
      console.error('PostgreSQL health check failed:', error);
      return false;
    }
  }

  getDatabaseType(): DatabaseType {
    return DatabaseType.POSTGRESQL;
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🔧 Initializing PostgreSQL database schema...');

      // Drop and recreate tables with correct schema (for fresh deployments)
      await this.migrateTablesIfNeeded();
      await this.createTables();
      await this.createIndexes();
      await this.initializeDemoData();

      console.log('✅ PostgreSQL database initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ PostgreSQL initialization failed:', error);
      throw error;
    }
  }

  private async migrateTablesIfNeeded(): Promise<void> {
    try {
      // Check if expenses table has old schema (date column instead of expense_date)
      const expensesCheck = await this.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'expenses' AND column_name = 'date'
      `);

      if (expensesCheck.length > 0) {
        console.log('🔄 Migrating expenses table to new schema...');
        // Drop and recreate expenses table (safe for test deployment)
        await this.run('DROP TABLE IF EXISTS expenses CASCADE');
        console.log('✅ Expenses table will be recreated with correct schema');
      }

      // Check if invoices table has old schema (client_name instead of client)
      const invoicesCheck = await this.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'invoices' AND column_name = 'client_name'
      `);

      if (invoicesCheck.length > 0) {
        console.log('🔄 Migrating invoices table to new schema...');
        // Drop and recreate invoices table (safe for test deployment)
        await this.run('DROP TABLE IF EXISTS invoice_items CASCADE');
        await this.run('DROP TABLE IF EXISTS invoices CASCADE');
        console.log('✅ Invoices tables will be recreated with correct schema');
      }

      // Check if invoice_items table exists
      const itemsCheck = await this.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_name = 'invoice_items'
      `);

      if (itemsCheck.length === 0) {
        console.log('📝 invoice_items table will be created');
      }
    } catch (error) {
      console.log('⚠️ Migration check error (may be first run):', error.message);
    }
  }

  private async createTables(): Promise<void> {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        status TEXT NOT NULL DEFAULT 'active',
        permissions TEXT NOT NULL DEFAULT '[]',
        phone TEXT,
        avatar_url TEXT,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Departments table (without foreign key to avoid circular dependency)
      `CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        budget DECIMAL DEFAULT 0,
        manager_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Contract types table
      `CREATE TABLE IF NOT EXISTS contract_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        is_permanent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Employees table (without foreign key to avoid circular dependency)
      `CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        position TEXT,
        department_id INTEGER,
        salary DECIMAL DEFAULT 0,
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Projects table
      `CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        client_name TEXT,
        description TEXT,
        status TEXT DEFAULT 'active',
        priority TEXT DEFAULT 'medium',
        budget DECIMAL DEFAULT 0,
        spent DECIMAL DEFAULT 0,
        start_date DATE,
        deadline DATE,
        progress INTEGER DEFAULT 0,
        project_type TEXT,
        deliverables TEXT,
        notes TEXT,
        client_contact_name TEXT,
        client_contact_email TEXT,
        client_contact_phone TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Project team members table
      `CREATE TABLE IF NOT EXISTS project_team_members (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id),
        employee_id INTEGER NOT NULL REFERENCES employees(id),
        role TEXT,
        assigned_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(project_id, employee_id)
      )`,

      // Expenses table (matches SQLite routes columns)
      `CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        amount DECIMAL NOT NULL,
        category TEXT,
        expense_date DATE NOT NULL,
        project_id INTEGER REFERENCES projects(id),
        employee_id INTEGER REFERENCES employees(id),
        receipt_file TEXT,
        status TEXT DEFAULT 'pending',
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        reimbursement_date DATE,
        reimbursement_method TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Invoices table (matches SQLite routes columns)
      `CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        client TEXT NOT NULL,
        client_ice TEXT,
        project TEXT,
        project_id INTEGER REFERENCES projects(id),
        amount DECIMAL NOT NULL,
        tax_amount DECIMAL DEFAULT 0,
        total_amount DECIMAL NOT NULL,
        status TEXT DEFAULT 'draft',
        due_date DATE,
        issue_date DATE NOT NULL,
        profit_margin DECIMAL,
        estimated_costs DECIMAL,
        team_members TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Invoice items table
      `CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL NOT NULL,
        total DECIMAL NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )`
    ];

    for (const tableSQL of tables) {
      await this.run(tableSQL);
    }
  }

  private async createIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email)',
      'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
      'CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_name)',
      'CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)',
      'CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number)'
    ];

    for (const indexSQL of indexes) {
      try {
        await this.run(indexSQL);
      } catch (error) {
        // Indexes might already exist, continue
        console.log('Index already exists or error creating index:', error.message);
      }
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
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'admin@nomedia.ma',
      hashedPassword,
      'Admin Principal',
      'admin',
      'active',
      JSON.stringify(['all'])
    ]);

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
        VALUES ($1, $2, $3)
      `, [dept.name, dept.description, dept.budget]);
    }

    console.log('✅ Demo data created successfully');
  }

  // Transaction support
  async transaction<T>(callback: (adapter: PostgreSQLAdapter) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      console.log('🔄 PostgreSQL transaction started');

      // Create a transaction-scoped adapter
      const transactionAdapter = new PostgreSQLTransactionAdapter(client, this.config);
      const result = await callback(transactionAdapter);

      await client.query('COMMIT');
      console.log('✅ PostgreSQL transaction committed');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ PostgreSQL transaction rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

// Transaction-scoped adapter that uses a specific client
class PostgreSQLTransactionAdapter extends PostgreSQLAdapter {
  private client: PoolClient;

  constructor(client: PoolClient, config: DatabaseConfig) {
    super(config);
    this.client = client;
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    const convertedSql = sqlDialect.convertParameterPlaceholders(sql, DatabaseType.SQLITE, DatabaseType.POSTGRESQL);
    console.log('🔍 PostgreSQL Transaction Query:', convertedSql.substring(0, 100) + '...', params);
    const result = await this.client.query(convertedSql, params);
    console.log('✅ Transaction query returned', result.rows?.length || 0, 'rows');
    return result.rows || [];
  }

  async run(sql: string, params: any[] = []): Promise<DatabaseResult> {
    const convertedSql = sqlDialect.convertParameterPlaceholders(sql, DatabaseType.SQLITE, DatabaseType.POSTGRESQL);
    console.log('🔧 PostgreSQL Transaction Run:', convertedSql.substring(0, 100) + '...', params);
    
    let finalSql = convertedSql;
    if (convertedSql.trim().toUpperCase().startsWith('INSERT')) {
      if (!convertedSql.toUpperCase().includes('RETURNING')) {
        finalSql = convertedSql + ' RETURNING id';
      }
    }
    
    const result = await this.client.query(finalSql, params);
    console.log('✅ Transaction query affected', result.rowCount, 'rows');
    
    return {
      rowCount: result.rowCount || 0,
      changes: result.rowCount || 0,
      rows: result.rows,
      lastInsertRowid: result.rows[0]?.id || null
    };
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const convertedSql = sqlDialect.convertParameterPlaceholders(sql, DatabaseType.SQLITE, DatabaseType.POSTGRESQL);
    console.log('🔍 PostgreSQL Transaction Get:', convertedSql.substring(0, 100) + '...', params);
    const result = await this.client.query(convertedSql, params);
    const row = result.rows[0] || null;
    console.log('✅ Transaction get returned:', row ? 'row found' : 'no row');
    return row;
  }
}
