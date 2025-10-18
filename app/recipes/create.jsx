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
    servings: 1,
    cookTime: 1,
  };

  const sanitizeStr = (s) => (typeof s === "string" ? s.trim() : s);
  const toIntMin = (v, min = 1, fallback = 1) => {
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) && n >= min ? n : fallback;
  };

  function preparePayload(values) {
    const title = sanitizeStr(values.title);
    const description = sanitizeStr(values.description) || undefined;

    const ingredients = (values.ingredients || [])
      .map((i) => ({
        name: sanitizeStr(i.name),
        quantity: sanitizeStr(i.quantity) || undefined,
        unit: sanitizeStr(i.unit) || undefined,
        notes: sanitizeStr(i.notes) || undefined,
      }))
      .filter((i) => i.name && i.name.length > 0);

    const steps = (values.steps || []).map(sanitizeStr).filter(Boolean);

    const images = (values.images || []).map(sanitizeStr).filter(Boolean);
    const tags = (values.tags || []).map(sanitizeStr).filter(Boolean);

    const servings = toIntMin(values.servings, 1, 1);
    const cookTime = toIntMin(values.cookTime, 1, 1);

    const payload = { title, description, ingredients, steps, servings, cookTime };
    if (images.length) payload.images = images;
    if (tags.length) payload.tags = tags;
    return payload;
  }

  async function handleCreate(values) {
    setSubmitting(true);
    try {
      const payload = preparePayload(values);

      // Validación rápida en cliente (evita 422 obvios)
      if (!payload.title) throw new Error("El título es obligatorio.");
      if (!payload.ingredients?.length) throw new Error("Agrega al menos 1 ingrediente con nombre.");
      if (!payload.steps?.length) throw new Error("Agrega al menos 1 paso.");
      if (!payload.servings || payload.servings < 1) throw new Error("Servings debe ser al menos 1.");
      if (!payload.cookTime || payload.cookTime < 1) throw new Error("Cook time debe ser al menos 1.");

      const r = await fetch(`${API}/recipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        // Si viene de Zod (422), muestra issues detallados
        const body = await r.json().catch(() => null);
        if (r.status === 422 && body?.issues?.length) {
          const msg = body.issues
            .map((it) => `• ${Array.isArray(it.path) ? it.path.join(".") : it.path}: ${it.message}`)
            .join("\n");
          throw new Error(`Errores de validación:\n${msg}`);
        }
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
