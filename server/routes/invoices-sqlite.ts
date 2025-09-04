import { Router } from 'express';
import { query, run, get } from '../config/unified-database';
import jwt from 'jsonwebtoken';
import type {
  ApiResponse,
  Invoice,
  CreateInvoiceRequest,
  InvoiceStats,
} from '@shared/api';

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

// GET /api/invoices - Get all invoices
router.get('/', async (req, res) => {
  try {
    console.log('Invoices GET route hit - SQLite version');

    const invoices = await query(`
      SELECT 
        i.*,
        p.name as project_name
      FROM invoices i
      LEFT JOIN projects p ON i.project_id = p.id
      ORDER BY i.created_at DESC
    `);

    // Get invoice items for each invoice
    const invoicesWithItems = await Promise.all(invoices.map(async (invoice) => {
      const items = await query(`
        SELECT * FROM invoice_items WHERE invoice_id = ?
      `, [invoice.id]);

      return {
        ...invoice,
        items: items || [],
        team_members: invoice.team_members ? JSON.parse(invoice.team_members) : []
      };
    }));

    const response: ApiResponse<Invoice[]> = {
      success: true,
      data: invoicesWithItems,
      count: invoicesWithItems.length,
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/invoices/:id - Get invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const invoice = await get(`
      SELECT 
        i.*,
        p.name as project_name
      FROM invoices i
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.id = ?
    `, [id]);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée',
      });
    }

    // Get invoice items
    const items = await query(`
      SELECT * FROM invoice_items WHERE invoice_id = ?
    `, [id]);

    const invoiceWithItems = {
      ...invoice,
      items: items || [],
      team_members: invoice.team_members ? JSON.parse(invoice.team_members) : []
    };

    const response: ApiResponse<Invoice> = {
      success: true,
      data: invoiceWithItems,
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la facture',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/invoices - Create new invoice
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Creating invoice with data:', req.body);
    
    const invoiceData: CreateInvoiceRequest = req.body;

    // Validate required fields
    if (!invoiceData.client || !invoiceData.project || !invoiceData.items || invoiceData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Client, projet et articles sont requis',
      });
    }

    // Calculate totals
    const amount = invoiceData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxAmount = amount * 0.2; // 20% VAT
    const totalAmount = amount + taxAmount;

    // Generate invoice number
    const currentYear = new Date().getFullYear();
    const lastInvoice = await get(`
      SELECT invoice_number FROM invoices 
      WHERE invoice_number LIKE 'NOM-${currentYear}-%' 
      ORDER BY invoice_number DESC 
      LIMIT 1
    `);

    let nextNumber = 1;
    if (lastInvoice) {
      const match = lastInvoice.invoice_number.match(/NOM-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const invoiceNumber = `NOM-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;

    // Insert invoice
    const result = await run(`
      INSERT INTO invoices (
        invoice_number, client, client_ice, project, project_id, 
        amount, tax_amount, total_amount, issue_date, due_date, 
        status, profit_margin, estimated_costs, team_members, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoiceNumber,
      invoiceData.client,
      invoiceData.clientIce || null,
      invoiceData.project,
      invoiceData.projectId || null,
      amount,
      taxAmount,
      totalAmount,
      invoiceData.issueDate,
      invoiceData.dueDate,
      'draft',
      invoiceData.profitMargin || null,
      invoiceData.estimatedCosts || null,
      JSON.stringify(invoiceData.teamMembers || []),
      invoiceData.notes || null
    ]);

    const invoiceId = result.lastInsertRowid;

    // Insert invoice items
    for (const item of invoiceData.items) {
      await run(`
        INSERT INTO invoice_items (invoice_id, description, unit_price, quantity, total)
        VALUES (?, ?, ?, ?, ?)
      `, [invoiceId, item.description, item.unitPrice, item.quantity, item.total]);
    }

    // Get the created invoice with items
    const newInvoice = await get(`
      SELECT 
        i.*,
        p.name as project_name
      FROM invoices i
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.id = ?
    `, [invoiceId]);

    const items = await query(`
      SELECT * FROM invoice_items WHERE invoice_id = ?
    `, [invoiceId]);

    const invoiceWithItems = {
      ...newInvoice,
      items: items || [],
      team_members: newInvoice.team_members ? JSON.parse(newInvoice.team_members) : []
    };

    res.status(201).json({
      success: true,
      data: invoiceWithItems,
      message: 'Facture créée avec succès',
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la facture',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/invoices/:id - Update invoice
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const invoiceData: Partial<CreateInvoiceRequest> = req.body;

    console.log(`��� Attempting to update invoice ${id}`);
    console.log('📝 Update data:', JSON.stringify(invoiceData, null, 2));

    if (isNaN(id) || id <= 0) {
      console.log('❌ Invalid invoice ID provided');
      return res.status(400).json({
        success: false,
        message: 'ID de facture invalide',
      });
    }

    // Basic input validation
    if (!invoiceData || typeof invoiceData !== 'object') {
      console.log('❌ Invalid or empty request body');
      return res.status(400).json({
        success: false,
        message: 'Données de facture invalides ou manquantes',
      });
    }

    // Check if invoice exists
    const existingInvoice = await get('SELECT * FROM invoices WHERE id = ?', [id]);
    console.log('🔍 Found existing invoice:', existingInvoice ? { id: existingInvoice.id, status: existingInvoice.status, client: existingInvoice.client } : 'null');

    if (!existingInvoice) {
      console.log(`❌ Invoice ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée',
      });
    }

    // Don't allow content updates to paid invoices, but allow status changes
    const isStatusOnlyUpdate = Object.keys(invoiceData).length === 1 && 'status' in invoiceData;
    console.log('📊 Update analysis:', {
      currentStatus: existingInvoice.status,
      isStatusOnlyUpdate,
      updateKeys: Object.keys(invoiceData)
    });

    // Allow admins to modify paid invoices, restrict others
    if (existingInvoice.status === 'paid' && !isStatusOnlyUpdate && req.user.role !== 'admin') {
      console.log(`❌ Cannot update content of paid invoice ${id} - user role: ${req.user.role}`);
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier le contenu d\'une facture payée. Seul le statut peut être changé. (Contact admin pour modifications)',
      });
    }

    if (existingInvoice.status === 'paid' && req.user.role === 'admin') {
      console.log(`✅ Admin override: allowing modification of paid invoice ${id}`);
    }

    // Calculate new totals if items provided
    let amount = existingInvoice.amount;
    let taxAmount = existingInvoice.tax_amount;
    let totalAmount = existingInvoice.total_amount;

    if (invoiceData.items && invoiceData.items.length > 0) {
      amount = invoiceData.items.reduce((sum, item) => sum + (item.total || 0), 0);
      taxAmount = amount * 0.2;
      totalAmount = amount + taxAmount;

      // Delete existing items and insert new ones
      await run('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
      
      for (const item of invoiceData.items) {
        await run(`
          INSERT INTO invoice_items (invoice_id, description, unit_price, quantity, total)
          VALUES (?, ?, ?, ?, ?)
        `, [id, item.description, item.unitPrice, item.quantity, item.total]);
      }
    }

    // Validate status if provided
    if (invoiceData.status) {
      const validStatuses = ['draft', 'pending', 'paid', 'overdue', 'cancelled'];
      if (!validStatuses.includes(invoiceData.status)) {
        console.log(`❌ Invalid status provided: ${invoiceData.status}`);
        return res.status(400).json({
          success: false,
          message: `Statut invalide. Statuts valides: ${validStatuses.join(', ')}`,
        });
      }
      console.log(`✅ Status validation passed: ${invoiceData.status}`);
    }

    console.log('📝 Updating invoice in database...');
    // Update invoice
    await run(`
      UPDATE invoices
      SET client = ?, client_ice = ?, project = ?, project_id = ?,
          amount = ?, tax_amount = ?, total_amount = ?, issue_date = ?,
          due_date = ?, status = ?, profit_margin = ?, estimated_costs = ?,
          team_members = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      invoiceData.client || existingInvoice.client,
      invoiceData.clientIce || existingInvoice.client_ice,
      invoiceData.project || existingInvoice.project,
      invoiceData.projectId || existingInvoice.project_id,
      amount,
      taxAmount,
      totalAmount,
      invoiceData.issueDate || existingInvoice.issue_date,
      invoiceData.dueDate || existingInvoice.due_date,
      invoiceData.status || existingInvoice.status,
      invoiceData.profitMargin || existingInvoice.profit_margin,
      invoiceData.estimatedCosts || existingInvoice.estimated_costs,
      JSON.stringify(invoiceData.teamMembers || (existingInvoice.team_members ? JSON.parse(existingInvoice.team_members) : [])),
      invoiceData.notes || existingInvoice.notes,
      id
    ]);

    // Get updated invoice with items
    const updatedInvoice = await get(`
      SELECT 
        i.*,
        p.name as project_name
      FROM invoices i
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.id = ?
    `, [id]);

    const items = await query(`
      SELECT * FROM invoice_items WHERE invoice_id = ?
    `, [id]);

    const invoiceWithItems = {
      ...updatedInvoice,
      items: items || [],
      team_members: updatedInvoice.team_members ? JSON.parse(updatedInvoice.team_members) : []
    };

    console.log(`✅ Successfully updated invoice ${id}`);
    res.json({
      success: true,
      data: invoiceWithItems,
      message: 'Facture mise à jour avec succès',
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la facture',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/invoices/:id - Delete invoice
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🗑️ Attempting to delete invoice with ID: ${id}`);

    if (isNaN(id)) {
      console.log('❌ Invalid invoice ID provided');
      return res.status(400).json({
        success: false,
        message: 'ID de facture invalide',
      });
    }

    // Check if invoice exists
    const existingInvoice = await get('SELECT id, status, invoice_number FROM invoices WHERE id = ?', [id]);
    console.log('🔍 Found invoice:', existingInvoice);

    if (!existingInvoice) {
      console.log(`❌ Invoice ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée',
      });
    }

    // Allow admins to delete paid invoices, restrict others
    if (existingInvoice.status === 'paid' && req.user.role !== 'admin') {
      console.log(`❌ Cannot delete paid invoice ${id} (${existingInvoice.invoice_number}) - user role: ${req.user.role}`);
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une facture payée. Contact admin pour suppression.',
      });
    }

    if (existingInvoice.status === 'paid' && req.user.role === 'admin') {
      console.log(`✅ Admin override: allowing deletion of paid invoice ${id} (${existingInvoice.invoice_number})`);
    }

    // Delete invoice items first, then invoice
    console.log(`🗑️ Deleting invoice items for invoice ${id}`);
    await run('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);

    console.log(`🗑️ Deleting invoice ${id}`);
    await run('DELETE FROM invoices WHERE id = ?', [id]);

    console.log(`✅ Successfully deleted invoice ${id}`);
    res.json({
      success: true,
      message: 'Facture supprimée avec succès',
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la facture',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/invoices/stats - Get invoice statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await get(`
      SELECT 
        COUNT(*) as total_invoices,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_invoices,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invoices,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(total_amount), 0) as total_potential_revenue,
        COALESCE(AVG(total_amount), 0) as average_invoice_value,
        COALESCE(AVG(profit_margin), 0) as total_profit_margin
      FROM invoices
    `);

    const response: ApiResponse<InvoiceStats> = {
      success: true,
      data: stats,
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
