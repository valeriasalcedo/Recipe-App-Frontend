import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";

/**
 * props:
 * - groups: [{ id, name, owner }]
 * - selectedId: string | "__ALL__"
 * - onSelect(id)
 * - onCreate()   -> click en chip "+"
 * - onEdit(group)
 * - onDelete(group)
 * - userId
 */
export default function GroupChips({
  groups = [],
  selectedId = "__ALL__",
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  userId,
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16 }}>
      {/* Chip ALL */}
      <Chip
        label="All"
        active={selectedId === "__ALL__"}
        onPress={() => onSelect("__ALL__")}
      />

      {/* Chip + crear */}
      <Chip
        label=""
        icon={<Ionicons name="add" size={18} color="#fff" />}
        onPress={onCreate}
      />

      {/* Chips de grupos */}
      {groups.map((g) => {
        const active = selectedId === g.id;
        const mine = String(g.owner) === String(userId);
        return (
          <View key={g.id} style={{ position: "relative" }}>
            <Chip
              label={g.name}
              active={active}
              onPress={() => onSelect(g.id)}
            />
            {mine && (
              <View style={{ position: "absolute", right: -6, top: -6, flexDirection: "row", gap: 4 }}>
                <IconBtn
                  name="create-outline"
                  onPress={() => onEdit(g)}
                  bg="rgba(0,0,0,0.5)"
                />
                <IconBtn
                  name="trash-outline"
                  onPress={() => onDelete(g)}
                  bg="rgba(176,0,32,0.75)"
                />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function Chip({ label, active, onPress, icon }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: active ? "#246b2c" : "#ffffff14",
        borderWidth: 1,
        borderColor: active ? "#246b2c" : "rgba(255,255,255,0.12)",
        minWidth: 64,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
      }}
    >
      {icon}
      {!!label && (
        <Text style={{ color: "#fff", fontWeight: active ? "700" : "500" }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function IconBtn({ name, onPress, bg }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: bg || "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
      }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Ionicons name={name} size={14} color="#fff" />
    </TouchableOpacity>
  );
}
