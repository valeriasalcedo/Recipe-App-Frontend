import { Platform } from "react-native";
import { router } from "expo-router";

export function safePush(href) {
  if (Platform.OS === "web") {
    // soltar foco por accesibilidad/gesto
    if (typeof document !== "undefined" && document.activeElement) {
      const el = document.activeElement;
      if (el && typeof el.blur === "function") el.blur();
    }
    // dejar terminar el pointerup/touchend
    setTimeout(() => router.push(href), 0);
  } else {
    router.push(href);
  }
}

export function safeReplace(href) {
  if (Platform.OS === "web") {
    if (typeof document !== "undefined" && document.activeElement) {
      const el = document.activeElement;
      if (el && typeof el.blur === "function") el.blur();
    }
    setTimeout(() => router.replace(href), 0);
  } else {
    router.replace(href);
  }
}
