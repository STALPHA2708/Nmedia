const Database = require('better-sqlite3');

try {
  const db = new Database('nomedia.db');
  
  console.log('🔍 Checking users table schema...');
  
  // Get table info
  const tableInfo = db.prepare('PRAGMA table_info(users)').all();
  console.log('\n📋 Users table columns:');
  tableInfo.forEach(col => {
    console.log(`- ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  // Get sample data
  const users = db.prepare('SELECT * FROM users LIMIT 3').all();
  console.log('\n👥 Sample users:');
  users.forEach(user => {
    console.log('User:', Object.keys(user).reduce((obj, key) => {
      obj[key] = key === 'password_hash' ? '[HIDDEN]' : user[key];
      return obj;
    }, {}));
  });
  
  db.close();
} catch (error) {
  console.error('❌ Error checking users table:', error.message);
}
