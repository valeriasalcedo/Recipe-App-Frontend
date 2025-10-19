import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, Alert, ScrollView, TouchableOpacity, ActivityIndicator, Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { recipeDetailStyles } from "@/assets/styles/recipe-detail.styles";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/src/auth/AuthContext";
import RecipeForm from "@/components/RecipeForm";
import { toDetailVM } from "@/services/recipeMapper";

const API_BASE = Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { accessToken, user } = useAuth();

  const [vm, setVm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isOwner = useMemo(() => {
    if (!user || !vm) return false;
    return String(vm.ownerId) === String(user.id);
  }, [user, vm]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`${API_BASE}/recipes/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        setVm(toDetailVM(data.recipe));
      } catch (e) {
        Alert.alert("Error", String(e?.message || "No se pudo cargar la receta"));
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id, accessToken]);

  // --- helpers ---
  const getYouTubeEmbedUrl = (url) => {
    const videoId = url?.split("v=")?.[1];
    return `https://www.youtube.com/embed/${videoId}`;
  };

  // --- UPDATE (PATCH) ---
  async function handleUpdate(values) {
    setSubmitting(true);
    try {
      const r = await fetch(`${API_BASE}/recipes/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(values),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${r.status}`);
      }
      const { recipe } = await r.json();
      setVm(toDetailVM(recipe));
      setEditMode(false);
      Alert.alert("Listo", "Receta actualizada");
    } catch (e) {
      Alert.alert("Error", String(e?.message || "No se pudo actualizar"));
    } finally {
      setSubmitting(false);
    }
  }

  // --- DELETE ---
  function confirmDelete() {
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
              router.replace("/(tabs)");
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
  if (!vm) return null;

  // --- Edit mode: muestra el formulario ---
  if (editMode) {
    const initialValues = {
      title: vm.title || "",
      description: vm.description || "",
      images: vm.image ? [vm.image] : [],
      ingredients: (vm.ingredients || []).map((name) => ({ name, quantity: "", unit: "", notes: "" })),
      steps: vm.instructions || [],
      tags: vm.category ? [vm.category] : [],
      servings: vm.servings ?? 1,
      cookTime: vm.cookTime ?? 1,
    };

    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
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

  // --- Detalle (read-only) ---
  return (
    <View style={recipeDetailStyles.container}>
      <ScrollView>
        {/* HEADER */}
        <View style={recipeDetailStyles.headerContainer}>
          <View style={recipeDetailStyles.imageContainer}>
            {!!vm.image && (
              <Image source={{ uri: vm.image }} style={recipeDetailStyles.headerImage} contentFit="cover" />
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
                  onPress={confirmDelete}
                  disabled={submitting}
                >
                  <Ionicons name="trash-outline" size={22} color={COLORS.white} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Título + Owner */}
          <View style={recipeDetailStyles.titleSection}>
            {vm.category && (
              <View style={recipeDetailStyles.categoryBadge}>
                <Text style={recipeDetailStyles.categoryText}>{vm.category}</Text>
              </View>
            )}
            <Text style={recipeDetailStyles.recipeTitle}>{vm.title}</Text>

            {/* 👇 Owner debajo del título */}
            {(vm.ownerName || vm.ownerEmail) && (
              <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="person-circle-outline" size={16} color={COLORS.white} />
                <Text style={recipeDetailStyles.locationText}>
                  by {vm.ownerName || vm.ownerEmail}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* CONTENIDO */}
        <View style={recipeDetailStyles.contentSection}>
          {/* QUICK STATS */}
          <View style={recipeDetailStyles.statsContainer}>
            <View style={recipeDetailStyles.statCard}>
              <LinearGradient colors={["#FF6B6B", "#FF8E53"]} style={recipeDetailStyles.statIconContainer}>
                <Ionicons name="time" size={20} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.statValue}>{vm.cookTime}</Text>
              <Text style={recipeDetailStyles.statLabel}>Prep Time</Text>
            </View>

            <View style={recipeDetailStyles.statCard}>
              <LinearGradient colors={["#4ECDC4", "#44A08D"]} style={recipeDetailStyles.statIconContainer}>
                <Ionicons name="people" size={20} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.statValue}>{vm.servings}</Text>
              <Text style={recipeDetailStyles.statLabel}>Porciones</Text>
            </View>
          </View>

          {/* VIDEO opcional */}
          {!!vm.youtubeUrl && (
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
                  source={{ uri: getYouTubeEmbedUrl(vm.youtubeUrl) }}
                  allowsFullscreenVideo
                  mediaPlaybackRequiresUserAction={false}
                />
              </View>
            </View>
          )}

          {/* INGREDIENTES */}
          <View style={recipeDetailStyles.sectionContainer}>
            <View style={recipeDetailStyles.sectionTitleRow}>
              <LinearGradient colors={[COLORS.primary, COLORS.primary + "80"]} style={recipeDetailStyles.sectionIcon}>
                <Ionicons name="list" size={16} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.sectionTitle}>Ingredientes</Text>
              <View style={recipeDetailStyles.countBadge}>
                <Text style={recipeDetailStyles.countText}>{vm.ingredients.length}</Text>
              </View>
            </View>

            <View style={recipeDetailStyles.ingredientsGrid}>
              {vm.ingredients.map((ingredient, index) => (
                <View key={index} style={recipeDetailStyles.ingredientCard}>
                  <View style={recipeDetailStyles.ingredientNumber}>
                    <Text style={recipeDetailStyles.ingredientNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={recipeDetailStyles.ingredientText}>{ingredient}</Text>
                  <View style={recipeDetailStyles.ingredientCheck}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.textLight} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* INSTRUCCIONES */}
          <View style={recipeDetailStyles.sectionContainer}>
            <View style={recipeDetailStyles.sectionTitleRow}>
              <LinearGradient colors={["#9C27B0", "#673AB7"]} style={recipeDetailStyles.sectionIcon}>
                <Ionicons name="book" size={16} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.sectionTitle}>Instrucciones</Text>
              <View style={recipeDetailStyles.countBadge}>
                <Text style={recipeDetailStyles.countText}>{vm.instructions.length}</Text>
              </View>
            </View>

            <View style={recipeDetailStyles.instructionsContainer}>
              {vm.instructions.map((instruction, index) => (
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
        </View>
      </ScrollView>
    </View>
  );
}
