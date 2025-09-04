import { pool } from '../config/database';

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create departments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create contract types table
    await client.query(`
      CREATE TABLE IF NOT EXISTS contract_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        is_permanent BOOLEAN DEFAULT false,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create employees table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20),
        address TEXT,
        position VARCHAR(100),
        department_id INTEGER REFERENCES departments(id),
        salary DECIMAL(10,2),
        hire_date DATE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create employee contracts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_contracts (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        contract_type_id INTEGER REFERENCES contract_types(id),
        start_date DATE NOT NULL,
        end_date DATE,
        salary DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated', 'pending')),
        contract_file_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        client_name VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pre_production' CHECK (status IN ('pre_production', 'production', 'post_production', 'completed')),
        priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        budget DECIMAL(12,2) DEFAULT 0,
        spent DECIMAL(12,2) DEFAULT 0,
        start_date DATE,
        deadline DATE,
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        project_type VARCHAR(50),
        deliverables JSONB DEFAULT '[]',
        notes TEXT,
        client_contact_name VARCHAR(100),
        client_contact_email VARCHAR(255),
        client_contact_phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create project assignments table (many-to-many between projects and employees)
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_assignments (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        role VARCHAR(100),
        start_date DATE,
        end_date DATE,
        hourly_rate DECIMAL(8,2),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, employee_id, status) -- Prevent duplicate active assignments
      )
    `);

    // Create employee skills table (optional for future use)
    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_skills (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        skill_name VARCHAR(100) NOT NULL,
        proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
        years_experience INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default departments
    await client.query(`
      INSERT INTO departments (name, description) VALUES
      ('Production', 'Équipe de production audiovisuelle'),
      ('Technique', 'Équipe technique et matériel'),
      ('Post-Production', 'Montage et finalisation'),
      ('Direction', 'Direction et management'),
      ('Administration', 'Administration et RH'),
      ('Marketing', 'Marketing et communication'),
      ('Commercial', 'Équipe commerciale')
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert default contract types
    await client.query(`
      INSERT INTO contract_types (name, is_permanent, description) VALUES
      ('CDI', true, 'Contrat à Durée Indéterminée'),
      ('CDD', false, 'Contrat à Durée Déterminée'),
      ('Freelance', false, 'Travailleur indépendant'),
      ('Stage', false, 'Stage étudiant'),
      ('Interim', false, 'Contrat intérimaire')
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert sample employees
    const departmentResult = await client.query('SELECT id, name FROM departments');
    const contractTypeResult = await client.query('SELECT id, name FROM contract_types');
    
    const departments = departmentResult.rows;
    const contractTypes = contractTypeResult.rows;

    if (departments.length > 0 && contractTypes.length > 0) {
      const productionDept = departments.find(d => d.name === 'Production')?.id;
      const techniqueDept = departments.find(d => d.name === 'Technique')?.id;
      const postProdDept = departments.find(d => d.name === 'Post-Production')?.id;
      const directionDept = departments.find(d => d.name === 'Direction')?.id;

      const cdiType = contractTypes.find(ct => ct.name === 'CDI')?.id;
      const freelanceType = contractTypes.find(ct => ct.name === 'Freelance')?.id;

      // Insert sample employees
      const employees = [
        {
          firstName: 'Alice',
          lastName: 'Martin',
          email: 'alice.martin@nomedia.ma',
          phone: '+212 6 12 34 56 78',
          address: 'Casablanca, Maroc',
          position: 'Réalisatrice',
          departmentId: productionDept,
          salary: 45000,
          hireDate: '2023-01-15',
          contractType: cdiType
        },
        {
          firstName: 'Bob',
          lastName: 'Dupont',
          email: 'bob.dupont@nomedia.ma',
          phone: '+212 6 23 45 67 89',
          address: 'Rabat, Maroc',
          position: 'Cameraman',
          departmentId: techniqueDept,
          salary: 35000,
          hireDate: '2023-03-20',
          contractType: cdiType
        },
        {
          firstName: 'Carol',
          lastName: 'Leroy',
          email: 'carol.leroy@nomedia.ma',
          phone: '+212 6 34 56 78 90',
          address: 'Casablanca, Maroc',
          position: 'Monteuse',
          departmentId: postProdDept,
          salary: 38000,
          hireDate: '2023-02-10',
          contractType: cdiType
        },
        {
          firstName: 'David',
          lastName: 'Chen',
          email: 'david.chen@nomedia.ma',
          phone: '+212 6 45 67 89 01',
          address: 'Casablanca, Maroc',
          position: 'Producteur',
          departmentId: directionDept,
          salary: 55000,
          hireDate: '2022-11-05',
          contractType: cdiType
        }
      ];

      for (const emp of employees) {
        // Insert employee
        const empResult = await client.query(`
          INSERT INTO employees (first_name, last_name, email, phone, address, position, department_id, salary, hire_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (email) DO NOTHING
          RETURNING id
        `, [emp.firstName, emp.lastName, emp.email, emp.phone, emp.address, emp.position, emp.departmentId, emp.salary, emp.hireDate]);

        // Insert contract if employee was created
        if (empResult.rows.length > 0) {
          await client.query(`
            INSERT INTO employee_contracts (employee_id, contract_type_id, start_date, salary, status)
            VALUES ($1, $2, $3, $4, 'active')
          `, [empResult.rows[0].id, emp.contractType, emp.hireDate, emp.salary]);
        }
      }

      // Insert sample projects
      const sampleProjects = [
        {
          name: 'Spot TV - Luxury Brand',
          clientName: 'Maison Deluxe',
          description: 'Production d\'un spot télévisé de 30 secondes pour une marque de luxe',
          status: 'production',
          priority: 'high',
          budget: 85000,
          spent: 55250,
          startDate: '2024-01-10',
          deadline: '2024-02-15',
          progress: 65,
          projectType: 'publicite'
        },
        {
          name: 'Documentaire Corporate',
          clientName: 'TechCorp',
          description: 'Documentaire de 15 minutes sur l\'histoire et les valeurs de l\'entreprise',
          status: 'post_production',
          priority: 'medium',
          budget: 45000,
          spent: 38000,
          startDate: '2023-12-01',
          deadline: '2024-01-30',
          progress: 80,
          projectType: 'documentaire'
        }
      ];

      for (const project of sampleProjects) {
        await client.query(`
          INSERT INTO projects (name, client_name, description, status, priority, budget, spent, start_date, deadline, progress, project_type)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT DO NOTHING
        `, [project.name, project.clientName, project.description, project.status, project.priority, project.budget, project.spent, project.startDate, project.deadline, project.progress, project.projectType]);
      }
    }

    await client.query('COMMIT');
    console.log('Database initialized successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

export { initializeDatabase };
