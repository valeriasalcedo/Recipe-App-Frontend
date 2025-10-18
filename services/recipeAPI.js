// services/recipeAPI.js
const API_BASE = "http://localhost:4000";

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const RecipeAPI = {
  async createRecipe(payload, token) {
    // payload debe cumplir CreateRecipeDTO
    const res = await fetch(`${API_BASE}/recipes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // deja data como null si no es JSON
    }

    if (!res.ok) {
      // Errores comunes de tu backend
      if (res.status === 422 && data?.issues) {
        const issues = data.issues.map((i) => i.message || i.code).join("\n");
        throw new Error(`Validación fallida:\n${issues}`);
      }
      if (res.status === 409) {
        throw new Error(data?.error || "Ya existe una receta con ese título");
      }
      throw new Error(data?.error || `Error HTTP ${res.status}`);
    }

    // tu backend responde { recipe }
    return data?.recipe ?? data;
  },
};
