// This script will trigger database reinitialization
const { initializeDatabase } = require('./server/config/sqlite-database');

console.log('🔧 Triggering database initialization to create new users...');

// Since we already modified the sqlite-database.ts file to include the new users,
// we need to clear the existing check and reinitialize

const sqlite3 = require('sqlite3');
const { join } = require('path');

const dbPath = join(process.cwd(), 'nomedia.db');
const db = new sqlite3.Database(dbPath);

// First, let's manually add the users
const bcrypt = require('bcryptjs');

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function createUsers() {
  const users = [
    {
      email: 'mohammed@nomedia.ma',
      name: 'Mohammed', 
      role: 'admin',
      password: 'mohammed123',
      permissions: ['all']
    },
    {
      email: 'zineb@nomedia.ma',
      name: 'Zineb',
      role: 'manager', 
      password: 'zineb123',
      permissions: ['projects', 'employees', 'invoices', 'expenses']
    },
    {
      email: 'karim@nomedia.ma',
      name: 'User',
      role: 'user',
      password: 'karim123',
      permissions: ['projects', 'expenses']
    },
    {
      email: 'invite@nomedia.ma',
      name: 'Invité',
      role: 'guest',
      password: 'invite123',
      permissions: ['projects']
    }
  ];

  console.log('📝 Creating 4 custom users...');

  for (const user of users) {
    try {
      const existing = await getQuery('SELECT id FROM users WHERE email = ?', [user.email]);
      if (existing) {
        console.log(`⚠️  ${user.name} (${user.email}) already exists`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      await runQuery(`
        INSERT INTO users (name, email, password_hash, role, status, permissions, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [user.name, user.email, hashedPassword, user.role, JSON.stringify(user.permissions)]);
      
      console.log(`✅ Created: ${user.name} (${user.role})`);
    } catch (error) {
      console.error(`❌ Error creating ${user.name}:`, error.message);
    }
  }

  console.log('\n🎉 User creation completed!');
  console.log('\n📋 LOGIN CREDENTIALS:');
  console.log('====================');
  console.log('1. 👑 ADMIN - Mohammed:     mohammed@nomedia.ma / mohammed123');
  console.log('2. 🏢 MANAGER - Zineb:      zineb@nomedia.ma / zineb123');  
  console.log('3. 👤 USER - User:          karim@nomedia.ma / karim123');
  console.log('4. 🎫 GUEST - Invité:       invite@nomedia.ma / invite123');
  console.log('');
  
  db.close();
}

createUsers();
