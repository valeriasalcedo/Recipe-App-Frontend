import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";

export default function CategoryFilter({ groups = [], selectedId, onSelect, onCreate }) {
  // Orden: +, All, grupos
  const chips = [
    { id: "__CREATE__", label: "", type: "create" },
    { id: "__ALL__", label: "TODAS", type: "all" },
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
            borderColor: selected ? "transparent" : "rgba(5, 2, 2, 0.06)",
            backgroundColor: selected ? "#9d4040ff" : "#edededff",
            borderColor: selected ? "rgba(154, 75, 75, 0.38)" : "rgba(208, 74, 74, 0.13)",
            shadowColor: "#704a4aff",
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
              style={[baseStyle, { backgroundColor: "#edededff", borderColor: "rgba(208, 74, 74, 0.13)" }]}
            >
              <Ionicons name="add-circle-outline" size={30} color={COLORS.primary} />
              <Text style={{ marginLeft: 8, color: COLORS.primary, fontWeight: "800" }}>Crear</Text>
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
            <Text style={{ color: selected ? "#fff" : "#450c0cff", fontWeight: "700" }}>
              {c.label}
            </Text>
          </TouchableOpacity>
        );
      })}
      </ScrollView>
    </View>
  );
}
