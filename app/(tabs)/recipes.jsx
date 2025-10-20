import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Platform,
} from "react-native";
import { favoritesStyles } from "../../assets/styles/favorites.styles";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import RecipeCard from "../../components/RecipeCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../src/auth/AuthContext";
import { getMyRecipes } from "../../services/recipe.service";
import { useRouter } from "expo-router";

const MyRecipesScreen = () => {
  const router = useRouter();
  const { user, accessToken, logout } = useAuth(); 
  const [myRecipes, setMyRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadMyRecipes() {
    if (!accessToken) return;
    setLoading(true);
    try {
      const recipes = await getMyRecipes({ accessToken });
      setMyRecipes(recipes);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to load your recipes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMyRecipes();
  }, [accessToken, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadMyRecipes();
    } finally {
      setRefreshing(false);
    }
  }, []);

const handleSignOut = () => {
  Alert.alert("Logout", "Are you sure you want to logout?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Logout",
      style: "destructive",
      onPress: async () => {
        try {
          await logout?.();
          router.replace("/(auth)/sign-in");
        } catch (e) {}
      },
    },
  ]);
};

  if (loading) return <LoadingSpinner message="Loading your recipes..." />;

  return (
    <View style={favoritesStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
         <View style={favoritesStyles.header}>
  <Text style={favoritesStyles.title}>My Recipes</Text>

  <TouchableOpacity
    onPress={() => {
      console.log("[MyRecipes] logout button tapped");
      if (Platform.OS === "web") {
        logout?.()
          .then(() => console.log("[MyRecipes] logged out (web)"))
          .catch((e) => console.log("[MyRecipes] logout error (web)", e));
        return;
      }

      try {
        Alert.alert("Logout", "Are you sure you want to logout?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Logout",
            style: "destructive",
            onPress: async () => {
              console.log("[MyRecipes] confirming logout...");
              try {
                await logout?.();
                console.log("[MyRecipes] logged out");
              } catch (e) {
                console.log("[MyRecipes] logout error", e);
              }
            },
          },
        ]);
      } catch (err) {
        console.log("[MyRecipes] Alert failed, doing direct logout", err);
        logout?.().catch(() => {});
      }
    }}

    style={{
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.06)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
    }}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    accessibilityRole="button"
    accessibilityLabel="Logout"
  >
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Ionicons name="log-out-outline" size={20} color={COLORS.text} />
      <Text style={{ color: COLORS.text, fontWeight: "700" }}>Cerrar Sesion</Text>
    </View>
  </TouchableOpacity>
</View>


        <View style={favoritesStyles.recipesSection}>
          <FlatList
            data={myRecipes}
            renderItem={({ item }) => (
              <RecipeCard
                recipe={{
                  id: item.id,
                  title: item.title,
                  image: item.image,
                  cookTime: item.cookTime,
                  servings: item.servings,
                }}
                onPress={() => router.push({ pathname: "/(recipes)/[id]", params: { id: String(item.id) } })}
              />
            )}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            columnWrapperStyle={favoritesStyles.row}
            contentContainerStyle={favoritesStyles.recipesGrid}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Ionicons name="restaurant-outline" size={28} color={COLORS.mutedText} />
                <Text style={{ marginTop: 8, color: COLORS.mutedText }}>
                  No has creado ninguna receta aún.
                </Text>
                <Text style={{ marginTop: 4, color: COLORS.mutedText }}>
                  ¡Comienza creando tu primera receta!
                </Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default MyRecipesScreen;
