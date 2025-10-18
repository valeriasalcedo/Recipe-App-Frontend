export function toCardVM(apiRecipe) {
  return {
    id: apiRecipe.id,
    title: apiRecipe.title,
    image: apiRecipe.images?.[0] || null,
    cookTime: "30 minutes",
    servings: "4",
    category: apiRecipe.tags?.[0] || "General",
    ownerName: apiRecipe.ownerName || "Unknown",
  };
}

export function toDetailVM(apiRecipe) {
  const ingredientsAsText = (apiRecipe.ingredients || []).map((i) => {
    const main = [i.quantity, i.unit, i.name].filter(Boolean).join(" ").trim();
    return i.notes ? `${main} (${i.notes})` : main;
  });

  return {
    title: apiRecipe.title,
    image: apiRecipe.images?.[0] || null,
    category: apiRecipe.tags?.[0] || "Recipe",
    area: null,
    cookTime: "30 minutes",
    servings: "4",
    youtubeUrl: null,
    ingredients: ingredientsAsText,
    instructions: apiRecipe.steps || [],
    ownerName: apiRecipe.ownerName || "Unknown",
  };
}
