import { Pool } from 'pg';
import "dotenv/config";

// PostgreSQL configuration for production
export class ProductionDatabase {
  private static instance: ProductionDatabase;
  private pool: Pool;

  private constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required for production');
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
      connectionTimeoutMillis: 2000, // How long to wait when connecting a new client
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });

    console.log('✅ PostgreSQL connection pool initialized');
  }

  public static getInstance(): ProductionDatabase {
    if (!ProductionDatabase.instance) {
      ProductionDatabase.instance = new ProductionDatabase();
    }
    return ProductionDatabase.instance;
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  public async transaction<T>(callback: (query: (text: string, params?: any[]) => Promise<any>) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const query = async (text: string, params?: any[]) => {
        const result = await client.query(text, params);
        return result;
      };
      
      const result = await callback(query);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.rows[0].health === 1;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
    console.log('✅ PostgreSQL connection pool closed');
  }
}

// Database migration utilities for production
export class DatabaseMigrations {
  private db: ProductionDatabase;

  constructor() {
    this.db = ProductionDatabase.getInstance();
  }

  public async runMigrations(): Promise<void> {
    console.log('🔄 Running database migrations...');
    
    try {
      // Create migrations table if it doesn't exist
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Define migrations
      const migrations = [
        {
          name: '001_create_departments',
          sql: `
            CREATE TABLE IF NOT EXISTS departments (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL UNIQUE,
              description TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `
        },
        {
          name: '002_create_contract_types',
          sql: `
            CREATE TABLE IF NOT EXISTS contract_types (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL UNIQUE,
              is_permanent BOOLEAN DEFAULT FALSE,
              description TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `
        },
        {
          name: '003_create_employees',
          sql: `
            CREATE TABLE IF NOT EXISTS employees (
              id SERIAL PRIMARY KEY,
              first_name VARCHAR(255) NOT NULL,
              last_name VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL UNIQUE,
              phone VARCHAR(50),
              address TEXT,
              position VARCHAR(255),
              department_id INTEGER REFERENCES departments(id),
              salary DECIMAL(10,2),
              hire_date DATE NOT NULL,
              status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
              avatar_url TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `
        },
        {
          name: '004_create_users',
          sql: `
            CREATE TABLE IF NOT EXISTS users (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL UNIQUE,
              password_hash VARCHAR(255) NOT NULL,
              role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'guest')),
              status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
              phone VARCHAR(50),
              avatar_url TEXT,
              last_login TIMESTAMP,
              permissions JSON,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `
        },
        {
          name: '005_create_projects',
          sql: `
            CREATE TABLE IF NOT EXISTS projects (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              client_name VARCHAR(255) NOT NULL,
              description TEXT,
              status VARCHAR(20) DEFAULT 'pre_production' CHECK (status IN ('pre_production', 'production', 'post_production', 'completed')),
              priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
              budget DECIMAL(12,2) NOT NULL,
              spent DECIMAL(12,2) DEFAULT 0,
              start_date DATE NOT NULL,
              deadline DATE NOT NULL,
              progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
              project_type VARCHAR(100),
              deliverables JSON,
              notes TEXT,
              client_contact_name VARCHAR(255),
              client_contact_email VARCHAR(255),
              client_contact_phone VARCHAR(50),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `
        },
        {
          name: '006_create_invoices',
          sql: `
            CREATE TABLE IF NOT EXISTS invoices (
              id SERIAL PRIMARY KEY,
              invoice_number VARCHAR(100) NOT NULL UNIQUE,
              client VARCHAR(255) NOT NULL,
              client_ice VARCHAR(100),
              project VARCHAR(255) NOT NULL,
              project_id INTEGER REFERENCES projects(id),
              amount DECIMAL(12,2) NOT NULL,
              tax_amount DECIMAL(12,2) NOT NULL,
              total_amount DECIMAL(12,2) NOT NULL,
              issue_date DATE NOT NULL,
              due_date DATE NOT NULL,
              status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
              profit_margin DECIMAL(5,2),
              estimated_costs DECIMAL(12,2),
              team_members JSON,
              notes TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `
        },
        {
          name: '007_create_expenses',
          sql: `
            CREATE TABLE IF NOT EXISTS expenses (
              id SERIAL PRIMARY KEY,
              employee_id INTEGER REFERENCES employees(id),
              project_id INTEGER REFERENCES projects(id),
              category VARCHAR(100) NOT NULL,
              description TEXT NOT NULL,
              amount DECIMAL(10,2) NOT NULL,
              receipt_file VARCHAR(255),
              expense_date DATE NOT NULL,
              status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
              approved_by INTEGER REFERENCES users(id),
              approved_at TIMESTAMP,
              rejection_reason TEXT,
              reimbursement_date DATE,
              reimbursement_method VARCHAR(100),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `
        }
      ];

      // Run each migration if not already executed
      for (const migration of migrations) {
        const existingMigration = await this.db.query(
          'SELECT id FROM migrations WHERE name = $1',
          [migration.name]
        );

        if (existingMigration.rows.length === 0) {
          console.log(`Running migration: ${migration.name}`);
          await this.db.transaction(async (query) => {
            await query(migration.sql);
            await query(
              'INSERT INTO migrations (name) VALUES ($1)',
              [migration.name]
            );
          });
          console.log(`✅ Migration completed: ${migration.name}`);
        } else {
          console.log(`⏭️ Migration already applied: ${migration.name}`);
        }
      }

      console.log('✅ All migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
}
