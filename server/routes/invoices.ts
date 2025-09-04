import { Router } from 'express';
import { pool } from '../config/database';
import { emailService } from '../services/emailService';
import type {
  ApiResponse,
  Invoice,
  CreateInvoiceRequest,
  InvoiceStats,
  InvoiceEmployee,
} from '@shared/api';

const router = Router();

// GET /api/invoices - Get all invoices
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        i.*,
        p.name as project_name,
        json_agg(
          json_build_object(
            'id', ii.id,
            'description', ii.description,
            'unit_price', ii.unit_price,
            'quantity', ii.quantity,
            'total', ii.total
          )
        ) FILTER (WHERE ii.id IS NOT NULL) as items
      FROM nomedia.invoices i
      LEFT JOIN nomedia.projects p ON i.project_id = p.id
      LEFT JOIN nomedia.invoice_items ii ON i.id = ii.invoice_id
      GROUP BY i.id, p.name
      ORDER BY i.created_at DESC
    `;

    const result = await pool.query(query);

    // Get assigned employees for each invoice
    for (const invoice of result.rows) {
      const employeesQuery = `
        SELECT * FROM nomedia.invoice_employee_payments
        WHERE invoice_id = $1
        ORDER BY employee_name
      `;
      const employeesResult = await pool.query(employeesQuery, [invoice.id]);
      invoice.assignedEmployees = employeesResult.rows;
    }

    const response: ApiResponse<Invoice[]> = {
      success: true,
      data: result.rows,
      count: result.rows.length,
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
    
    const query = `
      SELECT 
        i.*,
        p.name as project_name,
        json_agg(
          json_build_object(
            'id', ii.id,
            'description', ii.description,
            'unit_price', ii.unit_price,
            'quantity', ii.quantity,
            'total', ii.total
          )
        ) FILTER (WHERE ii.id IS NOT NULL) as items
      FROM nomedia.invoices i
      LEFT JOIN nomedia.projects p ON i.project_id = p.id
      LEFT JOIN nomedia.invoice_items ii ON i.id = ii.invoice_id
      WHERE i.id = $1
      GROUP BY i.id, p.name
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée',
      });
    }

    const invoice = result.rows[0];

    // Get assigned employees
    const employeesQuery = `
      SELECT * FROM nomedia.invoice_employee_payments
      WHERE invoice_id = $1
      ORDER BY employee_name
    `;
    const employeesResult = await pool.query(employeesQuery, [id]);
    invoice.assignedEmployees = employeesResult.rows;

    const response: ApiResponse<Invoice> = {
      success: true,
      data: invoice,
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
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const invoiceData: CreateInvoiceRequest = req.body;
    
    // Calculate totals
    const amount = invoiceData.items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = amount * 0.2; // 20% TVA
    const totalAmount = amount + taxAmount;
    
    // Generate invoice number
    const invoiceNumberQuery = `
      SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'NOM-\\d{4}-(\\d+)') AS INTEGER)), 0) + 1 as next_number
      FROM nomedia.invoices 
      WHERE invoice_number LIKE 'NOM-' || EXTRACT(YEAR FROM NOW()) || '-%'
    `;
    const numberResult = await client.query(invoiceNumberQuery);
    const nextNumber = numberResult.rows[0].next_number;
    const currentYear = new Date().getFullYear();
    const invoiceNumber = `NOM-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;

    // Insert invoice
    const invoiceQuery = `
      INSERT INTO nomedia.invoices (
        invoice_number, client, client_ice, project, project_id, 
        amount, tax_amount, total_amount, issue_date, due_date, 
        status, profit_margin, estimated_costs, team_members, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const invoiceResult = await client.query(invoiceQuery, [
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
      invoiceData.profitMargin ? amount * (1 - invoiceData.profitMargin / 100) : amount * 0.7,
      invoiceData.teamMembers || [],
      invoiceData.notes || null
    ]);

    const invoiceId = invoiceResult.rows[0].id;

    // Insert invoice items
    for (const item of invoiceData.items) {
      const itemQuery = `
        INSERT INTO nomedia.invoice_items (
          invoice_id, description, unit_price, quantity, total
        )
        VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(itemQuery, [
        invoiceId,
        item.description,
        item.unitPrice,
        item.quantity,
        item.total
      ]);
    }

    await client.query('COMMIT');

    const newInvoice = {
      ...invoiceResult.rows[0],
      items: invoiceData.items,
      assignedEmployees: []
    };

    const response: ApiResponse<Invoice> = {
      success: true,
      data: newInvoice,
      message: 'Facture créée avec succès',
    };
    res.status(201).json(response);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la facture',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    client.release();
  }
});

// PUT /api/invoices/:id - Update invoice
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const id = parseInt(req.params.id);
    const updateData = req.body;
    
    // Check if invoice exists
    const invoiceCheck = await client.query('SELECT * FROM nomedia.invoices WHERE id = $1', [id]);
    if (invoiceCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée',
      });
    }

    const currentInvoice = invoiceCheck.rows[0];
    
    // Recalculate totals if items changed
    let amount = currentInvoice.amount;
    let taxAmount = currentInvoice.tax_amount;
    let totalAmount = currentInvoice.total_amount;
    
    if (updateData.items) {
      amount = updateData.items.reduce((sum: number, item: any) => sum + item.total, 0);
      taxAmount = amount * 0.2;
      totalAmount = amount + taxAmount;

      // Delete existing items and insert new ones
      await client.query('DELETE FROM nomedia.invoice_items WHERE invoice_id = $1', [id]);
      
      for (const item of updateData.items) {
        const itemQuery = `
          INSERT INTO nomedia.invoice_items (
            invoice_id, description, unit_price, quantity, total
          )
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(itemQuery, [
          id,
          item.description,
          item.unitPrice,
          item.quantity,
          item.total
        ]);
      }
    }

    // Update invoice
    const updateQuery = `
      UPDATE nomedia.invoices 
      SET 
        client = COALESCE($1, client),
        client_ice = COALESCE($2, client_ice),
        project = COALESCE($3, project),
        project_id = COALESCE($4, project_id),
        amount = $5,
        tax_amount = $6,
        total_amount = $7,
        issue_date = COALESCE($8, issue_date),
        due_date = COALESCE($9, due_date),
        status = COALESCE($10, status),
        profit_margin = COALESCE($11, profit_margin),
        estimated_costs = COALESCE($12, estimated_costs),
        team_members = COALESCE($13, team_members),
        notes = COALESCE($14, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      updateData.client,
      updateData.clientIce,
      updateData.project,
      updateData.projectId,
      amount,
      taxAmount,
      totalAmount,
      updateData.issueDate,
      updateData.dueDate,
      updateData.status,
      updateData.profitMargin,
      updateData.estimatedCosts,
      updateData.teamMembers,
      updateData.notes,
      id
    ]);

    await client.query('COMMIT');

    const updatedInvoice = {
      ...result.rows[0],
      items: updateData.items || currentInvoice.items
    };

    const response: ApiResponse<Invoice> = {
      success: true,
      data: updatedInvoice,
      message: 'Facture mise à jour avec succès',
    };
    res.json(response);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la facture',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    client.release();
  }
});

// DELETE /api/invoices/:id - Delete invoice
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const id = parseInt(req.params.id);
    
    // Check if invoice exists and is not paid
    const invoiceCheck = await client.query('SELECT status FROM nomedia.invoices WHERE id = $1', [id]);
    if (invoiceCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée',
      });
    }

    if (invoiceCheck.rows[0].status === 'paid') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une facture déjà payée',
      });
    }

    // Delete invoice (items will be deleted via CASCADE)
    await client.query('DELETE FROM nomedia.invoices WHERE id = $1', [id]);

    await client.query('COMMIT');

    const response: ApiResponse<void> = {
      success: true,
      message: 'Facture supprimée avec succès',
    };
    res.json(response);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la facture',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    client.release();
  }
});

// GET /api/invoices/stats - Get invoice statistics
router.get('/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_invoices,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_invoices,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invoices,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status IN ('pending', 'overdue') THEN total_amount ELSE 0 END), 0) as total_pending_amount,
        COALESCE(AVG(total_amount), 0) as average_invoice_value,
        COALESCE(AVG(profit_margin), 0) as total_profit_margin
      FROM nomedia.invoices
    `;

    const result = await pool.query(statsQuery);
    const stats: InvoiceStats = result.rows[0];

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

// POST /api/invoices/:id/send-email - Send invoice by email
router.post('/:id/send-email', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { clientEmail, clientName } = req.body;

    // Validate required fields
    if (!clientEmail || !clientName) {
      return res.status(400).json({
        success: false,
        message: 'Email du client et nom requis',
      });
    }

    // Get invoice data
    const query = `
      SELECT
        i.*,
        p.name as project_name,
        json_agg(
          json_build_object(
            'id', ii.id,
            'description', ii.description,
            'unit_price', ii.unit_price,
            'quantity', ii.quantity,
            'total', ii.total
          )
        ) FILTER (WHERE ii.id IS NOT NULL) as items
      FROM nomedia.invoices i
      LEFT JOIN nomedia.projects p ON i.project_id = p.id
      LEFT JOIN nomedia.invoice_items ii ON i.id = ii.invoice_id
      WHERE i.id = $1
      GROUP BY i.id, p.name
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée',
      });
    }

    const invoice = result.rows[0];

    // Check if email service is configured
    if (!emailService.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Service email non configuré. Veuillez contacter l\'administrateur.',
      });
    }

    // Generate PDF (simplified version - in production use a proper PDF library)
    const pdfContent = `Facture ${invoice.invoice_number}
Client: ${clientName}
Projet: ${invoice.project}
Montant: ${invoice.total_amount} MAD
Date: ${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}

Détails:
${invoice.items?.map((item: any) =>
  `- ${item.description}: ${item.quantity} x ${item.unit_price} = ${item.total} MAD`
).join('\n') || ''}

Total HT: ${invoice.amount} MAD
TVA (20%): ${invoice.tax_amount} MAD
Total TTC: ${invoice.total_amount} MAD

Merci pour votre confiance !
Nomedia Production`;

    const pdfBuffer = Buffer.from(pdfContent, 'utf-8');

    // Send email
    const emailSent = await emailService.sendInvoiceEmail(
      clientEmail,
      clientName,
      invoice.invoice_number,
      pdfBuffer,
      invoice.total_amount
    );

    if (emailSent) {
      // Update invoice to track email sent
      await pool.query(
        'UPDATE nomedia.invoices SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );

      const response: ApiResponse<void> = {
        success: true,
        message: `Facture envoyée avec succès à ${clientEmail}`,
      };
      res.json(response);
    } else {
      res.status(500).json({
        success: false,
        message: 'Échec de l\'envoi de l\'email. Veuillez réessayer.',
      });
    }
  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la facture par email',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
