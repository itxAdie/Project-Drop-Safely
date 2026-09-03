"use client";

import {
  createContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { AuthUser, AuthTokens } from "@/types/api";

// ── Storage helpers ─────────────────────────────────────────────────────────

interface StoredAuth {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

function readStorage(): StoredAuth | null {
  try {
    const raw = localStorage.getItem("ds_auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Support new shape
    if (parsed.accessToken && parsed.refreshToken) {
      return parsed as StoredAuth;
    }
    // Legacy shape (token field) — migrate
    if (parsed.token) {
      return null; // can't migrate without refresh token
    }
    return null;
  } catch {
    return null;
  }
}

function writeStorage(data: StoredAuth): void {
  localStorage.setItem("ds_auth", JSON.stringify(data));
}

function clearStorage(): void {
  localStorage.removeItem("ds_auth");
}

// ── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: AuthTokens, user: AuthUser) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refreshToken: async () => false,
});

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);

  // ── Refresh token logic ──────────────────────────────────────────────────

  const doRefresh = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) return false;
    isRefreshingRef.current = true;

    try {
      const stored = readStorage();
      const rt = stored?.refreshToken;
      if (!rt) return false;

      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });

      if (!res.ok) {
        clearStorage();
        setUser(null);
        setToken(null);
        setRefreshTokenValue(null);
        return false;
      }

      const data = await res.json();
      const newTokens: AuthTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };

      // Keep the same user object
      setUser((prev) => {
        if (!prev) return null;
        const updated = { ...prev };
        writeStorage({
          user: updated,
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
        });
        return updated;
      });
      setToken(newTokens.accessToken);
      setRefreshTokenValue(newTokens.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // ── Schedule auto-refresh ────────────────────────────────────────────────

  const scheduleRefresh = useCallback(
    (accessToken: string) => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

      try {
        // Decode JWT payload to read exp
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        const expMs = payload.exp * 1000;
        const nowMs = Date.now();
        // Refresh 60s before expiry, minimum 5s from now
        const delayMs = Math.max(expMs - nowMs - 60_000, 5_000);

        refreshTimerRef.current = setTimeout(() => {
          doRefresh();
        }, delayMs);
      } catch {
        // If token can't be decoded, skip auto-refresh
      }
    },
    [doRefresh],
  );

  // ── Hydrate from localStorage on mount ───────────────────────────────────

  useEffect(() => {
    const stored = readStorage();
    if (stored) {
      setUser(stored.user);
      setToken(stored.accessToken);
      setRefreshTokenValue(stored.refreshToken);
      scheduleRefresh(stored.accessToken);
    }
    setIsLoading(false);
  }, [scheduleRefresh]);

  // ── Public methods ────────────────────────────────────────────────────────

  const login = useCallback(
    (tokens: AuthTokens, authUser: AuthUser) => {
      setUser(authUser);
      setToken(tokens.accessToken);
      setRefreshTokenValue(tokens.refreshToken);
      writeStorage({
        user: authUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
      scheduleRefresh(tokens.accessToken);
    },
    [scheduleRefresh],
  );

  const logout = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    setUser(null);
    setToken(null);
    setRefreshTokenValue(null);
    clearStorage();
  }, []);

  // ── Cleanup timer on unmount ─────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        refreshToken: doRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
