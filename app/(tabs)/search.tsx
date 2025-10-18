import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Platform } from "react-native";
import { useDebounce } from "@/hooks/useDebounce";
import { searchStyles } from "@/assets/styles/search.styles";
import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import RecipeCard from "@/components/RecipeCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/src/auth/AuthContext";
import { toCardVM } from "@/services/recipeMapper";

const API = Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";

export default function SearchScreen() {
  const { accessToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  async function fetchRecipes(q: string) {
    const url = new URL(`${API}/recipes`);
    url.searchParams.set("scope", "general"); // TODAS
    url.searchParams.set("limit", "100");
    if (q.trim()) url.searchParams.set("q", q.trim());

    const r = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json(); // {items,total,...}
    const cards = (data.items || []).map(toCardVM);

    // si no hay query, muestra “populares”: baraja y toma 12
    if (!q.trim()) {
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
      return cards.slice(0, 12);
    }
    return cards.slice(0, 50);
  }

  // carga inicial (populares)
  useEffect(() => {
    (async () => {
      try {
        const results = await fetchRecipes("");
        setRecipes(results);
      } catch (e) {
        console.error("Error loading initial data:", e);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [accessToken]);

  // búsqueda
  useEffect(() => {
    if (initialLoading) return;
    (async () => {
      setLoading(true);
      try {
        const results = await fetchRecipes(debouncedSearchQuery);
        setRecipes(results);
      } catch (e) {
        console.error("Error searching:", e);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [debouncedSearchQuery, initialLoading, accessToken]);

  if (initialLoading) return <LoadingSpinner message="Loading recipes..." />;

  return (
    <View style={searchStyles.container}>
      <View style={searchStyles.searchSection}>
        <View style={searchStyles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textLight} style={searchStyles.searchIcon} />
          <TextInput
            style={searchStyles.searchInput}
            placeholder="Search recipes, ingredients..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={searchStyles.clearButton}>
              <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={searchStyles.resultsSection}>
        <View style={searchStyles.resultsHeader}>
          <Text style={searchStyles.resultsTitle}>
            {searchQuery ? `Results for "${searchQuery}"` : "Popular Recipes"}
          </Text>
          <Text style={searchStyles.resultsCount}>{recipes.length} found</Text>
        </View>

        {loading ? (
          <View style={searchStyles.loadingContainer}>
            <LoadingSpinner message="Searching recipes..." size="small" />
          </View>
        ) : (
          <FlatList
            data={recipes}
            renderItem={({ item }) => <RecipeCard recipe={item} />}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            columnWrapperStyle={searchStyles.row}
            contentContainerStyle={searchStyles.recipesGrid}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<NoResultsFound />}
          />
        )}
      </View>
    </View>
  );
}

function NoResultsFound() {
  return (
    <View style={searchStyles.emptyState}>
      <Ionicons name="search-outline" size={64} color={COLORS.textLight} />
      <Text style={searchStyles.emptyTitle}>No recipes found</Text>
      <Text style={searchStyles.emptyDescription}>
        Try adjusting your search or try different keywords
      </Text>
    </View>
  );
}
