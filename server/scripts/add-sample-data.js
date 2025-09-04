const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

async function addSampleData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if departments exist, if not create them
    const deptCheck = await client.query('SELECT COUNT(*) FROM nomedia.departments');
    if (parseInt(deptCheck.rows[0].count) === 0) {
      console.log('Adding sample departments...');
      await client.query(`
        INSERT INTO nomedia.departments (name, description) VALUES
        ('Production', 'Équipe de production audiovisuelle'),
        ('Technique', 'Équipe technique et matériel'),
        ('Post-Production', 'Montage et finalisation'),
        ('Direction', 'Direction et management'),
        ('Commercial', 'Ventes et relations clients')
      `);
    }
    
    // Check if employees exist, if not create them
    const empCheck = await client.query('SELECT COUNT(*) FROM nomedia.employees');
    if (parseInt(empCheck.rows[0].count) === 0) {
      console.log('Adding sample employees...');
      await client.query(`
        INSERT INTO nomedia.employees (first_name, last_name, email, phone, address, position, department_id, salary, hire_date, status) VALUES
        ('Alice', 'Martin', 'alice.martin@nomedia.ma', '+212 6 12 34 56 78', 'Casablanca, Maroc', 'Réalisatrice', 1, 45000, '2023-01-15', 'active'),
        ('Bob', 'Dupont', 'bob.dupont@nomedia.ma', '+212 6 23 45 67 89', 'Rabat, Maroc', 'Cameraman', 2, 35000, '2023-03-20', 'active'),
        ('Carol', 'Leroy', 'carol.leroy@nomedia.ma', '+212 6 34 56 78 90', 'Casablanca, Maroc', 'Monteuse', 3, 38000, '2023-02-10', 'active'),
        ('David', 'Chen', 'david.chen@nomedia.ma', '+212 6 45 67 89 01', 'Casablanca, Maroc', 'Producteur', 4, 55000, '2022-11-05', 'active'),
        ('Eva', 'Rodriguez', 'eva.rodriguez@nomedia.ma', '+212 6 56 78 90 12', 'Casablanca, Maroc', 'Ingénieure Son', 2, 40000, '2023-04-15', 'active')
      `);
    }
    
    // Check if contract types exist, if not create them
    const contractCheck = await client.query('SELECT COUNT(*) FROM nomedia.contract_types');
    if (parseInt(contractCheck.rows[0].count) === 0) {
      console.log('Adding sample contract types...');
      await client.query(`
        INSERT INTO nomedia.contract_types (name, is_permanent, description) VALUES
        ('CDI', true, 'Contrat à Durée Indéterminée'),
        ('CDD', false, 'Contrat à Durée Déterminée'),
        ('Freelance', false, 'Travailleur indépendant'),
        ('Stage', false, 'Stage étudiant'),
        ('Consultant', false, 'Consultant externe')
      `);
    }
    
    // Check if admin user exists, if not create one
    const userCheck = await client.query('SELECT COUNT(*) FROM nomedia.users WHERE email = $1', ['admin@nomedia.ma']);
    if (parseInt(userCheck.rows[0].count) === 0) {
      console.log('Adding admin user...');
      // Create admin user with default password: "admin123"
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await client.query(`
        INSERT INTO nomedia.users (name, email, password_hash, role, status, phone, permissions) VALUES
        ('Admin Principal', 'admin@nomedia.ma', $1, 'admin', 'active', '+212 6 12 34 56 78', ARRAY['all'])
      `, [hashedPassword]);
    }
    
    await client.query('COMMIT');
    console.log('Sample data added successfully!');
    console.log('Admin login: admin@nomedia.ma / admin123');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding sample data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script
addSampleData()
  .then(() => {
    console.log('Sample data script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Sample data script failed:', error);
    process.exit(1);
  });
