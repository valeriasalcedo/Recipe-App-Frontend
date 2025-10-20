import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const WEB = Platform.OS === "web";

// Claves fijas para evitar typos
export const STORAGE_KEYS = {
  access: "accessToken",
  refresh: "refreshToken",
} as const;

function assertKey(k?: string) {
  if (!k || typeof k !== "string" || k.trim() === "") {
    throw new Error("SecureStore: key must be a non-empty string");
  }
}

function assertValue(v?: string | null) {
  if (v == null) {
    throw new Error("SecureStore: value must be a non-null string");
  }
}

export const storage = {
  get: async (k: string) => {
    assertKey(k);
    if (WEB) return Promise.resolve(localStorage.getItem(k) ?? null);
    return SecureStore.getItemAsync(k);
  },
  set: async (k: string, v: string) => {
    assertKey(k);
    assertValue(v);
    if (WEB) {
      localStorage.setItem(k, v);
      return;
    }
    await SecureStore.setItemAsync(k, v);
  },
  del: async (k: string) => {
    assertKey(k);
    if (WEB) {
      localStorage.removeItem(k);
      return;
    }
    await SecureStore.deleteItemAsync(k);
  },
};
