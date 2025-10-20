import React, { useEffect, useRef } from "react";
import { View, Text, Animated, TouchableOpacity } from "react-native";

export default function Banner({ type = "info", text, onClose, autoHideMs = 3000 }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();

    if (autoHideMs > 0) {
      const t = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => {
          if (finished) onClose?.();
        });
      }, autoHideMs);
      return () => clearTimeout(t);
    }
  }, [autoHideMs]);

  const bg = type === "success" ? "#0f5132" : type === "error" ? "#5f1d20" : "#1b3b5a";
  const border = type === "success" ? "#198754" : type === "error" ? "#dc3545" : "#0d6efd";

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        right: 12,
        zIndex: 50,
        opacity,
      }}
    >
      <View
        style={{
          backgroundColor: bg,
          borderColor: border,
          borderWidth: 1,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: "white" }}>{text}</Text>
        <TouchableOpacity onPress={onClose} style={{ position: "absolute", right: 10, top: 8 }}>
          <Text style={{ color: "white", fontWeight: "700" }}>×</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
