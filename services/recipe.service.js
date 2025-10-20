import { Platform } from "react-native";

const API_BASE =
  Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";

/**
 * Trae SOLO tus recetas (usa el token).
 */
export async function getMyRecipes({ accessToken, page = 1, limit = 100 } = {}) {
  const url = `${API_BASE}/recipes?scope=personal&page=${page}&limit=${limit}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,   // <- NECESARIO
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error fetching my recipes (${res.status}): ${text}`);
  }

  const data = await res.json(); // tu backend responde { page, limit, total, items: [...] }

  const items = Array.isArray(data?.items) ? data.items : [];
  return items.map((r) => ({
    id: r.id || r._id,
    title: r.title,
    description: r.description,
    image: r.images?.[0] ?? null,
    servings: r.servings,
    cookTime: r.cookTime,
    // añade lo que necesites
  }));
}
