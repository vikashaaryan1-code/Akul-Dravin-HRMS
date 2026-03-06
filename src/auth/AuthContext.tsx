import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, clearToken, storeToken } from "../lib/api";
import type { AuthSession, Tenant, User } from "../types";

interface LoginResponse {
  token: string;
  user: User;
  tenant: Tenant;
}

interface MeResponse {
  user: User;
  tenant: Tenant;
}

export interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  login: (
    tenantSlug: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem("hrms_token")));

  // On mount, validate the stored token by calling /api/auth/me
  useEffect(() => {
    const stored = localStorage.getItem("hrms_token");
    if (!stored) {
      return;
    }

    api
      .get<MeResponse>("/auth/me")
      .then((data) => {
        setSession({ token: stored, user: data.user, tenant: data.tenant });
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(
    async (tenantSlug: string, email: string, password: string) => {
      const data = await api.post<LoginResponse>("/auth/login", {
        tenantSlug,
        email,
        password,
      });
      storeToken(data.token);
      setSession({ token: data.token, user: data.user, tenant: data.tenant });
    },
    [],
  );

  const logout = useCallback(() => {
    clearToken();
    setSession(null);
  }, []);

  return (
    <AuthContext value={{ session, isLoading, login, logout }}>
      {children}
    </AuthContext>
  );
}
