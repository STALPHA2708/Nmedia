/**
 * Database abstraction layer interface
 * Supports both SQLite and PostgreSQL with identical API
 */

export interface DatabaseAdapter {
  // Basic query operations
  query(sql: string, params?: any[]): Promise<any[]>;
  run(sql: string, params?: any[]): Promise<DatabaseResult>;
  get(sql: string, params?: any[]): Promise<any>;
  
  // Connection management
  close(): Promise<void>;
  healthCheck(): Promise<boolean>;
  
  // Database type identification
  getDatabaseType(): DatabaseType;
  
  // Initialization
  initialize(): Promise<boolean>;
}

export interface DatabaseResult {
  lastInsertRowid?: number | null;
  rowCount?: number;
  changes?: number;
  rows?: any[];
}

export enum DatabaseType {
  SQLITE = 'sqlite',
  POSTGRESQL = 'postgresql'
}

export interface DatabaseConfig {
  type: DatabaseType;
  // SQLite specific
  path?: string;
  // PostgreSQL specific
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | object;
  connectionString?: string;
}

// Database factory interface
export interface DatabaseFactory {
  createDatabase(config: DatabaseConfig): DatabaseAdapter;
  createFromEnvironment(): DatabaseAdapter;
}

// SQL dialect differences handler
export interface SqlDialect {
  // Convert SQLite SQL to PostgreSQL SQL and vice versa
  convertSql(sql: string, fromType: DatabaseType, toType: DatabaseType): string;
  
  // Get appropriate SQL for auto-increment/serial columns
  getAutoIncrementSql(columnName: string, type: DatabaseType): string;
  
  // Get appropriate SQL for boolean values
  getBooleanSql(value: boolean, type: DatabaseType): string | number;
  
  // Get appropriate SQL for current timestamp
  getCurrentTimestampSql(type: DatabaseType): string;
}
