const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

try {
  const db = new Database('nomedia.db');
  
  console.log('🔍 Checking current users in database...');
  
  // Get all users
  const users = db.prepare('SELECT id, email, name, role, status FROM users').all();
  console.log(`\nFound ${users.length} users:`);
  users.forEach(user => {
    console.log(`- ${user.email} (${user.name}) [${user.role}] - ${user.status}`);
  });
  
  // Check if test@test.com exists, if not create it
  const testUser = db.prepare('SELECT * FROM users WHERE email = ?').get('test@test.com');
  
  if (!testUser) {
    console.log('\n❌ test@test.com not found, creating...');
    
    const passwordHash = bcrypt.hashSync('password', 10);
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, name, role, status, permissions, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      'test@test.com',
      passwordHash,
      'Test User',
      'user',
      'active',
      JSON.stringify([])
    );
    
    console.log(`✅ Created test@test.com with password: "password"`);
  } else {
    console.log('\n✅ test@test.com exists, updating password...');
    
    const passwordHash = bcrypt.hashSync('password', 10);
    db.prepare('UPDATE users SET password_hash = ?, status = ? WHERE email = ?')
      .run(passwordHash, 'active', 'test@test.com');
    
    console.log('✅ Updated test@test.com password to: "password"');
  }
  
  console.log('\n🎯 Available login credentials:');
  console.log('================================');
  console.log('• admin@nomedia.ma / admin123 (Admin)');
  console.log('• david.chen@nomedia.ma / manager123 (Manager)');
  console.log('• alice.martin@nomedia.ma / user123 (User)');
  console.log('• test@test.com / password (Test User)');
  
  db.close();
  
} catch (error) {
  console.error('❌ Error:', error);
}
