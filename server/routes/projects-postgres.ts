import { RequestHandler } from "express";
import { query, run, get } from "../config/postgres-database";

// Get all projects
export const getProjects: RequestHandler = async (req, res) => {
  try {
    console.log("🚀 Projects GET route hit - PostgreSQL version");

    const projects = await query(`
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
        (SELECT COUNT(*) FROM project_team_members ptm WHERE ptm.project_id = p.id) as team_member_count,
        0 as contracts_compliance
      FROM projects p
      ORDER BY p.created_at DESC
    `);

    console.log(`✅ Found ${projects.length} projects`);

    res.json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    console.error("❌ Error fetching projects:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des projets",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get project by ID
export const getProjectById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🚀 Get project by ID: ${id}`);

    const project = await get(
      `
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
        (SELECT COUNT(*) FROM project_team_members ptm WHERE ptm.project_id = p.id) as team_member_count,
        0 as contracts_compliance
      FROM projects p
      WHERE p.id = $1
    `,
      [id],
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Projet non trouvé",
      });
    }

    // Get team members for this project
    const teamMembers = await query(
      `
      SELECT 
        ptm.id,
        ptm.role,
        ptm.start_date,
        ptm.end_date,
        ptm.hourly_rate,
        ptm.status,
        e.first_name || ' ' || e.last_name as employee_name,
        e.email as employee_email
      FROM project_team_members ptm
      JOIN employees e ON ptm.employee_id = e.id
      WHERE ptm.project_id = $1
      ORDER BY ptm.created_at ASC
    `,
      [id],
    );

    project.team_members = teamMembers;

    console.log(`✅ Found project with ${teamMembers.length} team members`);

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("❌ Error fetching project:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du projet",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create new project
export const createProject: RequestHandler = async (req, res) => {
  try {
    console.log("🚀 Create project route hit");
    console.log("📦 Request body:", JSON.stringify(req.body, null, 2));

    const {
      name,
      clientName,
      description,
      budget,
      startDate,
      deadline,
      status = "pre_production",
      priority = "medium",
      projectType = "production",
      deliverables = [],
      notes = "",
      clientContact = {},
      progress = 0,
      spent = 0,
    } = req.body;

    // Validation
    if (
      !name ||
      !clientName ||
      !description ||
      !budget ||
      !startDate ||
      !deadline
    ) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être remplis",
      });
    }

    if (budget <= 0) {
      return res.status(400).json({
        success: false,
        message: "Le budget doit être supérieur à 0",
      });
    }

    // Insert new project
    const result = await run(
      `
      INSERT INTO projects (
        name, client_name, description, status, priority, budget, spent,
        start_date, deadline, progress, project_type, deliverables, notes,
        client_contact_name, client_contact_email, client_contact_phone,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, client_name, description, status, priority, budget, spent,
               start_date, deadline, progress, project_type, deliverables, notes,
               client_contact_name, client_contact_email, client_contact_phone,
               created_at, updated_at
    `,
      [
        name.trim(),
        clientName.trim(),
        description.trim(),
        status,
        priority,
        parseFloat(budget),
        parseFloat(spent),
        startDate,
        deadline,
        parseInt(progress),
        projectType,
        JSON.stringify(deliverables),
        notes,
        clientContact.name || "",
        clientContact.email || "",
        clientContact.phone || "",
      ],
    );

    const newProject = {
      ...result.rows[0],
      team_member_count: 0,
      contracts_compliance: 0,
    };

    console.log("✅ Project created successfully:", newProject);

    res.status(201).json({
      success: true,
      data: newProject,
      message: "Projet créé avec succès",
    });
  } catch (error) {
    console.error("❌ Error creating project:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du projet",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update project
export const updateProject: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🚀 Update project ${id}`);

    const {
      name,
      client,
      description,
      budget,
      startDate,
      deadline,
      status,
      priority,
      projectType,
      deliverables,
      notes,
      clientContact,
      progress,
      spent,
    } = req.body;

    // Check if project exists
    const existing = await get("SELECT id FROM projects WHERE id = $1", [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Projet non trouvé",
      });
    }

    // Update project
    const result = await run(
      `
      UPDATE projects
      SET name = $1, client_name = $2, description = $3, budget = $4,
          start_date = $5, deadline = $6, status = $7, priority = $8,
          project_type = $9, deliverables = $10, notes = $11,
          client_contact_name = $12, client_contact_email = $13, client_contact_phone = $14,
          progress = $15, spent = $16, updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING id, name, client_name, description, status, priority, budget, spent,
               start_date, deadline, progress, project_type, deliverables, notes,
               client_contact_name, client_contact_email, client_contact_phone,
               created_at, updated_at
    `,
      [
        name,
        client,
        description,
        budget,
        startDate,
        deadline,
        status,
        priority,
        projectType,
        JSON.stringify(deliverables || []),
        notes || "",
        clientContact?.name || "",
        clientContact?.email || "",
        clientContact?.phone || "",
        progress || 0,
        spent || 0,
        id,
      ],
    );

    const updatedProject = {
      ...result.rows[0],
      team_member_count: 0,
      contracts_compliance: 0,
    };

    console.log("✅ Project updated successfully");

    res.json({
      success: true,
      data: updatedProject,
      message: "Projet mis à jour avec succès",
    });
  } catch (error) {
    console.error("❌ Error updating project:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du projet",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete project
export const deleteProject: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🚀 Delete project ${id}`);

    // Check if project exists
    const existing = await get("SELECT id, name FROM projects WHERE id = $1", [
      id,
    ]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Projet non trouvé",
      });
    }

    // Delete project (CASCADE will handle team members)
    const result = await run("DELETE FROM projects WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Projet non trouvé",
      });
    }

    console.log(`✅ Project "${existing.name}" deleted successfully`);

    res.json({
      success: true,
      message: "Projet supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ Error deleting project:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du projet",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Assign employee to project
export const assignEmployeeToProject: RequestHandler = async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const employeeId = parseInt(req.params.employeeId);
    const { role, startDate, endDate, hourlyRate } = req.body;

    console.log(`🚀 Assign employee ${employeeId} to project ${projectId}`);

    // Check if project and employee exist
    const project = await get("SELECT id, name FROM projects WHERE id = $1", [
      projectId,
    ]);
    const employee = await get(
      "SELECT id, first_name, last_name FROM employees WHERE id = $1",
      [employeeId],
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Projet non trouvé",
      });
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employé non trouvé",
      });
    }

    // Check if assignment already exists
    const existingAssignment = await get(
      "SELECT id FROM project_team_members WHERE project_id = $1 AND employee_id = $2",
      [projectId, employeeId],
    );

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: "Cet employé est déjà assigné à ce projet",
      });
    }

    // Insert assignment
    await run(
      `
      INSERT INTO project_team_members (
        project_id, employee_id, role, start_date, end_date, hourly_rate, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
      [
        projectId,
        employeeId,
        role,
        startDate,
        endDate || null,
        hourlyRate || null,
      ],
    );

    console.log(
      `✅ Employee ${employee.first_name} ${employee.last_name} assigned to project ${project.name}`,
    );

    res.status(201).json({
      success: true,
      message: "Employé assigné au projet avec succès",
    });
  } catch (error) {
    console.error("❌ Error assigning employee to project:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'assignation de l'employé au projet",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Remove employee from project
export const removeEmployeeFromProject: RequestHandler = async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const employeeId = parseInt(req.params.employeeId);

    console.log(`🚀 Remove employee ${employeeId} from project ${projectId}`);

    // Check if assignment exists
    const assignment = await get(
      "SELECT id FROM project_team_members WHERE project_id = $1 AND employee_id = $2",
      [projectId, employeeId],
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignation non trouvée",
      });
    }

    // Remove assignment
    const result = await run(
      "DELETE FROM project_team_members WHERE project_id = $1 AND employee_id = $2",
      [projectId, employeeId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Assignation non trouvée",
      });
    }

    console.log("✅ Employee removed from project successfully");

    res.json({
      success: true,
      message: "Employé retiré du projet avec succès",
    });
  } catch (error) {
    console.error("❌ Error removing employee from project:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du retrait de l'employé du projet",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
