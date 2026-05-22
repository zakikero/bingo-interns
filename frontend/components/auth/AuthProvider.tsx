"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { registerUser, loginUser, logoutUser } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (username: string, password: string) => Promise<User>;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const storageKey = "bingo_user";

  // On mount: read user from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        setUser(JSON.parse(raw) as User);
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    setLoading(false);
  }, []);

  const register = useCallback(
    async (username: string, password: string): Promise<User> => {
      setLoading(true);
      setError(null);
      try {
        const newUser = await registerUser(username, password);
        setUser(newUser);
        localStorage.setItem(storageKey, JSON.stringify(newUser));
        return newUser;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Registration failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const login = useCallback(
    async (username: string, password: string): Promise<User> => {
      setLoading(true);
      setError(null);
      try {
        const loggedInUser = await loginUser(username, password);
        setUser(loggedInUser);
        localStorage.setItem(storageKey, JSON.stringify(loggedInUser));
        return loggedInUser;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutUser();
    } catch {
      // best-effort
    }
    setUser(null);
    localStorage.removeItem(storageKey);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      register,
      login,
      logout,
      isLoggedIn: !!user,
    }),
    [user, loading, error, register, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Consume the shared auth context.
 * Must be used inside an <AuthProvider>.
 */
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an <AuthProvider>");
  }
  return ctx;
}
