import React, { createContext, useContext, useEffect, useState } from "react";
import { storage, STORAGE_KEYS } from "./storage";
import { Platform } from "react-native";

type User = { id: string; email: string; name?: string; bio?: string };

type AuthCtx = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
};

// Base URL sensible al entorno
const API =
  Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";

const AuthContext = createContext<AuthCtx>({} as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null); // 🔹 nuevo
  const [loading, setLoading] = useState(true);

  async function hydrate() {
    try {
      const token = await storage.get(STORAGE_KEYS.access);
      if (!token) return; 
      setAccessToken(token); 

      const r = await fetch(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const data = await r.json();
        setUser(data.user);
      } else {
        await storage.del(STORAGE_KEYS.access);
        await storage.del(STORAGE_KEYS.refresh);
        setAccessToken(null); // 🔹 limpiar
        setUser(null);
      }
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    hydrate();
  }, []);

  const persistSession = async (
    accessTokenIn: string,
    refreshTokenIn: string,
    u: User
  ) => {
    await storage.set(STORAGE_KEYS.access, accessTokenIn);
    await storage.set(STORAGE_KEYS.refresh, refreshTokenIn);
    setAccessToken(accessTokenIn); // 🔹 mantener en memoria
    setUser(u);
  };

  const login = async (email: string, password: string) => {
    const r = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) {
      const msg = await r.text();
      throw new Error(msg || "Invalid credentials");
    }
    const { accessToken: at, refreshToken: rt, user: u } = await r.json();
    await persistSession(at, rt, u);
  };

  const register = async (email: string, password: string, name: string) => {
    const r = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      const message =
        body?.message ||
        body?.error ||
        (r.status === 409
          ? "El email ya está registrado"
          : "Error al registrarte");
      throw new Error(message);
    }
    const { accessToken: at, refreshToken: rt, user: u } = await r.json();
    await persistSession(at, rt, u);
  };

  const logout = async () => {
    await storage.del(STORAGE_KEYS.access);
    await storage.del(STORAGE_KEYS.refresh);
    setAccessToken(null); // 🔹 limpiar
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
