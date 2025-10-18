import { View, Text, Alert, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { useEffect, useState } from "react";
import { favoritesStyles } from "../../assets/styles/favorites.styles";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import RecipeCard from "../../components/RecipeCard";
import NoFavoritesFound from "../../components/NoFavoritesFound";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../src/auth/AuthContext";
import { getFavorites, FavoriteRecipe } from "../../src/favorites/favorites.service";

const FavoritesScreen = () => {
  const { user, logout } = useAuth();
  const [favoriteRecipes, setFavoriteRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadFavorites() {
    if (!user) return;
    setLoading(true);
    try {
      const favorites = await getFavorites(user.id);
      // Adaptar al formato de RecipeCard: requiere `id`
      const transformed = favorites.map((f: FavoriteRecipe) => ({
        ...f,
        id: f.recipeId,
      }));
      setFavoriteRecipes(transformed);
    } catch (error) {
      console.log("Error loading favorites", error);
      Alert.alert("Error", "Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFavorites();
  }, [user?.id]);

  const handleSignOut = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { await logout(); } },
    ]);
  };

  if (loading) return <LoadingSpinner message="Loading your favorites..." />;

  return (
    <View style={favoritesStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={favoritesStyles.header}>
          <Text style={favoritesStyles.title}>Favorites</Text>
          <TouchableOpacity style={favoritesStyles.logoutButton} onPress={ handleSignOut }>
            <Ionicons name="log-out-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={favoritesStyles.recipesSection}>
          <FlatList
            data={favoriteRecipes}
            renderItem={({ item }) => <RecipeCard recipe={item} />}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            columnWrapperStyle={favoritesStyles.row}
            contentContainerStyle={favoritesStyles.recipesGrid}
            scrollEnabled={false}
            ListEmptyComponent={<NoFavoritesFound />}
          />
        </View>
      </ScrollView>
    </View>
  );
};
export default FavoritesScreen;
