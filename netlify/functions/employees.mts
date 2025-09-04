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
      const employees = db.prepare('SELECT * FROM employees ORDER BY created_at DESC').all();
      
      return new Response(JSON.stringify(employees), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const employeeData = await req.json();
      
      const stmt = db.prepare(`
        INSERT INTO employees (first_name, last_name, email, phone, position, salary, contract_type, hire_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        employeeData.first_name,
        employeeData.last_name,
        employeeData.email,
        employeeData.phone,
        employeeData.position,
        employeeData.salary || 0,
        employeeData.contract_type,
        employeeData.hire_date,
        employeeData.status || 'active'
      );

      // Get the created employee
      const newEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
      
      // Save database changes
      await saveSQLiteDatabase(tempPath);
      tempPath = undefined;
      
      return new Response(JSON.stringify(newEmployee), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Employees function error:', error);
    
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
  path: "/api/employees"
};
