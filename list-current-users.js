const { query } = require('./server/config/sqlite-database');

async function listUsers() {
  try {
    console.log('📋 Current users in database:');
    console.log('=============================');
    
    const users = await query('SELECT id, name, email, role, status FROM users ORDER BY id');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id} | Name: "${user.name}" | Email: "${user.email}" | Role: ${user.role} | Status: ${user.status}`);
      });
    }
    
    console.log(`\nTotal users: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
  
  process.exit(0);
}

listUsers();
