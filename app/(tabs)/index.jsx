import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { homeStyles } from "../../assets/styles/home.styles";
import { Image } from "expo-image";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import CategoryFilter from "../../components/CategoryFilter";
import RecipeCard from "../../components/RecipeCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Platform } from "react-native";
import { useAuth } from "@/src/auth/AuthContext";
import { toCardVM } from "@/services/recipeMapper";

const API_BASE = Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";

const HomeScreen = () => {
  const router = useRouter();
  const { accessToken } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [recipes, setRecipes] = useState([]);         // <-- cards VM
  const [categories, setCategories] = useState([]);   // [{id,name,image?,description?}]
  const [featuredRecipe, setFeaturedRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/recipes?scope=general&limit=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("No autorizado");
      const data = await res.json(); // {items: [...]}
      const cards = (data.items || []).map(toCardVM);

      // armar categorías desde tags (más 'All')
      const tagSet = new Set(["All"]);
      cards.forEach((c) => c.category && tagSet.add(c.category));
      const cats = Array.from(tagSet).map((name, i) => ({
        id: i + 1,
        name,
        image: undefined,
        description: "",
      }));

      setRecipes(cards);
      setCategories(cats);
      setFeaturedRecipe(cards[0] || null);
      if (!cats.find((c) => c.name === selectedCategory)) setSelectedCategory("All");
    } catch (e) {
      console.log("Error loading recipes", e);
      setRecipes([]);
      setCategories([{ id: 1, name: "All" }]);
      setFeaturedRecipe(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecipes();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRecipes();
  }, [accessToken]);

  const filteredRecipes =
    selectedCategory === "All"
      ? recipes
      : recipes.filter((r) => r.category === selectedCategory);

  if (loading && !refreshing) return <LoadingSpinner message="Loading delicious recipes..." />;

  return (
    <View style={homeStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={homeStyles.scrollContent}
      >
       

       

        {/* CATEGORIES (desde tags + All) */}
        {categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />
        )}

        {/* GRID */}
        <View style={homeStyles.recipesSection}>
          <View style={homeStyles.sectionHeader}>
            <Text style={homeStyles.sectionTitle}>{selectedCategory}</Text>
          </View>

          {filteredRecipes.length > 0 ? (
            <FlatList
              data={filteredRecipes}
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
              columnWrapperStyle={homeStyles.row}
              contentContainerStyle={homeStyles.recipesGrid}
              scrollEnabled={false}
            />
          ) : (
            <View style={homeStyles.emptyState}>
              <Ionicons name="restaurant-outline" size={64} color={COLORS.textLight} />
              <Text style={homeStyles.emptyTitle}>No recipes found</Text>
              <Text style={homeStyles.emptyDescription}>Try a different category</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
