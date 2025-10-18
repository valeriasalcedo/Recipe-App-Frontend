// app/recipes/create.jsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import RecipeForm from "@/components/RecipeForm";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/src/auth/AuthContext";
import { Platform } from "react-native";

const API = Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";

export default function CreateRecipeScreen() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const initialValues = {
    title: "",
    description: "",
    images: [""],
    ingredients: [{ name: "", quantity: "", unit: "", notes: "" }],
    steps: [""],
    tags: [],
  };

  async function handleCreate(payload) {
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/recipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${r.status}`);
      }
      const { recipe } = await r.json();
      alert("Receta creada");
      router.replace(`/recipes/${recipe.id}`);
    } catch (e) {
      alert(String(e?.message || "No se pudo crear la receta."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header simple */}
      <View style={{ padding: 16, paddingBottom: 0, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", marginLeft: 10 }}>Crear receta</Text>
      </View>

      <RecipeForm initialValues={initialValues} onSubmit={handleCreate} submitting={submitting} />
    </View>
  );
}
