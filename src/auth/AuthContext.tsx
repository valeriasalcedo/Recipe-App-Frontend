import React, { createContext, useContext, useEffect, useState } from "react";
import { storage } from "./storage";

type User = { id: string; email: string; name?: string; bio?: string };
type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>; // ⬅️ NUEVO
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({} as any);

// Ajusta según tu entorno (web: localhost, emulador Android: 10.0.2.2)
const API = "http://localhost:4000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function hydrate() {
    try {
      const token = await storage.get("accessToken");
      if (!token) return;
      const r = await fetch(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const data = await r.json();
        setUser(data.user);
      } else {
        // token inválido → limpiar
        await storage.del("accessToken");
        await storage.del("refreshToken");
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    hydrate();
  }, []);

  const persistSession = async (accessToken: string, refreshToken: string, u: User) => {
    await storage.set("accessToken", accessToken);
    await storage.set("refreshToken", refreshToken);
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
    const { accessToken, refreshToken, user } = await r.json();
    await persistSession(accessToken, refreshToken, user);
  };

  // ⬅️ NUEVO: registro con tu backend
  const register = async (email: string, password: string, name: string) => {
    const r = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (!r.ok) {
      // tu back devuelve 409 cuando el email ya existe
      // y 422 para validaciones (zod)
      const body = await r.json().catch(() => ({}));
      const message =
        body?.message ||
        body?.error ||
        (r.status === 409 ? "El email ya está registrado" : "Error al registrarte");
      throw new Error(message);
    }
    const { accessToken, refreshToken, user } = await r.json();
    await persistSession(accessToken, refreshToken, user);
  };

  const logout = async () => {
    await storage.del("accessToken");
    await storage.del("refreshToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
