// services/recipeMapper.js

export function toCardVM(r) {
  return {
    id: r.id,
    title: r.title,
    image: (r.images && r.images[0]) || null,
    cookTime: r.cookTime != null ? `${r.cookTime} minutes` : "",
    servings: r.servings != null ? String(r.servings) : "",
    category: (r.tags && r.tags[0]) || "General",
    ownerName: r.ownerName || r.ownerEmail || "Unknown",
  };
}

export function toDetailVM(r) {
  const ingredientsAsText = (r.ingredients || []).map((i) => {
    const main = [i.quantity, i.unit, i.name].filter(Boolean).join(" ").trim();
    return i.notes ? `${main} (${i.notes})` : main;
  });

  return {
    id: r.id,
    owner: r.owner,                              // <- necesario para saber si es tuya
    ownerName: r.ownerName || r.ownerEmail || "Unknown",
    title: r.title,
    image: (r.images && r.images[0]) || null,
    category: (r.tags && r.tags[0]) || "Recipe",
    area: null,
    cookTime: r.cookTime != null ? `${r.cookTime} minutes` : "",
    servings: r.servings != null ? String(r.servings) : "",
    youtubeUrl: null,
    ingredients: ingredientsAsText,
    instructions: r.steps || [],
  };
}
