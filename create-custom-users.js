const bcrypt = require('bcrypt');
const { run, get } = require('./server/config/sqlite-database');

async function createCustomUsers() {
  console.log('🔧 Creating custom users...');

  const users = [
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
      name: 'Karim',
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

  for (const user of users) {
    try {
      // Check if user already exists
      const existingUser = await get('SELECT id FROM users WHERE email = ?', [user.email]);
      
      if (existingUser) {
        console.log(`⚠️  User ${user.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 12);

      // Set permissions based on role
      let permissions = [];
      switch (user.role) {
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

      // Insert user
      const result = await run(`
        INSERT INTO users (
          name, email, password_hash, role, status, phone, permissions
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        user.name,
        user.email.toLowerCase(),
        hashedPassword,
        user.role,
        'active',
        user.phone,
        JSON.stringify(permissions)
      ]);

      console.log(`✅ Created user: ${user.name} (${user.email}) with role: ${user.role}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   User ID: ${result.lastInsertRowid}`);
      console.log('');

    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error);
    }
  }

  console.log('🎉 Custom user creation completed!');
  console.log('');
  console.log('📋 Login Credentials:');
  console.log('=====================');
  users.forEach(user => {
    console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
  });
  
  process.exit(0);
}

createCustomUsers().catch(console.error);
