import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal } from "react-native";
import { COLORS } from "@/constants/colors";
export default function GroupModal({ visible, onClose, onSubmit, initial }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    setName(initial?.name || "");
    setDesc(initial?.description || "");
  }, [initial, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(204, 175, 175, 0.81)", justifyContent: "center", padding: 20 }}>
        <View style={{ backgroundColor: "#e48787ff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "rgba(212, 62, 62, 0.1)" }}>
          <Text style={{ color: "#bca0a0ff", fontSize: 18, fontWeight: "700", marginBottom: 10 }}>
            {initial ? "Editar grupo" : "Nuevo grupo"}
          </Text>

          <Text style={{ color: "#bbb", marginBottom: 6 }}>Nombre</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej. Desayunos"
            placeholderTextColor="#9aa0a6"
            style={{
              backgroundColor: "#9a1818ff", borderWidth: 1, borderColor: "rgba(200, 125, 125, 0.08)",
              color: "#fff", padding: 12, borderRadius: 10
            }}
          />

          <Text style={{ color: "#bbb", marginTop: 10, marginBottom: 6 }}>Descripción (opcional)</Text>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder="Breve descripción"
            placeholderTextColor="#9aa0a6"
            style={{
              backgroundColor: "#d7ccccff", borderWidth: 1, borderColor: "rgba(201, 138, 138, 0.08)",
              color: "#fff", padding: 12, borderRadius: 10
            }}
          />

          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", alignItems: "center" }}
            >
              <Text style={{ color: "#fff" }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSubmit({ name: name.trim(), description: desc.trim() || undefined })}
              style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>{initial ? "Guardar" : "Crear"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
