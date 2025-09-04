import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query as dbQuery, get as dbGet, run as dbRun } from '../config/unified-database';
import type {
  ApiResponse,
  User,
  LoginRequest,
  LoginResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  AuthSession,
  UserStats,
} from '@shared/api';

const router = Router();

// JWT secret - in production this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// Mock user data for development (in production this would be in database)
const mockUsers: User[] = [
  {
    id: 1,
    name: 'Admin Principal',
    email: 'admin@nomedia.ma',
    role: 'admin',
    status: 'active',
    phone: '+212 6 12 34 56 78',
    last_login: new Date().toISOString(),
    created_at: '2023-01-01T00:00:00Z',
    updated_at: new Date().toISOString(),
    permissions: ['all'],
  },
  {
    id: 2,
    name: 'David Chen',
    email: 'david.chen@nomedia.ma',
    role: 'manager',
    status: 'active',
    phone: '+212 6 23 45 67 89',
    last_login: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    created_at: '2023-02-01T00:00:00Z',
    updated_at: new Date().toISOString(),
    permissions: ['projects', 'employees', 'invoices'],
  },
  {
    id: 3,
    name: 'Alice Martin',
    email: 'alice.martin@nomedia.ma',
    role: 'user',
    status: 'active',
    phone: '+212 6 34 56 78 90',
    last_login: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    created_at: '2023-03-01T00:00:00Z',
    updated_at: new Date().toISOString(),
    permissions: ['projects', 'expenses'],
  },
  {
    id: 4,
    name: 'Bob Dupont',
    email: 'bob.dupont@nomedia.ma',
    role: 'user',
    status: 'inactive',
    phone: '+212 6 45 67 89 01',
    last_login: new Date(Date.now() - 1209600000).toISOString(), // 2 weeks ago
    created_at: '2023-04-01T00:00:00Z',
    updated_at: new Date().toISOString(),
    permissions: ['projects'],
  },
];

// Mock password storage (in production use proper hashed passwords)
const mockPasswords: Record<string, string> = {
  'admin@nomedia.ma': '$2a$10$rOq7K8K9mQJQJ9QJ9QJ9QuxvNBk7dGJp0N9kQ9J9Q9J9Q9J9Q9J9Q', // 'admin123'
  'david.chen@nomedia.ma': '$2a$10$rOq7K8K9mQJQJ9QJ9QJ9QuxvNBk7dGJp0N9kQ9J9Q9J9Q9J9Q9J9Q', // 'manager123'
  'alice.martin@nomedia.ma': '$2a$10$rOq7K8K9mQJQJ9QJ9QJ9QuxvNBk7dGJp0N9kQ9J9Q9J9Q9J9Q9J9Q', // 'user123'
  'bob.dupont@nomedia.ma': '$2a$10$rOq7K8K9mQJQJ9QJ9QJ9QuxvNBk7dGJp0N9kQ9J9Q9J9Q9J9Q9J9Q', // 'user123'
};

// Mock active sessions
const mockSessions: AuthSession[] = [
  {
    id: 'session-1',
    user_id: 1,
    device: 'Chrome sur Windows',
    browser: 'Chrome 120.0',
    ip_address: '196.200.xxx.xxx',
    location: 'Casablanca, Maroc',
    last_activity: new Date().toISOString(),
    is_current: true,
  },
  {
    id: 'session-2',
    user_id: 1,
    device: 'iPhone Safari',
    browser: 'Mobile Safari 17.0',
    ip_address: '196.200.xxx.xxx',
    location: 'Casablanca, Maroc',
    last_activity: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    is_current: false,
  },
];

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

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe }: LoginRequest = req.body;

    console.log('🔐 Login attempt:', {
      email: email,
      passwordLength: password?.length || 0,
      rememberMe
    });

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
      });
    }

    // Find user by email - Use mock data for development when DB is not available or empty
    let user;
    let usingMockData = false;

    try {
      const userQuery = 'SELECT * FROM users WHERE email = ? AND status = ?';
      const users = await dbQuery(userQuery, [email.toLowerCase(), 'active']);
      user = users[0];
      console.log('✅ Database query successful. User found:', user ? user.email : 'none');
    } catch (dbError) {
      console.log('📀 Database error occurred:', dbError.message);
      usingMockData = true;
    }

    // If no user found in database (either error or empty result), try mock data
    if (!user) {
      console.log('🔄 No user in database, falling back to mock data');
      console.log('🔍 Searching mock users for email:', email.toLowerCase());
      console.log('📋 Available mock users:', mockUsers.map(u => ({ email: u.email, status: u.status })));

      user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.status === 'active');
      console.log('👤 Mock user found:', user ? user.email : 'none');
      usingMockData = true;
    }

    if (!user) {
      console.log('❌ No user found in database OR mock data for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    console.log('🎯 Using user from:', usingMockData ? 'mock data' : 'database');

    console.log('🔑 Checking password. Provided:', password, 'Expected one of: admin123, manager123, user123');

    // Verify password
    // For demo, we'll use simple comparison - in production use bcrypt.compare
    const isValidPassword = password === 'admin123' || password === 'manager123' || password === 'user123';
    console.log('🔒 Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Invalid password provided');
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Update last login (only if database is available)
    try {
      await dbRun(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );
    } catch (dbError) {
      console.log('Database not available, skipping last_login update');
    }

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn: rememberMe ? '30d' : JWT_EXPIRES_IN 
    });

    const refreshToken = jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn: REFRESH_TOKEN_EXPIRES_IN 
    });

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        user: {
          ...user,
          // Don't send sensitive data
        },
        token,
        refreshToken,
        expiresIn: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // seconds
      },
      message: 'Connexion réussie',
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In production, invalidate the token in a blacklist or database
    
    const response: ApiResponse<void> = {
      success: true,
      message: 'Déconnexion réussie',
    };

    res.json(response);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/auth/verify - Verify token
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    // Token is already verified by middleware, get user data
    let user;
    try {
      user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
    } catch (dbError) {
      // Fallback to mock data if database is not available
      console.log('Database not available, using mock data for verify');
      user = mockUsers.find(u => u.id === req.user.id && u.status === 'active');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    const response: ApiResponse<{ user: User }> = {
      success: true,
      data: { user },
      message: 'Token valide',
    };

    res.json(response);
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du token',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouv��',
      });
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user,
    };

    res.json(response);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations utilisateur',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/auth/refresh - Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Token de rafraîchissement manquant',
      });
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
    const user = await dbGet('SELECT * FROM users WHERE id = ? AND status = ?', [decoded.id, 'active']);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou utilisateur inactif',
      });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };

    const newToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const newRefreshToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

    const response: ApiResponse<{ token: string; refreshToken: string; expiresIn: number }> = {
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Token de rafraîchissement invalide',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/auth/change-password - Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword }: ChangePasswordRequest = req.body;
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Les mots de passe ne correspondent pas',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères',
      });
    }

    // Verify current password (simplified for demo)
    const isValidCurrentPassword = currentPassword === 'admin123' || currentPassword === 'manager123' || currentPassword === 'user123';
    if (!isValidCurrentPassword) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await dbRun(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, user.id]
    );

    const response: ApiResponse<void> = {
      success: true,
      message: 'Mot de passe modifié avec succès',
    };

    res.json(response);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/auth/sessions - Get user sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userSessions = mockSessions.filter(s => s.user_id === req.user.id);

    const response: ApiResponse<AuthSession[]> = {
      success: true,
      data: userSessions,
    };

    res.json(response);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la r��cupération des sessions',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/auth/sessions/:sessionId - Terminate a session
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionIndex = mockSessions.findIndex(s => s.id === sessionId && s.user_id === req.user.id);

    if (sessionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée',
      });
    }

    mockSessions.splice(sessionIndex, 1);

    const response: ApiResponse<void> = {
      success: true,
      message: 'Session terminée avec succès',
    };

    res.json(response);
  } catch (error) {
    console.error('Terminate session error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la terminaison de session',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
