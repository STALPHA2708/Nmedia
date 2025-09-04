import { Router } from 'express';
import { query, run, get } from '../config/sqlite-database';
import { authenticateToken } from './auth-sqlite';
import type { ApiResponse, Project } from '@shared/api';

const router = Router();

// Middleware to check authentication
router.use(authenticateToken);

// GET /api/projects - Get all projects
router.get('/', async (req, res) => {
  try {
    console.log('Projects GET route hit');

    const projects = query(`
      SELECT *
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
});

// GET /api/projects/:id - Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const project = get(`
      SELECT *
      FROM projects p
      WHERE p.id = ?
    `, [id]);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé',
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du projet',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/projects - Create new project  
router.post('/', async (req, res) => {
  try {
    const {
      name,
      client,
      description,
      budget,
      startDate,
      deadline,
      status = 'pre_production',
      priority = 'medium',
      projectType,
      deliverables = [],
      notes,
      clientContact
    } = req.body;

    console.log('Creating project with data:', req.body);

    // Validate required fields
    if (!name || !client || !description || !budget || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Champs obligatoires manquants: nom, client, description, budget, deadline',
      });
    }

    // Insert project
    const result = run(`
      INSERT INTO projects (
        name, client_name, description, status, priority, budget, spent, 
        start_date, deadline, progress, project_type, deliverables, notes,
        client_contact_name, client_contact_email, client_contact_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      client,
      description,
      status,
      priority,
      parseFloat(budget),
      0, // spent starts at 0
      startDate,
      deadline,
      0, // progress starts at 0
      projectType || 'production',
      JSON.stringify(deliverables),
      notes || '',
      clientContact?.name || '',
      clientContact?.email || '',
      clientContact?.phone || ''
    ]);

    const projectId = result.lastInsertRowid;

    // Get the created project
    const createdProject = get(`
      SELECT *
      FROM projects p
      WHERE p.id = ?
    `, [projectId]);

    res.status(201).json({
      success: true,
      data: createdProject,
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
});

export default router;
