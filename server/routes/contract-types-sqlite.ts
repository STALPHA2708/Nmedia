import { RequestHandler } from "express";
import { query, run, get } from "../config/unified-database";

// Get all contract types
export const getContractTypes: RequestHandler = async (req, res) => {
  try {
    console.log('Contract types GET route hit');

    let contractTypes;
    try {
      // Try with contract_type column first
      contractTypes = await query(`
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
      console.warn('Contract_type column not found in employees table, using basic query');
      // Fallback without employee count
      contractTypes = await query(`
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
};

// Get contract type by ID
export const getContractTypeById: RequestHandler = async (req, res) => {
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
};

// Create new contract type
export const createContractType: RequestHandler = async (req, res) => {
  try {
    console.log('📋 Create contract type request received:', req.body);
    const { name, is_permanent, description } = req.body;

    if (!name) {
      console.log('❌ Contract type creation failed: missing name');
      return res.status(400).json({
        success: false,
        message: 'Le nom du type de contrat est requis',
      });
    }

    // Check if contract type with this name already exists
    console.log('📋 Checking if contract type exists:', name);
    const existing = await get('SELECT id FROM contract_types WHERE name = ?', [name]);

    if (existing) {
      console.log('❌ Contract type creation failed: name already exists');
      return res.status(400).json({
        success: false,
        message: 'Un type de contrat avec ce nom existe déjà',
      });
    }

    // Insert new contract type
    console.log('📋 Creating new contract type:', { name, is_permanent, description });
    const result = await run(`
      INSERT INTO contract_types (name, is_permanent, description)
      VALUES (?, ?, ?)
    `, [name, is_permanent ? 1 : 0, description || null]);

    console.log('✅ Contract type created with ID:', result.lastInsertRowid);

    // Get the created contract type
    const newContractType = await get(`
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
    `, [result.lastInsertRowid]);

    // Convert is_permanent from 0/1 to boolean
    const processedContractType = {
      ...newContractType,
      is_permanent: newContractType.is_permanent === 1
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
};

// Update contract type
export const updateContractType: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, is_permanent, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du type de contrat est requis',
      });
    }

    // Check if contract type exists
    const existing = await get('SELECT id FROM contract_types WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Type de contrat non trouvé',
      });
    }

    // Check if another contract type with this name exists
    const nameConflict = await get('SELECT id FROM contract_types WHERE name = ? AND id != ?', [name, id]);
    
    if (nameConflict) {
      return res.status(400).json({
        success: false,
        message: 'Un type de contrat avec ce nom existe déjà',
      });
    }

    // Update contract type
    await run(`
      UPDATE contract_types 
      SET name = ?, is_permanent = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, is_permanent ? 1 : 0, description || null, id]);

    // Get updated contract type with employee count
    let updatedContractType;
    try {
      updatedContractType = await get(`
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
      updatedContractType = await get(`
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

    // Convert is_permanent from 0/1 to boolean
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
};

// Delete contract type
export const deleteContractType: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check if contract type exists
    const existing = await get('SELECT id FROM contract_types WHERE id = ?', [id]);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Type de contrat non trouvé',
      });
    }

    // Check if contract type is being used by employees
    let employeeCount;
    try {
      employeeCount = await get('SELECT COUNT(*) as count FROM employees WHERE contract_type = (SELECT name FROM contract_types WHERE id = ?)', [id]);
    } catch (columnError) {
      // If contract_type column doesn't exist, assume no employees are using it
      employeeCount = { count: 0 };
    }
    
    if (employeeCount && employeeCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un type de contrat utilisé par des employés',
      });
    }

    // Delete contract type
    const result = await run('DELETE FROM contract_types WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Type de contrat non trouvé',
      });
    }

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
};
