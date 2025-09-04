// Migration script to add contract fields to existing employees table
import Database from 'better-sqlite3';
import { existsSync } from 'fs';

const dbPath = './nomedia.db';

function migrateContractFields() {
  console.log('🔄 Starting contract fields migration...');
  
  if (!existsSync(dbPath)) {
    console.log('❌ Database not found. Please run setup-sqlite.js first.');
    return;
  }

  const db = new Database(dbPath);
  
  try {
    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');
    
    // Check if contract fields already exist
    const tableInfo = db.prepare("PRAGMA table_info(employees)").all();
    const contractTypeExists = tableInfo.some(col => col.name === 'contract_type');
    
    if (contractTypeExists) {
      console.log('✅ Contract fields already exist in employees table');
      return;
    }
    
    console.log('🔧 Adding contract fields to employees table...');
    
    // Add contract fields to employees table
    db.exec(`
      ALTER TABLE employees ADD COLUMN contract_type TEXT;
    `);
    
    db.exec(`
      ALTER TABLE employees ADD COLUMN contract_start_date DATE;
    `);
    
    db.exec(`
      ALTER TABLE employees ADD COLUMN contract_end_date DATE;
    `);
    
    db.exec(`
      ALTER TABLE employees ADD COLUMN contract_file_name TEXT;
    `);
    
    // Create project_team_members table for many-to-many relationship
    db.exec(`
      CREATE TABLE IF NOT EXISTS project_team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, employee_id)
      )
    `);
    
    console.log('✅ Contract fields added successfully to employees table');
    console.log('✅ project_team_members table created for project assignments');
    
    // Verify the changes
    const updatedTableInfo = db.prepare("PRAGMA table_info(employees)").all();
    const contractFields = updatedTableInfo.filter(col => 
      col.name.startsWith('contract_')
    );
    
    console.log('📋 Contract fields added:');
    contractFields.forEach(field => {
      console.log(`   • ${field.name} (${field.type})`);
    });
    
    console.log('');
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    db.close();
  }
}

migrateContractFields();
