import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, Alert, ScrollView, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { recipeDetailStyles } from "@/assets/styles/recipe-detail.styles";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/src/auth/AuthContext";
import { toDetailVM } from "@/services/recipeMapper";
import { Platform } from "react-native";

const API_BASE = Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { accessToken } = useAuth();

  const [vm, setVm] = useState(null);
  const [loading, setLoading] = useState(true);

  const getYouTubeEmbedUrl = (url) => {
    const videoId = url?.split("v=")?.[1];
    return `https://www.youtube.com/embed/${videoId}`;
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/recipes/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!r.ok) throw new Error("No autorizado o no encontrada");
        const data = await r.json();
        setVm(toDetailVM(data.recipe));
      } catch (e) {
        Alert.alert("Error", String(e?.message || "No se pudo cargar la receta"));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, accessToken]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background }}>
        <Text style={{ color: "#fff" }}>Cargando...</Text>
      </View>
    );
  }
  if (!vm) return null;

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
          </View>

          {/* Title Section */}
          <View style={recipeDetailStyles.titleSection}>
            <View style={recipeDetailStyles.categoryBadge}>
              <Text style={recipeDetailStyles.categoryText}>{vm.category}</Text>
            </View>
            <Text style={recipeDetailStyles.recipeTitle}>{vm.title}</Text>
            {vm.area && (
              <View style={recipeDetailStyles.locationRow}>
                <Ionicons name="location" size={16} color={COLORS.white} />
                <Text style={recipeDetailStyles.locationText}>{vm.area} Cuisine</Text>
              </View>
            )}
          </View>
        </View>

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
              <Text style={recipeDetailStyles.statLabel}>Servings</Text>
            </View>
          </View>

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

          {/* INGREDIENTS */}
          <View style={recipeDetailStyles.sectionContainer}>
            <View style={recipeDetailStyles.sectionTitleRow}>
              <LinearGradient colors={[COLORS.primary, COLORS.primary + "80"]} style={recipeDetailStyles.sectionIcon}>
                <Ionicons name="list" size={16} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.sectionTitle}>Ingredients</Text>
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

          {/* INSTRUCTIONS */}
          <View style={recipeDetailStyles.sectionContainer}>
            <View style={recipeDetailStyles.sectionTitleRow}>
              <LinearGradient colors={["#9C27B0", "#673AB7"]} style={recipeDetailStyles.sectionIcon}>
                <Ionicons name="book" size={16} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.sectionTitle}>Instructions</Text>
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
                      <TouchableOpacity style={recipeDetailStyles.completeButton}>
                        <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                      </TouchableOpacity>
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
