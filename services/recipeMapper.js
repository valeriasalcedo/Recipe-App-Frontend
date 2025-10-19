// Mapea una receta del backend a lo que usan las cards del Home
export function toCardVM(api) {
  return {
    id: String(api.id),
    title: api.title ?? "",
    image: api.images?.[0] ?? null,

    // usa los valores reales si existen; si no, deja null (o un fallback de tu preferencia)
    cookTime: Number.isFinite(api.cookTime) ? `${api.cookTime} minutes` : null,
    servings: Number.isFinite(api.servings) ? String(api.servings) : null,

    category: api.tags?.[0] ?? "General",

    // meta de autor
    owner: api.owner ? String(api.owner) : null,
    ownerName: api.ownerName ?? api.ownerEmail ?? "Unknown",

    // importantísimo para filtrar por grupo
    groups: Array.isArray(api.groups) ? api.groups.map(String) : [],
  };
}

// Mapea para la vista de detalle
export function toDetailVM(api) {
  const ingredientsAsText = (api.ingredients || []).map((i) => {
    const main = [i.quantity, i.unit, i.name].filter(Boolean).join(" ").trim();
    return i.notes ? `${main} (${i.notes})` : main;
  });

  return {
    id: String(api.id),
    title: api.title ?? "",
    image: api.images?.[0] ?? null,
    category: api.tags?.[0] ?? "Recipe",

    cookTime: Number.isFinite(api.cookTime) ? `${api.cookTime} minutes` : null,
    servings: Number.isFinite(api.servings) ? String(api.servings) : null,

    youtubeUrl: null, // si más adelante lo agregas al modelo, cámbialo aquí
    ingredients: ingredientsAsText,
    instructions: api.steps || [],

    owner: api.owner ? String(api.owner) : null,
    ownerName: api.ownerName ?? api.ownerEmail ?? "Unknown",

    groups: Array.isArray(api.groups) ? api.groups.map(String) : [],
  };
}
