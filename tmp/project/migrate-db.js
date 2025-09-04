import Database from 'better-sqlite3';

const dbPath = './nomedia.db';
const db = new Database(dbPath);

try {
  console.log('🔄 Migrating database to add contract fields...');
  
  // Check if contract_type column exists
  const tableInfo = db.prepare("PRAGMA table_info(employees)").all();
  const hasContractType = tableInfo.some(col => col.name === 'contract_type');
  
  if (!hasContractType) {
    console.log('Adding contract fields to employees table...');
    
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
    
    db.exec(`
      ALTER TABLE employees ADD COLUMN contract_file_path TEXT;
    `);
    
    console.log('✅ Contract fields added to employees table');
  } else {
    console.log('✅ Contract fields already exist in employees table');
  }
  
  // Ensure contract_types table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS contract_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      is_permanent BOOLEAN DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Add some basic contract types if they don't exist
  const contractTypesCount = db.prepare('SELECT COUNT(*) as count FROM contract_types').get();
  if (contractTypesCount.count === 0) {
    const insertContract = db.prepare(`
      INSERT INTO contract_types (name, is_permanent, description) VALUES (?, ?, ?)
    `);
    insertContract.run('CDI', 1, 'Contrat à Durée Indéterminée');
    insertContract.run('CDD', 0, 'Contrat à Durée Déterminée');
    insertContract.run('Stage', 0, 'Stage étudiant');
    insertContract.run('Freelance', 0, 'Travailleur indépendant');
    insertContract.run('Consultant', 0, 'Consultant externe');
    console.log('✅ Added basic contract types');
  }
  
  console.log('✅ Database migration completed successfully!');
  
} catch (error) {
  console.error('❌ Migration error:', error);
} finally {
  db.close();
}
