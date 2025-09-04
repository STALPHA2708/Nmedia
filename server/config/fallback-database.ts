// Fallback in-memory database for when PostgreSQL is not available
import bcrypt from "bcryptjs";

// In-memory data store
let users: any[] = [];
let departments: any[] = [];
let contractTypes: any[] = [];
let employees: any[] = [];
let projects: any[] = [];
let invoices: any[] = [];
let expenses: any[] = [];
let projectTeamMembers: any[] = [];

let nextId = 1;

function getNextId() {
  return nextId++;
}

export async function initializeFallbackData() {
  console.log("🔧 Initializing fallback in-memory database...");

  // Create default departments
  departments = [
    {
      id: getNextId(),
      name: "Production",
      description: "Équipe de production audiovisuelle",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: getNextId(),
      name: "Technique",
      description: "Équipe technique et matériel",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: getNextId(),
      name: "Post-Production",
      description: "Montage et finalisation",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: getNextId(),
      name: "Direction",
      description: "Direction et management",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: getNextId(),
      name: "Administration",
      description: "Administration et RH",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: getNextId(),
      name: "Marketing",
      description: "Marketing et communication",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: getNextId(),
      name: "Commercial",
      description: "Équipe commerciale",
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  // Create default contract types
  contractTypes = [
    {
      id: getNextId(),
      name: "CDI",
      is_permanent: true,
      description: "Contrat à Durée Indéterminée",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: getNextId(),
      name: "CDD",
      is_permanent: false,
      description: "Contrat à Durée Déterminée",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: getNextId(),
      name: "Freelance",
      is_permanent: false,
      description: "Travailleur indépendant",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: getNextId(),
      name: "Stage",
      is_permanent: false,
      description: "Stage étudiant",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: getNextId(),
      name: "Interim",
      is_permanent: false,
      description: "Contrat intérimaire",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: getNextId(),
      name: "Consultant",
      is_permanent: false,
      description: "Consultant externe",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: getNextId(),
      name: "Apprentissage",
      is_permanent: false,
      description: "Contrat d'apprentissage",
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  // Create demo users
  const hashedPassword = await bcrypt.hash("admin123", 10);
  users = [
    {
      id: getNextId(),
      email: "admin@nomedia.ma",
      password: hashedPassword,
      first_name: "Admin",
      last_name: "Principal",
      role: "admin",
      status: "active",
      permissions: "{}",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: getNextId(),
      email: "test@test.com",
      password: await bcrypt.hash("password", 10),
      first_name: "Test",
      last_name: "User",
      role: "user",
      status: "active",
      permissions: "{}",
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  // Initialize empty employees array - no demo data
  employees = [];

  // Initialize empty projects array - no demo data
  projects = [];

  console.log("✅ Fallback database initialized (empty - no demo data)");
}

// Helper functions that mimic PostgreSQL interface
export async function query(sql: string, params: any[] = []): Promise<any[]> {
  console.log("🔍 Fallback Query:", sql.substring(0, 100) + "...", params);

  // Very basic SQL parsing for common queries
  if (sql.includes("FROM users")) {
    if (sql.includes("WHERE email =")) {
      const email = params[0];
      return users.filter((u) => u.email === email);
    }
    if (sql.includes("WHERE id =")) {
      const id = params[0];
      return users.filter((u) => u.id === id);
    }
    return users;
  }

  if (sql.includes("FROM departments")) {
    if (sql.includes("COUNT(*)")) {
      return [{ count: departments.length }];
    }
    if (sql.includes("WHERE id =")) {
      const id = params[0];
      return departments.filter((d) => d.id === id);
    }
    return departments;
  }

  if (sql.includes("FROM contract_types")) {
    if (sql.includes("COUNT(*)")) {
      return [{ count: contractTypes.length }];
    }
    if (sql.includes("WHERE ct.id =")) {
      const id = params[0];
      const contractType = contractTypes.find((ct) => ct.id === id);
      if (contractType) {
        const employeeCount = employees.filter(
          (e) => e.contract_type === contractType.name,
        ).length;
        return [
          {
            ...contractType,
            employee_count: employeeCount,
          },
        ];
      }
      return [];
    }
    // Return all contract types with employee count
    return contractTypes.map((ct) => ({
      ...ct,
      employee_count: employees.filter((e) => e.contract_type === ct.name)
        .length,
    }));
  }

  if (sql.includes("FROM employees")) {
    if (sql.includes("COUNT(*)")) {
      return [{ count: employees.length }];
    }
    if (sql.includes("WHERE id =")) {
      const id = params[0];
      return employees.filter((e) => e.id === id);
    }
    return employees.map((e) => ({
      ...e,
      department_name:
        departments.find((d) => d.id === e.department_id)?.name || null,
      active_projects: projectTeamMembers.filter(
        (ptm) => ptm.employee_id === e.id && ptm.status === "active",
      ).length,
    }));
  }

  if (sql.includes("FROM projects")) {
    if (sql.includes("COUNT(*)")) {
      return [{ count: projects.length }];
    }
    if (sql.includes("WHERE id =")) {
      const id = params[0];
      return projects.filter((p) => p.id === id);
    }
    return projects.map((p) => ({
      ...p,
      team_member_count: projectTeamMembers.filter(
        (ptm) => ptm.project_id === p.id,
      ).length,
      contracts_compliance: 0,
    }));
  }

  if (sql.includes("FROM project_team_members")) {
    if (sql.includes("WHERE project_id =")) {
      const projectId = params[0];
      return projectTeamMembers.filter((ptm) => ptm.project_id === projectId);
    }
    return projectTeamMembers;
  }

  return [];
}

export async function run(sql: string, params: any[] = []): Promise<any> {
  console.log("🔧 Fallback Run:", sql.substring(0, 100) + "...", params);

  if (sql.includes("INSERT INTO users")) {
    const newUser = {
      id: getNextId(),
      email: params[0],
      password: params[1],
      first_name: params[2],
      last_name: params[3],
      role: params[4],
      status: params[5],
      permissions: params[6],
      created_at: new Date(),
      updated_at: new Date(),
    };
    users.push(newUser);
    return { rowCount: 1, rows: [newUser] };
  }

  if (sql.includes("UPDATE users SET last_login")) {
    const userId = params[0];
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.last_login = new Date();
    }
    return { rowCount: user ? 1 : 0, rows: [] };
  }

  if (sql.includes("INSERT INTO departments")) {
    const newDept = {
      id: getNextId(),
      name: params[0],
      description: params[1],
      created_at: new Date(),
      updated_at: new Date(),
    };
    departments.push(newDept);
    return { rowCount: 1, rows: [newDept] };
  }

  if (sql.includes("INSERT INTO contract_types")) {
    const newContractType = {
      id: getNextId(),
      name: params[0],
      is_permanent: params[1],
      description: params[2],
      created_at: new Date(),
      updated_at: new Date(),
      employee_count: 0,
    };
    contractTypes.push(newContractType);
    return { rowCount: 1, rows: [newContractType] };
  }

  if (sql.includes("INSERT INTO employees")) {
    const newEmployee = {
      id: getNextId(),
      first_name: params[0],
      last_name: params[1],
      email: params[2],
      phone: params[3],
      address: params[4],
      position: params[5],
      department_id: params[6],
      salary: params[7],
      hire_date: params[8],
      status: params[9] || "active",
      contract_type: params[10],
      contract_start_date: params[11],
      contract_end_date: params[12],
      created_at: new Date(),
      updated_at: new Date(),
    };
    employees.push(newEmployee);
    return { rowCount: 1, rows: [newEmployee] };
  }

  if (sql.includes("INSERT INTO projects")) {
    const newProject = {
      id: getNextId(),
      name: params[0],
      client_name: params[1],
      description: params[2],
      status: params[3],
      priority: params[4],
      budget: params[5],
      spent: params[6],
      start_date: params[7],
      deadline: params[8],
      progress: params[9],
      project_type: params[10],
      deliverables: params[11],
      notes: params[12],
      client_contact_name: params[13],
      client_contact_email: params[14],
      client_contact_phone: params[15],
      created_at: new Date(),
      updated_at: new Date(),
    };
    projects.push(newProject);
    return { rowCount: 1, rows: [newProject] };
  }

  if (sql.includes("DELETE FROM projects WHERE id =")) {
    const id = params[0];
    const index = projects.findIndex((p) => p.id === id);
    if (index > -1) {
      projects.splice(index, 1);
      // Also remove team members
      projectTeamMembers = projectTeamMembers.filter(
        (ptm) => ptm.project_id !== id,
      );
      return { rowCount: 1, rows: [] };
    }
    return { rowCount: 0, rows: [] };
  }

  if (sql.includes("DELETE FROM employees WHERE id =")) {
    const id = params[0];
    const index = employees.findIndex((e) => e.id === id);
    if (index > -1) {
      employees.splice(index, 1);
      return { rowCount: 1, rows: [] };
    }
    return { rowCount: 0, rows: [] };
  }

  if (sql.includes("UPDATE contract_types")) {
    const id = params[3]; // id is the last parameter in UPDATE
    const index = contractTypes.findIndex((ct) => ct.id === id);
    if (index > -1) {
      contractTypes[index] = {
        ...contractTypes[index],
        name: params[0],
        is_permanent: params[1],
        description: params[2],
        updated_at: new Date(),
      };
      return { rowCount: 1, rows: [contractTypes[index]] };
    }
    return { rowCount: 0, rows: [] };
  }

  if (sql.includes("DELETE FROM contract_types WHERE id =")) {
    const id = params[0];
    const index = contractTypes.findIndex((ct) => ct.id === id);
    if (index > -1) {
      contractTypes.splice(index, 1);
      return { rowCount: 1, rows: [] };
    }
    return { rowCount: 0, rows: [] };
  }

  return { rowCount: 1, rows: [] };
}

export async function get(sql: string, params: any[] = []): Promise<any> {
  console.log("🔍 Fallback Get:", sql.substring(0, 100) + "...", params);

  const results = await query(sql, params);
  return results[0] || null;
}

export async function close() {
  console.log("✅ Fallback database connection closed");
}

export const db = null; // No actual database connection
