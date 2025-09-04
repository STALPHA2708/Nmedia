import { DatabaseType, SqlDialect } from './database-interface';

export class SqlDialectConverter implements SqlDialect {
  convertSql(sql: string, fromType: DatabaseType, toType: DatabaseType): string {
    if (fromType === toType) return sql;
    
    let convertedSql = sql;
    
    if (fromType === DatabaseType.SQLITE && toType === DatabaseType.POSTGRESQL) {
      // SQLite to PostgreSQL conversions
      convertedSql = this.sqliteToPostgreSQL(convertedSql);
    } else if (fromType === DatabaseType.POSTGRESQL && toType === DatabaseType.SQLITE) {
      // PostgreSQL to SQLite conversions
      convertedSql = this.postgreSQLToSQLite(convertedSql);
    }
    
    return convertedSql;
  }
  
  private sqliteToPostgreSQL(sql: string): string {
    return sql
      // Convert INTEGER PRIMARY KEY AUTOINCREMENT to SERIAL PRIMARY KEY
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
      // Convert AUTOINCREMENT to SERIAL
      .replace(/AUTOINCREMENT/gi, 'SERIAL')
      // Convert DATETIME to TIMESTAMP
      .replace(/DATETIME/gi, 'TIMESTAMP')
      // Convert TEXT to VARCHAR for better PostgreSQL compatibility
      .replace(/\bTEXT\b/gi, 'TEXT')
      // Convert REAL to DECIMAL
      .replace(/\bREAL\b/gi, 'DECIMAL')
      // Convert SQLite's CURRENT_TIMESTAMP
      .replace(/CURRENT_TIMESTAMP/gi, 'NOW()')
      // Handle boolean values (SQLite uses INTEGER 0/1)
      .replace(/INTEGER DEFAULT 0/gi, 'BOOLEAN DEFAULT FALSE')
      .replace(/INTEGER DEFAULT 1/gi, 'BOOLEAN DEFAULT TRUE')
      // Convert PRAGMA to appropriate PostgreSQL commands
      .replace(/PRAGMA foreign_keys = ON;?/gi, '-- Foreign keys enabled by default in PostgreSQL');
  }
  
  private postgreSQLToSQLite(sql: string): string {
    return sql
      // Convert SERIAL PRIMARY KEY to INTEGER PRIMARY KEY AUTOINCREMENT
      .replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
      // Convert SERIAL to INTEGER
      .replace(/\bSERIAL\b/gi, 'INTEGER')
      // Convert TIMESTAMP to DATETIME
      .replace(/TIMESTAMP/gi, 'DATETIME')
      // Convert DECIMAL to REAL
      .replace(/\bDECIMAL\b/gi, 'REAL')
      // Convert PostgreSQL's NOW()
      .replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP')
      // Handle boolean values (PostgreSQL BOOLEAN to SQLite INTEGER)
      .replace(/BOOLEAN DEFAULT FALSE/gi, 'INTEGER DEFAULT 0')
      .replace(/BOOLEAN DEFAULT TRUE/gi, 'INTEGER DEFAULT 1')
      .replace(/\bBOOLEAN\b/gi, 'INTEGER');
  }
  
  getAutoIncrementSql(columnName: string, type: DatabaseType): string {
    switch (type) {
      case DatabaseType.SQLITE:
        return `${columnName} INTEGER PRIMARY KEY AUTOINCREMENT`;
      case DatabaseType.POSTGRESQL:
        return `${columnName} SERIAL PRIMARY KEY`;
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }
  
  getBooleanSql(value: boolean, type: DatabaseType): string | number {
    switch (type) {
      case DatabaseType.SQLITE:
        return value ? 1 : 0;
      case DatabaseType.POSTGRESQL:
        return value ? 'TRUE' : 'FALSE';
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }
  
  getCurrentTimestampSql(type: DatabaseType): string {
    switch (type) {
      case DatabaseType.SQLITE:
        return 'CURRENT_TIMESTAMP';
      case DatabaseType.POSTGRESQL:
        return 'NOW()';
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }
  
  // Helper method to get the appropriate placeholder syntax
  getParameterPlaceholder(index: number, type: DatabaseType): string {
    switch (type) {
      case DatabaseType.SQLITE:
        return '?';
      case DatabaseType.POSTGRESQL:
        return `$${index + 1}`;
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }
  
  // Convert parameter placeholders
  convertParameterPlaceholders(sql: string, fromType: DatabaseType, toType: DatabaseType): string {
    if (fromType === toType) return sql;
    
    if (fromType === DatabaseType.SQLITE && toType === DatabaseType.POSTGRESQL) {
      // Convert ? to $1, $2, etc.
      let index = 0;
      return sql.replace(/\?/g, () => `$${++index}`);
    } else if (fromType === DatabaseType.POSTGRESQL && toType === DatabaseType.SQLITE) {
      // Convert $1, $2, etc. to ?
      return sql.replace(/\$\d+/g, '?');
    }
    
    return sql;
  }
}

export const sqlDialect = new SqlDialectConverter();
