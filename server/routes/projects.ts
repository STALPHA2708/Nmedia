import { RequestHandler } from "express";
import { pool } from "../config/database";

// Get all projects with team and contract information
export const getProjects: RequestHandler = async (req, res) => {
  try {
    console.log('Projects GET route hit');

    // Set proper headers to ensure JSON response
    res.setHeader('Content-Type', 'application/json');
    // First ensure the projects table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nomedia.projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        client_name VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pre_production' CHECK (status IN ('pre_production', 'production', 'post_production', 'completed')),
        priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        budget DECIMAL(12,2) NOT NULL,
        spent DECIMAL(12,2) DEFAULT 0,
        start_date DATE NOT NULL,
        deadline DATE NOT NULL,
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        project_type VARCHAR(50),
        deliverables TEXT[],
        notes TEXT,
        client_contact_name VARCHAR(100),
        client_contact_email VARCHAR(100),
        client_contact_phone VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Simple query with safe field mapping for frontend compatibility
    const query = `
      SELECT
        p.id,
        p.name,
        p.client_name,
        p.description,
        p.status,
        p.priority,
        p.budget,
        p.spent,
        p.start_date,
        p.deadline,
        p.progress,
        p.project_type,
        p.deliverables,
        p.notes,
        p.client_contact_name,
        p.client_contact_email,
        p.client_contact_phone,
        p.created_at,
        p.updated_at,
        0 as team_member_count,
        0 as contracts_compliance,
        '[]'::json as team_members
      FROM nomedia.projects p
      ORDER BY p.created_at DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des projets",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Get project by ID with detailed information
export const getProjectById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Get project basic info
    const projectQuery = `
      SELECT * FROM nomedia.projects WHERE id = $1
    `;

    // Get project assignments with employee details
    const assignmentsQuery = `
      SELECT 
        pa.*,
        e.first_name,
        e.last_name,
        e.email,
        e.phone,
        e.position as employee_position,
        d.name as department_name,
        ec.status as contract_status,
        ec.contract_file_name,
        ct.name as contract_type
      FROM project_assignments pa
      JOIN nomedia.employees e ON pa.employee_id = e.id
      LEFT JOIN nomedia.departments d ON e.department_id = d.id
      LEFT JOIN nomedia.contracts ec ON e.id = ec.employee_id AND ec.status = 'active'
      LEFT JOIN nomedia.contract_types ct ON ec.contract_type_id = ct.id
      WHERE pa.project_id = $1
      ORDER BY pa.start_date
    `;

    const [project, assignments] = await Promise.all([
      pool.query(projectQuery, [id]),
      pool.query(assignmentsQuery, [id]),
    ]);

    if (project.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Projet non trouvé",
      });
    }

    res.json({
      success: true,
      data: {
        ...project.rows[0],
        assignments: assignments.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching project details:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des détails du projet",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Create new project
export const createProject: RequestHandler = async (req, res) => {
  const client = await pool.connect();

  try {
    console.log('CREATE PROJECT: Received request body:', req.body);
    await client.query("BEGIN");

    const {
      name,
      client: clientName,
      description,
      budget,
      startDate,
      deadline,
      status,
      priority,
      teamMembers,
      projectType,
      deliverables,
      notes,
      clientContact,
    } = req.body;

    console.log('CREATE PROJECT: Extracted fields:', {
      name,
      clientName,
      description,
      budget,
      startDate,
      deadline,
      status,
      priority
    });

    // Validate required fields
    if (!name || !clientName || !description || !budget || !startDate || !deadline) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être remplis",
      });
    }

    // Insert project
    const projectQuery = `
      INSERT INTO nomedia.projects (
        name, client_name, description, budget, start_date, deadline, 
        status, priority, progress, spent, project_type, deliverables, 
        notes, client_contact_name, client_contact_email, client_contact_phone
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const projectResult = await client.query(projectQuery, [
      name,
      clientName,
      description,
      budget,
      startDate,
      deadline,
      status || 'pre_production',
      priority || 'medium',
      projectType || 'production',
      JSON.stringify(deliverables || []),
      notes || '',
      clientContact?.name || '',
      clientContact?.email || '',
      clientContact?.phone || '',
    ]);

    const projectId = projectResult.rows[0].id;

    // Add team members if provided
    if (teamMembers && teamMembers.length > 0) {
      for (const member of teamMembers) {
        if (member.employeeId) {
          const assignmentQuery = `
            INSERT INTO nomedia.project_assignments (
              project_id, employee_id, role, start_date, end_date, 
              hourly_rate, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'active')
          `;

          await client.query(assignmentQuery, [
            projectId,
            member.employeeId,
            member.role || 'Team Member',
            member.startDate || startDate,
            member.endDate || deadline,
            member.hourlyRate || null,
          ]);
        }
      }
    }

    await client.query("COMMIT");

    // Fetch the complete project data to return
    const completeProject = await pool.query(
      `
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'employee_id', pa.employee_id,
              'employee_name', CONCAT(e.first_name, ' ', e.last_name),
              'role', pa.role,
              'start_date', pa.start_date,
              'end_date', pa.end_date
            )
          ) FILTER (WHERE pa.employee_id IS NOT NULL),
          '[]'::json
        ) as team_members
      FROM nomedia.projects p
      LEFT JOIN nomedia.project_assignments pa ON p.id = pa.project_id AND pa.status = 'active'
      LEFT JOIN nomedia.employees e ON pa.employee_id = e.id
      WHERE p.id = $1
      GROUP BY p.id
    `,
      [projectId],
    );

    res.status(201).json({
      success: true,
      message: "Projet créé avec succès",
      data: completeProject.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating project:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du projet",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  } finally {
    client.release();
  }
};

// Update project
export const updateProject: RequestHandler = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const {
      name,
      client: clientName,
      description,
      budget,
      startDate,
      deadline,
      status,
      priority,
      progress,
      spent,
      projectType,
      deliverables,
      notes,
      clientContact,
    } = req.body;

    const query = `
      UPDATE nomedia.projects 
      SET 
        name = $1,
        client_name = $2,
        description = $3,
        budget = $4,
        start_date = $5,
        deadline = $6,
        status = $7,
        priority = $8,
        progress = $9,
        spent = $10,
        project_type = $11,
        deliverables = $12,
        notes = $13,
        client_contact_name = $14,
        client_contact_email = $15,
        client_contact_phone = $16,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING *
    `;

    const result = await client.query(query, [
      name,
      clientName,
      description,
      budget,
      startDate,
      deadline,
      status,
      priority,
      progress || 0,
      spent || 0,
      projectType,
      JSON.stringify(deliverables || []),
      notes || '',
      clientContact?.name || '',
      clientContact?.email || '',
      clientContact?.phone || '',
      id,
    ]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Projet non trouvé",
      });
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Projet mis à jour avec succès",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating project:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du projet",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  } finally {
    client.release();
  }
};

// Delete project
export const deleteProject: RequestHandler = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;

    // Check if project has active assignments
    const activeAssignments = await client.query(
      "SELECT COUNT(*) FROM nomedia.project_assignments WHERE project_id = $1 AND status = $2",
      [id, "active"],
    );

    if (parseInt(activeAssignments.rows[0].count) > 0) {
      // Update assignments to inactive instead of deleting
      await client.query(
        "UPDATE nomedia.project_assignments SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE project_id = $1 AND status = 'active'",
        [id]
      );
    }

    // Delete project
    const result = await client.query(
      "DELETE FROM nomedia.projects WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Projet non trouvé",
      });
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Projet supprimé avec succès",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting project:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du projet",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  } finally {
    client.release();
  }
};

// Assign employee to project
export const assignEmployeeToProject: RequestHandler = async (req, res) => {
  try {
    const { projectId, employeeId } = req.params;
    const { role, startDate, endDate, hourlyRate } = req.body;

    // Check if assignment already exists
    const existingAssignment = await pool.query(
      "SELECT id FROM nomedia.project_assignments WHERE project_id = $1 AND employee_id = $2 AND status = 'active'",
      [projectId, employeeId]
    );

    if (existingAssignment.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "L'employé est déjà assigné à ce projet",
      });
    }

    const query = `
      INSERT INTO nomedia.project_assignments (
        project_id, employee_id, role, start_date, end_date, hourly_rate, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING *
    `;

    const result = await pool.query(query, [
      projectId,
      employeeId,
      role || 'Team Member',
      startDate,
      endDate,
      hourlyRate,
    ]);

    res.status(201).json({
      success: true,
      message: "Employé assigné au projet avec succès",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error assigning employee to project:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'assignation de l'employé au projet",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Remove employee from project
export const removeEmployeeFromProject: RequestHandler = async (req, res) => {
  try {
    const { projectId, employeeId } = req.params;

    const result = await pool.query(
      "UPDATE nomedia.project_assignments SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE project_id = $1 AND employee_id = $2 AND status = 'active' RETURNING *",
      [projectId, employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Assignation non trouvée",
      });
    }

    res.json({
      success: true,
      message: "Employé retiré du projet avec succès",
    });
  } catch (error) {
    console.error("Error removing employee from project:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du retrait de l'employé du projet",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Get project statistics
export const getProjectStats: RequestHandler = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'pre_production' THEN 1 END) as pre_production_projects,
        COUNT(CASE WHEN status = 'production' THEN 1 END) as production_projects,
        COUNT(CASE WHEN status = 'post_production' THEN 1 END) as post_production_projects,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
        COALESCE(SUM(budget), 0) as total_budget,
        COALESCE(SUM(spent), 0) as total_spent,
        COALESCE(AVG(progress), 0) as average_progress
      FROM projects
    `;

    const priorityStatsQuery = `
      SELECT 
        priority,
        COUNT(*) as count
      FROM projects
      GROUP BY priority
      ORDER BY 
        CASE priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END
    `;

    const [stats, priorityStats] = await Promise.all([
      pool.query(statsQuery),
      pool.query(priorityStatsQuery),
    ]);

    res.json({
      success: true,
      data: {
        general: stats.rows[0],
        priorities: priorityStats.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching project statistics:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques des projets",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
