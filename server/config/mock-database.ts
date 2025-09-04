// Mock database for development without native dependencies

const mockData = {
  users: [
    {
      id: 1,
      email: 'admin@nomedia.ma',
      password_hash: '$2b$10$rFYvKXw2vX8GXLYdHPyzEeWGLCVnKqMNBl.rFE./LXJr9YlmJqj6m', // admin123
      name: 'Admin Principal',
      role: 'admin',
      status: 'active',
      permissions: '[]',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null
    },
    {
      id: 2,
      email: 'manager@nomedia.ma',
      password_hash: '$2b$10$rFYvKXw2vX8GXLYdHPyzEeWGLCVnKqMNBl.rFE./LXJr9YlmJqj6m', // manager123
      name: 'Manager Test',
      role: 'manager',
      status: 'active',
      permissions: '[]',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null
    }
  ],
  employees: [],
  departments: [
    { id: 1, name: 'Production', description: 'Production audiovisuelle' }
  ],
  projects: [],
  invoices: []
};

let nextId = 10; // Start from 10 to avoid conflicts

// Mock database functions
export function query(sql: string, params: any[] = []): any[] {
  console.log('Mock Query:', sql, params);
  
  // Simple parsing for common queries
  if (sql.includes('SELECT') && sql.includes('users')) {
    if (sql.includes('WHERE email = ?')) {
      const email = params[0];
      return mockData.users.filter(u => u.email === email);
    }
    if (sql.includes('WHERE id = ?')) {
      const id = params[0];
      return mockData.users.filter(u => u.id === id);
    }
    return mockData.users;
  }
  
  if (sql.includes('SELECT') && sql.includes('departments')) {
    return mockData.departments;
  }
  
  return [];
}

export function get(sql: string, params: any[] = []): any {
  const results = query(sql, params);
  return results.length > 0 ? results[0] : null;
}

export function run(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  console.log('Mock Run:', sql, params);
  
  if (sql.includes('INSERT INTO users')) {
    const newUser = {
      id: nextId++,
      email: params[0],
      password_hash: params[1],
      name: params[2],
      role: params[3],
      status: params[4],
      permissions: params[5],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null
    };
    mockData.users.push(newUser);
    return { lastInsertRowid: newUser.id, changes: 1 };
  }
  
  if (sql.includes('INSERT INTO employees')) {
    const newEmployee = {
      id: nextId++,
      first_name: params[0],
      last_name: params[1],
      email: params[2],
      phone: params[3],
      position: params[4],
      department_id: params[5],
      salary: params[6],
      hire_date: params[7],
      status: params[8],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockData.employees.push(newEmployee);
    return { lastInsertRowid: newEmployee.id, changes: 1 };
  }
  
  if (sql.includes('UPDATE users') && sql.includes('last_login')) {
    const userId = params[params.length - 1];
    const user = mockData.users.find(u => u.id === userId);
    if (user) {
      user.last_login = new Date().toISOString();
      return { lastInsertRowid: userId, changes: 1 };
    }
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
  })
};
