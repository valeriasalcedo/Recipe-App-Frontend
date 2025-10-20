// app/recipes/create.jsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import RecipeForm from "@/components/RecipeForm";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/src/auth/AuthContext";
import Banner from "@/components/Banner";

const API = Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";

export default function CreateRecipeScreen() {
  const router = useRouter();
  const { accessToken } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState(null); // {type: 'success'|'error'|'info', text: string}

  function showBanner(type, text, autoHideMs = 3500) {
    setBanner({ type, text, autoHideMs });
  }

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
    const payload = preparePayload(values); // ahora no metas tags, pero sí acepta groupIds que viene del form
    const r = await fetch(`${API}/recipes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        ingredients: payload.ingredients,
        steps: payload.steps,
        servings: payload.servings,
        cookTime: payload.cookTime,
        images: payload.images,
        // OJO: el backend de recipes NO recibe groups. Asociamos aparte.
      }),
    });

    const body = await r.json().catch(() => null);
    if (!r.ok) {
      // ... tus errores 409/422 ...
      throw new Error(body?.error || `HTTP ${r.status}`);
    }

    const { recipe } = body || {};
    // Asociar a grupos seleccionados
    const groupIds = values.groupIds || []; // viene del form.buildPayload
    if (recipe?.id && Array.isArray(groupIds) && groupIds.length) {
      await Promise.all(
        groupIds.map((gid) =>
          fetch(`${API}/groups/${gid}/recipes/${recipe.id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
          })
        )
      );
    }

    // feedback + redirect
    alert("¡Receta creada!");
    router.replace(`/recipes/${recipe.id}`);
  } catch (e) {
    alert(String(e?.message || "No se pudo crear la receta."));
  } finally {
    setSubmitting(false);
  }
}

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {banner && (
        <Banner
          type={banner.type}
          text={banner.text}
          autoHideMs={banner.autoHideMs}
          onClose={() => setBanner(null)}
        />
      )}

      {/* Header */}
      <View style={{ padding: 16, paddingBottom: 0, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: COLORS.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#ffffffff" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", marginLeft: 10 }}>Crear receta</Text>
      </View>

      <RecipeForm initialValues={initialValues} onSubmit={handleCreate} submitting={submitting} />
    </View>
  );
}
