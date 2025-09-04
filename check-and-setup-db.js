// Simple script to check and setup database schema
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'nomedia.db');
const db = new sqlite3.Database(dbPath);

// Wrap database operations in promises
const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database schema and data...\n');

    // Ensure contract_types table exists
    await runAsync(`
      CREATE TABLE IF NOT EXISTS contract_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        is_permanent INTEGER DEFAULT 0,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add contract columns to employees table if they don't exist
    try {
      await runAsync('ALTER TABLE employees ADD COLUMN contract_type TEXT');
      console.log('✓ Added contract_type column');
    } catch (err) {
      console.log('- contract_type column already exists');
    }

    try {
      await runAsync('ALTER TABLE employees ADD COLUMN contract_start_date DATE');
      console.log('✓ Added contract_start_date column');
    } catch (err) {
      console.log('- contract_start_date column already exists');
    }

    try {
      await runAsync('ALTER TABLE employees ADD COLUMN contract_end_date DATE');
      console.log('✓ Added contract_end_date column');
    } catch (err) {
      console.log('- contract_end_date column already exists');
    }

    try {
      await runAsync('ALTER TABLE employees ADD COLUMN contract_file_name TEXT');
      console.log('✓ Added contract_file_name column');
    } catch (err) {
      console.log('- contract_file_name column already exists');
    }

    // Insert contract types
    const contractTypes = [
      ['CDI', 1, 'Contrat à Durée Indéterminée'],
      ['CDD', 0, 'Contrat à Durée Déterminée'],
      ['Freelance', 0, 'Travailleur indépendant'],
      ['Stage', 0, 'Stage étudiant'],
      ['Interim', 0, 'Contrat intérimaire'],
      ['Consultant', 0, 'Consultant externe'],
      ['Apprentissage', 0, 'Contrat d\'apprentissage']
    ];

    console.log('\n📝 Setting up contract types...');
    for (const [name, is_permanent, description] of contractTypes) {
      try {
        await runAsync(
          'INSERT OR IGNORE INTO contract_types (name, is_permanent, description) VALUES (?, ?, ?)',
          [name, is_permanent, description]
        );
        console.log(`✓ ${name}`);
      } catch (err) {
        console.log(`- ${name} already exists`);
      }
    }

    // Verify contract types
    const contractList = await allAsync('SELECT * FROM contract_types ORDER BY name');
    console.log(`\n📊 Found ${contractList.length} contract types in database:`);
    contractList.forEach(ct => {
      console.log(`  - ${ct.name} (${ct.is_permanent ? 'Permanent' : 'Temporary'})`);
    });

    // Check if tables exist and show counts
    console.log('\n📈 Database statistics:');
    
    try {
      const empCount = await getAsync('SELECT COUNT(*) as count FROM employees');
      console.log(`  - Employees: ${empCount.count}`);
    } catch (err) {
      console.log('  - Employees table may not exist');
    }

    try {
      const deptCount = await getAsync('SELECT COUNT(*) as count FROM departments');
      console.log(`  - Departments: ${deptCount.count}`);
    } catch (err) {
      console.log('  - Departments table may not exist');
    }

    try {
      const projCount = await getAsync('SELECT COUNT(*) as count FROM projects');
      console.log(`  - Projects: ${projCount.count}`);
    } catch (err) {
      console.log('  - Projects table may not exist');
    }

    try {
      const invCount = await getAsync('SELECT COUNT(*) as count FROM invoices');
      console.log(`  - Invoices: ${invCount.count}`);
    } catch (err) {
      console.log('  - Invoices table may not exist');
    }

    console.log('\n✅ Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
    });
  }
}

setupDatabase().catch(console.error);
