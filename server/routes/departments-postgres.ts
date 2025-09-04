import { RequestHandler } from "express";
import { query, run, get } from "../config/postgres-database";

// Get all departments
export const getDepartments: RequestHandler = async (req, res) => {
  try {
    console.log("Departments GET route hit");

    const departments = await query(`
      SELECT
        d.id,
        d.name,
        d.description,
        d.created_at,
        d.updated_at,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id
      GROUP BY d.id, d.name, d.description, d.created_at, d.updated_at
      ORDER BY d.name
    `);

    res.json({
      success: true,
      data: departments,
      count: departments.length,
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des départements",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get department by ID
export const getDepartmentById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const department = await get(
      `
      SELECT
        d.id,
        d.name,
        d.description,
        d.created_at,
        d.updated_at,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id
      WHERE d.id = $1
      GROUP BY d.id, d.name, d.description, d.created_at, d.updated_at
    `,
      [id],
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Département non trouvé",
      });
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error("Error fetching department:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du département",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create new department
export const createDepartment: RequestHandler = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Le nom du département est requis",
      });
    }

    // Check if department with this name already exists
    const existing = await get("SELECT id FROM departments WHERE name = $1", [
      name,
    ]);

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Un département avec ce nom existe déjà",
      });
    }

    // Insert new department and get the created record
    const result = await run(
      `
      INSERT INTO departments (name, description)
      VALUES ($1, $2)
      RETURNING id, name, description, created_at, updated_at
    `,
      [name, description || null],
    );

    const newDepartment = {
      ...result.rows[0],
      employee_count: 0,
    };

    res.status(201).json({
      success: true,
      data: newDepartment,
      message: "Département créé avec succès",
    });
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du département",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update department
export const updateDepartment: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Le nom du département est requis",
      });
    }

    // Check if department exists
    const existing = await get("SELECT id FROM departments WHERE id = $1", [
      id,
    ]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Département non trouvé",
      });
    }

    // Check if another department with this name exists
    const nameConflict = await get(
      "SELECT id FROM departments WHERE name = $1 AND id != $2",
      [name, id],
    );

    if (nameConflict) {
      return res.status(400).json({
        success: false,
        message: "Un département avec ce nom existe déjà",
      });
    }

    // Update department
    await run(
      `
      UPDATE departments
      SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `,
      [name, description || null, id],
    );

    // Get updated department with employee count
    const updatedDepartment = await get(
      `
      SELECT
        d.id,
        d.name,
        d.description,
        d.created_at,
        d.updated_at,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id
      WHERE d.id = $1
      GROUP BY d.id, d.name, d.description, d.created_at, d.updated_at
    `,
      [id],
    );

    res.json({
      success: true,
      data: updatedDepartment,
      message: "Département mis à jour avec succès",
    });
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du département",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete department
export const deleteDepartment: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check if department exists
    const existing = await get("SELECT id FROM departments WHERE id = $1", [
      id,
    ]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Département non trouvé",
      });
    }

    // Check if department has employees
    const employeeCount = await get(
      "SELECT COUNT(*) as count FROM employees WHERE department_id = $1",
      [id],
    );

    if (employeeCount && employeeCount.count > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Impossible de supprimer un département qui contient des employés",
      });
    }

    // Delete department
    const result = await run("DELETE FROM departments WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Département non trouvé",
      });
    }

    res.json({
      success: true,
      message: "Département supprimé avec succès",
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du département",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
