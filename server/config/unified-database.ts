/**
 * Unified database configuration that automatically detects and configures
 * either SQLite or PostgreSQL based on environment variables
 */

import { getDatabase, query, run, get, closeDatabase, checkDatabaseHealth, getDatabaseType, detectDatabaseEnvironment } from './database-factory';

// Re-export all the database functions with the unified interface
export { getDatabase, query, run, get, closeDatabase, checkDatabaseHealth, getDatabaseType, detectDatabaseEnvironment };

// Database initialization function
export async function initializeDatabase(): Promise<boolean> {
  try {
    const envInfo = detectDatabaseEnvironment();
    console.log(`🗄️ Detected database type: ${envInfo.type.toUpperCase()}`);
    console.log(`📊 Database config:`, envInfo.config);
    
    // Get the database adapter (this will auto-initialize)
    const db = await getDatabase();
    
    // Verify connection
    const isHealthy = await checkDatabaseHealth();
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }
    
    console.log(`✅ Database initialized successfully: ${getDatabaseType()?.toUpperCase()}`);
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Migration helper for switching between databases
export async function migrateData(fromType: 'sqlite' | 'postgresql', toType: 'sqlite' | 'postgresql'): Promise<void> {
  if (fromType === toType) {
    console.log('Source and target database types are the same, no migration needed');
    return;
  }
  
  console.log(`🔄 Starting data migration from ${fromType.toUpperCase()} to ${toType.toUpperCase()}...`);
  
  // This is a basic framework - actual migration would need more sophisticated logic
  throw new Error('Data migration between database types is not yet implemented. Please use database-specific export/import tools.');
}

// Backup helper
export async function createBackup(): Promise<string> {
  const dbType = getDatabaseType();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  switch (dbType) {
    case 'sqlite':
      // For SQLite, we could copy the file
      console.log('SQLite backup: Copy the nomedia.db file');
      return `nomedia-backup-${timestamp}.db`;
      
    case 'postgresql':
      // For PostgreSQL, we'd need to use pg_dump
      console.log('PostgreSQL backup: Use pg_dump command');
      return `nomedia-backup-${timestamp}.sql`;
      
    default:
      throw new Error(`Backup not supported for database type: ${dbType}`);
  }
}

// Configuration helper for deployment
export function getDeploymentConfig(): any {
  const envInfo = detectDatabaseEnvironment();
  
  return {
    databaseType: envInfo.type,
    isProduction: process.env.NODE_ENV === 'production',
    hasConnectionString: !!process.env.DATABASE_URL,
    hasIndividualParams: !!(process.env.DB_HOST && process.env.DB_NAME),
    recommendedForHostinger: {
      envVars: [
        'DATABASE_TYPE=postgresql',
        'DB_HOST=your-hostinger-host',
        'DB_NAME=your-database-name', 
        'DB_USER=your-username',
        'DB_PASSWORD=your-password',
        'DB_PORT=5432'
      ],
      alternativeFormat: [
        'DATABASE_URL=postgresql://username:password@host:5432/database'
      ]
    }
  };
}

// For backward compatibility with existing code
export const db = {
  query,
  run,
  get,
  close: closeDatabase,
  healthCheck: checkDatabaseHealth
};

// Export the database type for conditional logic in routes
export { DatabaseType } from './database-interface';
