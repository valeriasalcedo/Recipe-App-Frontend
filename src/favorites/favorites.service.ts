import * as SecureStore from "expo-secure-store";

export type FavoriteRecipe = {
  recipeId: number | string;
  title: string;
  image?: string;
  cookTime?: string;
  servings?: number;
};

const key = (userId: string) => `favorites:${userId}`;

export async function getFavorites(userId: string): Promise<FavoriteRecipe[]> {
  const raw = await SecureStore.getItemAsync(key(userId));
  return raw ? JSON.parse(raw) : [];
}

export async function isFavorite(userId: string, recipeId: number | string): Promise<boolean> {
  const list = await getFavorites(userId);
  return list.some((f) => String(f.recipeId) === String(recipeId));
}

export async function addFavorite(userId: string, fav: FavoriteRecipe): Promise<void> {
  const list = await getFavorites(userId);
  if (!list.some((f) => String(f.recipeId) === String(fav.recipeId))) {
    list.push(fav);
    await SecureStore.setItemAsync(key(userId), JSON.stringify(list));
  }
}

export async function removeFavorite(userId: string, recipeId: number | string): Promise<void> {
  const list = await getFavorites(userId);
  const next = list.filter((f) => String(f.recipeId) !== String(recipeId));
  await SecureStore.setItemAsync(key(userId), JSON.stringify(next));
}
