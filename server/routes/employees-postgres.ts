import { RequestHandler } from "express";
import { query, run, get } from "../config/postgres-database";

// Get employee statistics
export const getEmployeeStats: RequestHandler = async (req, res) => {
  try {
    console.log("🚀 Employee stats route hit - PostgreSQL version");

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
      console.log("Contract fields not available, using fallback");
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
          total_departments: 0,
        },
        contractTypes: contractStats || [],
      },
    });
  } catch (error) {
    console.error("❌ Error fetching employee stats:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all employees
export const getEmployees: RequestHandler = async (req, res) => {
  try {
    console.log("🚀 Employees GET route hit - PostgreSQL version");

    const employees = await query(`
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
        (SELECT COUNT(*) FROM project_team_members ptm WHERE ptm.employee_id = e.id AND ptm.status = 'active') as active_projects
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY e.first_name ASC, e.last_name ASC
    `);

    console.log(`✅ Found ${employees.length} employees`);

    res.json({
      success: true,
      data: employees,
      count: employees.length,
    });
  } catch (error) {
    console.error("❌ Error fetching employees:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des employés",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get employee by ID
export const getEmployeeById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🚀 Get employee by ID: ${id}`);

    const employee = await get(
      `
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
      WHERE e.id = $1
    `,
      [id],
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employé non trouvé",
      });
    }

    console.log("✅ Employee found");

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error("❌ Error fetching employee:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'employé",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create new employee
export const createEmployee: RequestHandler = async (req, res) => {
  try {
    console.log("🚀 Create employee route hit");

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
    } = req.body;

    // Validation
    if (
      !firstName ||
      !lastName ||
      !email ||
      !position ||
      !departmentId ||
      !hireDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être remplis",
      });
    }

    // Check if email already exists
    const existingEmployee = await get(
      "SELECT id FROM employees WHERE email = $1",
      [email.toLowerCase()],
    );
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "Un employé avec cet email existe déjà",
      });
    }

    // Insert new employee
    const result = await run(
      `
      INSERT INTO employees (
        first_name, last_name, email, phone, address, position,
        department_id, salary, hire_date, status, contract_type,
        contract_start_date, contract_end_date,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, first_name, last_name, email, phone, address, position,
               department_id, salary, hire_date, status, contract_type,
               contract_start_date, contract_end_date, created_at, updated_at
    `,
      [
        firstName.trim(),
        lastName.trim(),
        email.toLowerCase().trim(),
        phone || null,
        address || null,
        position.trim(),
        parseInt(departmentId),
        salary ? parseFloat(salary) : null,
        hireDate,
        contractType || null,
        contractStartDate || null,
        contractEndDate || null,
      ],
    );

    const newEmployee = result.rows[0];

    console.log("✅ Employee created successfully");

    res.status(201).json({
      success: true,
      data: newEmployee,
      message: "Employé créé avec succès",
    });
  } catch (error) {
    console.error("❌ Error creating employee:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'employé",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update employee
export const updateEmployee: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🚀 Update employee ${id}`);

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
      contractType,
      contractStartDate,
      contractEndDate,
    } = req.body;

    // Check if employee exists
    const existing = await get("SELECT id FROM employees WHERE id = $1", [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Employé non trouvé",
      });
    }

    // Check if email is unique (excluding current employee)
    if (email) {
      const emailConflict = await get(
        "SELECT id FROM employees WHERE email = $1 AND id != $2",
        [email.toLowerCase(), id],
      );
      if (emailConflict) {
        return res.status(400).json({
          success: false,
          message: "Un employé avec cet email existe déjà",
        });
      }
    }

    // Update employee
    const result = await run(
      `
      UPDATE employees
      SET first_name = $1, last_name = $2, email = $3, phone = $4,
          address = $5, position = $6, department_id = $7, salary = $8,
          status = $9, contract_type = $10, contract_start_date = $11,
          contract_end_date = $12, updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING id, first_name, last_name, email, phone, address, position,
               department_id, salary, hire_date, status, contract_type,
               contract_start_date, contract_end_date, created_at, updated_at
    `,
      [
        firstName,
        lastName,
        email?.toLowerCase(),
        phone,
        address,
        position,
        departmentId ? parseInt(departmentId) : null,
        salary ? parseFloat(salary) : null,
        status || "active",
        contractType,
        contractStartDate,
        contractEndDate,
        id,
      ],
    );

    const updatedEmployee = result.rows[0];

    console.log("✅ Employee updated successfully");

    res.json({
      success: true,
      data: updatedEmployee,
      message: "Employé mis à jour avec succès",
    });
  } catch (error) {
    console.error("❌ Error updating employee:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'employé",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete employee
export const deleteEmployee: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🚀 Delete employee ${id}`);

    // Check if employee exists
    const existing = await get(
      "SELECT id, first_name, last_name FROM employees WHERE id = $1",
      [id],
    );
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Employé non trouvé",
      });
    }

    // Check if employee is assigned to active projects
    const activeProjects = await get(
      "SELECT COUNT(*) as count FROM project_team_members WHERE employee_id = $1 AND status = $2",
      [id, "active"],
    );

    if (activeProjects && activeProjects.count > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Impossible de supprimer un employé assigné à des projets actifs",
      });
    }

    // Delete employee
    const result = await run("DELETE FROM employees WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Employé non trouvé",
      });
    }

    console.log(
      `✅ Employee "${existing.first_name} ${existing.last_name}" deleted successfully`,
    );

    res.json({
      success: true,
      message: "Employé supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ Error deleting employee:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'employé",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
