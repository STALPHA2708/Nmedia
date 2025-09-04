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
    {
      name: t("dashboard"),
      href: "/",
      icon: LayoutDashboard,
      key: "dashboard",
      roles: ["admin", "manager", "user", "guest"],
    },
    {
      name: t("projects"),
      href: "/projects",
      icon: FolderOpen,
      key: "projects",
      roles: ["admin", "manager", "user"],
    },
    {
      name: t("team"),
      href: "/employees",
      icon: Users,
      key: "team",
      roles: ["admin", "manager"],
    },
    {
      name: "Départements",
      href: "/departments",
      icon: Building2,
      key: "departments",
      roles: ["admin", "manager"],
    },
    {
      name: "Types de Contrats",
      href: "/contract-types",
      icon: Briefcase,
      key: "contract-types",
      roles: ["admin", "manager"],
    },
    {
      name: t("expenses"),
      href: "/expenses",
      icon: Receipt,
      key: "expenses",
      roles: ["admin", "manager"],
    },
    {
      name: t("invoicing"),
      href: "/invoices",
      icon: FileText,
      key: "invoicing",
      roles: ["admin", "manager", "user"],
    },
    {
      name: "Utilisateurs",
      href: "/users",
      icon: Shield,
      key: "users",
      roles: ["admin"],
    },
    {
      name: t("settings"),
      href: "/settings",
      icon: Settings,
      key: "settings",
      roles: ["admin"],
    },
  ];

  return baseNavigation.filter(
    (item) => userRole && item.roles.includes(userRole),
  );
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, actualTheme, setTheme } = useTheme();
  const { language, t } = useLocalization();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Horizontal Navigation Bar */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F7a25a5293015472896bb7679c041e95e%2F27c40508f6d34af887b8f7974a28d0f3?format=webp&width=800"
              alt="Nomedia Production"
              className="h-8 sm:h-10 w-auto flex-shrink-0"
            />
            <div className="hidden xs:block min-w-0 text-sm sm:text-lg truncate">
              Nomedia
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {getNavigation(t, user?.role).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 xl:px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    language === "ar" && "flex-row-reverse",
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden xl:inline">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Tablet Navigation (Medium screens) */}
          <nav className="hidden md:flex lg:hidden items-center gap-1">
            {getNavigation(t, user?.role)
              .slice(0, 4)
              .map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.key}
                    to={item.href}
                    className={cn(
                      "flex items-center justify-center rounded-lg p-2 transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                    title={item.name}
                  >
                    <item.icon className="h-4 w-4" />
                  </Link>
                );
              })}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </nav>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Mobile/Tablet Navigation Menu */}
        <div
          className={cn(
            "lg:hidden border-t bg-card transition-all duration-200 ease-in-out",
            mobileMenuOpen
              ? "max-h-screen opacity-100"
              : "max-h-0 opacity-0 overflow-hidden",
          )}
        >
          <nav className="px-3 sm:px-4 py-2 space-y-1">
            {getNavigation(t, user?.role).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    language === "ar" && "flex-row-reverse",
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <div className="relative">
        {/* Page content */}
        <main className="p-3 sm:p-4 md:p-6 lg:p-8 pb-24 sm:pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Admin Controls - Bottom Left - Always Visible */}
      <div className="fixed bottom-4 left-4 z-50">
        <div className="bg-card border-2 rounded-lg shadow-lg p-2 space-y-2 w-14">
          {/* User Avatar */}
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-nomedia-blue/10 flex items-center justify-center border">
              <span className="text-nomedia-blue font-medium text-xs">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "G"}
              </span>
            </div>
          </div>

          {/* Theme toggle */}
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 p-0"
            onClick={() => setTheme(actualTheme === "dark" ? "light" : "dark")}
            title={actualTheme === "dark" ? "Mode Clair" : "Mode Sombre"}
          >
            {actualTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Account Management */}
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 p-0"
            onClick={() => navigate("/settings")}
            title="Gestion des comptes"
          >
            <UserCheck className="h-4 w-4" />
          </Button>

          {/* Login/Logout */}
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 p-0 text-destructive hover:text-destructive border-destructive/20"
              onClick={handleLogout}
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 p-0 text-green-600 hover:text-green-600 border-green-600/20"
              onClick={() => navigate("/login")}
              title="Connexion"
            >
              <UserCheck className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* User Info Tooltip */}
      <div className="fixed bottom-4 left-20 z-40 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-card border rounded-lg shadow-lg p-3 text-xs whitespace-nowrap max-w-48">
          <p className="font-medium">{user?.name || "Invité"}</p>
          <p className="text-muted-foreground">
            {user?.email || "Non connecté"}
          </p>
          <p className="text-muted-foreground capitalize">
            {user?.role || "guest"}
          </p>
          <div className="mt-1 pt-1 border-t text-xs">
            <p>{isAuthenticated ? "🟢 Connecté" : "🔴 Déconnecté"}</p>
          </div>
        </div>
      </div>

      {/* Theme Indicator for testing */}
      <ThemeIndicator />
    </div>
  );
}
