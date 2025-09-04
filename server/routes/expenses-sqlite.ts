import { Router } from 'express';
import { query, run, get } from '../config/unified-database';
import jwt from 'jsonwebtoken';

const router = Router();

// JWT secret
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

// GET /api/expenses - Get all expenses
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('Expenses GET route hit - SQLite version');

    let sql = `
      SELECT 
        e.*,
        emp.first_name || ' ' || emp.last_name as employee_name,
        p.name as project_name,
        approver.name as approved_by_name
      FROM expenses e
      LEFT JOIN employees emp ON e.employee_id = emp.id
      LEFT JOIN projects p ON e.project_id = p.id
      LEFT JOIN users approver ON e.approved_by = approver.id
      ORDER BY e.created_at DESC
    `;

    // If user is not admin/manager, only show their own expenses
    if (req.user.role === 'user') {
      sql = `
        SELECT 
          e.*,
          emp.first_name || ' ' || emp.last_name as employee_name,
          p.name as project_name,
          approver.name as approved_by_name
        FROM expenses e
        LEFT JOIN employees emp ON e.employee_id = emp.id
        LEFT JOIN projects p ON e.project_id = p.id
        LEFT JOIN users approver ON e.approved_by = approver.id
        WHERE e.employee_id = (
          SELECT id FROM employees WHERE email = ?
        )
        ORDER BY e.created_at DESC
      `;
      const expenses = await query(sql, [req.user.email]);
      return res.json({
        success: true,
        data: expenses,
        count: expenses.length,
      });
    }

    const expenses = await query(sql);

    res.json({
      success: true,
      data: expenses,
      count: expenses.length,
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
  const categories = ['Transport', 'Hébergement', 'Repas', 'Matériel', 'Communication', 'Formation', 'Bureautique', 'Marketing', 'Autre'];
  res.json({ success: true, data: categories });
});

// GET /api/expenses/stats - Get expense statistics (admin/manager only)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const stats = get(`
      SELECT 
        COUNT(*) as total_expenses,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_expenses,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_expenses,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_expenses,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) as approved_amount,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount
      FROM expenses
    `);

    res.json({
      success: true,
      data: stats
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
    const id = parseInt(req.params.id);
    
    const expense = get(`
      SELECT 
        e.*,
        emp.first_name || ' ' || emp.last_name as employee_name,
        p.name as project_name,
        approver.name as approved_by_name
      FROM expenses e
      LEFT JOIN employees emp ON e.employee_id = emp.id
      LEFT JOIN projects p ON e.project_id = p.id
      LEFT JOIN users approver ON e.approved_by = approver.id
      WHERE e.id = ?
    `, [id]);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Dépense non trouvée',
      });
    }

    // Check permissions
    if (req.user.role === 'user') {
      const userEmployee = get('SELECT id FROM employees WHERE email = ?', [req.user.email]);
      if (userEmployee && expense.employee_id !== userEmployee.id) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé',
        });
      }
    }

    res.json({
      success: true,
      data: expense,
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
  try {
    console.log('Creating expense with data:', req.body);
    
    const {
      employee_id,
      project_id,
      category,
      description,
      amount,
      expense_date,
      receipt_file
    } = req.body;

    // Validate required fields
    if (!category || !description || !amount || !expense_date) {
      return res.status(400).json({
        success: false,
        message: 'Catégorie, description, montant et date sont requis',
      });
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le montant doit être un nombre positif',
      });
    }

    // For users, ensure they can only create expenses for themselves
    let finalEmployeeId = employee_id;
    if (req.user.role === 'user') {
      const userEmployee = get('SELECT id FROM employees WHERE email = ?', [req.user.email]);
      if (userEmployee) {
        finalEmployeeId = userEmployee.id;
      }
    }

    // Insert expense
    const result = run(`
      INSERT INTO expenses (
        employee_id, project_id, category, description, amount, 
        expense_date, receipt_file, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      finalEmployeeId || null,
      project_id || null,
      category,
      description,
      numAmount,
      expense_date,
      receipt_file || null
    ]);

    // Get the created expense with joined data
    const newExpense = get(`
      SELECT 
        e.*,
        emp.first_name || ' ' || emp.last_name as employee_name,
        p.name as project_name
      FROM expenses e
      LEFT JOIN employees emp ON e.employee_id = emp.id
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json({
      success: true,
      data: newExpense,
      message: 'Dépense créée avec succès',
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la dépense',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { category, description, amount, expense_date, receipt_file } = req.body;

    // Check if expense exists and user has permission
    const existingExpense = get('SELECT * FROM expenses WHERE id = ?', [id]);
    
    if (!existingExpense) {
      return res.status(404).json({
        success: false,
        message: 'Dépense non trouvée',
      });
    }

    // Check permissions
    if (req.user.role === 'user') {
      const userEmployee = get('SELECT id FROM employees WHERE email = ?', [req.user.email]);
      if (userEmployee && existingExpense.employee_id !== userEmployee.id) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé',
        });
      }
    }

    // Don't allow updates to approved/rejected expenses
    if (existingExpense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier une dépense déjà traitée',
      });
    }

    // Update expense
    run(`
      UPDATE expenses 
      SET category = ?, description = ?, amount = ?, expense_date = ?, 
          receipt_file = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [category, description, parseFloat(amount), expense_date, receipt_file || null, id]);

    // Get updated expense with joined data
    const updatedExpense = get(`
      SELECT 
        e.*,
        emp.first_name || ' ' || emp.last_name as employee_name,
        p.name as project_name
      FROM expenses e
      LEFT JOIN employees emp ON e.employee_id = emp.id
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.id = ?
    `, [id]);

    res.json({
      success: true,
      data: updatedExpense,
      message: 'Dépense mise à jour avec succès',
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la dépense',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/expenses/:id/approve - Approve expense (admin/manager only)
router.put('/:id/approve', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const id = parseInt(req.params.id);

    // Update expense status
    const result = run(`
      UPDATE expenses 
      SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'pending'
    `, [req.user.id, id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dépense non trouvée ou déjà traitée',
      });
    }

    res.json({
      success: true,
      message: 'Dépense approuvée avec succès',
    });
  } catch (error) {
    console.error('Error approving expense:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'approbation de la dépense',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/expenses/:id/reject - Reject expense (admin/manager only)
router.put('/:id/reject', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const id = parseInt(req.params.id);
    const { rejection_reason } = req.body;

    // Update expense status
    const result = run(`
      UPDATE expenses 
      SET status = 'rejected', approved_by = ?, approved_at = CURRENT_TIMESTAMP, 
          rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'pending'
    `, [req.user.id, rejection_reason || 'Rejetée par l\'administrateur', id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dépense non trouvée ou déjà traitée',
      });
    }

    res.json({
      success: true,
      message: 'Dépense rejetée avec succès',
    });
  } catch (error) {
    console.error('Error rejecting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet de la dépense',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check if expense exists and user has permission
    const existingExpense = await get('SELECT * FROM expenses WHERE id = ?', [id]);
    console.log('����️ Existing expense found:', existingExpense);

    if (!existingExpense) {
      return res.status(404).json({
        success: false,
        message: 'Dépense non trouvée',
      });
    }

    // Check permissions
    if (req.user.role === 'user') {
      const userEmployee = await get('SELECT id FROM employees WHERE email = ?', [req.user.email]);
      if (userEmployee && existingExpense.employee_id !== userEmployee.id) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé',
        });
      }
    }

    console.log('🗑️ Expense status:', existingExpense.status);
    console.log('🗑️ User role:', req.user.role);

    // Allow admins to delete any expense (including approved ones)
    // Managers can delete any expense
    // Users can only delete pending expenses
    if (req.user.role === 'user' && existingExpense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une dépense déjà traitée. Contact admin pour suppression.',
      });
    }

    if (req.user.role === 'admin') {
      console.log(`✅ Admin override: allowing deletion of ${existingExpense.status} expense ${id}`);
    }

    // Delete expense
    await run('DELETE FROM expenses WHERE id = ?', [id]);
    console.log('🗑️ Expense deleted successfully');

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
  }
});

// DELETE /api/expenses/bulk - Bulk delete expenses (admin only)
router.delete('/bulk', authenticateToken, async (req, res) => {
  try {
    const { expenseIds, projectId, invoiceId } = req.body;

    // Admin only operation
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Opération réservée aux administrateurs.',
      });
    }

    console.log('🗑️ Bulk delete request:', { expenseIds, projectId, invoiceId, userRole: req.user.role });

    let deletedCount = 0;

    if (expenseIds && Array.isArray(expenseIds)) {
      // Delete specific expenses by ID
      for (const id of expenseIds) {
        const expense = await get('SELECT id, status FROM expenses WHERE id = ?', [id]);
        if (expense) {
          await run('DELETE FROM expenses WHERE id = ?', [id]);
          deletedCount++;
          console.log(`✅ Deleted expense ${id} (status: ${expense.status})`);
        }
      }
    } else if (projectId) {
      // Delete all expenses for a project
      const expenses = await query('SELECT id, status FROM expenses WHERE project_id = ?', [projectId]);
      for (const expense of expenses) {
        await run('DELETE FROM expenses WHERE id = ?', [expense.id]);
        deletedCount++;
        console.log(`✅ Deleted expense ${expense.id} for project ${projectId}`);
      }
    } else if (invoiceId) {
      // Delete all expenses related to an invoice (through project)
      const expenses = await query(`
        SELECT e.id, e.status
        FROM expenses e
        JOIN invoices i ON e.project_id = i.project_id
        WHERE i.id = ?
      `, [invoiceId]);
      for (const expense of expenses) {
        await run('DELETE FROM expenses WHERE id = ?', [expense.id]);
        deletedCount++;
        console.log(`✅ Deleted expense ${expense.id} related to invoice ${invoiceId}`);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Aucune condition de suppression spécifiée (expenseIds, projectId, ou invoiceId requis)',
      });
    }

    console.log(`✅ Bulk delete completed: ${deletedCount} expenses deleted`);

    res.json({
      success: true,
      message: `${deletedCount} dépense(s) supprimée(s) avec succès`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression en lot',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
