import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import api, { tokenStore } from "../api";
import type { AuthResponse, User } from "../types";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (data: AuthResponse) => void;
  logout: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthCtx = createContext<AuthContextValue | undefined>(undefined);

function loadUser(): User | null {
  const raw = localStorage.getItem("user");
  return raw ? (JSON.parse(raw) as User) : null;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => tokenStore.access);
  const [user, setUser] = useState<User | null>(loadUser);

  const login = useCallback((data: AuthResponse) => {
    tokenStore.set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    const u: User = { id: data.id, email: data.email, name: data.name, role: data.role };
    localStorage.setItem("user", JSON.stringify(u));
    setAccessToken(data.accessToken);
    setUser(u);
  }, []);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setAccessToken(null);
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.refresh;
    if (refreshToken) {
      try {
        await api.post("/auth/logout", { refreshToken });
      } catch {
        /* ignore */
      }
    }
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    const onForcedLogout = () => clearSession();
    window.addEventListener("auth:logout", onForcedLogout);
    return () => window.removeEventListener("auth:logout", onForcedLogout);
  }, [clearSession]);

  const value: AuthContextValue = {
    user,
    accessToken,
    isAuthenticated: !!accessToken,
    isAdmin: user?.role === "ADMIN",
    login,
    logout,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
