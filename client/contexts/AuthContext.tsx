import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User, LoginRequest, LoginResponse } from '@shared/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          // Verify token validity before trusting stored data
          try {
            const verifyResponse = await fetch('/api/auth/verify', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${storedToken}`,
                'Content-Type': 'application/json'
              }
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              if (verifyData.success && verifyData.data?.user) {
                setToken(storedToken);
                setUser(verifyData.data.user);
                console.log('AuthContext: Token verified, user authenticated');
              } else {
                throw new Error('Token verification failed');
              }
            } else {
              // Try to refresh token if verification fails
              const refreshSuccess = await refreshTokenSilently(storedToken);
              if (!refreshSuccess) {
                throw new Error('Token invalid and refresh failed');
              }
            }
          } catch (verifyError) {
            console.warn('AuthContext: Token verification failed, clearing auth data:', verifyError);
            clearAuthData();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const clearAuthData = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      console.log('AuthContext: Starting login with credentials:', { email: credentials.email, rememberMe: credentials.rememberMe });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      let response: Response;
      let data: any;

      try {
        response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(credentials),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('AuthContext: Response status:', response.status);
        console.log('AuthContext: Response ok:', response.ok);

      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('AuthContext: Fetch error:', fetchError);
        throw new Error('Network error - unable to connect to server');
      }

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        console.error('AuthContext: HTTP error:', response.status, response.statusText);
        try {
          const errorText = await response.text();
          console.error('AuthContext: Error response body:', errorText);
          throw new Error(`Server error (${response.status}): ${response.statusText}`);
        } catch {
          throw new Error(`Server error (${response.status}): ${response.statusText}`);
        }
      }

      // Try to parse JSON response
      try {
        data = await response.json();
        console.log('AuthContext: Parsed response data:', data);
      } catch (parseError) {
        console.error('AuthContext: JSON parse error:', parseError);
        const responseText = await response.text();
        console.error('AuthContext: Raw response text:', responseText);
        throw new Error('Server returned invalid JSON response');
      }

      // Check API response structure
      if (!data || typeof data !== 'object') {
        console.error('AuthContext: Invalid data structure:', data);
        throw new Error('Invalid response format from server');
      }

      if (data.success) {
        const { user: userData, token: authToken, refreshToken: refToken } = data.data;

        if (!userData || !authToken) {
          console.error('AuthContext: Missing required data in response:', data.data);
          throw new Error('Incomplete login response from server');
        }

        setUser(userData);
        setToken(authToken);

        // Store in localStorage
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('refreshToken', refToken || '');
        localStorage.setItem('user', JSON.stringify(userData));

        console.log('AuthContext: Login successful for user:', userData.name);
        return data.data;
      } else {
        console.error('AuthContext: Login failed - API returned success=false:', data.message);
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  };

  const refreshTokenSilently = async (currentToken: string): Promise<boolean> => {
    try {
      const refToken = localStorage.getItem('refreshToken');
      if (!refToken) {
        return false;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({ refreshToken: refToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { token: newToken, refreshToken: newRefreshToken, user } = data.data;

        setToken(newToken);
        setUser(user);
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Silent token refresh error:', error);
      return false;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refToken = localStorage.getItem('refreshToken');
      if (!refToken) {
        return false;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { token: newToken, refreshToken: newRefreshToken } = data.data;
        
        setToken(newToken);
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        return true;
      } else {
        clearAuthData();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuthData();
      return false;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    
    // Admin has all permissions
    if (user.permissions.includes('all')) return true;
    
    return user.permissions.includes(permission);
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  };

  const isAuthenticated = !!user && !!token;

  const contextValue: AuthContextType = {
    user,
    token,
    login,
    logout,
    updateUser,
    isAuthenticated,
    isLoading,
    hasPermission,
    hasRole,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for route protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions?: string[],
  requiredRoles?: string[]
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, hasPermission, hasRole } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nomedia-blue"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Accès non autorisé</h2>
            <p className="text-muted-foreground">Veuillez vous connecter pour accéder à cette page.</p>
          </div>
        </div>
      );
    }

    // Check required permissions
    if (requiredPermissions && !requiredPermissions.every(permission => hasPermission(permission))) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Permissions insuffisantes</h2>
            <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          </div>
        </div>
      );
    }

    // Check required roles
    if (requiredRoles && !hasRole(requiredRoles)) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Rôle insuffisant</h2>
            <p className="text-muted-foreground">Votre rôle ne vous permet pas d'accéder à cette page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Hook for protected API calls
export function useProtectedAPI() {
  const { token, refreshToken } = useAuth();

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If token expired, try to refresh
    if (response.status === 401 && token) {
      const refreshSuccess = await refreshToken();
      if (refreshSuccess) {
        const newToken = localStorage.getItem('authToken');
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
        }
      }
    }

    return response;
  };

  return { apiCall };
}
