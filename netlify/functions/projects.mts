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
    const { db, tempPath: dbPath } = await getSQLiteDatabase();
    tempPath = dbPath;

    if (req.method === 'GET') {
      const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
      
      return new Response(JSON.stringify(projects), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const projectData = await req.json();
      
      const stmt = db.prepare(`
        INSERT INTO projects (name, description, client_name, status, start_date, deadline, budget)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        projectData.name,
        projectData.description,
        projectData.client_name,
        projectData.status || 'active',
        projectData.start_date,
        projectData.deadline,
        projectData.budget || 0
      );

      // Get the created project
      const newProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
      
      // Save database changes
      await saveSQLiteDatabase(tempPath);
      tempPath = undefined; // Mark as handled
      
      return new Response(JSON.stringify(newProject), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Projects function error:', error);
    
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
  path: "/api/projects"
};
