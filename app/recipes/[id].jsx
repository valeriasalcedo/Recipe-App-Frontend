// app/recipes/[id].jsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { recipeDetailStyles } from "@/assets/styles/recipe-detail.styles";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/src/auth/AuthContext";
import RecipeForm from "@/components/RecipeForm";

const API_BASE = Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { accessToken, user } = useAuth();

  const [recipe, setRecipe] = useState(null);    // ← receta cruda del backend (con owner/ownerName/ownerEmail)
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isOwner = useMemo(() => {
    if (!user || !recipe) return false;
    return String(recipe.owner) === String(user.id);
  }, [user, recipe]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`${API_BASE}/recipes/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json(); // {recipe: {...}}
        setRecipe(data.recipe);
      } catch (e) {
        Alert.alert("Error", String(e?.message || "No se pudo cargar la receta"));
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id, accessToken]);

  const getYouTubeEmbedUrl = (url) => {
    const videoId = url?.split("v=")?.[1];
    return `https://www.youtube.com/embed/${videoId}`;
  };

  // ---- EDIT (PATCH) ----
  async function handleUpdate(payload) {
    setSubmitting(true);
    try {
      const r = await fetch(`${API_BASE}/recipes/${id}`, {
        method: "PATCH",
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
      const { recipe: updated } = await r.json();
      setRecipe(updated);
      setEditMode(false);
      Alert.alert("Listo", "Receta actualizada");
    } catch (e) {
      Alert.alert("Error", String(e?.message || "No se pudo actualizar la receta"));
    } finally {
      setSubmitting(false);
    }
  }

  // ---- DELETE ----
  async function handleDelete() {
    Alert.alert(
      "Eliminar receta",
      "Esta acción no se puede deshacer. ¿Quieres eliminarla?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              setSubmitting(true);
              const r = await fetch(`${API_BASE}/recipes/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (!r.ok) {
                const body = await r.json().catch(() => ({}));
                throw new Error(body?.error || `HTTP ${r.status}`);
              }
              Alert.alert("Eliminada", "La receta se eliminó correctamente");
              router.replace("/(tabs)"); // o "/"
            } catch (e) {
              Alert.alert("Error", String(e?.message || "No se pudo eliminar"));
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator color="#fff" />
        <Text style={{ color: "#fff", marginTop: 8 }}>Cargando...</Text>
      </View>
    );
  }
  if (!recipe) return null;

  // ---- si está en modo edición, mostrar el form en lugar del detalle ----
  if (editMode) {
    const initialValues = {
      title: recipe.title || "",
      description: recipe.description || "",
      images: recipe.images?.length ? recipe.images : [""],
      ingredients:
        recipe.ingredients?.length
          ? recipe.ingredients
          : [{ name: "", quantity: "", unit: "", notes: "" }],
      steps: recipe.steps?.length ? recipe.steps : [""],
      tags: recipe.tags || [],
    };

    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        {/* Header edición */}
        <View style={{ padding: 16, paddingBottom: 0, flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => setEditMode(false)}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", marginLeft: 10 }}>Editar receta</Text>
        </View>

        <RecipeForm initialValues={initialValues} onSubmit={handleUpdate} submitting={submitting} />
      </View>
    );
  }

  // ---- modo lectura (detalle) ----
  return (
    <View style={recipeDetailStyles.container}>
      <ScrollView>
        {/* HEADER */}
        <View style={recipeDetailStyles.headerContainer}>
          <View style={recipeDetailStyles.imageContainer}>
            {!!recipe.images?.[0] && (
              <Image source={{ uri: recipe.images[0] }} style={recipeDetailStyles.headerImage} contentFit="cover" />
            )}
          </View>

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.9)"]}
            style={recipeDetailStyles.gradientOverlay}
          />

          <View style={recipeDetailStyles.floatingButtons}>
            <TouchableOpacity style={recipeDetailStyles.floatingButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>

            {isOwner && (
              <>
                <TouchableOpacity
                  style={[recipeDetailStyles.floatingButton, { backgroundColor: COLORS.primary }]}
                  onPress={() => setEditMode(true)}
                  disabled={submitting}
                >
                  <Ionicons name="create-outline" size={22} color={COLORS.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[recipeDetailStyles.floatingButton, { backgroundColor: "#B00020" }]}
                  onPress={handleDelete}
                  disabled={submitting}
                >
                  <Ionicons name="trash-outline" size={22} color={COLORS.white} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Title Section */}
          <View style={recipeDetailStyles.titleSection}>
            {/* badge con primer tag (si existe) */}
            {recipe.tags?.[0] && (
              <View style={recipeDetailStyles.categoryBadge}>
                <Text style={recipeDetailStyles.categoryText}>{recipe.tags[0]}</Text>
              </View>
            )}

            <Text style={recipeDetailStyles.recipeTitle}>{recipe.title}</Text>

            {/* autor */}
            {(recipe.ownerName || recipe.ownerEmail) && (
              <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="person-circle-outline" size={16} color={COLORS.white} />
                <Text style={recipeDetailStyles.locationText}>
                  by {recipe.ownerName || recipe.ownerEmail}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={recipeDetailStyles.contentSection}>
          {/* DESCRIPCIÓN (opcional) */}
          {!!recipe.description && (
            <View style={recipeDetailStyles.sectionContainer}>
              <View style={recipeDetailStyles.sectionTitleRow}>
                <LinearGradient colors={["#2F80ED", "#56CCF2"]} style={recipeDetailStyles.sectionIcon}>
                  <Ionicons name="information-circle-outline" size={16} color={COLORS.white} />
                </LinearGradient>
                <Text style={recipeDetailStyles.sectionTitle}>Description</Text>
              </View>
              <Text style={{ color: COLORS.text, marginTop: 8, lineHeight: 20 }}>{recipe.description}</Text>
            </View>
          )}

          {/* INGREDIENTS */}
          <View style={recipeDetailStyles.sectionContainer}>
            <View style={recipeDetailStyles.sectionTitleRow}>
              <LinearGradient colors={[COLORS.primary, COLORS.primary + "80"]} style={recipeDetailStyles.sectionIcon}>
                <Ionicons name="list" size={16} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.sectionTitle}>Ingredients</Text>
              <View style={recipeDetailStyles.countBadge}>
                <Text style={recipeDetailStyles.countText}>{recipe.ingredients.length}</Text>
              </View>
            </View>

            <View style={recipeDetailStyles.ingredientsGrid}>
              {recipe.ingredients.map((ing, index) => {
                const label = [ing.quantity, ing.unit].filter(Boolean).join(" ");
                return (
                  <View key={index} style={recipeDetailStyles.ingredientCard}>
                    <View style={recipeDetailStyles.ingredientNumber}>
                      <Text style={recipeDetailStyles.ingredientNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={recipeDetailStyles.ingredientText}>
                      {ing.name} {label ? `• ${label}` : ""} {ing.notes ? `(${ing.notes})` : ""}
                    </Text>
                    <View style={recipeDetailStyles.ingredientCheck}>
                      <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.textLight} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* INSTRUCTIONS */}
          <View style={recipeDetailStyles.sectionContainer}>
            <View style={recipeDetailStyles.sectionTitleRow}>
              <LinearGradient colors={["#9C27B0", "#673AB7"]} style={recipeDetailStyles.sectionIcon}>
                <Ionicons name="book" size={16} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.sectionTitle}>Instructions</Text>
              <View style={recipeDetailStyles.countBadge}>
                <Text style={recipeDetailStyles.countText}>{recipe.steps.length}</Text>
              </View>
            </View>

            <View style={recipeDetailStyles.instructionsContainer}>
              {recipe.steps.map((instruction, index) => (
                <View key={index} style={recipeDetailStyles.instructionCard}>
                  <LinearGradient colors={[COLORS.primary, COLORS.primary + "CC"]} style={recipeDetailStyles.stepIndicator}>
                    <Text style={recipeDetailStyles.stepNumber}>{index + 1}</Text>
                  </LinearGradient>
                  <View style={recipeDetailStyles.instructionContent}>
                    <Text style={recipeDetailStyles.instructionText}>{instruction}</Text>
                    <View style={recipeDetailStyles.instructionFooter}>
                      <Text style={recipeDetailStyles.stepLabel}>Step {index + 1}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* VIDEO (si alguna vez agregas youtubeUrl en el model/DTO) */}
          {!!recipe.youtubeUrl && (
            <View style={recipeDetailStyles.sectionContainer}>
              <View style={recipeDetailStyles.sectionTitleRow}>
                <LinearGradient colors={["#FF0000", "#CC0000"]} style={recipeDetailStyles.sectionIcon}>
                  <Ionicons name="play" size={16} color={COLORS.white} />
                </LinearGradient>
                <Text style={recipeDetailStyles.sectionTitle}>Video Tutorial</Text>
              </View>

              <View style={recipeDetailStyles.videoCard}>
                <WebView
                  style={recipeDetailStyles.webview}
                  source={{ uri: getYouTubeEmbedUrl(recipe.youtubeUrl) }}
                  allowsFullscreenVideo
                  mediaPlaybackRequiresUserAction={false}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
