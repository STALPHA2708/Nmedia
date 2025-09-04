const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

try {
  const db = new Database('nomedia.db');
  
  console.log('🔍 Checking authentication issue...');
  
  // Check existing users
  const users = db.prepare('SELECT * FROM users').all();
  console.log('\n👥 Current users in database:');
  users.forEach(user => {
    console.log(`- ${user.email} (${user.first_name} ${user.last_name}) [Role: ${user.role}]`);
  });
  
  // Check the specific user that's failing
  const problemEmail = 'mohammed.berrhazi@uir.ac.ma';
  const userExists = db.prepare('SELECT * FROM users WHERE email = ?').get(problemEmail);
  
  if (userExists) {
    console.log(`\n✅ User ${problemEmail} exists in users table`);
    console.log('User details:', {
      id: userExists.id,
      name: `${userExists.first_name} ${userExists.last_name}`,
      role: userExists.role,
      is_active: userExists.is_active
    });
    
    // Test password (assuming it might be 'admin123' or 'password')
    const testPasswords = ['admin123', 'password', '123456', 'mohammed'];
    let passwordFound = false;
    
    for (const testPassword of testPasswords) {
      const isValid = bcrypt.compareSync(testPassword, userExists.password_hash);
      if (isValid) {
        console.log(`🔑 Password found: "${testPassword}"`);
        passwordFound = true;
        break;
      }
    }
    
    if (!passwordFound) {
      console.log('🔒 Password not found in common passwords');
      console.log('Setting password to "admin123"...');
      
      const newPasswordHash = bcrypt.hashSync('admin123', 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(newPasswordHash, problemEmail);
      console.log('✅ Password updated to "admin123"');
    }
    
  } else {
    console.log(`\n❌ User ${problemEmail} does not exist in users table`);
    
    // Check if user exists in employees table
    const employee = db.prepare('SELECT * FROM employees WHERE email = ?').get(problemEmail);
    
    if (employee) {
      console.log('📋 Found user in employees table, creating user account...');
      
      const passwordHash = bcrypt.hashSync('admin123', 10);
      const result = db.prepare(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        problemEmail,
        passwordHash,
        employee.first_name,
        employee.last_name,
        'user', // Default role
        1 // Active
      );
      
      console.log(`✅ User account created with ID: ${result.lastInsertRowid}`);
      console.log('🔑 Default password: admin123');
    } else {
      console.log('❌ User not found in employees table either');
    }
  }
  
  // Final verification
  console.log('\n🔍 Final user verification:');
  const finalUsers = db.prepare('SELECT email, first_name, last_name, role, is_active FROM users').all();
  finalUsers.forEach(user => {
    console.log(`- ${user.email} (${user.first_name} ${user.last_name}) [Role: ${user.role}, Active: ${user.is_active}]`);
  });
  
  db.close();
  console.log('\n✅ Authentication fix completed!');
  
} catch (error) {
  console.error('❌ Error fixing authentication:', error);
}
