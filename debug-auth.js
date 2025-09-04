const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

async function debugAuth() {
  try {
    const db = new Database('nomedia.db');
    
    console.log('🔍 Authentication Debug Report');
    console.log('================================');
    
    // List all users
    const users = db.prepare(`
      SELECT id, email, name, role, status, 
             created_at, last_login
      FROM users 
      ORDER BY id
    `).all();
    
    console.log(`\n👥 Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role} | Status: ${user.status}`);
      console.log(`   Created: ${user.created_at} | Last Login: ${user.last_login || 'Never'}`);
      console.log('');
    });
    
    // Test passwords for common accounts
    console.log('🔐 Testing common passwords:');
    const testPasswords = ['admin123', 'password', '123456', 'test123'];
    
    for (const user of users) {
      console.log(`\nTesting ${user.email}:`);
      let passwordFound = false;
      
      for (const testPassword of testPasswords) {
        try {
          const userWithHash = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id);
          if (userWithHash && userWithHash.password_hash) {
            const isValid = bcrypt.compareSync(testPassword, userWithHash.password_hash);
            if (isValid) {
              console.log(`  ✅ Password: "${testPassword}"`);
              passwordFound = true;
              break;
            }
          }
        } catch (error) {
          console.log(`  ❌ Error testing password: ${error.message}`);
        }
      }
      
      if (!passwordFound) {
        console.log(`  ❓ Password not found in common list`);
        
        // Reset to admin123 for testing
        try {
          const newHash = bcrypt.hashSync('admin123', 10);
          db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
          console.log(`  🔄 Password reset to: "admin123"`);
        } catch (error) {
          console.log(`  ❌ Failed to reset password: ${error.message}`);
        }
      }
    }
    
    console.log('\n🎯 Quick Login Test:');
    console.log('====================');
    console.log('You can now try these credentials:');
    users.forEach(user => {
      console.log(`• ${user.email} / admin123`);
    });
    
    db.close();
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugAuth();
