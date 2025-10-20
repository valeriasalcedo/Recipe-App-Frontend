import { storage } from "@/src/auth/storage";

export type FavoriteRecipe = {
  recipeId: number | string;
  title: string;
  image?: string;
  cookTime?: string;
  servings?: number;
};

const PREFIX = "favorites_";

// solo alfanum, . - _
const sanitizeId = (id: string) =>
  String(id || "anon").replace(/[^\w.-]/g, "_");

const favKey = (userId: string) => `${PREFIX}${sanitizeId(userId)}`;

async function readList(userId: string): Promise<FavoriteRecipe[]> {
  if (!userId) return [];
  try {
    const raw = await storage.get(favKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    // si algo raro pasa (JSON corrupto, etc.), reseteamos
    console.warn("favorites.readList error:", e);
    return [];
  }
}

async function writeList(userId: string, list: FavoriteRecipe[]) {
  if (!userId) return;
  try {
    await storage.set(favKey(userId), JSON.stringify(list));
  } catch (e) {
    console.warn("favorites.writeList error:", e);
  }
}

export async function getFavorites(userId: string): Promise<FavoriteRecipe[]> {
  return readList(userId);
}

export async function isFavorite(
  userId: string,
  recipeId: number | string
): Promise<boolean> {
  const list = await readList(userId);
  return list.some((f) => String(f.recipeId) === String(recipeId));
}

export async function addFavorite(
  userId: string,
  fav: FavoriteRecipe
): Promise<void> {
  if (!userId) return;
  const list = await readList(userId);
  if (!list.some((f) => String(f.recipeId) === String(fav.recipeId))) {
    list.push(fav);
    await writeList(userId, list);
  }
}

export async function removeFavorite(
  userId: string,
  recipeId: number | string
): Promise<void> {
  if (!userId) return;
  const list = await readList(userId);
  const next = list.filter((f) => String(f.recipeId) !== String(recipeId));
  await writeList(userId, next);
}
