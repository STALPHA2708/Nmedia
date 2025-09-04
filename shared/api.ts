/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Common API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
  count?: number;
}

/**
 * Employee interfaces
 */
export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  department_id: number;
  department_name?: string;
  salary: number;
  hire_date: string;
  status: 'active' | 'inactive' | 'on_leave';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  // Contract information
  contract_id?: number;
  contract_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  contract_status?: string;
  contract_file_name?: string;
  // Active projects count
  active_projects?: number;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  departmentId: number;
  salary: number;
  hireDate: string;
  contractType: string;
  contractStartDate: string;
  contractEndDate?: string;
  contractFileName?: string;
}

export interface EmployeeStats {
  total_employees: number;
  active_employees: number;
  inactive_employees: number;
  on_leave_employees: number;
  total_active_payroll: number;
  total_departments: number;
}

/**
 * Project interfaces
 */
export interface Project {
  id: number;
  name: string;
  client_name: string;
  description: string;
  status: 'pre_production' | 'production' | 'post_production' | 'completed';
  priority: 'low' | 'medium' | 'high';
  budget: number;
  spent: number;
  start_date: string;
  deadline: string;
  progress: number;
  project_type: string;
  deliverables: string[];
  notes: string;
  client_contact_name: string;
  client_contact_email: string;
  client_contact_phone: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  team_member_count?: number;
  contracts_compliance?: number;
  team_members?: ProjectTeamMember[];
}

export interface ProjectTeamMember {
  employee_id: number;
  employee_name: string;
  role: string;
  start_date: string;
  end_date?: string;
  status: string;
  contract_status: 'pending' | 'uploaded' | 'verified';
}

export interface CreateProjectRequest {
  name: string;
  client: string;
  description: string;
  budget: number;
  startDate: string;
  deadline: string;
  status?: string;
  priority?: string;
  projectType?: string;
  deliverables?: string[];
  notes?: string;
  clientContact?: {
    name: string;
    email: string;
    phone: string;
  };
  teamMembers?: {
    employeeId: number;
    role: string;
    startDate: string;
    endDate?: string;
    hourlyRate?: number;
  }[];
}

export interface ProjectAssignment {
  id: number;
  project_id: number;
  employee_id: number;
  role: string;
  start_date: string;
  end_date?: string;
  hourly_rate?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface ProjectStats {
  total_projects: number;
  pre_production_projects: number;
  production_projects: number;
  post_production_projects: number;
  completed_projects: number;
  total_budget: number;
  total_spent: number;
  average_progress: number;
}

/**
 * Department interfaces
 */
export interface Department {
  id: number;
  name: string;
  description: string;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Contract type interfaces
 */
export interface ContractType {
  id: number;
  name: string;
  is_permanent: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

/**
 * Contract interfaces
 */
export interface Contract {
  id: number;
  employee_id: number;
  contract_type_id: number;
  contract_type: string;
  is_permanent: boolean;
  start_date: string;
  end_date?: string;
  salary: number;
  status: 'active' | 'expired' | 'terminated';
  contract_file_name?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Invoice interfaces
 */
export interface InvoiceItem {
  id?: number;
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  client: string;
  clientIce: string;
  project: string;
  projectId?: number;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  teamMembers?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed fields for analytics
  profitMargin?: number;
  estimatedCosts?: number;
  assignedEmployees?: InvoiceEmployee[];
}

export interface InvoiceEmployee {
  employee_id: number;
  employee_name: string;
  position: string;
  department: string;
  role_in_project: string;
  hourly_rate?: number;
  hours_allocated?: number;
  cost_allocation?: number;
  // Enhanced payment details for admin
  base_salary?: number;
  overtime_hours?: number;
  overtime_rate?: number;
  overtime_payment?: number;
  bonus_amount?: number;
  bonus_reason?: string;
  expense_reimbursements?: number;
  total_payment?: number;
  payment_date?: string;
  payment_status: 'pending' | 'paid' | 'cancelled';
  payment_method?: string;
  bank_details?: string;
  taxes_withheld?: number;
  net_payment?: number;
  contract_type?: string;
  performance_bonus?: number;
  project_completion_bonus?: number;
  travel_allowance?: number;
  equipment_allowance?: number;
}

export interface CreateInvoiceRequest {
  invoiceNumber: string;
  client: string;
  clientIce: string;
  project: string;
  projectId?: number;
  issueDate: string;
  dueDate: string;
  items: Omit<InvoiceItem, 'id'>[];
  teamMembers?: string[];
  notes?: string;
  profitMargin?: number;
}

export interface InvoiceStats {
  total_invoices: number;
  draft_invoices: number;
  pending_invoices: number;
  paid_invoices: number;
  overdue_invoices: number;
  total_revenue: number;
  total_pending_amount: number;
  average_invoice_value: number;
  total_profit_margin: number;
}

/**
 * Authentication interfaces
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user' | 'guest';
  status: 'active' | 'inactive' | 'suspended';
  phone?: string;
  avatar_url?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
  permissions?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user' | 'guest';
  phone?: string;
  password?: string;
  sendWelcomeEmail?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'admin' | 'manager' | 'user' | 'guest';
  phone?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthSession {
  id: string;
  user_id: number;
  device: string;
  browser: string;
  ip_address: string;
  location: string;
  last_activity: string;
  is_current: boolean;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  suspended_users: number;
  admin_users: number;
  manager_users: number;
  regular_users: number;
  guest_users: number;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  projects: ProjectStats;
  employees: EmployeeStats;
  recentProjects: Project[];
  recentEmployees: Employee[];
}
