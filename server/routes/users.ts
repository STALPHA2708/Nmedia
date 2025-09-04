import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { emailService } from '../services/emailService';
import type {
  ApiResponse,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserStats,
} from '@shared/api';

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

// Middleware to check admin permissions
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès administrateur requis',
    });
  }
  next();
};

// GET /api/users - Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let result;
    try {
      const query = `
        SELECT
          id, name, email, role, status, phone, avatar_url,
          last_login, permissions, created_at, updated_at
        FROM nomedia.users
        ORDER BY created_at DESC
      `;

      result = await pool.query(query);
    } catch (dbError) {
      console.log('Database error in users route:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Erreur de base de données',
        error: dbError.message,
      });
    }

    // If no users found, ensure admin user exists
    if (result.rows.length === 0) {
      console.log('No users found, this should not happen after authentication');
      return res.status(500).json({
        success: false,
        message: 'Aucun utilisateur trouvé - base de données corrompue',
      });
    }

    const response: ApiResponse<User[]> = {
      success: true,
      data: result.rows,
      count: result.rows.length,
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const query = `
      SELECT 
        id, name, email, role, status, phone, avatar_url,
        last_login, permissions, created_at, updated_at
      FROM nomedia.users 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    const user = result.rows[0];

    // Check permissions: users can only view their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user,
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/users - Create new user (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const userData: CreateUserRequest = req.body;
    
    // Validate required fields
    if (!userData.name || !userData.email || !userData.password) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Nom, email et mot de passe sont requis',
      });
    }

    // Validate password strength
    if (userData.password.length < 8) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères',
      });
    }

    // Check if email already exists
    const emailCheck = await client.query(
      'SELECT id FROM nomedia.users WHERE email = $1',
      [userData.email.toLowerCase()]
    );
    
    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Set permissions based on role
    let permissions: string[] = [];
    switch (userData.role) {
      case 'admin':
        permissions = ['all'];
        break;
      case 'manager':
        permissions = ['projects', 'employees', 'invoices', 'expenses'];
        break;
      case 'user':
        permissions = ['projects', 'expenses'];
        break;
      case 'guest':
        permissions = ['projects'];
        break;
      default:
        permissions = ['projects'];
    }

    // Insert user
    const insertQuery = `
      INSERT INTO nomedia.users (
        name, email, password_hash, role, status, phone, 
        avatar_url, permissions
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, email, role, status, phone, avatar_url, 
               last_login, permissions, created_at, updated_at
    `;

    const result = await client.query(insertQuery, [
      userData.name,
      userData.email.toLowerCase(),
      hashedPassword,
      userData.role || 'user',
      'active',
      userData.phone || null,
      userData.avatarUrl || null,
      permissions
    ]);

    await client.query('COMMIT');

    const newUser = result.rows[0];

    // Send welcome email if requested
    let emailMessage = '';
    if (userData.sendWelcomeEmail) {
      if (emailService.isReady()) {
        const emailSent = await emailService.sendWelcomeEmail(
          newUser.email,
          newUser.name,
          userData.password
        );

        if (emailSent) {
          emailMessage = ' Email de bienvenue envoyé.';
        } else {
          emailMessage = ' Erreur lors de l\'envoi de l\'email de bienvenue.';
        }
      } else {
        emailMessage = ' Service email non configuré.';
      }
    }

    const response: ApiResponse<User> = {
      success: true,
      data: newUser,
      message: `Utilisateur créé avec succès.${emailMessage}`,
    };
    res.status(201).json(response);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    client.release();
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const id = parseInt(req.params.id);
    const updateData: UpdateUserRequest = req.body;
    
    // Check if user exists
    const userCheck = await client.query(
      'SELECT * FROM nomedia.users WHERE id = $1',
      [id]
    );
    
    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    const currentUser = userCheck.rows[0];

    // Check permissions: users can only update their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== id) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    // Non-admin users cannot change certain fields
    if (req.user.role !== 'admin') {
      delete updateData.role;
      delete updateData.status;
    }

    // Validate email if being updated
    if (updateData.email && updateData.email !== currentUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Format d\'email invalide',
        });
      }

      // Check if new email already exists
      const emailCheck = await client.query(
        'SELECT id FROM nomedia.users WHERE email = $1 AND id != $2',
        [updateData.email.toLowerCase(), id]
      );
      
      if (emailCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Un utilisateur avec cet email existe déjà',
        });
      }
    }

    // Update permissions if role changed
    let permissions = currentUser.permissions;
    if (updateData.role && updateData.role !== currentUser.role) {
      switch (updateData.role) {
        case 'admin':
          permissions = ['all'];
          break;
        case 'manager':
          permissions = ['projects', 'employees', 'invoices', 'expenses'];
          break;
        case 'user':
          permissions = ['projects', 'expenses'];
          break;
        case 'guest':
          permissions = ['projects'];
          break;
        default:
          permissions = ['projects'];
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let valueIndex = 1;

    if (updateData.name) {
      updateFields.push(`name = $${valueIndex++}`);
      updateValues.push(updateData.name);
    }
    if (updateData.email) {
      updateFields.push(`email = $${valueIndex++}`);
      updateValues.push(updateData.email.toLowerCase());
    }
    if (updateData.role) {
      updateFields.push(`role = $${valueIndex++}`);
      updateValues.push(updateData.role);
    }
    if (updateData.status) {
      updateFields.push(`status = $${valueIndex++}`);
      updateValues.push(updateData.status);
    }
    if (updateData.phone !== undefined) {
      updateFields.push(`phone = $${valueIndex++}`);
      updateValues.push(updateData.phone);
    }
    if (updateData.avatarUrl !== undefined) {
      updateFields.push(`avatar_url = $${valueIndex++}`);
      updateValues.push(updateData.avatarUrl);
    }
    if (permissions !== currentUser.permissions) {
      updateFields.push(`permissions = $${valueIndex++}`);
      updateValues.push(permissions);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const updateQuery = `
      UPDATE nomedia.users 
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING id, name, email, role, status, phone, avatar_url, 
               last_login, permissions, created_at, updated_at
    `;

    const result = await client.query(updateQuery, updateValues);
    
    await client.query('COMMIT');

    const response: ApiResponse<User> = {
      success: true,
      data: result.rows[0],
      message: 'Utilisateur mis à jour avec succès',
    };
    res.json(response);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    client.release();
  }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const id = parseInt(req.params.id);
    
    // Prevent deleting the current admin user
    if (req.user.id === id) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte',
      });
    }

    const result = await client.query(
      'DELETE FROM nomedia.users WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    await client.query('COMMIT');

    const response: ApiResponse<void> = {
      success: true,
      message: 'Utilisateur supprimé avec succès',
    };
    res.json(response);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    client.release();
  }
});

// GET /api/users/stats - Get user statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'manager' THEN 1 END) as manager_users,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
        COUNT(CASE WHEN role = 'guest' THEN 1 END) as guest_users
      FROM nomedia.users
    `;

    const result = await pool.query(statsQuery);
    const stats: UserStats = result.rows[0];

    const response: ApiResponse<UserStats> = {
      success: true,
      data: stats,
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
