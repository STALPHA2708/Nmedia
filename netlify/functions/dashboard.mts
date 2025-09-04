import type { Context, Config } from "@netlify/functions";
import { getSQLiteDatabase } from "./sqlite-helper.mts";

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

  try {
    const { db } = await getSQLiteDatabase();

    if (req.method === 'GET') {
      // Get dashboard statistics
      const projectsCount = db.prepare('SELECT COUNT(*) as count FROM projects').get()?.count || 0;
      const employeesCount = db.prepare('SELECT COUNT(*) as count FROM employees').get()?.count || 0;
      const activeProjectsCount = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'active'").get()?.count || 0;
      
      const totalBudget = db.prepare('SELECT SUM(budget) as total FROM projects').get()?.total || 0;
      const totalSpent = db.prepare('SELECT SUM(spent) as total FROM projects').get()?.total || 0;
      
      const recentProjects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC LIMIT 5').all();
      
      const stats = {
        totalProjects: projectsCount,
        totalEmployees: employeesCount,
        activeProjects: activeProjectsCount,
        totalBudget: totalBudget,
        totalSpent: totalSpent,
        budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        recentProjects
      };
      
      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Dashboard function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config: Config = {
  path: "/api/dashboard/*"
};
