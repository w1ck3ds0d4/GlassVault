import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../services/api";

interface User {
  id: string;
  email: string;
  role: string;
  displayName: string;
  tenantId: string;
  tenantName?: string;
}

interface AuthContextType {
  user: User | null;
  tenant: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, tenantSlug: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing token on mount
    const token = api.getToken();
    if (token) {
      api
        .getMe()
        .then((data) => {
          setUser(data.me);
          setTenant(data.tenant);
        })
        .catch(() => {
          api.logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, tenantSlug: string) => {
    setError(null);
    try {
      const result = await api.login(email, password, tenantSlug);
      setUser(result.user);
      // Fetch tenant info
      const meData = await api.getMe();
      setTenant(meData.tenant);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
