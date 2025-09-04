import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import type { ApiResponse } from '@shared/api';

const router = Router();

// JWT secret - in production this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token d\'accès manquant',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token invalide ou expiré',
    });
  }
};

// Expense categories
const EXPENSE_CATEGORIES = [
  'Transport',
  'Hébergement',
  'Repas',
  'Matériel',
  'Communication',
  'Formation',
  'Bureautique',
  'Marketing',
  'Autre'
];

// GET /api/expenses - Get all expenses
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('Expenses GET route hit');

    // First ensure the table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nomedia.expenses (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES nomedia.employees(id),
        project_id INTEGER REFERENCES nomedia.projects(id),
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        receipt_file VARCHAR(255),
        expense_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        approved_by INTEGER REFERENCES nomedia.users(id),
        approved_at TIMESTAMP WITH TIME ZONE,
        rejection_reason TEXT,
        reimbursement_date DATE,
        reimbursement_method VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    let query = `
      SELECT 
        e.*,
        emp.first_name || ' ' || emp.last_name as employee_name,
        p.name as project_name,
        approver.name as approved_by_name
      FROM nomedia.expenses e
      LEFT JOIN nomedia.employees emp ON e.employee_id = emp.id
      LEFT JOIN nomedia.projects p ON e.project_id = p.id
      LEFT JOIN nomedia.users approver ON e.approved_by = approver.id
    `;

    const queryParams: any[] = [];

    // Filter by user role
    if (req.user.role === 'user') {
      // Users can only see their own expenses
      query += ` WHERE e.employee_id = (
        SELECT id FROM nomedia.employees WHERE id = 
        (SELECT id FROM nomedia.users WHERE id = $1)
      )`;
      queryParams.push(req.user.id);
    }

    query += ` ORDER BY e.created_at DESC`;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des dépenses',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/expenses/categories - Get expense categories
router.get('/categories', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    data: EXPENSE_CATEGORIES,
  });
});

// GET /api/expenses/stats - Get expense statistics (admin/manager only)
router.get('/stats', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé',
    });
  }

  try {
    const query = `
      SELECT 
        COUNT(*) as total_expenses,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_expenses,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_expenses,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_expenses,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) as approved_amount,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount
      FROM nomedia.expenses
    `;

    const result = await pool.query(query);
    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        total_expenses: parseInt(stats.total_expenses),
        pending_expenses: parseInt(stats.pending_expenses),
        approved_expenses: parseInt(stats.approved_expenses),
        rejected_expenses: parseInt(stats.rejected_expenses),
        total_amount: parseFloat(stats.total_amount),
        approved_amount: parseFloat(stats.approved_amount),
        pending_amount: parseFloat(stats.pending_amount),
      },
    });
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/expenses/:id - Get expense by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = `
      SELECT 
        e.*,
        emp.first_name || ' ' || emp.last_name as employee_name,
        p.name as project_name,
        approver.name as approved_by_name
      FROM nomedia.expenses e
      LEFT JOIN nomedia.employees emp ON e.employee_id = emp.id
      LEFT JOIN nomedia.projects p ON e.project_id = p.id
      LEFT JOIN nomedia.users approver ON e.approved_by = approver.id
      WHERE e.id = $1
    `;

    const queryParams = [id];

    // Additional authorization check for users
    if (req.user.role === 'user') {
      query += ` AND e.employee_id = (
        SELECT id FROM nomedia.employees WHERE id = 
        (SELECT id FROM nomedia.users WHERE id = $2)
      )`;
      queryParams.push(req.user.id);
    }

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dépense non trouvée',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la dépense',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/expenses - Create new expense
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { employee_id, project_id, category, description, amount, expense_date, receipt_file } = req.body;
    
    // Validate required fields
    if (!category || !description || !amount || !expense_date) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Catégorie, description, montant et date sont requis',
      });
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Le montant doit être un nombre positif',
      });
    }

    // Validate category
    if (!EXPENSE_CATEGORIES.includes(category)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Catégorie invalide',
      });
    }

    // For users, ensure they can only create expenses for themselves
    let finalEmployeeId = employee_id;
    if (req.user.role === 'user') {
      // Find the employee record for this user
      const userEmployee = await client.query(
        'SELECT id FROM nomedia.employees WHERE id = (SELECT id FROM nomedia.users WHERE id = $1)',
        [req.user.id]
      );
      
      if (userEmployee.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Aucun profil employé trouvé pour cet utilisateur',
        });
      }
      
      finalEmployeeId = userEmployee.rows[0].id;
    }

    // Insert expense
    const insertQuery = `
      INSERT INTO nomedia.expenses (
        employee_id, project_id, category, description, amount, 
        expense_date, receipt_file, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      finalEmployeeId,
      project_id || null,
      category,
      description,
      parseFloat(amount),
      expense_date,
      receipt_file || null,
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Dépense créée avec succès',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la dépense',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    client.release();
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { category, description, amount, expense_date, receipt_file } = req.body;

    // Check if expense exists and user has permission
    let checkQuery = 'SELECT * FROM nomedia.expenses WHERE id = $1';
    const checkParams = [id];

    if (req.user.role === 'user') {
      checkQuery += ` AND employee_id = (
        SELECT id FROM nomedia.employees WHERE id = 
        (SELECT id FROM nomedia.users WHERE id = $2)
      )`;
      checkParams.push(req.user.id);
    }

    const existingExpense = await client.query(checkQuery, checkParams);

    if (existingExpense.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Dépense non trouvée ou accès non autorisé',
      });
    }

    // Don't allow updates to approved/rejected expenses
    if (existingExpense.rows[0].status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier une dépense déjà traitée',
      });
    }

    // Update expense
    const updateQuery = `
      UPDATE nomedia.expenses 
      SET category = $1, description = $2, amount = $3, expense_date = $4, 
          receipt_file = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      category,
      description,
      parseFloat(amount),
      expense_date,
      receipt_file || null,
      id,
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Dépense mise à jour avec succès',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la dépense',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    client.release();
  }
});

// PUT /api/expenses/:id/approve - Approve expense (admin/manager only)
router.put('/:id/approve', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé',
    });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;

    const updateQuery = `
      UPDATE nomedia.expenses 
      SET status = 'approved', approved_by = $1, approved_at = NOW(), updated_at = NOW()
      WHERE id = $2 AND status = 'pending'
      RETURNING *
    `;

    const result = await client.query(updateQuery, [req.user.id, id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Dépense non trouvée ou déjà traitée',
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Dépense approuvée avec succès',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving expense:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'approbation de la dépense',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    client.release();
  }
});

// PUT /api/expenses/:id/reject - Reject expense (admin/manager only)
router.put('/:id/reject', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé',
    });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { rejection_reason } = req.body;

    const updateQuery = `
      UPDATE nomedia.expenses 
      SET status = 'rejected', approved_by = $1, approved_at = NOW(), 
          rejection_reason = $2, updated_at = NOW()
      WHERE id = $3 AND status = 'pending'
      RETURNING *
    `;

    const result = await client.query(updateQuery, [req.user.id, rejection_reason || null, id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Dépense non trouvée ou déjà traitée',
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Dépense rejetée avec succès',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rejecting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet de la dépense',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    client.release();
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    // Check if expense exists and user has permission
    let checkQuery = 'SELECT * FROM nomedia.expenses WHERE id = $1';
    const checkParams = [id];

    if (req.user.role === 'user') {
      checkQuery += ` AND employee_id = (
        SELECT id FROM nomedia.employees WHERE id = 
        (SELECT id FROM nomedia.users WHERE id = $2)
      )`;
      checkParams.push(req.user.id);
    }

    const existingExpense = await client.query(checkQuery, checkParams);

    if (existingExpense.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dépense non trouvée ou accès non autorisé',
      });
    }

    // Only allow deletion of pending expenses
    if (existingExpense.rows[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une dépense déjà traitée',
      });
    }

    await client.query('DELETE FROM nomedia.expenses WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Dépense supprimée avec succès',
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la dépense',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    client.release();
  }
});

export default router;
