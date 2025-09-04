import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute, ROLE_PERMISSIONS } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocalizationProvider } from "@/contexts/LocalizationContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Projects from "@/pages/Projects";
import Employees from "@/pages/Employees";
import Departments from "@/pages/Departments";
import Expenses from "@/pages/Expenses";
import Invoices from "@/pages/InvoicesUpdated";
import Users from "@/pages/UsersFixed";
import Settings from "@/pages/Settings";
import ContractTypes from "@/pages/ContractTypes";
import ContractTypes from "@/pages/ContractTypes";
import NotFound from "@/pages/NotFound";

// Main app routes with authentication wrapper
function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nomedia-blue mx-auto"></div>
          <p className="text-muted-foreground">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public login route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        }
      />

      {/* Protected routes with role-based access */}
      <Route
        path="/"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.user.roles}>
            <AppLayout>
              <Index />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.manager.roles}>
            <AppLayout>
              <Projects />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employees"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.manager.roles}>
            <AppLayout>
              <Employees />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/departments"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.manager.roles}>
            <AppLayout>
              <Departments />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/expenses"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.manager.roles}>
            <AppLayout>
              <Expenses />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoices"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.user.roles}>
            <AppLayout>
              <Invoices />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.admin.roles}>
            <AppLayout>
              <Users />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.admin.roles}>
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/contract-types"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.admin.roles}>
            <AppLayout>
              <ContractTypes />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/contract-types"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.admin.roles}>
            <AppLayout>
              <ContractTypes />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Default redirect to login for unauthenticated users */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LocalizationProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
