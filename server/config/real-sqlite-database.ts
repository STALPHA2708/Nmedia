import sqlite3 from 'sqlite3';
import { join } from 'path';

// Real SQLite database connection
const dbPath = join(process.cwd(), 'nomedia.db');

console.log('🗄️ Connecting to real SQLite database:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
  } else {
    console.log('✅ Connected to real SQLite database');
    // Enable foreign key constraints
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Helper function to run a query that returns rows
export function query(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    console.log('🔍 Real DB Query:', sql.substring(0, 100) + '...', params);
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('❌ SQL Error:', err);
        reject(err);
      } else {
        console.log('✅ Query returned', rows?.length || 0, 'rows');
        resolve(rows || []);
      }
    });
  });
}

// Helper function to run a query that modifies data
export function run(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log('🔧 Real DB Run:', sql.substring(0, 100) + '...', params);
    db.run(sql, params, function(err) {
      if (err) {
        console.error('❌ SQL Error:', err);
        reject(err);
      } else {
        console.log('✅ Query affected', this.changes, 'rows, lastID:', this.lastID);
        resolve({ 
          lastInsertRowid: this.lastID, 
          changes: this.changes 
        });
      }
    });
  });
}

// Helper function to get a single row
export function get(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log('🔍 Real DB Get:', sql.substring(0, 100) + '...', params);
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('❌ SQL Error:', err);
        reject(err);
      } else {
        console.log('✅ Get returned:', row ? 'row found' : 'no row');
        resolve(row);
      }
    });
  });
}

// Close database connection
export function close() {
  return new Promise<void>((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
        reject(err);
      } else {
        console.log('✅ Database connection closed');
        resolve();
      }
    });
  });
}

export { db };
