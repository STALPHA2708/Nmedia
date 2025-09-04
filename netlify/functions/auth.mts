import type { Context, Config } from "@netlify/functions";
import { getSQLiteDatabase, saveSQLiteDatabase } from "./sqlite-helper.mts";

export default async (req: Request, context: Context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  let tempPath: string | undefined;

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/api/auth', '');

    if (path === '/login' && req.method === 'POST') {
      const { email, password } = await req.json();
      
      const { db, tempPath: dbPath } = await getSQLiteDatabase();
      tempPath = dbPath;
      
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      
      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Verify password
      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.default.compare(password, user.password_hash);
      
      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Invalid password' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Update last login
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
      
      // Save database changes
      await saveSQLiteDatabase(tempPath);
      tempPath = undefined; // Mark as handled

      return new Response(JSON.stringify({ 
        success: true, 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role,
          permissions: JSON.parse(user.permissions || '[]')
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Auth function error:', error);
    
    // Clean up temp file if error occurred
    if (tempPath) {
      try {
        await saveSQLiteDatabase(tempPath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config: Config = {
  path: "/api/auth/*"
};
