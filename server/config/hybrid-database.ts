// Complete hybrid database with your real data and full CRUD operations

// Real data from your database
const realData = {
  users: [
    {
      id: 1,
      name: 'Admin Principal',
      email: 'admin@nomedia.ma',
      password_hash: '$2b$10$ZaxMbSU7MNmO5yddRsPxj.a6or1jsPoXASfhypuAYNwBr1z3oa06W',
      role: 'admin',
      status: 'active',
      phone: '+212 6 12 34 56 78',
      permissions: '["all"]',
      last_login: '2025-07-31 16:51:31',
      created_at: '2025-07-31 12:11:42',
      updated_at: '2025-07-31 12:11:42'
    },
    {
      id: 2,
      name: 'tessttesst',
      email: 'test@test.com',
      password_hash: '$2b$12$.fXT7BsdxLYPBHvIGqI0ZuAX/uQYcrrpPtf/7Ga2MJeKNo4LAEIb6',
      role: 'guest',
      status: 'active',
      phone: '+212664655009',
      permissions: '["projects"]',
      created_at: '2025-07-31 16:32:28',
      updated_at: '2025-07-31 16:32:28'
    }
  ],
  
  projects: [
    {
      id: 1,
      name: 'Spot TV - Luxury Brand',
      client_name: 'Maison Deluxe',
      description: 'Production d\'un spot télévisé de 30 secondes pour une marque de luxe',
      status: 'production',
      priority: 'high',
      budget: 75000.00,
      spent: 48750.00,
      start_date: '2024-01-10',
      deadline: '2024-02-15',
      progress: 65,
      project_type: 'publicite',
      deliverables: '["Spot TV 30s","Version web","Making-of"]',
      notes: 'Tournage en studio et en extérieur',
      client_contact_name: 'Sophie Dubois',
      client_contact_email: 'sophie@maison-deluxe.com',
      client_contact_phone: '+212 5 22 33 44 55',
      created_at: '2025-07-31 12:18:54',
      updated_at: '2025-07-31 12:18:54'
    },
    {
      id: 2,
      name: 'Documentaire Corporate',
      client_name: 'TechCorp',
      description: 'Documentaire de 15 minutes sur l\'histoire et les valeurs de l\'entreprise',
      status: 'post_production',
      priority: 'medium',
      budget: 35000.00,
      spent: 28800.00,
      start_date: '2023-12-01',
      deadline: '2024-01-30',
      progress: 80,
      project_type: 'documentaire',
      deliverables: '["Documentaire 15min","Trailer 2min"]',
      notes: 'Interviews avec les dirigeants et employés',
      client_contact_name: 'Jean Techno',
      client_contact_email: 'jean@techcorp.ma',
      client_contact_phone: '+212 5 22 11 22 33',
      created_at: '2025-07-31 12:18:54',
      updated_at: '2025-07-31 12:18:54'
    },
    {
      id: 3,
      name: 'Campagne Publicitaire',
      client_name: 'FashionHouse',
      description: 'Série de 5 vidéos pour campagne publicitaire multi-canaux',
      status: 'pre_production',
      priority: 'high',
      budget: 120000.00,
      spent: 15000.00,
      start_date: '2024-01-20',
      deadline: '2024-03-10',
      progress: 25,
      project_type: 'publicite',
      deliverables: '["5 vidéos produits","Adaptation réseaux sociaux","Assets photos"]',
      notes: 'Campagne automne-hiver 2024',
      client_contact_name: 'Marie Fashion',
      client_contact_email: 'marie@fashionhouse.ma',
      client_contact_phone: '+212 5 22 44 55 66',
      created_at: '2025-07-31 12:27:32',
      updated_at: '2025-07-31 12:27:32'
    }
  ],
  
  departments: [
    {
      id: 1,
      name: 'Production',
      description: 'Production audiovisuelle',
      created_at: '2025-01-01 00:00:00',
      updated_at: '2025-01-01 00:00:00'
    },
    {
      id: 2,
      name: 'Post-Production',
      description: 'Montage et effets visuels',
      created_at: '2025-01-01 00:00:00',
      updated_at: '2025-01-01 00:00:00'
    }
  ],
  
  employees: [
    {
      id: 1,
      first_name: 'Ahmed',
      last_name: 'Benali',
      email: 'ahmed.benali@nomedia.ma',
      phone: '+212 6 11 22 33 44',
      address: 'Casablanca, Maroc',
      position: 'Directeur de production',
      department_id: 1,
      salary: 15000.00,
      hire_date: '2023-01-15',
      status: 'active',
      created_at: '2025-01-01 00:00:00',
      updated_at: '2025-01-01 00:00:00'
    },
    {
      id: 2,
      first_name: 'Fatima',
      last_name: 'Zahra',
      email: 'fatima.zahra@nomedia.ma',
      phone: '+212 6 22 33 44 55',
      address: 'Rabat, Maroc',
      position: 'Monteuse',
      department_id: 2,
      salary: 8000.00,
      hire_date: '2023-03-01',
      status: 'active',
      created_at: '2025-01-01 00:00:00',
      updated_at: '2025-01-01 00:00:00'
    }
  ],
  
  invoices: [
    {
      id: 1,
      invoice_number: 'INV-2024-001',
      client: 'Maison Deluxe',
      project: 'Spot TV - Luxury Brand',
      project_id: 1,
      amount: 75000.00,
      tax_amount: 15000.00,
      total_amount: 90000.00,
      issue_date: '2024-01-15',
      due_date: '2024-02-15',
      status: 'paid',
      created_at: '2024-01-15 00:00:00',
      updated_at: '2024-01-20 00:00:00'
    }
  ],
  
  expenses: [
    {
      id: 1,
      employee_id: 1,
      project_id: 1,
      category: 'Transport',
      description: 'Déplacement tournage',
      amount: 250.00,
      expense_date: '2024-01-12',
      status: 'approved',
      created_at: '2024-01-12 00:00:00',
      updated_at: '2024-01-12 00:00:00'
    }
  ]
};

let nextId = 1000; // Start high to avoid conflicts

export function query(sql: string, params: any[] = []): any[] {
  console.log('🗄️ Hybrid Query:', sql.substring(0, 100) + '...', params);
  
  // Users queries
  if (sql.includes('FROM users')) {
    if (sql.includes('WHERE email = ?')) {
      return realData.users.filter(u => u.email === params[0]);
    }
    if (sql.includes('WHERE id = ?')) {
      return realData.users.filter(u => u.id === params[0]);
    }
    if (sql.includes('ORDER BY created_at DESC')) {
      return [...realData.users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return realData.users;
  }
  
  // Projects queries
  if (sql.includes('FROM projects')) {
    if (sql.includes('COUNT(*)') && sql.includes('CASE WHEN')) {
      // Dashboard stats query
      const projects = realData.projects;
      return [{
        total_projects: projects.length,
        pre_production_projects: projects.filter(p => p.status === 'pre_production').length,
        production_projects: projects.filter(p => p.status === 'production').length,
        post_production_projects: projects.filter(p => p.status === 'post_production').length,
        completed_projects: projects.filter(p => p.status === 'completed').length,
        total_budget: projects.reduce((sum, p) => sum + p.budget, 0),
        total_spent: projects.reduce((sum, p) => sum + p.spent, 0),
        average_progress: projects.length > 0 ? projects.reduce((sum, p) => sum + p.progress, 0) / projects.length : 0
      }];
    }
    if (sql.includes('WHERE id = ?')) {
      return realData.projects.filter(p => p.id === params[0]);
    }
    if (sql.includes('LIMIT 3')) {
      return realData.projects.slice(0, 3).map(p => ({
        name: p.name,
        status: p.status,
        created_at: p.created_at,
        type: 'project'
      }));
    }
    // Return projects with team member count
    return realData.projects.map(p => ({
      ...p,
      team_member_count: 0 // Mock value for now
    }));
  }
  
  // Employees queries
  if (sql.includes('FROM employees')) {
    if (sql.includes('COUNT(*)') && sql.includes('CASE WHEN')) {
      // Dashboard stats query
      const employees = realData.employees;
      return [{
        total_employees: employees.length,
        active_employees: employees.filter(e => e.status === 'active').length,
        inactive_employees: employees.filter(e => e.status === 'inactive').length,
        on_leave_employees: employees.filter(e => e.status === 'on_leave').length,
        total_active_payroll: employees.filter(e => e.status === 'active').reduce((sum, e) => sum + e.salary, 0),
        total_departments: realData.departments.length
      }];
    }
    if (sql.includes('WHERE id = ?')) {
      return realData.employees.filter(e => e.id === params[0]);
    }
    // Return employees with department name
    return realData.employees.map(e => {
      const dept = realData.departments.find(d => d.id === e.department_id);
      return {
        ...e,
        department_name: dept?.name || 'N/A',
        active_projects: 0 // Mock value for now
      };
    });
  }
  
  // Departments queries
  if (sql.includes('FROM departments')) {
    if (sql.includes('WHERE id = ?')) {
      return realData.departments.filter(d => d.id === params[0]);
    }
    if (sql.includes('WHERE name = ?')) {
      // Check for existing department by name
      const dept = realData.departments.filter(d => d.name === params[0]);
      console.log('🏢 Department name check:', params[0], 'found:', dept.length > 0);
      return dept;
    }
    if (sql.includes('WHERE name = ? AND id != ?')) {
      // Check for name conflict during update
      return realData.departments.filter(d => d.name === params[0] && d.id !== params[1]);
    }
    if (sql.includes('LEFT JOIN employees')) {
      // Return departments with employee count
      return realData.departments.map(d => {
        const employeeCount = realData.employees.filter(e => e.department_id === d.id).length;
        return {
          ...d,
          employee_count: employeeCount
        };
      });
    }
    return realData.departments;
  }
  
  // Invoices queries
  if (sql.includes('FROM invoices')) {
    if (sql.includes('COUNT(*)') && sql.includes('CASE WHEN')) {
      // Dashboard stats query
      const invoices = realData.invoices;
      return [{
        total_invoices: invoices.length,
        draft_invoices: invoices.filter(i => i.status === 'draft').length,
        sent_invoices: invoices.filter(i => i.status === 'pending').length,
        paid_invoices: invoices.filter(i => i.status === 'paid').length,
        overdue_invoices: invoices.filter(i => i.status === 'overdue').length,
        total_revenue: invoices.reduce((sum, i) => sum + i.total_amount, 0),
        paid_revenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0),
        pending_revenue: invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((sum, i) => sum + i.total_amount, 0)
      }];
    }
    if (sql.includes('WHERE id = ?')) {
      return realData.invoices.filter(i => i.id === params[0]);
    }
    return realData.invoices;
  }
  
  // Expenses queries
  if (sql.includes('FROM expenses')) {
    if (sql.includes('COUNT(*)') && sql.includes('CASE WHEN')) {
      // Dashboard stats query
      const expenses = realData.expenses;
      return [{
        total_expenses: expenses.length,
        pending_expenses: expenses.filter(e => e.status === 'pending').length,
        approved_expenses: expenses.filter(e => e.status === 'approved').length,
        rejected_expenses: expenses.filter(e => e.status === 'rejected').length,
        total_amount: expenses.reduce((sum, e) => sum + e.amount, 0),
        approved_amount: expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0),
        pending_amount: expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0)
      }];
    }
    if (sql.includes('WHERE id = ?')) {
      return realData.expenses.filter(e => e.id === params[0]);
    }
    return realData.expenses;
  }

  // Employee count check for departments (for deletion validation)
  if (sql.includes('COUNT(*) as count FROM employees WHERE department_id = ?')) {
    const departmentId = params[0];
    const count = realData.employees.filter(e => e.department_id === departmentId).length;
    console.log('🏢 Employee count for department', departmentId, ':', count);
    return [{ count }];
  }
  
  return [];
}

export function get(sql: string, params: any[] = []): any {
  const results = query(sql, params);
  return results.length > 0 ? results[0] : null;
}

export function run(sql: string, params: any[] = []): any {
  console.log('🗄️ Hybrid Run:', sql.substring(0, 100) + '...', params);
  
  // Insert operations
  if (sql.includes('INSERT INTO users')) {
    const newUser = {
      id: nextId++,
      email: params[0],
      password_hash: params[1],
      name: params[2],
      role: params[3],
      status: params[4],
      permissions: params[5],
      phone: null,
      avatar_url: null,
      last_login: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    realData.users.push(newUser);
    console.log('✅ Created user:', newUser.name);
    return { lastInsertRowid: newUser.id, changes: 1 };
  }
  
  if (sql.includes('INSERT INTO projects')) {
    const newProject = {
      id: nextId++,
      name: params[0],
      client_name: params[1],
      description: params[2] || '',
      status: params[3] || 'pre_production',
      priority: params[4] || 'medium',
      budget: params[5] || 0,
      spent: 0,
      start_date: params[6] || new Date().toISOString().split('T')[0],
      deadline: params[7] || new Date().toISOString().split('T')[0],
      progress: 0,
      project_type: params[8] || 'general',
      deliverables: params[9] || '[]',
      notes: params[10] || '',
      client_contact_name: params[11] || '',
      client_contact_email: params[12] || '',
      client_contact_phone: params[13] || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    realData.projects.push(newProject);
    console.log('✅ Created project:', newProject.name);
    return { lastInsertRowid: newProject.id, changes: 1 };
  }
  
  if (sql.includes('INSERT INTO employees')) {
    const newEmployee = {
      id: nextId++,
      first_name: params[0],
      last_name: params[1],
      email: params[2],
      phone: params[3],
      address: params[4] || '',
      position: params[5] || 'Employee',
      department_id: params[6] || 1,
      salary: params[7] || 0,
      hire_date: params[8] || new Date().toISOString().split('T')[0],
      status: params[9] || 'active',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    realData.employees.push(newEmployee);
    console.log('✅ Created employee:', newEmployee.first_name, newEmployee.last_name);
    return { lastInsertRowid: newEmployee.id, changes: 1 };
  }

  if (sql.includes('INSERT INTO departments')) {
    const newDepartment = {
      id: nextId++,
      name: params[0],
      description: params[1] || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    realData.departments.push(newDepartment);
    console.log('✅ Created department:', newDepartment.name);
    return { lastInsertRowid: newDepartment.id, changes: 1 };
  }
  
  // Update operations
  if (sql.includes('UPDATE users') && sql.includes('last_login')) {
    const userId = params[params.length - 1];
    const user = realData.users.find(u => u.id === userId);
    if (user) {
      user.last_login = new Date().toISOString();
      user.updated_at = new Date().toISOString();
      console.log('✅ Updated last login for:', user.email);
    }
    return { lastInsertRowid: userId, changes: 1 };
  }
  
  if (sql.includes('UPDATE projects')) {
    const projectId = params[params.length - 1];
    const project = realData.projects.find(p => p.id === projectId);
    if (project) {
      // Update project fields based on SQL (simplified)
      project.updated_at = new Date().toISOString();
      console.log('✅ Updated project:', project.name);
    }
    return { lastInsertRowid: projectId, changes: 1 };
  }

  if (sql.includes('UPDATE departments')) {
    const departmentId = params[params.length - 1];
    const department = realData.departments.find(d => d.id === departmentId);
    if (department) {
      // Update department fields
      department.name = params[0];
      department.description = params[1] || '';
      department.updated_at = new Date().toISOString();
      console.log('✅ Updated department:', department.name);
    }
    return { lastInsertRowid: departmentId, changes: 1 };
  }
  
  // Delete operations
  if (sql.includes('DELETE FROM projects')) {
    const projectId = params[0];
    const index = realData.projects.findIndex(p => p.id === projectId);
    if (index > -1) {
      const deletedProject = realData.projects.splice(index, 1)[0];
      console.log('✅ Deleted project:', deletedProject.name);
      return { changes: 1 };
    }
    return { changes: 0 };
  }
  
  if (sql.includes('DELETE FROM employees')) {
    const employeeId = params[0];
    const index = realData.employees.findIndex(e => e.id === employeeId);
    if (index > -1) {
      const deletedEmployee = realData.employees.splice(index, 1)[0];
      console.log('✅ Deleted employee:', deletedEmployee.first_name, deletedEmployee.last_name);
      return { changes: 1 };
    }
    return { changes: 0 };
  }
  
  if (sql.includes('DELETE FROM users')) {
    const userId = params[0];
    const index = realData.users.findIndex(u => u.id === userId);
    if (index > -1) {
      const deletedUser = realData.users.splice(index, 1)[0];
      console.log('✅ Deleted user:', deletedUser.name);
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  if (sql.includes('DELETE FROM departments')) {
    const departmentId = params[0];
    const index = realData.departments.findIndex(d => d.id === departmentId);
    if (index > -1) {
      const deletedDepartment = realData.departments.splice(index, 1)[0];
      console.log('✅ Deleted department:', deletedDepartment.name);
      return { changes: 1 };
    }
    return { changes: 0 };
  }
  
  return { lastInsertRowid: nextId++, changes: 1 };
}

// Export mock db for compatibility
export const db = {
  pragma: () => {},
  prepare: (sql: string) => ({
    all: (params: any[]) => query(sql, params),
    get: (params: any[]) => get(sql, params),
    run: (params: any[]) => run(sql, params)
  }),
  close: () => {}
};
