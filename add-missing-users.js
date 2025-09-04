const { run, get } = require('./server/config/sqlite-database');
const bcrypt = require('bcryptjs');

async function addMissingUsers() {
  console.log('🔧 Adding missing users to database...');
  
  const usersToAdd = [
    {
      name: 'Mohammed',
      email: 'mohammed@nomedia.ma',
      password: 'mohammed123',
      role: 'admin',
      phone: '+212 6 12 34 56 78'
    },
    {
      name: 'Zineb',
      email: 'zineb@nomedia.ma',
      password: 'zineb123',
      role: 'manager',
      phone: '+212 6 23 45 67 89'
    },
    {
      name: 'User',
      email: 'karim@nomedia.ma',
      password: 'karim123',
      role: 'user',
      phone: '+212 6 34 56 78 90'
    },
    {
      name: 'Invité',
      email: 'invite@nomedia.ma',
      password: 'invite123',
      role: 'guest',
      phone: '+212 6 45 67 89 01'
    }
  ];

  for (const userData of usersToAdd) {
    try {
      // Check if user already exists
      const existingUser = await get('SELECT id FROM users WHERE email = ?', [userData.email.toLowerCase()]);
      
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Set permissions based on role
      let permissions = [];
      switch (userData.role) {
        case 'admin':
          permissions = ['all'];
          break;
        case 'manager':
          permissions = ['projects', 'employees', 'invoices', 'expenses'];
          break;
        case 'user':
          permissions = ['projects', 'expenses'];
          break;
        case 'guest':
          permissions = ['projects'];
          break;
        default:
          permissions = ['projects'];
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Insert user
      const result = await run(`
        INSERT INTO users (
          name, email, password_hash, role, status, phone, permissions, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        userData.name,
        userData.email.toLowerCase(),
        hashedPassword,
        userData.role,
        'active',
        userData.phone || null,
        JSON.stringify(permissions)
      ]);

      console.log(`✅ Created user: ${userData.name} (${userData.email}) with role: ${userData.role} - ID: ${result.lastInsertRowid}`);

    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
    }
  }

  console.log('\n🎉 User creation completed!');
  console.log('\n📋 LOGIN CREDENTIALS:');
  console.log('====================');
  console.log('1. 👑 ADMIN - Mohammed:  mohammed@nomedia.ma / mohammed123');
  console.log('2. 🏢 MANAGER - Zineb:   zineb@nomedia.ma / zineb123');
  console.log('3. 👤 USER - User:       karim@nomedia.ma / karim123');
  console.log('4. 🎫 GUEST - Invité:    invite@nomedia.ma / invite123');
  console.log('\nYou can now login with any of these credentials!');
  
  process.exit(0);
}

addMissingUsers().catch(console.error);
