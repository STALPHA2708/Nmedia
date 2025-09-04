import { Router } from 'express';
import { query, run, get } from '../config/unified-database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { ApiResponse, AuthSession, ChangePasswordRequest } from '@shared/api';

const router = Router();

// JWT secret - in production this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    console.log('🔐 Login attempt:', { email, passwordLength: password?.length, rememberMe });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
      });
    }

    // Find user in database with error handling for schema mismatches
    let user;
    try {
      user = await get(`
        SELECT id, name, email, password_hash, role, status, permissions
        FROM users
        WHERE email = ? AND status = 'active'
      `, [email.toLowerCase()]);
    } catch (schemaError) {
      console.error('❌ Database schema error:', schemaError.message);

      // Try alternative schema (for backwards compatibility)
      try {
        user = await get(`
          SELECT id, email, password_hash, role,
                 COALESCE(name, first_name || ' ' || last_name) as name,
                 COALESCE(status, CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END) as status,
                 COALESCE(permissions, '[]') as permissions
          FROM users
          WHERE email = ? AND (status = 'active' OR is_active = 1)
        `, [email.toLowerCase()]);
        console.log('✅ Using fallback schema query');
      } catch (fallbackError) {
        console.error('❌ Fallback schema also failed:', fallbackError.message);
        return res.status(500).json({
          success: false,
          message: 'Erreur de configuration de la base de données',
        });
      }
    }

    console.log('🔍 Database query result:', user ? 'User found' : 'User not found');
    if (user) {
      console.log('👤 User details:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      });
    }

    if (!user) {
      console.log('👤 User not found in database:', email);

      // Debug: Check if user exists but is inactive
      const inactiveUser = await get('SELECT email, status FROM users WHERE email = ?', [email.toLowerCase()]);
      if (inactiveUser) {
        console.log('⚠️ User exists but is inactive:', inactiveUser);
        return res.status(401).json({
          success: false,
          message: 'Compte désactivé. Contactez l\'administrateur.',
        });
      } else {
        console.log('⚠️ User does not exist in users table at all');

        // Development mode: Auto-create test users
        if (process.env.NODE_ENV === 'development' && (email.includes('test') || email.includes('demo'))) {
          console.log('🔧 Development mode: Auto-creating test user...');

          try {
            // Create test user with the attempted password
            const hashedPassword = await bcrypt.hash(password, 10);
            const userName = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);

            const result = await run(`
              INSERT INTO users (email, password_hash, name, role, status, permissions, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, [email.toLowerCase(), hashedPassword, userName, 'user', 'active', JSON.stringify([])]);

            console.log(`✅ Auto-created test user: ${email} with password provided`);

            // Retry the login with the newly created user
            const newUser = await get(`
              SELECT id, name, email, password_hash, role, status, permissions
              FROM users
              WHERE email = ? AND status = 'active'
            `, [email.toLowerCase()]);

            if (newUser) {
              console.log('🔄 Retrying login with auto-created user...');
              user = newUser; // Continue with login flow
            }
          } catch (createError) {
            console.error('❌ Failed to auto-create user:', createError);
          }
        }

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Email ou mot de passe incorrect',
            hint: process.env.NODE_ENV === 'development' ? 'Try: admin@nomedia.ma / admin123' : undefined
          });
        }
      }
    }

    console.log('👤 User found in database:', user.email);

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      console.log('🔒 Password invalid for user:', user.email);
      console.log('💡 Available test accounts:');
      console.log('   - admin@nomedia.ma / admin123 (Admin)');
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
        debug: process.env.NODE_ENV === 'development' ? {
          hint: 'Try admin@nomedia.ma / admin123',
          availableUsers: ['admin@nomedia.ma']
        } : undefined
      });
    }

    console.log('🔒 Password valid for user:', user.email);

    // Parse permissions JSON
    const permissions = user.permissions ? JSON.parse(user.permissions) : [];

    // Create JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions,
    };

    const tokenExpiry = rememberMe ? '30d' : '24h';
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: tokenExpiry });

    // Update last login
    await run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    // Return successful response
    const response = {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions,
        },
      },
      message: 'Connexion réussie',
    };

    console.log('✅ Login successful for user:', user.email);
    res.json(response);
  } catch (error) {
    console.error('❌ Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  // Since we're using JWT tokens, logout is handled client-side
  // In a production system with refresh tokens, you'd invalidate them here
  res.json({
    success: true,
    message: 'Déconnexion réussie',
  });
});

// Get current user endpoint
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès manquant',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get fresh user data from database
    const user = await get(`
      SELECT id, name, email, role, status, phone, avatar_url, permissions, last_login, created_at
      FROM users
      WHERE id = ? AND status = 'active'
    `, [decoded.id]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou inactif',
      });
    }

    // Parse permissions JSON
    const permissions = user.permissions ? JSON.parse(user.permissions) : [];

    const response = {
      success: true,
      data: {
        ...user,
        permissions,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré',
    });
  }
});

// Verify token endpoint
router.post('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès manquant',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Get fresh user data from database
    const user = await get(`
      SELECT id, name, email, role, status, phone, avatar_url, permissions, last_login, created_at
      FROM users
      WHERE id = ? AND status = 'active'
    `, [decoded.id]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou inactif',
      });
    }

    // Parse permissions JSON
    const permissions = user.permissions ? JSON.parse(user.permissions) : [];

    const response = {
      success: true,
      data: {
        user: {
          ...user,
          permissions,
        }
      },
      message: 'Token valide',
    };

    res.json(response);
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré',
    });
  }
});

// Change password endpoint
router.put('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès manquant',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { currentPassword, newPassword }: ChangePasswordRequest = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
      });
    }

    // Get user from database
    const user = await get(`
      SELECT id, password_hash FROM users WHERE id = ? AND status = 'active'
    `, [decoded.id]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!passwordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect',
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await run(`
      UPDATE users
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [hashedNewPassword, decoded.id]);

    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// User registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    console.log('👤 Registration attempt:', {
      firstName,
      lastName,
      email,
      phoneLength: phone?.length
    });

    // Validation
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères',
      });
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    if (cleanPhone.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le numéro de téléphone doit contenir au moins 8 chiffres',
      });
    }

    // Check if user already exists
    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un compte avec cet email existe déjà',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create full name
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    // Insert new user
    const result = await run(`
      INSERT INTO users (email, password_hash, name, role, status, permissions, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      email.toLowerCase().trim(),
      hashedPassword,
      fullName,
      'user', // Default role
      'active',
      JSON.stringify([]) // Default permissions
    ]);

    // Get the created user (without password hash)
    const newUser = await get(`
      SELECT id, name, email, role, status, created_at
      FROM users WHERE id = ?
    `, [result.lastInsertRowid]);

    console.log('✅ User registered successfully:', {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    });

    // Also create employee record for the user
    try {
      const { run: employeeRun } = await import('../config/unified-database');

      await employeeRun(`
        INSERT INTO employees (
          first_name, last_name, email, phone, position,
          department_id, salary, hire_date, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        firstName.trim(),
        lastName.trim(),
        email.toLowerCase().trim(),
        cleanPhone,
        'Employé', // Default position
        1, // Default department (first department)
        0, // Default salary
        new Date().toISOString().split('T')[0], // Today's date
        'active'
      ]);

      console.log('✅ Employee record created for user');
    } catch (employeeError) {
      console.warn('⚠️ Could not create employee record:', employeeError.message);
      // Don't fail registration if employee creation fails
    }

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        user: newUser
      }
    });

  } catch (error) {
    console.error('❌ Error during registration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Development only: Reset password endpoint
if (process.env.NODE_ENV === 'development') {
  router.post('/reset-password', async (req, res) => {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Email et nouveau mot de passe requis',
        });
      }

      // Check if user exists
      const user = await get('SELECT id, email, name FROM users WHERE email = ?', [email.toLowerCase()]);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé',
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await run('UPDATE users SET password_hash = ? WHERE email = ?', [hashedPassword, email.toLowerCase()]);

      console.log(`🔄 Password reset for user: ${email}`);

      res.json({
        success: true,
        message: `Mot de passe mis à jour pour ${user.name}`,
        data: {
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      console.error('❌ Error resetting password:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la réinitialisation du mot de passe',
      });
    }
  });

  // Development only: List users endpoint
  router.get('/list-users', async (req, res) => {
    try {
      const users = await query(`
        SELECT id, email, name, role, status, created_at
        FROM users
        ORDER BY created_at DESC
      `);

      res.json({
        success: true,
        data: users,
        message: `Found ${users.length} users`
      });
    } catch (error) {
      console.error('❌ Error listing users:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des utilisateurs',
      });
    }
  });

  // Development only: Test demo accounts
  router.get('/test-accounts', async (req, res) => {
    try {
      const demoAccounts = [
        { email: 'admin@nomedia.ma', password: 'admin123' },
        { email: 'david.chen@nomedia.ma', password: 'manager123' },
        { email: 'alice.martin@nomedia.ma', password: 'user123' }
      ];

      const results = [];

      for (const account of demoAccounts) {
        const user = get(`
          SELECT id, name, email, role, status
          FROM users WHERE email = ? AND status = 'active'
        `, [account.email]);

        if (user) {
          const userWithHash = get('SELECT password_hash FROM users WHERE email = ?', [account.email]);
          const passwordValid = await bcrypt.compare(account.password, userWithHash.password_hash);

          results.push({
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            passwordValid,
            testPassword: account.password
          });
        } else {
          results.push({
            email: account.email,
            error: 'User not found',
            testPassword: account.password
          });
        }
      }

      res.json({
        success: true,
        data: results,
        message: 'Demo account test completed'
      });
    } catch (error) {
      console.error('❌ Error testing accounts:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du test des comptes',
      });
    }
  });

  // Development only: Create contract types
  router.post('/create-contract-types', async (req, res) => {
    try {
      const contractTypes = [
        { name: 'CDI', is_permanent: 1, description: 'Contrat à Durée Indéterminée' },
        { name: 'CDD', is_permanent: 0, description: 'Contrat à Durée Déterminée' },
        { name: 'Stage', is_permanent: 0, description: 'Contrat de Stage' },
        { name: 'Freelance', is_permanent: 0, description: 'Contrat Freelance/Indépendant' },
        { name: 'Consultant', is_permanent: 0, description: 'Contrat de Consultation' }
      ];

      const results = [];

      for (const ct of contractTypes) {
        const existing = await get('SELECT id FROM contract_types WHERE name = ?', [ct.name]);

        if (!existing) {
          const result = await run(`
            INSERT INTO contract_types (name, is_permanent, description, created_at, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [ct.name, ct.is_permanent, ct.description]);

          results.push({
            name: ct.name,
            status: 'created',
            id: result.lastInsertRowid
          });
        } else {
          results.push({
            name: ct.name,
            status: 'exists'
          });
        }
      }

      res.json({
        success: true,
        data: results,
        message: 'Contract types processed successfully'
      });
    } catch (error) {
      console.error('❌ Error creating contract types:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating contract types',
        error: error.message
      });
    }
  });

  // Development only: Create missing demo accounts
  router.post('/create-demo-accounts', async (req, res) => {
    try {
      const demoAccounts = [
        {
          email: 'admin@nomedia.ma',
          name: 'Admin Principal',
          role: 'admin',
          password: 'admin123'
        },
        {
          email: 'david.chen@nomedia.ma',
          name: 'David Chen',
          role: 'manager',
          password: 'manager123'
        },
        {
          email: 'alice.martin@nomedia.ma',
          name: 'Alice Martin',
          role: 'user',
          password: 'user123'
        },
        {
          email: 'test@test.com',
          name: 'Test User',
          role: 'user',
          password: 'password'
        }
      ];

      const results = [];

      for (const account of demoAccounts) {
        const existing = get('SELECT id FROM users WHERE email = ?', [account.email]);

        if (!existing) {
          const hashedPassword = await bcrypt.hash(account.password, 10);

          const result = run(`
            INSERT INTO users (email, password_hash, name, role, status, permissions, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [account.email, hashedPassword, account.name, account.role, 'active', JSON.stringify([])]);

          results.push({
            email: account.email,
            status: 'created',
            id: result.lastInsertRowid
          });
        } else {
          // Update password for existing user
          const hashedPassword = await bcrypt.hash(account.password, 10);
          run('UPDATE users SET password_hash = ?, status = ? WHERE email = ?',
              [hashedPassword, 'active', account.email]);

          results.push({
            email: account.email,
            status: 'updated'
          });
        }
      }

      res.json({
        success: true,
        data: results,
        message: 'Demo accounts created/updated successfully'
      });
    } catch (error) {
      console.error('❌ Error creating demo accounts:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating demo accounts',
        error: error.message
      });
    }
  });
}

export default router;
