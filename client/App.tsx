import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute, ROLE_PERMISSIONS } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocalizationProvider } from "@/contexts/LocalizationContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Lazy load pages for code splitting
const Index = lazy(() => import("@/pages/Index"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Projects = lazy(() => import("@/pages/Projects"));
const Employees = lazy(() => import("@/pages/Employees"));
const Departments = lazy(() => import("@/pages/Departments"));
const ContractTypes = lazy(() => import("@/pages/ContractTypes"));
const Expenses = lazy(() => import("@/pages/Expenses"));
const Invoices = lazy(() => import("@/pages/InvoicesUpdated"));
const Users = lazy(() => import("@/pages/UsersFixed"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Create QueryClient instance with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Loading component for suspense fallback
function PageLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nomedia-blue mx-auto"></div>
        <p className="text-muted-foreground">Chargement de la page...</p>
      </div>
    </div>
  );
}

// Main app routes with authentication wrapper
function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nomedia-blue mx-auto"></div>
          <p className="text-muted-foreground">
            Chargement de l'application...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Suspense fallback={<PageLoadingSpinner />}>
              <Login />
            </Suspense>
          )
        }
      />

      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Suspense fallback={<PageLoadingSpinner />}>
              <Register />
            </Suspense>
          )
        }
      />

      {/* Protected routes with role-based access */}
      <Route
        path="/"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.user.roles}>
            <AppLayout>
              <Suspense fallback={<PageLoadingSpinner />}>
                <Index />
              </Suspense>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.manager.roles}>
            <AppLayout>
              <Suspense fallback={<PageLoadingSpinner />}>
                <Projects />
              </Suspense>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employees"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.manager.roles}>
            <AppLayout>
              <Suspense fallback={<PageLoadingSpinner />}>
                <Employees />
              </Suspense>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/departments"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.manager.roles}>
            <AppLayout>
              <Suspense fallback={<PageLoadingSpinner />}>
                <Departments />
              </Suspense>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/contract-types"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.manager.roles}>
            <AppLayout>
              <Suspense fallback={<PageLoadingSpinner />}>
                <ContractTypes />
              </Suspense>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/expenses"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.manager.roles}>
            <AppLayout>
              <Suspense fallback={<PageLoadingSpinner />}>
                <Expenses />
              </Suspense>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoices"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.user.roles}>
            <AppLayout>
              <Suspense fallback={<PageLoadingSpinner />}>
                <Invoices />
              </Suspense>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.admin.roles}>
            <AppLayout>
              <Suspense fallback={<PageLoadingSpinner />}>
                <Users />
              </Suspense>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredRoles={ROLE_PERMISSIONS.admin.roles}>
            <AppLayout>
              <Suspense fallback={<PageLoadingSpinner />}>
                <Settings />
              </Suspense>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 and fallback handling */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <AppLayout>
              <Suspense fallback={<PageLoadingSpinner />}>
                <NotFound />
              </Suspense>
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LocalizationProvider>
            <AuthProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </AuthProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
