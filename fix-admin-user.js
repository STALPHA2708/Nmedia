const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

try {
  const db = new Database('nomedia.db');
  
  console.log('🔧 Fixing admin user...');
  
  // Check if admin user exists
  const adminUser = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@nomedia.ma');
  
  if (adminUser) {
    console.log('✅ Admin user already exists');
    console.log('Admin user details:', {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      status: adminUser.status
    });
  } else {
    console.log('❌ Admin user not found, creating...');
    
    // Create admin user with correct schema
    const passwordHash = bcrypt.hashSync('admin123', 10);
    
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, status, permissions, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      'Admin Nomedia',
      'admin@nomedia.ma', 
      passwordHash,
      'admin',
      'active',
      JSON.stringify([])
    );
    
    console.log('✅ Admin user created with ID:', result.lastInsertRowid);
    console.log('🔑 Login credentials: admin@nomedia.ma / admin123');
  }
  
  // Check all users
  const allUsers = db.prepare('SELECT id, name, email, role, status FROM users').all();
  console.log('\n👥 All users in database:');
  allUsers.forEach(user => {
    console.log(`- ${user.name} (${user.email}) [${user.role}] - ${user.status}`);
  });
  
  db.close();
  console.log('\n✅ Admin user fix completed!');
  
} catch (error) {
  console.error('❌ Error fixing admin user:', error);
}
