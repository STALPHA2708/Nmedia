import { RequestHandler } from "express";
import { query, run, get } from "../config/postgres-database";

// Get all contract types
export const getContractTypes: RequestHandler = async (req, res) => {
  try {
    console.log("🚀 Contract types GET route hit - PostgreSQL version");

    const contractTypes = await query(`
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

    console.log(`✅ Found ${contractTypes.length} contract types`);

    res.json({
      success: true,
      data: contractTypes,
      count: contractTypes.length,
    });
  } catch (error) {
    console.error("❌ Error fetching contract types:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des types de contrats",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get contract type by ID
export const getContractTypeById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🚀 Get contract type by ID: ${id}`);

    const contractType = await get(
      `
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
      WHERE ct.id = $1
      GROUP BY ct.id, ct.name, ct.is_permanent, ct.description, ct.created_at, ct.updated_at
    `,
      [id],
    );

    if (!contractType) {
      return res.status(404).json({
        success: false,
        message: "Type de contrat non trouvé",
      });
    }

    console.log(`✅ Found contract type: ${contractType.name}`);

    res.json({
      success: true,
      data: contractType,
    });
  } catch (error) {
    console.error("❌ Error fetching contract type:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du type de contrat",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create new contract type
export const createContractType: RequestHandler = async (req, res) => {
  try {
    console.log("🚀 Create contract type route hit");
    console.log("📦 Request body:", JSON.stringify(req.body, null, 2));

    const { name, is_permanent, description } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Le nom du type de contrat est requis",
      });
    }

    // Check if contract type with this name already exists
    const existing = await get(
      "SELECT id FROM contract_types WHERE name = $1",
      [name.trim()],
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Un type de contrat avec ce nom existe déjà",
      });
    }

    // Insert new contract type
    const result = await run(
      `
      INSERT INTO contract_types (name, is_permanent, description, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, is_permanent, description, created_at, updated_at
    `,
      [name.trim(), !!is_permanent, description?.trim() || null],
    );

    const newContractType = {
      ...result.rows[0],
      employee_count: 0,
    };

    console.log("✅ Contract type created successfully:", newContractType);

    res.status(201).json({
      success: true,
      data: newContractType,
      message: "Type de contrat créé avec succès",
    });
  } catch (error) {
    console.error("❌ Error creating contract type:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du type de contrat",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update contract type
export const updateContractType: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🚀 Update contract type ${id}`);

    const { name, is_permanent, description } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Le nom du type de contrat est requis",
      });
    }

    // Check if contract type exists
    const existing = await get("SELECT id FROM contract_types WHERE id = $1", [
      id,
    ]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Type de contrat non trouvé",
      });
    }

    // Check if another contract type with this name exists
    const nameConflict = await get(
      "SELECT id FROM contract_types WHERE name = $1 AND id != $2",
      [name.trim(), id],
    );

    if (nameConflict) {
      return res.status(400).json({
        success: false,
        message: "Un type de contrat avec ce nom existe déjà",
      });
    }

    // Update contract type
    const result = await run(
      `
      UPDATE contract_types 
      SET name = $1, is_permanent = $2, description = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, is_permanent, description, created_at, updated_at
    `,
      [name.trim(), !!is_permanent, description?.trim() || null, id],
    );

    // Get updated contract type with employee count
    const updatedContractType = await get(
      `
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
      WHERE ct.id = $1
      GROUP BY ct.id, ct.name, ct.is_permanent, ct.description, ct.created_at, ct.updated_at
    `,
      [id],
    );

    console.log("✅ Contract type updated successfully");

    res.json({
      success: true,
      data: updatedContractType,
      message: "Type de contrat mis à jour avec succès",
    });
  } catch (error) {
    console.error("❌ Error updating contract type:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du type de contrat",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete contract type
export const deleteContractType: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🚀 Delete contract type ${id}`);

    // Check if contract type exists
    const existing = await get(
      "SELECT id, name FROM contract_types WHERE id = $1",
      [id],
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Type de contrat non trouvé",
      });
    }

    // Check if contract type is being used by employees
    const employeeCount = await get(
      "SELECT COUNT(*) as count FROM employees WHERE contract_type = $1",
      [existing.name],
    );

    if (employeeCount && employeeCount.count > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Impossible de supprimer un type de contrat utilisé par des employés",
      });
    }

    // Delete contract type
    const result = await run("DELETE FROM contract_types WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Type de contrat non trouvé",
      });
    }

    console.log(`✅ Contract type "${existing.name}" deleted successfully`);

    res.json({
      success: true,
      message: "Type de contrat supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ Error deleting contract type:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du type de contrat",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
