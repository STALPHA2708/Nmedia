const Database = require('better-sqlite3');

try {
  const db = new Database('nomedia.db');
  
  // Check existing employees with the problematic email
  const email = 'mohammed.berrhazi@uir.ac.ma';
  const existing = db.prepare('SELECT * FROM employees WHERE email = ?').all(email);
  
  console.log('Checking for existing employees with email:', email);
  console.log('Found employees:', existing.length);
  
  if (existing.length > 0) {
    console.log('Existing employee data:');
    existing.forEach((emp, index) => {
      console.log(`Employee ${index + 1}:`, {
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        created_at: emp.created_at
      });
    });
    
    // Delete duplicate if needed
    console.log('\nTo fix duplicate email issue, you can delete the existing employee(s):');
    console.log('DELETE FROM employees WHERE email = ?', [email]);
  } else {
    console.log('No existing employee found with this email.');
    
    // Check if there are any other issues
    const allEmployees = db.prepare('SELECT id, first_name, last_name, email FROM employees').all();
    console.log('\nAll employees in database:');
    allEmployees.forEach(emp => {
      console.log(`- ${emp.first_name} ${emp.last_name} (${emp.email}) [ID: ${emp.id}]`);
    });
  }
  
  // Check departments table
  const departments = db.prepare('SELECT * FROM departments').all();
  console.log('\nAvailable departments:');
  departments.forEach(dept => {
    console.log(`- ${dept.name} [ID: ${dept.id}]`);
  });
  
  db.close();
} catch (error) {
  console.error('Database error:', error);
}
