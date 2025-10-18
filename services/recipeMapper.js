// services/recipeMapper.js
// Adapta tu receta del backend al shape que tu UI ya espera

export function toDetailVM(apiRecipe) {
  const firstImage = apiRecipe.images?.[0] || null;

  // ingredients: [{name, quantity?, unit?, notes?}] -> ["200 g Harina (nota)"]
  const ingredientsAsText = (apiRecipe.ingredients || []).map((i) => {
    const qty = i.quantity ? `${i.quantity}` : "";
    const unit = i.unit ? `${i.unit}` : "";
    const main = [qty, unit, i.name].filter(Boolean).join(" ").trim();
    return i.notes ? `${main} (${i.notes})` : main;
  });

  return {
    // Cabecera que tu UI usa
    title: apiRecipe.title,
    image: firstImage,
    category: (apiRecipe.tags && apiRecipe.tags[0]) || "Recipe",
    area: null,               // tu modelo no tiene 'area' (dejamos nulo)
    cookTime: "—",            // si luego agregas campo, lo pintas aquí
    servings: "—",            // idem

    // Video: tu modelo no tiene; mantenemos null
    youtubeUrl: null,

    // Cuerpo que tu UI espera
    ingredients: ingredientsAsText,            // array<string>
    instructions: apiRecipe.steps || [],       // tu modelo steps[] -> instructions
  };
}

// versión compacta para listas (cards)
// services/recipeMapper.js
// Tu API -> UI actual

export function toCardVM(apiRecipe) {
  return {
    id: apiRecipe.id,
    title: apiRecipe.title,
    image: apiRecipe.images?.[0] || null,
    // placeholders hasta que agregues en el modelo:
    cookTime: "30 minutes",
    servings: "4",
    // usaremos el primer tag como "categoría"
    category: apiRecipe.tags?.[0] || "General",
    // opcional para subtítulos en cards
    description: apiRecipe.description || "",
  };
}

