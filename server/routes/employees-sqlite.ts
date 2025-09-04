import { RequestHandler } from "express";
import { query, run, get } from "../config/unified-database";
import jwt from 'jsonwebtoken';

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token d\'accès requis',
    });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token invalide',
      });
    }
    req.user = user;
    next();
  });
};

// Get employee statistics
export const getEmployeeStats: RequestHandler = async (req, res) => {
  try {
    console.log('Employee stats route hit');

    // Get general employee statistics
    const stats = await get(`
      SELECT
        COUNT(*) as total_employees,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_employees,
        COUNT(CASE WHEN status = 'on_leave' THEN 1 END) as on_leave_employees,
        COALESCE(SUM(CASE WHEN status = 'active' THEN salary ELSE 0 END), 0) as total_active_payroll,
        COUNT(DISTINCT department_id) as total_departments
      FROM employees
    `);

    // Get contract type statistics
    let contractStats;
    try {
      contractStats = await query(`
        SELECT
          contract_type,
          COUNT(*) as count,
          AVG(salary) as avg_salary
        FROM employees
        WHERE contract_type IS NOT NULL
        GROUP BY contract_type
        ORDER BY count DESC
      `);
    } catch (error) {
      console.log('Contract fields not available, using fallback');
      contractStats = [];
    }

    res.json({
      success: true,
      data: {
        general: stats || {
          total_employees: 0,
          active_employees: 0,
          inactive_employees: 0,
          on_leave_employees: 0,
          total_active_payroll: 0,
          total_departments: 0
        },
        contractTypes: contractStats || []
      },
    });
  } catch (error) {
    console.error('Error fetching employee statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques des employés',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get all employees
export const getEmployees: RequestHandler = async (req, res) => {
  try {
    console.log('Employees GET route hit');
    
    let employees;
    try {
      // Try with contract fields first
      employees = await query(`
        SELECT
          e.id,
          e.first_name,
          e.last_name,
          e.email,
          e.phone,
          e.address,
          e.position,
          e.department_id,
          e.salary,
          e.hire_date,
          e.status,
          e.avatar_url,
          e.contract_type,
          e.contract_start_date,
          e.contract_end_date,
          e.contract_file_name,
          e.created_at,
          e.updated_at,
          d.name as department_name,
          (SELECT COUNT(*) FROM project_team_members ptm WHERE ptm.employee_id = e.id) as active_projects
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        ORDER BY e.first_name, e.last_name
      `);
    } catch (columnError) {
      console.warn('Contract columns not found, using basic employee query');
      // Fallback without contract fields
      employees = await query(`
        SELECT 
          e.id,
          e.first_name,
          e.last_name,
          e.email,
          e.phone,
          e.address,
          e.position,
          e.department_id,
          e.salary,
          e.hire_date,
          e.status,
          e.avatar_url,
          e.created_at,
          e.updated_at,
          d.name as department_name,
          0 as active_projects
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        ORDER BY e.first_name, e.last_name
      `);
    }

    res.json({
      success: true,
      data: employees,
      count: employees.length,
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des employés',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get employee by ID
export const getEmployeeById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    let employee;
    try {
      employee = await get(`
        SELECT 
          e.id,
          e.first_name,
          e.last_name,
          e.email,
          e.phone,
          e.address,
          e.position,
          e.department_id,
          e.salary,
          e.hire_date,
          e.status,
          e.avatar_url,
          e.contract_type,
          e.contract_start_date,
          e.contract_end_date,
          e.contract_file_name,
          e.created_at,
          e.updated_at,
          d.name as department_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.id = ?
      `, [id]);
    } catch (columnError) {
      employee = await get(`
        SELECT 
          e.id,
          e.first_name,
          e.last_name,
          e.email,
          e.phone,
          e.address,
          e.position,
          e.department_id,
          e.salary,
          e.hire_date,
          e.status,
          e.avatar_url,
          e.created_at,
          e.updated_at,
          d.name as department_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.id = ?
      `, [id]);
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employé non trouvé',
      });
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'employé',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Create new employee
export const createEmployee: RequestHandler = async (req, res) => {
  try {
    console.log('Create employee request received:', req.body);

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
      contractFileName
    } = req.body;

    console.log('Extracted fields:', { firstName, lastName, email, departmentId, salary });

    // Enhanced validation with detailed logging
    if (!firstName || !lastName || !email) {
      console.log('Validation failed: missing required fields', {
        firstName: !!firstName,
        lastName: !!lastName,
        email: !!email
      });
      return res.status(400).json({
        success: false,
        message: 'Le prénom, nom et email sont requis',
      });
    }

    if (!departmentId || isNaN(parseInt(departmentId))) {
      console.log('Validation failed: invalid department ID');
      return res.status(400).json({
        success: false,
        message: 'Un département valide doit être sélectionné',
      });
    }

    if (!salary || isNaN(parseFloat(salary)) || parseFloat(salary) <= 0) {
      console.log('Validation failed: invalid salary');
      return res.status(400).json({
        success: false,
        message: 'Le salaire doit être un nombre positif',
      });
    }

    if (!hireDate) {
      console.log('Validation failed: missing hire date');
      return res.status(400).json({
        success: false,
        message: 'La date d\'embauche est requise',
      });
    }

    // Validate contract fields if provided
    if (contractType && !contractStartDate) {
      console.log('Validation failed: contract type provided but no start date');
      return res.status(400).json({
        success: false,
        message: 'La date de début du contrat est requise quand un type de contrat est spécifié',
      });
    }

    // Check if employee with this email already exists
    const existing = await get('SELECT id FROM employees WHERE email = ?', [email]);

    if (existing) {
      console.log(`Validation failed: employee with email ${email} already exists (ID: ${existing.id})`);
      return res.status(400).json({
        success: false,
        message: 'Un employé avec cet email existe déjà',
        field: 'email',
        value: email
      });
    }

    let result;
    try {
      // Try inserting with contract fields
      result = await run(`
        INSERT INTO employees (
          first_name, last_name, email, phone, address, position, 
          department_id, salary, hire_date, contract_type, 
          contract_start_date, contract_end_date, contract_file_name
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        firstName, lastName, email, phone, address, position,
        departmentId, salary, hireDate, contractType,
        contractStartDate, contractEndDate, contractFileName
      ]);
    } catch (columnError) {
      console.warn('Contract columns not found, creating employee without contract fields');
      // Fallback without contract fields
      result = await run(`
        INSERT INTO employees (
          first_name, last_name, email, phone, address, position, 
          department_id, salary, hire_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        firstName, lastName, email, phone, address, position,
        departmentId, salary, hireDate
      ]);
    }

    // Get the created employee
    const newEmployee = await get(`
      SELECT 
        e.id,
        e.first_name,
        e.last_name,
        e.email,
        e.phone,
        e.address,
        e.position,
        e.department_id,
        e.salary,
        e.hire_date,
        e.status,
        e.created_at,
        e.updated_at,
        d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json({
      success: true,
      data: newEmployee,
      message: 'Employé créé avec succès',
    });
  } catch (error) {
    console.error('Error creating employee:', error);

    // Check if it's a SQLite constraint error
    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed: employees.email')) {
        console.log('SQLite unique constraint failed for email:', email);
        return res.status(400).json({
          success: false,
          message: 'Un employé avec cet email existe déjà',
          field: 'email',
          value: email
        });
      }

      if (error.message.includes('FOREIGN KEY constraint failed')) {
        console.log('Foreign key constraint failed, invalid department ID:', departmentId);
        return res.status(400).json({
          success: false,
          message: 'Département invalide sélectionné',
          field: 'departmentId',
          value: departmentId
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'employé',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update employee
export const updateEmployee: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
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
      status,
      contractType, 
      contractStartDate, 
      contractEndDate, 
      contractFileName 
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Le prénom, nom et email sont requis',
      });
    }

    // Check if employee exists
    const existing = await get('SELECT id FROM employees WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Employé non trouvé',
      });
    }

    // Check if another employee with this email exists
    const emailConflict = await get('SELECT id FROM employees WHERE email = ? AND id != ?', [email, id]);
    
    if (emailConflict) {
      return res.status(400).json({
        success: false,
        message: 'Un autre employé avec cet email existe déjà',
      });
    }

    try {
      // Try updating with contract fields
      await run(`
        UPDATE employees 
        SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?, 
            position = ?, department_id = ?, salary = ?, hire_date = ?, 
            status = ?, contract_type = ?, contract_start_date = ?, 
            contract_end_date = ?, contract_file_name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        firstName, lastName, email, phone, address, 
        position, departmentId, salary, hireDate, 
        status, contractType, contractStartDate, 
        contractEndDate, contractFileName, id
      ]);
    } catch (columnError) {
      console.warn('Contract columns not found, updating employee without contract fields');
      // Fallback without contract fields
      await run(`
        UPDATE employees 
        SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?, 
            position = ?, department_id = ?, salary = ?, hire_date = ?, 
            status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        firstName, lastName, email, phone, address, 
        position, departmentId, salary, hireDate, 
        status, id
      ]);
    }

    // Get updated employee
    const updatedEmployee = await get(`
      SELECT 
        e.id,
        e.first_name,
        e.last_name,
        e.email,
        e.phone,
        e.address,
        e.position,
        e.department_id,
        e.salary,
        e.hire_date,
        e.status,
        e.created_at,
        e.updated_at,
        d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = ?
    `, [id]);

    res.json({
      success: true,
      data: updatedEmployee,
      message: 'Employé mis à jour avec succès',
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'employé',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete employee
export const deleteEmployee: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check if employee exists
    const existing = await get('SELECT id FROM employees WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Employé non trouvé',
      });
    }

    // Delete all related records in the correct order to avoid foreign key constraints

    // 1. Delete project team member assignments (if table exists)
    try {
      await run('DELETE FROM project_team_members WHERE employee_id = ?', [id]);
    } catch (error) {
      console.log('Note: project_team_members table may not exist yet');
    }

    // 2. Update expenses to remove employee reference (set employee_id to NULL instead of deleting)
    try {
      await run('UPDATE expenses SET employee_id = NULL WHERE employee_id = ?', [id]);
    } catch (error) {
      console.log('Note: Could not update expenses employee_id');
    }

    // 3. Finally delete the employee
    const result = await run('DELETE FROM employees WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employé non trouvé',
      });
    }

    res.json({
      success: true,
      message: 'Employé supprimé avec succès',
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'employé',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
