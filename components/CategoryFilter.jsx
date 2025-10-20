import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";

// Props: groups, selectedId, onSelect, onCreate
export default function CategoryFilter({ groups = [], selectedId, onSelect, onCreate }) {
  // Orden: +, All, grupos
  const chips = [
    { id: "__CREATE__", label: "", type: "create" },
    { id: "__ALL__", label: "All", type: "all" },
    ...groups.map((g) => ({ id: g.id, label: g.name, type: "group" })),
  ];

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {chips.map((c) => {
          const selected = c.type !== "create" && selectedId === c.id;
          const baseStyle = {
            height: 64,
            minWidth: 108,
            paddingHorizontal: 14,
            borderRadius: 18,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1.5,
            borderColor: selected ? "transparent" : "rgba(0,0,0,0.06)",
            backgroundColor: selected ? "#2f7d3a" : "#fff",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
          };

        if (c.type === "create") {
          return (
            <TouchableOpacity
              key={c.id}
              onPress={onCreate}
              activeOpacity={0.8}
              style={[baseStyle, { backgroundColor: "#e8f4ec", borderColor: "rgba(0,0,0,0.04)" }]}
            >
              <Ionicons name="add-circle-outline" size={22} color={COLORS.primary} />
              <Text style={{ marginLeft: 8, color: COLORS.primary, fontWeight: "700" }}>New</Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={c.id}
            onPress={() => onSelect(c.id)}
            activeOpacity={0.85}
            style={baseStyle}
          >
            <View style={{
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: selected ? "rgba(255,255,255,0.22)" : "#e9f1ec",
              marginRight: 10,
            }} />
            <Text style={{ color: selected ? "#fff" : "#2d2d2d", fontWeight: "700" }}>
              {c.label}
            </Text>
          </TouchableOpacity>
        );
      })}
      </ScrollView>
    </View>
  );
}
