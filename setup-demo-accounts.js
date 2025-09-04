const { run, get, close } = require('./server/config/sqlite-database');
const bcrypt = require('bcryptjs');

async function setupDemoAccounts() {
  try {
    console.log('🔧 Setting up demo accounts...');

    const demoAccounts = [
      {
        email: 'admin@nomedia.ma',
        name: 'Admin Principal',
        role: 'admin',
        password: 'admin123'
      },
      {
        email: 'test@test.com',
        name: 'Test User',
        role: 'user',
        password: 'password'
      }
    ];

    for (const account of demoAccounts) {
      // Check if user already exists
      const existing = await get('SELECT id FROM users WHERE email = ?', [account.email]);

      if (!existing) {
        // Hash password
        const hashedPassword = await bcrypt.hash(account.password, 10);

        // Create user
        const result = await run(`
          INSERT INTO users (email, password_hash, name, role, status, permissions, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [account.email, hashedPassword, account.name, account.role, 'active', JSON.stringify([])]);

        console.log(`✅ Created user: ${account.email} (ID: ${result.lastInsertRowid})`);
      } else {
        // Update password for existing user
        const hashedPassword = await bcrypt.hash(account.password, 10);
        await run('UPDATE users SET password_hash = ?, status = ? WHERE email = ?',
            [hashedPassword, 'active', account.email]);

        console.log(`✅ Updated password for: ${account.email}`);
      }
    }

    // Verify users exist
    console.log('\n📊 Current users in database:');
    const users = await query('SELECT id, email, name, role, status FROM users ORDER BY created_at');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - Role: ${user.role}, Status: ${user.status}`);
    });

    console.log('\n🎉 Demo accounts setup completed!');
    console.log('🔑 Test credentials:');
    console.log('   - admin@nomedia.ma / admin123');
    console.log('   - test@test.com / password');

  } catch (error) {
    console.error('❌ Error setting up demo accounts:', error);
    throw error;
  }
}

// Import query function
async function getQueryFunction() {
  const { query } = await import('./server/config/sqlite-database.js');
  return query;
}

async function main() {
  try {
    // Get query function
    global.query = await getQueryFunction();
    
    await setupDemoAccounts();
  } catch (error) {
    console.error('Failed to setup demo accounts:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { setupDemoAccounts };
