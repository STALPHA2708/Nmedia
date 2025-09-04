import { DatabaseAdapter, DatabaseConfig, DatabaseType, DatabaseFactory } from './database-interface';
import { SQLiteAdapter } from './sqlite-adapter';
import { PostgreSQLAdapter } from './postgresql-adapter';

export class UniversalDatabaseFactory implements DatabaseFactory {
  createDatabase(config: DatabaseConfig): DatabaseAdapter {
    switch (config.type) {
      case DatabaseType.SQLITE:
        return new SQLiteAdapter(config);
      case DatabaseType.POSTGRESQL:
        return new PostgreSQLAdapter(config);
      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }
  }

  createFromEnvironment(): DatabaseAdapter {
    const config = this.getConfigFromEnvironment();
    return this.createDatabase(config);
  }

  private getConfigFromEnvironment(): DatabaseConfig {
    // Check for explicit database type configuration
    const databaseType = (process.env.DATABASE_TYPE || '').toLowerCase();

    // Respect explicit DATABASE_TYPE setting first
    if (databaseType === 'sqlite') {
      return this.getSQLiteConfig();
    } else if (databaseType === 'postgresql' || databaseType === 'postgres') {
      return this.getPostgreSQLConfig();
    }

    // Auto-detect based on available environment variables (when DATABASE_TYPE is not set)
    if (process.env.DATABASE_URL || process.env.DB_HOST) {
      return this.getPostgreSQLConfig();
    } else {
      return this.getSQLiteConfig();
    }
  }

  private getPostgreSQLConfig(): DatabaseConfig {
    // Support both DATABASE_URL (for services like Hostinger) and individual parameters
    if (process.env.DATABASE_URL) {
      return {
        type: DatabaseType.POSTGRESQL,
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      };
    }

    return {
      type: DatabaseType.POSTGRESQL,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'nomedia_production',
      user: process.env.DB_USER || 'nomedia_user',
      password: process.env.DB_PASSWORD,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  }

  private getSQLiteConfig(): DatabaseConfig {
    return {
      type: DatabaseType.SQLITE,
      path: process.env.SQLITE_PATH || process.cwd() + '/nomedia.db'
    };
  }
}

// Singleton database manager
class DatabaseManager {
  private static instance: DatabaseManager;
  private adapter: DatabaseAdapter | null = null;
  private factory: UniversalDatabaseFactory;

  private constructor() {
    this.factory = new UniversalDatabaseFactory();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async getAdapter(): Promise<DatabaseAdapter> {
    if (!this.adapter) {
      console.log('🔄 Initializing database adapter...');
      this.adapter = this.factory.createFromEnvironment();
      
      // Initialize the database (create tables, etc.)
      await this.adapter.initialize();
      
      console.log(`✅ Database adapter initialized: ${this.adapter.getDatabaseType().toUpperCase()}`);
    }
    return this.adapter;
  }

  public async closeConnection(): Promise<void> {
    if (this.adapter) {
      await this.adapter.close();
      this.adapter = null;
      console.log('✅ Database connection closed');
    }
  }

  public async switchDatabase(config: DatabaseConfig): Promise<void> {
    // Close current connection
    await this.closeConnection();
    
    // Create new adapter
    this.adapter = this.factory.createDatabase(config);
    await this.adapter.initialize();
    
    console.log(`✅ Switched to database: ${config.type.toUpperCase()}`);
  }

  public async healthCheck(): Promise<boolean> {
    if (!this.adapter) {
      return false;
    }
    return await this.adapter.healthCheck();
  }

  public getDatabaseType(): DatabaseType | null {
    return this.adapter ? this.adapter.getDatabaseType() : null;
  }
}

// Export singleton instance and convenience functions
const dbManager = DatabaseManager.getInstance();

export const getDatabase = () => dbManager.getAdapter();
export const closeDatabase = () => dbManager.closeConnection();
export const switchDatabase = (config: DatabaseConfig) => dbManager.switchDatabase(config);
export const getDatabaseType = () => dbManager.getDatabaseType();
export const checkDatabaseHealth = () => dbManager.healthCheck();

// Export convenience functions that match the existing interface
export const query = async (sql: string, params: any[] = []): Promise<any[]> => {
  const db = await getDatabase();
  return await db.query(sql, params);
};

export const run = async (sql: string, params: any[] = []): Promise<any> => {
  const db = await getDatabase();
  const result = await db.run(sql, params);
  // Return in SQLite format for backward compatibility
  return {
    lastInsertRowid: result.lastInsertRowid,
    changes: result.changes
  };
};

export const get = async (sql: string, params: any[] = []): Promise<any> => {
  const db = await getDatabase();
  return await db.get(sql, params);
};

// Environment detection helper
export const detectDatabaseEnvironment = (): { type: DatabaseType; config: any } => {
  const factory = new UniversalDatabaseFactory();
  const config = (factory as any).getConfigFromEnvironment();
  
  return {
    type: config.type,
    config: {
      ...config,
      // Don't expose sensitive information
      password: config.password ? '***' : undefined,
      connectionString: config.connectionString ? '***' : undefined
    }
  };
};

export { DatabaseManager };
