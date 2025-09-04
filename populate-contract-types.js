const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, 'nomedia.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Function to check if table exists
function checkTable(tableName) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [tableName],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

// Function to create contract_types table if not exists
function createContractTypesTable() {
  return new Promise((resolve, reject) => {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS contract_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        is_permanent INTEGER DEFAULT 0,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    db.run(createTableSQL, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Function to insert contract types
function insertContractTypes() {
  return new Promise((resolve, reject) => {
    const contractTypes = [
      { name: 'CDI', is_permanent: 1, description: 'Contrat à Durée Indéterminée' },
      { name: 'CDD', is_permanent: 0, description: 'Contrat à Durée Déterminée' },
      { name: 'Stage', is_permanent: 0, description: 'Stage' },
      { name: 'Freelance', is_permanent: 0, description: 'Travailleur indépendant' },
      { name: 'Consultant', is_permanent: 0, description: 'Consultant externe' },
      { name: 'Apprentissage', is_permanent: 0, description: 'Contrat d\'apprentissage' }
    ];

    let completed = 0;
    const total = contractTypes.length;

    contractTypes.forEach(contractType => {
      db.run(
        'INSERT OR IGNORE INTO contract_types (name, is_permanent, description) VALUES (?, ?, ?)',
        [contractType.name, contractType.is_permanent, contractType.description],
        function(err) {
          if (err) {
            console.error('Error inserting contract type:', contractType.name, err.message);
          } else if (this.changes > 0) {
            console.log('✓ Inserted contract type:', contractType.name);
          } else {
            console.log('- Contract type already exists:', contractType.name);
          }
          
          completed++;
          if (completed === total) {
            resolve();
          }
        }
      );
    });
  });
}

// Function to check if contract_type column exists in employees table
function checkEmployeesContractColumn() {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(employees)", (err, columns) => {
      if (err) reject(err);
      else {
        const hasContractType = columns.some(col => col.name === 'contract_type');
        resolve(hasContractType);
      }
    });
  });
}

// Function to add contract_type column to employees table
function addContractTypeColumn() {
  return new Promise((resolve, reject) => {
    const alterTableSQL = `
      ALTER TABLE employees 
      ADD COLUMN contract_type TEXT
    `;
    
    db.run(alterTableSQL, (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log('- contract_type column already exists in employees table');
          resolve();
        } else {
          reject(err);
        }
      } else {
        console.log('✓ Added contract_type column to employees table');
        resolve();
      }
    });
  });
}

// Function to add more contract columns to employees table
function addOtherContractColumns() {
  return new Promise(async (resolve, reject) => {
    const columns = [
      'contract_start_date DATE',
      'contract_end_date DATE', 
      'contract_file_name TEXT'
    ];

    for (const column of columns) {
      try {
        await new Promise((res, rej) => {
          db.run(`ALTER TABLE employees ADD COLUMN ${column}`, (err) => {
            if (err) {
              if (err.message.includes('duplicate column name')) {
                console.log(`- ${column.split(' ')[0]} column already exists`);
                res();
              } else {
                rej(err);
              }
            } else {
              console.log(`✓ Added ${column.split(' ')[0]} column to employees table`);
              res();
            }
          });
        });
      } catch (err) {
        console.error(`Error adding column ${column}:`, err.message);
      }
    }
    resolve();
  });
}

// Main function
async function main() {
  try {
    console.log('🔧 Setting up contract types and database schema...\n');

    // Check if contract_types table exists
    const contractTypesTableExists = await checkTable('contract_types');
    if (!contractTypesTableExists) {
      console.log('Creating contract_types table...');
      await createContractTypesTable();
      console.log('✓ contract_types table created');
    } else {
      console.log('- contract_types table already exists');
    }

    // Insert contract types
    console.log('\nInserting contract types...');
    await insertContractTypes();

    // Check if employees table has contract_type column
    console.log('\nChecking employees table schema...');
    const hasContractColumn = await checkEmployeesContractColumn();
    
    if (!hasContractColumn) {
      console.log('Adding contract_type column to employees table...');
      await addContractTypeColumn();
    } else {
      console.log('- contract_type column already exists in employees table');
    }

    // Add other contract columns
    await addOtherContractColumns();

    // Verify the setup
    console.log('\n📊 Verifying setup...');
    db.all('SELECT * FROM contract_types ORDER BY name', (err, rows) => {
      if (err) {
        console.error('Error verifying contract types:', err.message);
      } else {
        console.log(`✓ Found ${rows.length} contract types in database:`);
        rows.forEach(row => {
          console.log(`  - ${row.name} (${row.is_permanent ? 'Permanent' : 'Temporary'})`);
        });
      }

      // Close database connection
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('\n✅ Database setup completed successfully!');
        }
      });
    });

  } catch (error) {
    console.error('❌ Error during setup:', error);
    process.exit(1);
  }
}

// Run the script
main();
