import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const WEB = Platform.OS === "web";

export const storage = {
  get: async (k: string) => {
    if (WEB) return Promise.resolve(localStorage.getItem(k) ?? null);
    return SecureStore.getItemAsync(k);
  },
  set: async (k: string, v: string) => {
    if (WEB) {
      localStorage.setItem(k, v);
      return;
    }
    await SecureStore.setItemAsync(k, v);
  },
  del: async (k: string) => {
    if (WEB) {
      localStorage.removeItem(k);
      return;
    }
    await SecureStore.deleteItemAsync(k);
  },
};
