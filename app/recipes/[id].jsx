import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Alert, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { recipeDetailStyles } from "@/assets/styles/recipe-detail.styles";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/src/auth/AuthContext";
import { toDetailVM } from "@/services/recipeMapper";
import RecipeForm from "@/components/RecipeForm";

const API_BASE = Platform.OS === "android" ? "https://backend-recipeapp-production.up.railway.app" : "http://localhost:4000";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { accessToken, user, loading: authLoading } = useAuth();

  const [vm, setVm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [groups, setGroups] = useState([]);
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);
  const [picked, setPicked] = useState(new Set());

  const safeGoBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const isOwner = useMemo(
    () => !!user && !!vm && String(vm.owner) === String(user.id),
    [user, vm]
  );

  async function fetchGroups() {
    try {
      const r = await fetch(`${API_BASE}/groups?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setGroups(data.items || []);
    } catch {
      setGroups([]);
    }
  }

  const openGroupPicker = async () => {
    await fetchGroups();
    setPicked(new Set((vm.groups || []).map(String)));
    setGroupPickerOpen(true);
  };

  const togglePick = (gid) => {
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(String(gid))) n.delete(String(gid));
      else n.add(String(gid));
      return n;
    });
  };

  const saveGroupMembership = async () => {
    const current = new Set((vm.groups || []).map(String));
    const next = picked;
    const toAdd = [...next].filter((id) => !current.has(id));
    const toRemove = [...current].filter((id) => !next.has(id));

    try {
      await Promise.all([
        ...toAdd.map((gid) =>
          fetch(`${API_BASE}/groups/${gid}/recipes/${vm.id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
          })
        ),
        ...toRemove.map((gid) =>
          fetch(`${API_BASE}/groups/${gid}/recipes/${vm.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          })
        ),
      ]);
      await fetchRecipe();
      setGroupPickerOpen(false);
    } catch {
      Alert.alert("Error", "No se pudieron guardar los cambios de grupos");
    }
  };

  async function fetchRecipe() {
    const r = await fetch(`${API_BASE}/recipes/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (r.status === 401) {
      const err = new Error("unauthorized");
      err.code = 401;
      throw err;
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    setVm(toDetailVM(data.recipe));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!accessToken || !id) return;
      try {
        setLoading(true);
        await fetchRecipe();
      } catch (e) {
        if (e?.code === 401) {
          router.replace("/(auth)/sign-in");
          return;
        }
        Alert.alert("Error", String(e?.message || "No se pudo cargar la receta"));
        safeGoBack();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, accessToken]);

  async function handleUpdate(values) {
    setSubmitting(true);
    try {
      const payload = {
        title: values.title?.trim(),
        description: values.description?.trim() || undefined,
        ingredients: (values.ingredients || [])
          .map((i) => ({
            name: i.name?.trim(),
            quantity: i.quantity?.trim() || undefined,
            unit: i.unit?.trim() || undefined,
            notes: i.notes?.trim() || undefined,
          }))
          .filter((i) => i.name),
        steps: (values.steps || []).map((s) => s?.trim()).filter(Boolean),
        servings: Number(values.servings) || undefined,
        cookTime: Number(values.cookTime) || undefined,
        images: (values.images || []).map((u) => u?.trim()).filter(Boolean),
        tags: (values.tags || []).map((t) => t?.trim()).filter(Boolean),
      };

      const r = await fetch(`${API_BASE}/recipes/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const body = await r.json().catch(() => null);
      if (!r.ok) {
        const msg = body?.error || (body?.issues ? JSON.stringify(body.issues) : `HTTP ${r.status}`);
        throw new Error(msg);
      }

      await fetchRecipe();
      setEditMode(false);
      Alert.alert("Listo", "Receta actualizada");
    } catch (e) {
      Alert.alert("Error", String(e?.message || "No se pudo actualizar"));
    } finally {
      setSubmitting(false);
    }
  }

  async function doDelete() {
    try {
      setSubmitting(true);
      const r = await fetch(`${API_BASE}/recipes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = await r.json().catch(() => null);
      if (!r.ok) throw new Error(body?.error || `HTTP ${r.status}`);
      router.replace("/");
    } catch (e) {
      Alert.alert("Error", String(e?.message || "No se pudo eliminar"));
    } finally {
      setSubmitting(false);
    }
  }

  const handleDelete = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Eliminar receta. ¿Seguro?")) doDelete();
    } else {
      Alert.alert("Eliminar receta", "¿Seguro? Esta acción no se puede deshacer.", [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator color="#fff" />
      </View>
    );

  if (!vm) return null;

  if (editMode) {
    const initialValues = {
      title: vm.title || "",
      description: vm.description || "",
      images: vm.image ? [vm.image] : [],
      ingredients: (vm.ingredientsRaw || []).length
        ? vm.ingredientsRaw
        : (vm.ingredients || []).map((t) => ({ name: t, quantity: "", unit: "", notes: "" })),
      steps: vm.instructions || [],
      tags: vm.category ? [vm.category] : [],
      servings: Number(vm.servings) || 1,
      cookTime: Number((vm.cookTime || "").replace(/\D+/g, "")) || 1,
    };

    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
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

  return (
    <View style={recipeDetailStyles.container}>
      <ScrollView>
        <View style={recipeDetailStyles.headerContainer}>
          <View style={recipeDetailStyles.imageContainer}>
            {!!vm.image && <Image source={{ uri: vm.image }} style={recipeDetailStyles.headerImage} contentFit="cover" />}
          </View>
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.9)"]} style={recipeDetailStyles.gradientOverlay} />
          <View style={recipeDetailStyles.floatingButtons}>
            <TouchableOpacity style={recipeDetailStyles.floatingButton} onPress={safeGoBack}>
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

          <View style={recipeDetailStyles.titleSection}>
            {vm.category && (
              <View style={recipeDetailStyles.categoryBadge}>
                <Text style={recipeDetailStyles.categoryText}>{vm.category}</Text>
              </View>
            )}
            <Text style={recipeDetailStyles.recipeTitle}>{vm.title}</Text>
            {!!vm.ownerName && (
              <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="person-circle-outline" size={16} color={COLORS.white} />
                <Text style={recipeDetailStyles.locationText}>Por: {vm.ownerName}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={recipeDetailStyles.contentSection}>
          <View style={recipeDetailStyles.statsContainer}>
            <View style={recipeDetailStyles.statCard}>
              <LinearGradient colors={["#FF6B6B", "#FF8E53"]} style={recipeDetailStyles.statIconContainer}>
                <Ionicons name="time" size={20} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.statValue}>{vm.cookTime}</Text>
              <Text style={recipeDetailStyles.statLabel}>Tiempo de preparación</Text>
            </View>

            <View style={recipeDetailStyles.statCard}>
              <LinearGradient colors={["#4ECDC4", "#44A08D"]} style={recipeDetailStyles.statIconContainer}>
                <Ionicons name="people" size={20} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.statValue}>{vm.servings}</Text>
              <Text style={recipeDetailStyles.statLabel}>Porciones</Text>
            </View>
          </View>

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
                      <Text style={recipeDetailStyles.stepLabel}>Paso {index + 1}</Text>
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
