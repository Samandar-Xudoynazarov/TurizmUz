import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "./api";

interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  roles: string[];
  enabled: boolean;
  organizationId?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;

  // ✅ Login flow
  login: (email: string) => Promise<void>;
  verify: (email: string, code: string) => Promise<void>; // verify-login

  // ✅ Register flow
  verifyRegister: (email: string, code: string) => Promise<void>; // verify-register

  logout: () => void;
  hasRole: (role: string) => boolean;
  getRedirectPath: () => string;
}

const AuthContext = createContext<AuthContextType | null>(null);

type NeedsVerificationError = Error & { needsVerification?: boolean };

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function normalizeRoles(raw: unknown): string[] {
  if (!raw) return [];
  let roles: string[] = [];
  if (Array.isArray(raw)) roles = raw.map(String);
  else if (typeof raw === "string") roles = raw.split(/[, ]+/).filter(Boolean);
  roles = roles.map((r) => r.replace(/^ROLE_/, ""));
  return Array.from(new Set(roles));
}

function throwNeedsVerification() {
  const e: NeedsVerificationError = new Error("Verification required") as NeedsVerificationError;
  e.needsVerification = true;
  throw e;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("accessToken");
    const savedUser = localStorage.getItem("user");
    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem("user");
        }
      }
    }
    setIsLoading(false);
  }, []);

  const setSessionFromToken = useCallback((accessToken: string, emailFallback?: string) => {
    const payload = parseJwt(accessToken);
    const roles = normalizeRoles((payload as any)?.roles);

    const userData: User = {
      id: Number((payload as any)?.userId ?? 0),
      fullName: String((payload as any)?.fullName ?? ""),
      email: String((payload as any)?.sub ?? emailFallback ?? ""),
      phone: String((payload as any)?.phone ?? ""),
      country: String((payload as any)?.country ?? ""),
      roles,
      enabled: true,
      organizationId: (payload as any)?.organizationId as number | undefined,
    };

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  }, []);

  // ✅ LOGIN:
  // - SUPER_ADMIN => 200 + token
  // - boshqalar => 400 + code yuboriladi
  const login = useCallback(
    async (email: string) => {
      const normalizedEmail = email.trim().toLowerCase();

      try {
        const res = await authApi.login(normalizedEmail);
        const { accessToken, refreshToken } = res?.data ?? {};

        // Super admin uchun token kelishi kerak
        if (!accessToken) {
          throwNeedsVerification();
        }

        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

        setToken(accessToken);
        setSessionFromToken(accessToken, normalizedEmail);
      } catch (err: any) {
        const status = err?.response?.status;

        // ✅ SENING BACKEND OQIMING: 400 = kod yuborildi => CODE stepga o'tish kerak
        if (status === 400) {
          throwNeedsVerification();
        }

        throw err;
      }
    },
    [setSessionFromToken]
  );

  // ✅ VERIFY LOGIN: /auth/verify-login
  const verify = useCallback(
    async (email: string, code: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const cleanCode = code.replace(/\s/g, "").trim();

      const res = await authApi.verifyLogin(normalizedEmail, cleanCode);
      const { accessToken, refreshToken } = res?.data ?? {};

      if (!accessToken) {
        throw new Error("verify-login response: accessToken topilmadi");
      }

      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

      setToken(accessToken);
      setSessionFromToken(accessToken, normalizedEmail);
    },
    [setSessionFromToken]
  );

  // ✅ VERIFY REGISTER: /auth/verify-register
  const verifyRegister = useCallback(
    async (email: string, code: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const cleanCode = code.replace(/\s/g, "").trim();

      const res = await authApi.verifyRegister(normalizedEmail, cleanCode);
      const { accessToken, refreshToken } = res?.data ?? {};

      if (!accessToken) {
        throw new Error("verify-register response: accessToken topilmadi");
      }

      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

      setToken(accessToken);
      setSessionFromToken(accessToken, normalizedEmail);
    },
    [setSessionFromToken]
  );

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) authApi.logout(refreshToken).catch(() => {});

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    setUser(null);
    setToken(null);
  }, []);

  const hasRole = useCallback(
    (role: string) => {
      const r = role.replace(/^ROLE_/, "");
      return user?.roles?.includes(r) || false;
    },
    [user]
  );

  const getRedirectPath = useCallback(() => {
    if (!user) return "/login";
    if (user.roles.includes("SUPER_ADMIN")) return "/super-admin";
    if (user.roles.includes("ADMIN")) return "/admin";
    if (user.roles.includes("TOUR_ORGANIZATION")) return "/dashboard";
    return "/";
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        verify,
        verifyRegister,
        logout,
        hasRole,
        getRedirectPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}