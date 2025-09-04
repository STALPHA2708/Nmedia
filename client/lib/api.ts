import type {
  ApiResponse,
  Employee,
  CreateEmployeeRequest,
  EmployeeStats,
  Project,
  CreateProjectRequest,
  ProjectStats,
  Department,
  ContractType,
  DashboardStats,
  Invoice,
  CreateInvoiceRequest,
  InvoiceStats,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserStats,
  ChangePasswordRequest,
  AuthSession,
} from "@shared/api";
import {
  getMockProjects,
  getMockEmployees,
  getMockDepartments,
  getMockContractTypes,
  getMockEmployeeStats,
  getMockProjectStats,
  getMockInvoices,
  getMockInvoiceStats,
  getMockDashboardStats,
  mockEmployees,
  mockProjects,
  mockInvoices,
} from "./mock-data";

const API_BASE_URL = "/api";
const USE_MOCK_DATA = false; // Set to false when backend is available

// Generic API function with timeout and abort controller
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = 30000, // 30 seconds default timeout
): Promise<ApiResponse<T>> {
  // If using mock data, return appropriate mock response
  if (USE_MOCK_DATA) {
    return getMockResponse<T>(endpoint, options);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  // Get auth token from localStorage
  const token = localStorage.getItem("authToken");

  // Create abort controller for request cancellation
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    signal: controller.signal,
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Clear timeout since request completed
    clearTimeout(timeoutId);

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use the raw text if it's meaningful
            errorMessage =
              errorText.length > 0 && errorText.length < 200
                ? errorText
                : errorMessage;
          }
        }
      } catch {
        // If we can't read the error response, use the status message
        errorMessage = `${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // Only read the response body once after confirming it's ok
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error(
        `Failed to parse JSON response for ${endpoint}:`,
        parseError,
      );
      throw new Error("Invalid JSON response from server");
    }

    return data;
  } catch (error) {
    // Clear timeout in case of error
    clearTimeout(timeoutId);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
    }

    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Mock API response handler
async function getMockResponse<T>(
  endpoint: string,
  options: RequestInit,
): Promise<ApiResponse<T>> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const method = options.method || "GET";

  switch (endpoint) {
    case "/employees":
      if (method === "GET")
        return getMockEmployees() as Promise<ApiResponse<T>>;
      if (method === "POST") {
        const newEmployee = JSON.parse(options.body as string);
        const employee = {
          id: Date.now(),
          first_name: newEmployee.firstName,
          last_name: newEmployee.lastName,
          email: newEmployee.email,
          phone: newEmployee.phone,
          address: newEmployee.address,
          position: newEmployee.position,
          department_id: newEmployee.departmentId,
          salary: newEmployee.salary,
          hire_date: newEmployee.hireDate,
          status: "active" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          contract_type: newEmployee.contractType,
          contract_start_date: newEmployee.contractStartDate,
          contract_status: "active",
          active_projects: 0,
        };
        mockEmployees.push(employee);
        return { success: true, data: employee } as ApiResponse<T>;
      }
      break;

    case "/employees/stats":
      return getMockEmployeeStats() as Promise<ApiResponse<T>>;

    case "/projects":
      if (method === "GET") return getMockProjects() as Promise<ApiResponse<T>>;
      if (method === "POST") {
        const newProject = JSON.parse(options.body as string);
        const project = {
          id: Date.now(),
          name: newProject.name,
          client_name: newProject.clientName || newProject.client,
          description: newProject.description,
          status: newProject.status,
          priority: newProject.priority,
          budget: newProject.budget,
          spent: 0,
          start_date: newProject.startDate,
          deadline: newProject.deadline,
          progress: 0,
          project_type: newProject.projectType || "production",
          deliverables: newProject.deliverables || [],
          notes: newProject.notes || "",
          client_contact_name: newProject.clientContact?.name || "",
          client_contact_email: newProject.clientContact?.email || "",
          client_contact_phone: newProject.clientContact?.phone || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          team_member_count: newProject.teamMembers?.length || 0,
          contracts_compliance: 0,
          team_members: [],
        };
        mockProjects.push(project);
        return { success: true, data: project } as ApiResponse<T>;
      }
      break;

    case "/projects/stats":
      return getMockProjectStats() as Promise<ApiResponse<T>>;

    case "/departments":
      return getMockDepartments() as Promise<ApiResponse<T>>;

    case "/contract-types":
      return getMockContractTypes() as Promise<ApiResponse<T>>;

    case "/invoices":
      if (method === "GET") return getMockInvoices() as Promise<ApiResponse<T>>;
      if (method === "POST") {
        const newInvoice = JSON.parse(options.body as string);
        const amount = newInvoice.items.reduce(
          (sum: number, item: any) => sum + item.total,
          0,
        );
        const taxAmount = amount * 0.2;
        const totalAmount = amount + taxAmount;

        const invoice = {
          id: Date.now(),
          ...newInvoice,
          amount,
          taxAmount,
          totalAmount,
          status: "draft" as const,
          estimatedCosts: newInvoice.profitMargin
            ? amount * (1 - newInvoice.profitMargin / 100)
            : amount * 0.7,
          assignedEmployees: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockInvoices.unshift(invoice);
        return {
          success: true,
          data: invoice,
          message: "Facture créée avec succès",
        } as ApiResponse<T>;
      }
      break;

    case "/invoices/stats":
      return getMockInvoiceStats() as Promise<ApiResponse<T>>;

    case "/dashboard/stats":
      return getMockDashboardStats() as Promise<ApiResponse<T>>;

    default:
      // Handle update operations
      if (method === "PUT") {
        if (endpoint.startsWith("/projects/")) {
          const id = parseInt(endpoint.split("/")[2]);
          const index = mockProjects.findIndex((p) => p.id === id);
          if (index > -1) {
            const updateData = JSON.parse(options.body as string);
            mockProjects[index] = {
              ...mockProjects[index],
              name: updateData.name,
              client_name: updateData.client,
              description: updateData.description,
              budget: updateData.budget,
              start_date: updateData.startDate,
              deadline: updateData.deadline,
              status: updateData.status,
              priority: updateData.priority,
              project_type:
                updateData.projectType || mockProjects[index].project_type,
              deliverables:
                updateData.deliverables || mockProjects[index].deliverables,
              notes: updateData.notes || mockProjects[index].notes,
              client_contact_name:
                updateData.clientContact?.name ||
                mockProjects[index].client_contact_name,
              client_contact_email:
                updateData.clientContact?.email ||
                mockProjects[index].client_contact_email,
              client_contact_phone:
                updateData.clientContact?.phone ||
                mockProjects[index].client_contact_phone,
              progress: updateData.progress || mockProjects[index].progress,
              spent: updateData.spent || mockProjects[index].spent,
              updated_at: new Date().toISOString(),
            };
            return {
              success: true,
              data: mockProjects[index],
              message: "Projet mis à jour avec succès",
            } as ApiResponse<T>;
          }
        }
        if (endpoint.startsWith("/employees/")) {
          const id = parseInt(endpoint.split("/")[2]);
          const index = mockEmployees.findIndex((e) => e.id === id);
          if (index > -1) {
            const updateData = JSON.parse(options.body as string);
            mockEmployees[index] = {
              ...mockEmployees[index],
              first_name: updateData.firstName,
              last_name: updateData.lastName,
              email: updateData.email,
              phone: updateData.phone,
              address: updateData.address,
              position: updateData.position,
              department_id: updateData.departmentId,
              salary: updateData.salary,
              updated_at: new Date().toISOString(),
            };
            return {
              success: true,
              data: mockEmployees[index],
              message: "Employé mis à jour avec succès",
            } as ApiResponse<T>;
          }
        }
        if (endpoint.startsWith("/invoices/")) {
          const id = parseInt(endpoint.split("/")[2]);
          const index = mockInvoices.findIndex((i) => i.id === id);
          if (index > -1) {
            const updateData = JSON.parse(options.body as string);

            // Recalculate totals if items changed
            let amount = mockInvoices[index].amount;
            let taxAmount = mockInvoices[index].taxAmount;
            let totalAmount = mockInvoices[index].totalAmount;

            if (updateData.items) {
              amount = updateData.items.reduce(
                (sum: number, item: any) => sum + item.total,
                0,
              );
              taxAmount = amount * 0.2;
              totalAmount = amount + taxAmount;
            }

            mockInvoices[index] = {
              ...mockInvoices[index],
              ...updateData,
              amount,
              taxAmount,
              totalAmount,
              updated_at: new Date().toISOString(),
            };
            return {
              success: true,
              data: mockInvoices[index],
              message: "Facture mise à jour avec succès",
            } as ApiResponse<T>;
          }
        }
      }
      // Handle delete operations
      if (method === "DELETE") {
        if (endpoint.startsWith("/employees/")) {
          const id = parseInt(endpoint.split("/")[2]);
          const index = mockEmployees.findIndex((e) => e.id === id);
          if (index > -1) {
            mockEmployees.splice(index, 1);
          }
          return {
            success: true,
            message: "Employé supprimé avec succès",
          } as ApiResponse<T>;
        }
        if (endpoint.startsWith("/projects/")) {
          const id = parseInt(endpoint.split("/")[2]);
          const index = mockProjects.findIndex((p) => p.id === id);
          if (index > -1) {
            mockProjects.splice(index, 1);
          }
          return {
            success: true,
            message: "Projet supprimé avec succès",
          } as ApiResponse<T>;
        }
        if (endpoint.startsWith("/invoices/")) {
          const id = parseInt(endpoint.split("/")[2]);
          const index = mockInvoices.findIndex((i) => i.id === id);
          if (index > -1) {
            // Don't allow deletion of paid invoices
            if (mockInvoices[index].status === "paid") {
              throw new Error("Impossible de supprimer une facture déjà payée");
            }
            mockInvoices.splice(index, 1);
          }
          return {
            success: true,
            message: "Facture supprimée avec succès",
          } as ApiResponse<T>;
        }
      }
      break;
  }

  throw new Error(`Mock endpoint not implemented: ${method} ${endpoint}`);
}

// Employee API functions
export const employeeApi = {
  // Get all employees
  getAll: () => apiRequest<Employee[]>("/employees"),

  // Get employee by ID
  getById: (id: number) => apiRequest<Employee>(`/employees/${id}`),

  // Create new employee
  create: (data: CreateEmployeeRequest) =>
    apiRequest<Employee>("/employees", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update employee
  update: (id: number, data: Partial<CreateEmployeeRequest>) =>
    apiRequest<Employee>(`/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete employee
  delete: (id: number) =>
    apiRequest<void>(`/employees/${id}`, {
      method: "DELETE",
    }),

  // Get employee statistics
  getStats: () =>
    apiRequest<{ general: EmployeeStats; contractTypes: any[] }>(
      "/employees/stats",
    ),
};

// Project API functions
export const projectApi = {
  // Get all projects
  getAll: () => apiRequest<Project[]>("/projects"),

  // Get project by ID
  getById: (id: number) => apiRequest<Project>(`/projects/${id}`),

  // Create new project
  create: (data: CreateProjectRequest) =>
    apiRequest<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update project
  update: (id: number, data: Partial<CreateProjectRequest>) =>
    apiRequest<Project>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete project
  delete: (id: number) =>
    apiRequest<void>(`/projects/${id}`, {
      method: "DELETE",
    }),

  // Get project statistics
  getStats: () =>
    apiRequest<{ general: ProjectStats; priorities: any[] }>("/projects/stats"),

  // Assign employee to project
  assignEmployee: (
    projectId: number,
    employeeId: number,
    data: {
      role: string;
      startDate: string;
      endDate?: string;
      hourlyRate?: number;
    },
  ) =>
    apiRequest<void>(`/projects/${projectId}/employees/${employeeId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Remove employee from project
  removeEmployee: (projectId: number, employeeId: number) =>
    apiRequest<void>(`/projects/${projectId}/employees/${employeeId}`, {
      method: "DELETE",
    }),
};

// Department API functions
export const departmentApi = {
  // Get all departments
  getAll: () => apiRequest<Department[]>("/departments"),

  // Get department by ID
  getById: (id: number) => apiRequest<Department>(`/departments/${id}`),

  // Create new department
  create: (departmentData: { name: string; description?: string }) =>
    apiRequest<Department>("/departments", {
      method: "POST",
      body: JSON.stringify(departmentData),
    }),

  // Update department
  update: (
    id: number,
    departmentData: { name: string; description?: string },
  ) =>
    apiRequest<Department>(`/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(departmentData),
    }),

  // Delete department
  delete: (id: number) =>
    apiRequest<void>(`/departments/${id}`, {
      method: "DELETE",
    }),
};

// Contract type API functions
export const contractTypeApi = {
  // Get all contract types
  getAll: () => apiRequest<ContractType[]>("/contract-types"),

  // Get contract type by ID
  getById: (id: number) => apiRequest<ContractType>(`/contract-types/${id}`),

  // Create new contract type
  create: (data: { name: string; description?: string; is_permanent: boolean }) =>
    apiRequest<ContractType>("/contract-types", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update contract type
  update: (id: number, data: { name: string; description?: string; is_permanent: boolean }) =>
    apiRequest<ContractType>(`/contract-types/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete contract type
  delete: (id: number) =>
    apiRequest<void>(`/contract-types/${id}`, {
      method: "DELETE",
    }),
};

// Dashboard API functions
export const dashboardApi = {
  // Get dashboard statistics from dedicated endpoint
  getStats: () => apiRequest<DashboardStats>("/dashboard/stats"),
};

// Expenses API functions
export const expenseApi = {
  // Get all expenses
  getAll: () => apiRequest<any[]>("/expenses"),

  // Get expense by ID
  getById: (id: number) => apiRequest<any>(`/expenses/${id}`),

  // Create new expense
  create: (expenseData: any) =>
    apiRequest<any>("/expenses", {
      method: "POST",
      body: JSON.stringify(expenseData),
    }),

  // Update expense
  update: (id: number, expenseData: any) =>
    apiRequest<any>(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(expenseData),
    }),

  // Delete expense
  delete: (id: number) =>
    apiRequest<void>(`/expenses/${id}`, {
      method: "DELETE",
    }),

  // Approve expense (admin/manager only)
  approve: (id: number) =>
    apiRequest<any>(`/expenses/${id}/approve`, {
      method: "PUT",
    }),

  // Reject expense (admin/manager only)
  reject: (id: number, reason?: string) =>
    apiRequest<any>(`/expenses/${id}/reject`, {
      method: "PUT",
      body: JSON.stringify({ rejection_reason: reason }),
    }),

  // Get expense categories
  getCategories: () => apiRequest<string[]>("/expenses/categories"),

  // Get expense statistics (admin/manager only)
  getStats: () => apiRequest<any>("/expenses/stats"),

  // Bulk delete expenses (admin only)
  bulkDelete: (options: {
    expenseIds?: number[];
    projectId?: number;
    invoiceId?: number;
  }) =>
    apiRequest<{ deletedCount: number }>("/expenses/bulk", {
      method: "DELETE",
      body: JSON.stringify(options),
    }),
};

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("fr-FR");
};

export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

// Invoice API functions
export const invoiceApi = {
  // Get all invoices
  getAll: () => apiRequest<Invoice[]>("/invoices"),

  // Get invoice by ID
  getById: (id: number) => apiRequest<Invoice>(`/invoices/${id}`),

  // Create new invoice
  create: (data: CreateInvoiceRequest) =>
    apiRequest<Invoice>("/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update invoice
  update: (id: number, data: Partial<CreateInvoiceRequest>) =>
    apiRequest<Invoice>(`/invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete invoice
  delete: (id: number) =>
    apiRequest<void>(`/invoices/${id}`, {
      method: "DELETE",
    }),

  // Get invoice statistics
  getStats: () => apiRequest<InvoiceStats>("/invoices/stats"),
};

// User management API functions
export const userApi = {
  // Get all users (admin only)
  getAll: () => apiRequest<User[]>("/users"),

  // Get user by ID
  getById: (id: number) => apiRequest<User>(`/users/${id}`),

  // Create new user (admin only)
  create: (data: CreateUserRequest) =>
    apiRequest<User>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update user
  update: (id: number, data: UpdateUserRequest) =>
    apiRequest<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete user (admin only)
  delete: (id: number) =>
    apiRequest<void>(`/users/${id}`, {
      method: "DELETE",
    }),

  // Get user statistics (admin only)
  getStats: () => apiRequest<UserStats>("/users/stats"),
};

// Authentication API functions
export const authApi = {
  // Get current user sessions
  getSessions: () => apiRequest<AuthSession[]>("/auth/sessions"),

  // Terminate a session
  terminateSession: (sessionId: string) =>
    apiRequest<void>(`/auth/sessions/${sessionId}`, {
      method: "DELETE",
    }),

  // Change password
  changePassword: (data: ChangePasswordRequest) =>
    apiRequest<void>("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// Error handling utility
export const handleApiError = (error: any): string => {
  console.log("Handling API error:", error);

  if (error.message) {
    // Try to extract server error message from the response
    if (error.message.includes("Response: ")) {
      try {
        const responseText = error.message.split("Response: ")[1];
        const errorResponse = JSON.parse(responseText);
        if (errorResponse.message) {
          return errorResponse.message;
        }
      } catch (parseError) {
        console.log("Could not parse error response:", parseError);
      }
    }

    // Handle specific HTTP status codes
    if (error.message.includes("400 Bad Request")) {
      return "Données invalides. Veuillez vérifier les informations saisies.";
    }
    if (error.message.includes("401 Unauthorized")) {
      return "Accès non autorisé. Veuillez vous reconnecter.";
    }
    if (error.message.includes("403 Forbidden")) {
      return "Vous n'avez pas les permissions nécessaires pour cette action.";
    }
    if (error.message.includes("404 Not Found")) {
      return "Ressource non trouvée.";
    }
    if (error.message.includes("500 Internal Server Error")) {
      return "Erreur serveur. Veuillez réessayer plus tard.";
    }

    return error.message;
  }

  return "Une erreur inattendue s'est produite";
};
