import { RequestHandler } from "express";
import { query, run, get } from "../config/unified-database";

// Get all projects
export const getProjects: RequestHandler = async (req, res) => {
  try {
    console.log('Projects GET route hit - SQLite version');
    
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
        (SELECT COUNT(*) FROM project_team_members ptm WHERE ptm.project_id = p.id) as team_member_count
      FROM projects p
      ORDER BY p.created_at DESC
    `);

    res.json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des projets',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get project by ID
export const getProjectById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Validate ID parameter
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de projet invalide',
      });
    }
    
    const project = get(`
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
        p.updated_at
      FROM projects p
      WHERE p.id = ?
    `, [id]);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé',
      });
    }

    // Get team members for this project
    const teamMembers = query(`
      SELECT 
        ptm.id,
        ptm.role,
        ptm.created_at,
        e.id as employee_id,
        e.first_name,
        e.last_name,
        e.email,
        e.position,
        d.name as department_name
      FROM project_team_members ptm
      JOIN employees e ON ptm.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ptm.project_id = ?
      ORDER BY ptm.created_at
    `, [id]);

    res.json({
      success: true,
      data: {
        ...project,
        team_members: teamMembers
      },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du projet',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Create new project
export const createProject: RequestHandler = async (req, res) => {
  try {
    const { 
      name, 
      clientName, 
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
      teamMembers 
    } = req.body;

    if (!name || !clientName || !budget || !startDate || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Les champs nom, client, budget, date de début et date limite sont requis',
      });
    }

    // Insert project
    const result = run(`
      INSERT INTO projects (
        name, client_name, description, budget, start_date, deadline, 
        status, priority, project_type, deliverables, notes, 
        client_contact_name, client_contact_email, client_contact_phone,
        progress, spent
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
    `, [
      name, 
      clientName, 
      description || '', 
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
      clientContact?.phone || ''
    ]);

    const projectId = result.lastInsertRowid;

    // Add team members if provided
    if (teamMembers && teamMembers.length > 0) {
      for (const member of teamMembers) {
        if (member.employeeId) {
          run(`
            INSERT INTO project_team_members (project_id, employee_id, role)
            VALUES (?, ?, ?)
          `, [projectId, member.employeeId, member.role || 'member']);
        }
      }
    }

    // Get the created project
    const newProject = get(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM project_team_members ptm WHERE ptm.project_id = p.id) as team_member_count
      FROM projects p
      WHERE p.id = ?
    `, [projectId]);

    res.status(201).json({
      success: true,
      data: newProject,
      message: 'Projet créé avec succès',
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du projet',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update project
export const updateProject: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Validate ID parameter
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de projet invalide',
      });
    }
    const { 
      name, 
      clientName, 
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
      clientContact 
    } = req.body;

    if (!name || !clientName || !budget || !startDate || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Les champs nom, client, budget, date de début et date limite sont requis',
      });
    }

    // Check if project exists
    const existing = get('SELECT id FROM projects WHERE id = ?', [id]);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé',
      });
    }

    // Update project
    run(`
      UPDATE projects 
      SET name = ?, client_name = ?, description = ?, budget = ?, start_date = ?, 
          deadline = ?, status = ?, priority = ?, progress = ?, spent = ?,
          project_type = ?, deliverables = ?, notes = ?, 
          client_contact_name = ?, client_contact_email = ?, client_contact_phone = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name, clientName, description || '', budget, startDate, deadline,
      status || 'pre_production', priority || 'medium', progress || 0, spent || 0,
      projectType || 'production', JSON.stringify(deliverables || []), notes || '',
      clientContact?.name || '', clientContact?.email || '', clientContact?.phone || '',
      id
    ]);

    // Get updated project
    const updatedProject = get(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM project_team_members ptm WHERE ptm.project_id = p.id) as team_member_count
      FROM projects p
      WHERE p.id = ?
    `, [id]);

    res.json({
      success: true,
      data: updatedProject,
      message: 'Projet mis à jour avec succès',
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du projet',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete project
export const deleteProject: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Validate ID parameter
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de projet invalide',
      });
    }

    // Check if project exists
    const existing = get('SELECT id FROM projects WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé',
      });
    }

    console.log(`Attempting to delete project ID: ${id}`);

    // Delete all related records in the correct order to avoid foreign key constraints

    // 1. Delete project team members first (if table exists)
    try {
      const teamMembersResult = run('DELETE FROM project_team_members WHERE project_id = ?', [id]);
      console.log(`Deleted ${teamMembersResult.changes} team member assignments`);
    } catch (error) {
      console.log('Note: project_team_members table may not exist yet or no assignments found');
    }

    // 2. Update invoices to remove project reference (set project_id to NULL instead of deleting)
    try {
      const invoicesResult = run('UPDATE invoices SET project_id = NULL WHERE project_id = ?', [id]);
      console.log(`Updated ${invoicesResult.changes} invoices to remove project reference`);
    } catch (error) {
      console.log('Note: Could not update invoices project_id');
    }

    // 3. Update expenses to remove project reference (set project_id to NULL instead of deleting)
    try {
      const expensesResult = run('UPDATE expenses SET project_id = NULL WHERE project_id = ?', [id]);
      console.log(`Updated ${expensesResult.changes} expenses to remove project reference`);
    } catch (error) {
      console.log('Note: Could not update expenses project_id');
    }

    // 4. Finally delete the project
    console.log('Attempting to delete the project itself...');
    const result = run('DELETE FROM projects WHERE id = ?', [id]);
    console.log(`Project deletion result: ${result.changes} rows affected`);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé',
      });
    }

    res.json({
      success: true,
      message: 'Projet supprim�� avec succès',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du projet',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Assign employee to project
export const assignEmployeeToProject: RequestHandler = async (req, res) => {
  try {
    const { projectId, employeeId } = req.params;
    const { role } = req.body;

    // Check if assignment already exists
    const existing = get(
      'SELECT id FROM project_team_members WHERE project_id = ? AND employee_id = ?', 
      [projectId, employeeId]
    );
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'L\'employé est déjà assigné à ce projet',
      });
    }

    // Create assignment
    const result = run(`
      INSERT INTO project_team_members (project_id, employee_id, role)
      VALUES (?, ?, ?)
    `, [projectId, employeeId, role || 'member']);

    // Get assignment details
    const assignment = get(`
      SELECT 
        ptm.id,
        ptm.role,
        ptm.created_at,
        e.first_name,
        e.last_name,
        e.email,
        e.position
      FROM project_team_members ptm
      JOIN employees e ON ptm.employee_id = e.id
      WHERE ptm.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Employé assigné au projet avec succès',
    });
  } catch (error) {
    console.error('Error assigning employee to project:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'assignation de l\'employé au projet',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Remove employee from project
export const removeEmployeeFromProject: RequestHandler = async (req, res) => {
  try {
    const { projectId, employeeId } = req.params;

    const result = run(
      'DELETE FROM project_team_members WHERE project_id = ? AND employee_id = ?',
      [projectId, employeeId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignation non trouvée',
      });
    }

    res.json({
      success: true,
      message: 'Employé retiré du projet avec succès',
    });
  } catch (error) {
    console.error('Error removing employee from project:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du retrait de l\'employé du projet',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
