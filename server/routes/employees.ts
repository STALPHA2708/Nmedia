import { RequestHandler } from "express";
import { query, run } from "../config/unified-database";

// Import mock data functions
import {
  getMockEmployees,
  getMockDepartments,
  getMockContractTypes,
  getMockEmployeeStats,
  mockEmployees,
  mockDepartments,
  mockContractTypes,
} from '../../client/lib/mock-data';

// Use mock data when database is not available
const USE_MOCK_DATA = false;

// Get all employees with their contracts and current projects
export const getEmployees: RequestHandler = async (req, res) => {
  try {
    console.log('Employees GET route hit');

    // Ensure the schema and table exist
    await pool.query(`CREATE SCHEMA IF NOT EXISTS nomedia;`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nomedia.employees (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(20),
        address TEXT,
        position VARCHAR(100),
        department_id INTEGER,
        salary DECIMAL(10,2),
        hire_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    const query = `
      SELECT 
        e.id,
        e.first_name,
        e.last_name,
        e.email,
        e.phone,
        e.address,
        e.position,
        e.salary,
        e.hire_date,
        e.status,
        e.avatar_url,
        d.name as department_name,
        d.id as department_id,
        
        -- Current active contract
        ec.id as contract_id,
        ct.name as contract_type,
        ct.is_permanent,
        ec.start_date as contract_start_date,
        ec.end_date as contract_end_date,
        ec.status as contract_status,
        ec.contract_file_name,
        
        -- Count of active projects
        COALESCE(project_count.active_projects, 0) as active_projects
        
      FROM nomedia.employees e
      LEFT JOIN nomedia.departments d ON e.department_id = d.id
      LEFT JOIN nomedia.contracts ec ON e.id = ec.employee_id AND ec.status = 'active'
      LEFT JOIN nomedia.contract_types ct ON ec.contract_type_id = ct.id
      LEFT JOIN (
        SELECT
          pa.employee_id,
          COUNT(*) as active_projects
        FROM nomedia.project_assignments pa
        JOIN nomedia.projects p ON pa.project_id = p.id
        WHERE pa.status = 'active' AND p.status IN ('production', 'pre_production', 'post_production')
        GROUP BY pa.employee_id
      ) project_count ON e.id = project_count.employee_id
      
      ORDER BY e.last_name, e.first_name
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des employés",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Get employee by ID with detailed information
export const getEmployeeById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Get employee basic info
    const employeeQuery = `
      SELECT 
        e.*,
        d.name as department_name,
        d.id as department_id
      FROM nomedia.employees e
      LEFT JOIN nomedia.departments d ON e.department_id = d.id
      WHERE e.id = $1
    `;

    // Get all contracts for this employee
    const contractsQuery = `
      SELECT 
        ec.*,
        ct.name as contract_type,
        ct.is_permanent
      FROM nomedia.contracts ec
      JOIN nomedia.contract_types ct ON ec.contract_type_id = ct.id
      WHERE ec.employee_id = $1
      ORDER BY ec.start_date DESC
    `;

    // Get current project assignments
    const projectsQuery = `
      SELECT
        pa.*,
        p.name as project_name,
        p.client_name,
        p.status as project_status,
        p.deadline,
        p.budget,
        p.progress
      FROM nomedia.project_assignments pa
      JOIN nomedia.projects p ON pa.project_id = p.id
      WHERE pa.employee_id = $1
      ORDER BY pa.start_date DESC
    `;

    // Get employee skills
    const skillsQuery = `
      SELECT *
      FROM nomedia.employee_skills
      WHERE employee_id = $1
      ORDER BY proficiency_level DESC, years_experience DESC
    `;

    const [employee, contracts, projects, skills] = await Promise.all([
      pool.query(employeeQuery, [id]),
      pool.query(contractsQuery, [id]),
      pool.query(projectsQuery, [id]),
      pool.query(skillsQuery, [id]),
    ]);

    if (employee.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employé non trouvé",
      });
    }

    res.json({
      success: true,
      data: {
        ...employee.rows[0],
        contracts: contracts.rows,
        projects: projects.rows,
        skills: skills.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching employee details:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des détails de l'employé",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Create new employee
export const createEmployee: RequestHandler = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      position,
      departmentId,
      salary,
      hireDate,
      contractType,
      contractStartDate,
      contractEndDate,
      contractFileName,
    } = req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !address ||
      !position ||
      !departmentId ||
      !salary ||
      !hireDate ||
      !contractType ||
      !contractStartDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être remplis",
      });
    }

    // Check if email already exists
    const emailCheck = await client.query(
      "SELECT id FROM nomedia.employees WHERE email = $1",
      [email],
    );
    if (emailCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "Un employé avec cet email existe déjà",
      });
    }

    // Insert employee
    const employeeQuery = `
      INSERT INTO nomedia.employees (first_name, last_name, email, phone, address, position, department_id, salary, hire_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
      RETURNING *
    `;

    const employeeResult = await client.query(employeeQuery, [
      firstName,
      lastName,
      email,
      phone,
      address,
      position,
      departmentId,
      salary,
      hireDate,
    ]);

    const employeeId = employeeResult.rows[0].id;

    // Get contract type ID
    const contractTypeQuery = await client.query(
      "SELECT id FROM nomedia.contract_types WHERE name = $1",
      [contractType],
    );

    if (contractTypeQuery.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Type de contrat invalide",
      });
    }

    const contractTypeId = contractTypeQuery.rows[0].id;

    // Insert contract
    const contractQuery = `
      INSERT INTO nomedia.contracts (employee_id, contract_type_id, start_date, end_date, salary, status, contract_file_name)
      VALUES ($1, $2, $3, $4, $5, 'active', $6)
      RETURNING *
    `;

    await client.query(contractQuery, [
      employeeId,
      contractTypeId,
      contractStartDate,
      contractEndDate || null,
      salary,
      contractFileName,
    ]);

    await client.query("COMMIT");

    // Fetch the complete employee data to return
    const completeEmployee = await pool.query(
      `
      SELECT 
        e.*,
        d.name as department_name,
        ec.start_date as contract_start_date,
        ec.end_date as contract_end_date,
        ct.name as contract_type
      FROM nomedia.employees e
      LEFT JOIN nomedia.departments d ON e.department_id = d.id
      LEFT JOIN nomedia.contracts ec ON e.id = ec.employee_id AND ec.status = 'active'
      LEFT JOIN nomedia.contract_types ct ON ec.contract_type_id = ct.id
      WHERE e.id = $1
    `,
      [employeeId],
    );

    res.status(201).json({
      success: true,
      message: "Employé créé avec succès",
      data: completeEmployee.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating employee:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'employé",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  } finally {
    client.release();
  }
};

// Update employee
export const updateEmployee: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      position,
      departmentId,
      salary,
      status,
    } = req.body;

    const query = `
      UPDATE nomedia.employees 
      SET 
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        address = $5,
        position = $6,
        department_id = $7,
        salary = $8,
        status = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;

    const result = await pool.query(query, [
      firstName,
      lastName,
      email,
      phone,
      address,
      position,
      departmentId,
      salary,
      status,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employé non trouvé",
      });
    }

    res.json({
      success: true,
      message: "Employé mis à jour avec succès",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'employé",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Delete employee
export const deleteEmployee: RequestHandler = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;

    // Check if employee has active project assignments
    const activeAssignments = await client.query(
      "SELECT COUNT(*) FROM nomedia.project_assignments WHERE employee_id = $1 AND status = $2",
      [id, "active"],
    );

    if (parseInt(activeAssignments.rows[0].count) > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "Impossible de supprimer un employé ayant des projets actifs",
      });
    }

    // Delete employee (cascade will handle contracts and assignments)
    const result = await client.query(
      "DELETE FROM nomedia.employees WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Employé non trouvé",
      });
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Employé supprimé avec succès",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting employee:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'employé",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  } finally {
    client.release();
  }
};

// Get employee statistics
export const getEmployeeStats: RequestHandler = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_employees,
        COUNT(CASE WHEN status = 'on_leave' THEN 1 END) as on_leave_employees,
        COALESCE(SUM(CASE WHEN status = 'active' THEN salary ELSE 0 END), 0) as total_active_payroll,
        COUNT(DISTINCT department_id) as total_departments
      FROM nomedia.employees
    `;

    const contractStatsQuery = `
      SELECT 
        ct.name as contract_type,
        COUNT(*) as count
      FROM nomedia.contracts ec
      JOIN nomedia.contract_types ct ON ec.contract_type_id = ct.id
      WHERE ec.status = 'active'
      GROUP BY ct.name
      ORDER BY count DESC
    `;

    const [stats, contractStats] = await Promise.all([
      pool.query(statsQuery),
      pool.query(contractStatsQuery),
    ]);

    res.json({
      success: true,
      data: {
        general: stats.rows[0],
        contractTypes: contractStats.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching employee statistics:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Get departments
export const getDepartments: RequestHandler = async (req, res) => {
  try {
    if (USE_MOCK_DATA) {
      return res.json(await getMockDepartments());
    }

    let result;
    try {
      const query = `
        SELECT
          d.*,
          COUNT(e.id) as employee_count
        FROM nomedia.departments d
        LEFT JOIN nomedia.employees e ON d.id = e.department_id AND e.status = 'active'
        GROUP BY d.id, d.name, d.description, d.created_at, d.updated_at
        ORDER BY d.name
      `;

      result = await pool.query(query);
    } catch (dbError) {
      console.log("Database error, falling back to mock departments:", dbError.message);
      return res.json(await getMockDepartments());
    }

    // If database is empty, initialize with default departments
    if (result.rows.length === 0) {
      console.log("Departments table empty, initializing with default data...");

      try {
        await pool.query(`
          INSERT INTO nomedia.departments (name, description) VALUES
          ('Production', 'Équipe de production audiovisuelle'),
          ('Technique', 'Équipe technique et matériel'),
          ('Post-Production', 'Montage et finalisation'),
          ('Direction', 'Direction et management'),
          ('Commercial', 'Ventes et relations clients')
          ON CONFLICT (name) DO NOTHING
        `);

        // Fetch the data again
        const query = `
          SELECT
            d.*,
            COUNT(e.id) as employee_count
          FROM nomedia.departments d
          LEFT JOIN nomedia.employees e ON d.id = e.department_id AND e.status = 'active'
          GROUP BY d.id, d.name, d.description, d.created_at, d.updated_at
          ORDER BY d.name
        `;

        result = await pool.query(query);
        console.log("✅ Departments initialized successfully");
      } catch (insertError) {
        console.log("Failed to initialize departments, using mock data:", insertError.message);
        return res.json(await getMockDepartments());
      }
    }

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    // Fallback to mock data on any error
    try {
      const mockResponse = await getMockDepartments();
      console.log("Using mock departments due to error");
      return res.json(mockResponse);
    } catch (mockError) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des départements",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

// Get department by ID
export const getDepartmentById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (USE_MOCK_DATA) {
      const department = mockDepartments.find(d => d.id === parseInt(id));
      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Département non trouvé",
        });
      }
      return res.json({ success: true, data: department });
    }

    const query = `
      SELECT
        d.*,
        COUNT(e.id) as employee_count
      FROM nomedia.departments d
      LEFT JOIN nomedia.employees e ON d.id = e.department_id AND e.status = 'active'
      WHERE d.id = $1
      GROUP BY d.id, d.name, d.description, d.created_at, d.updated_at
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Département non trouvé",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching department:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du département",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Create new department
export const createDepartment: RequestHandler = async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Le nom du département est obligatoire",
      });
    }

    if (USE_MOCK_DATA) {
      const newDepartment = {
        id: Math.max(...mockDepartments.map(d => d.id)) + 1,
        name: name.trim(),
        description: description?.trim() || '',
        employee_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockDepartments.push(newDepartment);
      return res.status(201).json({ success: true, data: newDepartment });
    }

    await client.query("BEGIN");

    // Check if department name already exists
    const existingDept = await client.query(
      "SELECT id FROM nomedia.departments WHERE LOWER(name) = LOWER($1)",
      [name.trim()]
    );

    if (existingDept.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Un département avec ce nom existe déjà",
      });
    }

    // Create department
    const insertQuery = `
      INSERT INTO nomedia.departments (name, description, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      name.trim(),
      description?.trim() || null,
    ]);

    const newDepartment = {
      ...result.rows[0],
      employee_count: 0,
    };

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      data: newDepartment,
      message: "Département créé avec succès",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating department:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du département",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  } finally {
    client.release();
  }
};

// Update department
export const updateDepartment: RequestHandler = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Le nom du département est obligatoire",
      });
    }

    if (USE_MOCK_DATA) {
      const deptIndex = mockDepartments.findIndex(d => d.id === parseInt(id));
      if (deptIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Département non trouvé",
        });
      }

      mockDepartments[deptIndex] = {
        ...mockDepartments[deptIndex],
        name: name.trim(),
        description: description?.trim() || '',
        updated_at: new Date().toISOString(),
      };

      return res.json({ success: true, data: mockDepartments[deptIndex] });
    }

    await client.query("BEGIN");

    // Check if department exists
    const existingDept = await client.query(
      "SELECT id FROM nomedia.departments WHERE id = $1",
      [id]
    );

    if (existingDept.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Département non trouvé",
      });
    }

    // Check if name conflicts with another department
    const nameConflict = await client.query(
      "SELECT id FROM nomedia.departments WHERE LOWER(name) = LOWER($1) AND id != $2",
      [name.trim(), id]
    );

    if (nameConflict.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Un autre département avec ce nom existe déjà",
      });
    }

    // Update department
    const updateQuery = `
      UPDATE nomedia.departments
      SET name = $1, description = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      name.trim(),
      description?.trim() || null,
      id,
    ]);

    await client.query("COMMIT");

    res.json({
      success: true,
      data: result.rows[0],
      message: "Département mis à jour avec succès",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating department:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du département",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  } finally {
    client.release();
  }
};

// Delete department
export const deleteDepartment: RequestHandler = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    if (USE_MOCK_DATA) {
      const deptIndex = mockDepartments.findIndex(d => d.id === parseInt(id));
      if (deptIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Département non trouvé",
        });
      }

      // Check if department has employees
      const hasEmployees = mockEmployees.some(e => e.department_id === parseInt(id));
      if (hasEmployees) {
        return res.status(400).json({
          success: false,
          message: "Impossible de supprimer un département qui contient des employés",
        });
      }

      mockDepartments.splice(deptIndex, 1);
      return res.json({ success: true, message: "Département supprimé avec succès" });
    }

    await client.query("BEGIN");

    // Check if department exists
    const existingDept = await client.query(
      "SELECT id FROM nomedia.departments WHERE id = $1",
      [id]
    );

    if (existingDept.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Département non trouvé",
      });
    }

    // Check if department has employees
    const employeeCheck = await client.query(
      "SELECT COUNT(*) as count FROM nomedia.employees WHERE department_id = $1",
      [id]
    );

    if (parseInt(employeeCheck.rows[0].count) > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer un département qui contient des employés",
      });
    }

    // Delete department
    await client.query("DELETE FROM nomedia.departments WHERE id = $1", [id]);

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Département supprimé avec succès",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting department:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du département",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  } finally {
    client.release();
  }
};

// Get contract types
export const getContractTypes: RequestHandler = async (req, res) => {
  try {
    if (USE_MOCK_DATA) {
      return res.json(await getMockContractTypes());
    }

    let result;
    try {
      result = await pool.query(
        "SELECT * FROM nomedia.contract_types ORDER BY name",
      );
    } catch (dbError) {
      console.log("Database error, falling back to mock contract types:", dbError.message);
      return res.json(await getMockContractTypes());
    }

    // If database is empty, initialize with default contract types
    if (result.rows.length === 0) {
      console.log("Contract types table empty, initializing with default data...");

      try {
        await pool.query(`
          INSERT INTO nomedia.contract_types (name, is_permanent, description) VALUES
          ('CDI', true, 'Contrat à Durée Indéterminée'),
          ('CDD', false, 'Contrat à Durée Déterminée'),
          ('Freelance', false, 'Travailleur indépendant'),
          ('Stage', false, 'Stage étudiant'),
          ('Consultant', false, 'Consultant externe')
          ON CONFLICT (name) DO NOTHING
        `);

        // Fetch the data again
        result = await pool.query(
          "SELECT * FROM nomedia.contract_types ORDER BY name",
        );

        console.log("✅ Contract types initialized successfully");
      } catch (insertError) {
        console.log("Failed to initialize contract types, using mock data:", insertError.message);
        return res.json(await getMockContractTypes());
      }
    }

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching contract types:", error);
    // Fallback to mock data on any error
    try {
      const mockResponse = await getMockContractTypes();
      console.log("Using mock contract types due to error");
      return res.json(mockResponse);
    } catch (mockError) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des types de contrat",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
