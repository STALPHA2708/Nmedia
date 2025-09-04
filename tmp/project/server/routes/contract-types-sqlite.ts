import { Router } from 'express';
import { query, run, get } from '../config/sqlite-database';
import { authenticateToken } from './auth-sqlite';
import type { ApiResponse, ContractType } from '@shared/api';

const router = Router();

// Middleware to check authentication
router.use(authenticateToken);

// GET /api/contract-types - Get all contract types
router.get('/', async (req, res) => {
  try {
    console.log('Contract types GET route hit');
    
    // First check if the contract_type column exists in employees table
    let contractTypes;
    try {
      contractTypes = query(`
        SELECT
          ct.id,
          ct.name,
          ct.is_permanent,
          ct.description,
          ct.created_at,
          ct.updated_at,
          COUNT(e.id) as employee_count
        FROM contract_types ct
        LEFT JOIN employees e ON ct.name = e.contract_type
        GROUP BY ct.id, ct.name, ct.is_permanent, ct.description, ct.created_at, ct.updated_at
        ORDER BY ct.name
      `);
    } catch (columnError) {
      // If contract_type column doesn't exist, just get contract types without counts
      console.log('contract_type column not found in employees table, fetching without counts');
      contractTypes = query(`
        SELECT
          ct.id,
          ct.name,
          ct.is_permanent,
          ct.description,
          ct.created_at,
          ct.updated_at,
          0 as employee_count
        FROM contract_types ct
        ORDER BY ct.name
      `);
    }

    // Convert is_permanent from 0/1 to boolean
    const processedContractTypes = contractTypes.map(ct => ({
      ...ct,
      is_permanent: ct.is_permanent === 1
    }));

    res.json({
      success: true,
      data: processedContractTypes,
      count: processedContractTypes.length,
    });
  } catch (error) {
    console.error('Error fetching contract types:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des types de contrats',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/contract-types/:id - Get contract type by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    let contractType;
    try {
      contractType = get(`
        SELECT
          ct.id,
          ct.name,
          ct.is_permanent,
          ct.description,
          ct.created_at,
          ct.updated_at,
          COUNT(e.id) as employee_count
        FROM contract_types ct
        LEFT JOIN employees e ON ct.name = e.contract_type
        WHERE ct.id = ?
        GROUP BY ct.id, ct.name, ct.is_permanent, ct.description, ct.created_at, ct.updated_at
      `, [id]);
    } catch (columnError) {
      console.log('contract_type column not found, fetching without count');
      contractType = get(`
        SELECT
          ct.id,
          ct.name,
          ct.is_permanent,
          ct.description,
          ct.created_at,
          ct.updated_at,
          0 as employee_count
        FROM contract_types ct
        WHERE ct.id = ?
      `, [id]);
    }

    if (!contractType) {
      return res.status(404).json({
        success: false,
        message: 'Type de contrat non trouvé',
      });
    }

    // Convert is_permanent from 0/1 to boolean
    const processedContractType = {
      ...contractType,
      is_permanent: contractType.is_permanent === 1
    };

    res.json({
      success: true,
      data: processedContractType,
    });
  } catch (error) {
    console.error('Error fetching contract type:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du type de contrat',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/contract-types - Create new contract type
router.post('/', async (req, res) => {
  try {
    const { name, is_permanent = false, description } = req.body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du type de contrat est obligatoire',
      });
    }

    // Check if contract type already exists
    const existing = get('SELECT id FROM contract_types WHERE name = ?', [name.trim()]);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Un type de contrat avec ce nom existe déjà',
      });
    }

    // Insert contract type
    const result = run(`
      INSERT INTO contract_types (name, is_permanent, description)
      VALUES (?, ?, ?)
    `, [name.trim(), is_permanent ? 1 : 0, description || '']);

    const contractTypeId = result.lastInsertRowid;

    // Get the created contract type
    const createdContractType = get(`
      SELECT 
        ct.id,
        ct.name,
        ct.is_permanent,
        ct.description,
        ct.created_at,
        ct.updated_at,
        0 as employee_count
      FROM contract_types ct
      WHERE ct.id = ?
    `, [contractTypeId]);

    const processedContractType = {
      ...createdContractType,
      is_permanent: createdContractType.is_permanent === 1
    };

    res.status(201).json({
      success: true,
      data: processedContractType,
      message: 'Type de contrat créé avec succès',
    });
  } catch (error) {
    console.error('Error creating contract type:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du type de contrat',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/contract-types/:id - Update contract type
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, is_permanent = false, description } = req.body;

    // Check if contract type exists
    const existing = get('SELECT id FROM contract_types WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Type de contrat non trouvé',
      });
    }

    // Check if name is taken by another contract type
    const nameCheck = get('SELECT id FROM contract_types WHERE name = ? AND id != ?', [name.trim(), id]);
    if (nameCheck) {
      return res.status(400).json({
        success: false,
        message: 'Un autre type de contrat utilise déjà ce nom',
      });
    }

    // Update contract type
    run(`
      UPDATE contract_types SET
        name = ?, is_permanent = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name.trim(), is_permanent ? 1 : 0, description || '', id]);

    // Get updated contract type
    const updatedContractType = get(`
      SELECT 
        ct.id,
        ct.name,
        ct.is_permanent,
        ct.description,
        ct.created_at,
        ct.updated_at,
        COUNT(e.id) as employee_count
      FROM contract_types ct
      LEFT JOIN employees e ON ct.name = e.contract_type
      WHERE ct.id = ?
      GROUP BY ct.id, ct.name, ct.is_permanent, ct.description, ct.created_at, ct.updated_at
    `, [id]);

    const processedContractType = {
      ...updatedContractType,
      is_permanent: updatedContractType.is_permanent === 1
    };

    res.json({
      success: true,
      data: processedContractType,
      message: 'Type de contrat mis à jour avec succès',
    });
  } catch (error) {
    console.error('Error updating contract type:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du type de contrat',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/contract-types/:id - Delete contract type
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check if contract type exists
    const contractType = get('SELECT * FROM contract_types WHERE id = ?', [id]);
    if (!contractType) {
      return res.status(404).json({
        success: false,
        message: 'Type de contrat non trouvé',
      });
    }

    // Check if contract type is in use (if contract_type column exists)
    let inUse = { count: 0 };
    try {
      inUse = get('SELECT COUNT(*) as count FROM employees WHERE contract_type = ?', [contractType.name]);
    } catch (columnError) {
      console.log('contract_type column not found, skipping usage check');
    }

    if (inUse.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce type de contrat car il est utilisé par ${inUse.count} employé(s)`,
      });
    }

    // Delete contract type
    run('DELETE FROM contract_types WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Type de contrat supprimé avec succès',
    });
  } catch (error) {
    console.error('Error deleting contract type:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du type de contrat',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
