import { Router } from 'express';
import { query, run, get } from '../config/sqlite-database';
import { authenticateToken } from './auth-sqlite';
import type { ApiResponse, Employee } from '@shared/api';

const router = Router();

// Middleware to check authentication
router.use(authenticateToken);

// GET /api/employees - Get all employees
router.get('/', async (req, res) => {
  try {
    console.log('Employees GET route hit');

    // Check if contract fields exist and build query accordingly
    let employeesQuery = `
      SELECT 
        e.*,
        d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY e.created_at DESC
    `;

    const employees = query(employeesQuery);

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
});

// GET /api/employees/:id - Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const employee = get(`
      SELECT 
        e.*,
        d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = ?
    `, [id]);

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
});

// POST /api/employees - Create new employee
router.post('/', async (req, res) => {
  try {
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
      status = 'active'
    } = req.body;

    console.log('Creating employee with data:', req.body);

    // Validate required fields
    if (!firstName || !lastName || !email || !position || !departmentId || !salary || !hireDate) {
      return res.status(400).json({
        success: false,
        message: 'Champs obligatoires manquants',
      });
    }

    // Check if email already exists
    const existingEmployee = get('SELECT id FROM employees WHERE email = ?', [email]);
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Un employé avec cet email existe déjà',
      });
    }

    // Insert employee (basic fields only to avoid column errors)
    const result = run(`
      INSERT INTO employees (
        first_name, last_name, email, phone, address, position,
        department_id, salary, hire_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      firstName,
      lastName,
      email,
      phone || '',
      address || '',
      position,
      departmentId,
      parseFloat(salary),
      hireDate,
      status
    ]);

    const employeeId = result.lastInsertRowid;

    // Get the created employee with department info
    const createdEmployee = get(`
      SELECT 
        e.*,
        d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = ?
    `, [employeeId]);

    res.status(201).json({
      success: true,
      data: createdEmployee,
      message: 'Employé créé avec succès',
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'employé',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', async (req, res) => {
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
      status
    } = req.body;

    // Check if employee exists
    const existingEmployee = get('SELECT id FROM employees WHERE id = ?', [id]);
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employé non trouvé',
      });
    }

    // Check if email is taken by another employee
    const emailCheck = get('SELECT id FROM employees WHERE email = ? AND id != ?', [email, id]);
    if (emailCheck) {
      return res.status(400).json({
        success: false,
        message: 'Un autre employé utilise déjà cet email',
      });
    }

    // Update employee (basic fields only)
    run(`
      UPDATE employees SET
        first_name = ?, last_name = ?, email = ?, phone = ?, address = ?,
        position = ?, department_id = ?, salary = ?, hire_date = ?,
        status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      firstName,
      lastName,
      email,
      phone || '',
      address || '',
      position,
      departmentId,
      parseFloat(salary),
      hireDate,
      status,
      id
    ]);

    // Get updated employee with department info
    const updatedEmployee = get(`
      SELECT 
        e.*,
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
      message: 'Erreur lors de la mise à jour de l\'employ��',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/employees/:id - Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check if employee exists
    const employee = get('SELECT id FROM employees WHERE id = ?', [id]);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employé non trouvé',
      });
    }

    // Delete employee
    run('DELETE FROM employees WHERE id = ?', [id]);

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
});

export default router;
