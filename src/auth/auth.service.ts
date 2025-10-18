import * as SecureStore from "expo-secure-store";
import { api, withAuth } from "../lib/api";

export type BackendUser = {
  id: string;
  email: string;
  name: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
};

type AuthResponse = {
  user: BackendUser;
  accessToken: string;
  refreshToken: string;
};

export async function login(email: string, password: string) {
  const res = await fetch(`${api.baseURL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await api.error(res);
  const data = (await res.json()) as AuthResponse;
  await SecureStore.setItemAsync("accessToken", data.accessToken);
  await SecureStore.setItemAsync("refreshToken", data.refreshToken);
  return data.user;
}

export async function register(name: string, email: string, password: string) {
  const res = await fetch(`${api.baseURL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({email, password, name }),
  });
  if (!res.ok) throw await api.error(res);
  const data = (await res.json()) as AuthResponse;
  await SecureStore.setItemAsync("accessToken", data.accessToken);
  await SecureStore.setItemAsync("refreshToken", data.refreshToken);
  return data.user;
}

export async function me() {
  const res = await withAuth(() =>
    fetch(`${api.baseURL}/users/me`, { headers: { "Content-Type": "application/json" } })
  );
  if (!res.ok) throw await api.error(res);
  const data = (await res.json()) as { user: BackendUser };
  return data.user;
}

export async function logout() {
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
}
