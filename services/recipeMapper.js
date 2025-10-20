export function toCardVM(api) {
  return {
    id: String(api.id),
    title: api.title ?? "",
    image: api.images?.[0] ?? null,

    cookTime: Number.isFinite(api.cookTime) ? `${api.cookTime} minutes` : null,
    servings: Number.isFinite(api.servings) ? String(api.servings) : null,

    category: api.tags?.[0] ?? "General",

    owner: api.owner ? String(api.owner) : null,
    ownerName: api.ownerName ?? api.ownerEmail ?? "Unknown",

    groups: Array.isArray(api.groups) ? api.groups.map(String) : [],
  };
}

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

    youtubeUrl: null, 
    ingredients: ingredientsAsText,
    instructions: api.steps || [],

    owner: api.owner ? String(api.owner) : null,
    ownerName: api.ownerName ?? api.ownerEmail ?? "Unknown",

    groups: Array.isArray(api.groups) ? api.groups.map(String) : [],
  };
}
