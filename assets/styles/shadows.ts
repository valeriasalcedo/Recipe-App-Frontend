import { Platform } from "react-native";

type ShadowLevel = 0 | 1 | 2 | 3 | 4;


export const shadow = (level: ShadowLevel = 1) =>
  Platform.select({
    web: {
      boxShadow:
        level === 0
          ? "none"
          : level === 1
          ? "0 2px 4px rgba(0,0,0,0.08)"
          : level === 2
          ? "0 4px 8px rgba(0,0,0,0.12)"
          : level === 3
          ? "0 12px 16px rgba(0,0,0,0.2)"
          : "0 16px 24px rgba(0,0,0,0.24)",
    },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: level <= 1 ? 2 : level === 2 ? 4 : 12 },
      shadowOpacity: level <= 1 ? 0.1 : level === 2 ? 0.12 : 0.2,
      shadowRadius: level <= 1 ? 4 : level === 2 ? 8 : 16,
      elevation: level <= 1 ? 2 : level === 2 ? 4 : 12,
    },
  });

export const textShadowSoft = Platform.select({
  web: { textShadow: "0 1px 2px rgba(0,0,0,0.3)" },
  default: {
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
