import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalization } from "@/contexts/LocalizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeIndicator } from "@/components/ThemeIndicator";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Receipt,
  FileText,
  Settings,
  Menu,
  X,
  MoreHorizontal,
  LogOut,
  Sun,
  Moon,
  UserCheck,
  Shield,
  Building2,
  Briefcase,
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

const getNavigation = (t: (key: string) => string, userRole?: string) => {
  const baseNavigation = [
    { name: t("dashboard"), href: "/", icon: LayoutDashboard, key: "dashboard", roles: ["admin", "manager", "user", "guest"] },
    { name: t("projects"), href: "/projects", icon: FolderOpen, key: "projects", roles: ["admin", "manager", "user"] },
    { name: "Employés", href: "/employees", icon: Users, key: "employees", roles: ["admin", "manager"] },
    { name: "Départements", href: "/departments", icon: Building2, key: "departments", roles: ["admin", "manager"] },
    { name: "Types de Contrats", href: "/contract-types", icon: Briefcase, key: "contract-types", roles: ["admin"] },
    { name: t("expenses"), href: "/expenses", icon: Receipt, key: "expenses", roles: ["admin", "manager"] },
    { name: t("invoicing"), href: "/invoices", icon: FileText, key: "invoicing", roles: ["admin", "manager", "user"] },
    { name: "Utilisateurs", href: "/users", icon: Shield, key: "users", roles: ["admin"] },
    { name: t("settings"), href: "/settings", icon: Settings, key: "settings", roles: ["admin"] },
  ];

  return baseNavigation.filter(item =>
    userRole && item.roles.includes(userRole)
  );
};

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { actualTheme, setTheme } = useTheme();
  const { language, t } = useLocalization();
  const { user, logout } = useAuth();

  const navigation = getNavigation(t, user?.role);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleTheme = () => {
    setTheme(actualTheme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-sidebar-border">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F7a25a5293015472896bb7679c041e95e%2F27c40508f6d34af887b8f7974a28d0f3?format=webp&width=800"
              alt="Nomedia Production"
              className="h-8 w-auto"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-nomedia-blue flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name || "Utilisateur"}
                </p>
                <p className="text-xs text-sidebar-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-sidebar-foreground hover:text-sidebar-accent-foreground"
              >
                {actualTheme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              
              <ThemeIndicator />

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-sidebar-foreground hover:text-sidebar-accent-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-background border-b border-border lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F7a25a5293015472896bb7679c041e95e%2F27c40508f6d34af887b8f7974a28d0f3?format=webp&width=800"
              alt="Nomedia Production"
              className="h-8 w-auto"
            />
            <div className="w-10" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
