const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3');
const { join } = require('path');

const dbPath = join(process.cwd(), 'nomedia.db');
const db = new sqlite3.Database(dbPath);

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

async function addNewUsers() {
  console.log('🔧 Adding new custom users...');

  const newUsers = [
    {
      email: 'mohammed@nomedia.ma',
      name: 'Mohammed',
      role: 'admin',
      password: 'mohammed123',
      permissions: ['all'],
      phone: '+212 6 12 34 56 78'
    },
    {
      email: 'zineb@nomedia.ma',
      name: 'Zineb',
      role: 'manager',
      password: 'zineb123',
      permissions: ['projects', 'employees', 'invoices', 'expenses'],
      phone: '+212 6 23 45 67 89'
    },
    {
      email: 'karim@nomedia.ma',
      name: 'Karim',
      role: 'user',
      password: 'karim123',
      permissions: ['projects', 'expenses'],
      phone: '+212 6 34 56 78 90'
    },
    {
      email: 'invite@nomedia.ma',
      name: 'Invité',
      role: 'guest',
      password: 'invite123',
      permissions: ['projects'],
      phone: '+212 6 45 67 89 01'
    }
  ];

  for (const user of newUsers) {
    try {
      // Check if user already exists
      const existingUser = await getQuery('SELECT id FROM users WHERE email = ?', [user.email]);
      
      if (existingUser) {
        console.log(`⚠️  User ${user.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 12);

      // Insert user
      const result = await runQuery(`
        INSERT INTO users (
          name, email, password_hash, role, status, phone, permissions, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        user.name,
        user.email.toLowerCase(),
        hashedPassword,
        user.role,
        'active',
        user.phone,
        JSON.stringify(user.permissions)
      ]);

      console.log(`✅ Created user: ${user.name} (${user.email}) with role: ${user.role}`);

    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error);
    }
  }

  console.log('');
  console.log('🎉 Custom user creation completed!');
  console.log('');
  console.log('📋 LOGIN CREDENTIALS:');
  console.log('=====================');
  console.log('1. ADMIN - Mohammed:');
  console.log('   Email: mohammed@nomedia.ma');
  console.log('   Password: mohammed123');
  console.log('');
  console.log('2. MANAGER - Zineb:');
  console.log('   Email: zineb@nomedia.ma');
  console.log('   Password: zineb123');
  console.log('');
  console.log('3. USER - Karim:');
  console.log('   Email: karim@nomedia.ma');
  console.log('   Password: karim123');
  console.log('');
  console.log('4. GUEST - Invité:');
  console.log('   Email: invite@nomedia.ma');
  console.log('   Password: invite123');
  console.log('');
  
  db.close();
}

addNewUsers().catch(console.error);
