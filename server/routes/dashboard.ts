import { Router } from 'express';
import { query } from '../config/unified-database';
import type { DashboardStats } from '@shared/api';

const router = Router();

// GET /api/dashboard/stats - Get comprehensive dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Execute all statistics queries in parallel
    const [
      projectsStats,
      employeesStats,
      invoicesStats,
      expensesStats,
      recentActivity
    ] = await Promise.all([
      getProjectsStats(),
      getEmployeesStats(), 
      getInvoicesStats(),
      getExpensesStats(),
      getRecentActivity()
    ]);

    const dashboardStats: DashboardStats = {
      projects: projectsStats,
      employees: employeesStats,
      invoices: invoicesStats,
      expenses: expensesStats,
      recentActivity: recentActivity
    };

    res.json({
      success: true,
      data: dashboardStats,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Projects statistics
async function getProjectsStats() {
  try {
    const sql = `
      SELECT
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'pre_production' THEN 1 END) as pre_production_projects,
        COUNT(CASE WHEN status = 'production' THEN 1 END) as production_projects,
        COUNT(CASE WHEN status = 'post_production' THEN 1 END) as post_production_projects,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
        COALESCE(SUM(budget), 0) as total_budget,
        COALESCE(SUM(spent), 0) as total_spent,
        COALESCE(AVG(progress), 0) as average_progress
      FROM projects
    `;

    const result = await query(sql);
    const stats = result[0] || {};

    return {
      total_projects: parseInt(stats.total_projects),
      pre_production_projects: parseInt(stats.pre_production_projects),
      production_projects: parseInt(stats.production_projects),
      post_production_projects: parseInt(stats.post_production_projects),
      completed_projects: parseInt(stats.completed_projects),
      total_budget: parseFloat(stats.total_budget),
      total_spent: parseFloat(stats.total_spent),
      average_progress: Math.round(parseFloat(stats.average_progress)),
    };
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return {
      total_projects: 0,
      pre_production_projects: 0,
      production_projects: 0,
      post_production_projects: 0,
      completed_projects: 0,
      total_budget: 0,
      total_spent: 0,
      average_progress: 0,
    };
  }
}

// Employees statistics
async function getEmployeesStats() {
  try {
    const sql = `
      SELECT
        COUNT(*) as total_employees,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_employees,
        COUNT(CASE WHEN status = 'on_leave' THEN 1 END) as on_leave_employees,
        COALESCE(SUM(CASE WHEN status = 'active' THEN salary ELSE 0 END), 0) as total_active_payroll,
        COUNT(DISTINCT department_id) as total_departments
      FROM employees
    `;

    const result = await query(sql);
    const stats = result[0] || {};
    
    return {
      total_employees: parseInt(stats.total_employees),
      active_employees: parseInt(stats.active_employees),
      inactive_employees: parseInt(stats.inactive_employees),
      on_leave_employees: parseInt(stats.on_leave_employees),
      total_active_payroll: parseFloat(stats.total_active_payroll),
      total_departments: parseInt(stats.total_departments),
    };
  } catch (error) {
    console.error('Error fetching employee stats:', error);
    return {
      total_employees: 0,
      active_employees: 0,
      inactive_employees: 0,
      on_leave_employees: 0,
      total_active_payroll: 0,
      total_departments: 0,
    };
  }
}

// Invoices statistics
async function getInvoicesStats() {
  try {
    const sql = `
      SELECT
        COUNT(*) as total_invoices,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_invoices,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as sent_invoices,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) as paid_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending' OR status = 'overdue' THEN total_amount ELSE 0 END), 0) as pending_revenue
      FROM invoices
    `;

    const result = await query(sql);
    const stats = result[0] || {};
    
    return {
      total_invoices: parseInt(stats.total_invoices),
      draft_invoices: parseInt(stats.draft_invoices),
      sent_invoices: parseInt(stats.sent_invoices),
      paid_invoices: parseInt(stats.paid_invoices),
      overdue_invoices: parseInt(stats.overdue_invoices),
      total_revenue: parseFloat(stats.total_revenue),
      paid_revenue: parseFloat(stats.paid_revenue),
      pending_revenue: parseFloat(stats.pending_revenue),
    };
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    return {
      total_invoices: 0,
      draft_invoices: 0,
      sent_invoices: 0,
      paid_invoices: 0,
      overdue_invoices: 0,
      total_revenue: 0,
      paid_revenue: 0,
      pending_revenue: 0,
    };
  }
}

// Expenses statistics
async function getExpensesStats() {
  try {
    const sql = `
      SELECT
        COUNT(*) as total_expenses,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_expenses,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_expenses,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_expenses,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) as approved_amount,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount
      FROM expenses
    `;

    const result = await query(sql);
    const stats = result[0] || {};

    return {
      total_expenses: parseInt(stats.total_expenses),
      pending_expenses: parseInt(stats.pending_expenses),
      approved_expenses: parseInt(stats.approved_expenses),
      rejected_expenses: parseInt(stats.rejected_expenses),
      total_amount: parseFloat(stats.total_amount),
      approved_amount: parseFloat(stats.approved_amount),
      pending_amount: parseFloat(stats.pending_amount),
    };
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    return {
      total_expenses: 0,
      pending_expenses: 0,
      approved_expenses: 0,
      rejected_expenses: 0,
      total_amount: 0,
      approved_amount: 0,
      pending_amount: 0,
    };
  }
}

// Recent activity
async function getRecentActivity() {
  try {
    const activities = [];

    // Recent projects - FIXED: Added await
    const recentProjects = await query(`
      SELECT name, status, created_at, 'project' as type
      FROM projects
      ORDER BY created_at DESC
      LIMIT 3
    `);

    // Ensure it's an array before forEach
    if (Array.isArray(recentProjects)) {
      recentProjects.forEach(project => {
        activities.push({
          id: `project-${project.name}`,
          type: 'project',
          title: `Nouveau projet: ${project.name}`,
          description: `Statut: ${project.status}`,
          timestamp: project.created_at,
          icon: 'folder'
        });
      });
    }

    // Recent users - FIXED: Added await
    const recentUsers = await query(`
      SELECT name, role, created_at, 'user' as type
      FROM users
      ORDER BY created_at DESC
      LIMIT 2
    `);

    // Ensure it's an array before forEach
    if (Array.isArray(recentUsers)) {
      recentUsers.forEach(user => {
        activities.push({
          id: `user-${user.name}`,
          type: 'user',
          title: `Nouvel utilisateur: ${user.name}`,
          description: `Rôle: ${user.role}`,
          timestamp: user.created_at,
          icon: 'user'
        });
      });
    }

    // Sort by timestamp and return latest 5
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

export default router;
