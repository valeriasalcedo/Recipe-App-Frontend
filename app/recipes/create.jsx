import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../src/auth/AuthContext";
import { RecipeAPI } from "../../services/recipeAPI";

const CreateRecipeScreen = () => {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const token = user?.accessToken || user?.token || null;

  // Campos obligatorios del DTO
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // ingredients: [{ name, quantity?, unit?, notes? }]
  const [ingredients, setIngredients] = useState([{ name: "", quantity: "", unit: "", notes: "" }]);

  // steps: string[]
  const [steps, setSteps] = useState([""]);

  // images: string[] (urls)
  const [images, setImages] = useState([""]);
  const [imageErrors, setImageErrors] = useState({}); // {index: true} si falla preview

  // tags: string[]
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);

  const [submitting, setSubmitting] = useState(false);

  /* ---------------- Ingredientes ---------------- */
  const addIngredient = () =>
    setIngredients((arr) => [...arr, { name: "", quantity: "", unit: "", notes: "" }]);

  const updateIngredient = (idx, field, value) =>
    setIngredients((arr) => arr.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));

  const removeIngredient = (idx) =>
    setIngredients((arr) => arr.filter((_, i) => i !== idx));

  /* ---------------- Pasos ---------------- */
  const addStep = () => setSteps((arr) => [...arr, ""]);
  const updateStep = (idx, value) => setSteps((arr) => arr.map((s, i) => (i === idx ? value : s)));
  const removeStep = (idx) => setSteps((arr) => arr.filter((_, i) => i !== idx));

  /* ---------------- Imágenes ---------------- */
  const addImage = () => setImages((arr) => [...arr, ""]);
  const updateImage = (idx, value) => {
    setImages((arr) => arr.map((u, i) => (i === idx ? value : u)));
    setImageErrors((err) => ({ ...err, [idx]: false }));
  };
  const removeImage = (idx) => {
    setImages((arr) => arr.filter((_, i) => i !== idx));
    setImageErrors((err) => {
      const copy = { ...err };
      delete copy[idx];
      return copy;
    });
  };

  /* ---------------- Tags ---------------- */
  const pushTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags((arr) => [...arr, t]);
    setTagInput("");
  };
  const removeTag = (t) => setTags((arr) => arr.filter((x) => x !== t));

  /* ---------------- Validación mínima ---------------- */
  const validate = () => {
    if (!title.trim()) return "El título es obligatorio.";
    const ingClean = ingredients.filter((i) => i.name?.trim());
    if (ingClean.length === 0) return "Agrega al menos 1 ingrediente con nombre.";
    const stepsClean = steps.map((s) => s.trim()).filter(Boolean);
    if (stepsClean.length === 0) return "Agrega al menos 1 paso.";
    // imágenes opcionales pero, si hay texto, debe ser URL (el backend valida zod, aquí ligero)
    // tags opcional
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) return Alert.alert("Validación", err);

    if (!accessToken){
        Alert.alert("Sesion requerida", "No estás autenticado.");
        return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      ingredients: ingredients
        .map((i) => ({
          name: i.name?.trim(),
          quantity: i.quantity?.trim() || undefined,
          unit: i.unit?.trim() || undefined,
          notes: i.notes?.trim() || undefined,
        }))
        .filter((i) => i.name),
      steps: steps.map((s) => s.trim()).filter(Boolean),
    };

    const imageList = images.map((u) => u.trim()).filter(Boolean);
    if (imageList.length) payload.images = imageList;

    if (tags.length) payload.tags = tags;

    setSubmitting(true);
    try {
      const recipe = await RecipeAPI.createRecipe(payload, accessToken);
      Alert.alert("Éxito", "Receta creada correctamente.");
      const newId = recipe?.id;
      if (newId) router.replace({ pathname: "/recipes/[id]", params: { id: String(newId) } });
      else router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", String(e?.message || "No se pudo crear la receta."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={{ marginBottom: 12, flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={circleBtn(COLORS.primary)}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: "700", marginLeft: 10 }}>
            Crear Receta
          </Text>
        </View>

        {/* Título & Descripción */}
        <Card>
          <Label icon="restaurant-outline" text="Título" />
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="Ej. Arepas rellenas"
          />
          <Label icon="document-text-outline" text="Descripción (opcional)" style={{ marginTop: 10 }} />
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Breve descripción de la receta"
            multiline
          />
        </Card>

        {/* Imágenes (múltiples URLs + preview) */}
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Label icon="image-outline" text="Imágenes (URLs)" />
            <Text style={{ color: COLORS.textLight }}>(opcional)</Text>
          </View>

          {images.map((url, idx) => (
            <View key={`img-${idx}`} style={{ marginBottom: 12 }}>
              <Input
                value={url}
                onChangeText={(t) => updateImage(idx, t)}
                placeholder="https://...jpg"
                autoCapitalize="none"
              />
              {!!url && (
                <View style={{ height: 160, borderRadius: 12, overflow: "hidden", marginTop: 8, backgroundColor: "#111" }}>
                  <Image
                    source={{ uri: url }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    onError={() => setImageErrors((e) => ({ ...e, [idx]: true }))}
                    onLoad={() => setImageErrors((e) => ({ ...e, [idx]: false }))}
                  />
                </View>
              )}
              {imageErrors[idx] && (
                <Text style={{ color: "#ffb3b3", marginTop: 6 }}>No se pudo cargar la imagen. Verifica la URL.</Text>
              )}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <TouchableOpacity onPress={() => removeImage(idx)} style={smallBtn("#2b1b1b")}>
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={smallBtnText}>Eliminar</Text>
                </TouchableOpacity>
                {idx === images.length - 1 && (
                  <TouchableOpacity onPress={addImage} style={ghostBtn}>
                    <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                    <Text style={{ color: COLORS.primary, marginLeft: 6 }}>Agregar otra</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          {images.length === 0 && (
            <TouchableOpacity onPress={addImage} style={ghostBtn}>
              <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
              <Text style={{ color: COLORS.primary, marginLeft: 6 }}>Agregar imagen</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Ingredientes */}
        <Card>
          <Label icon="list-outline" text="Ingredientes" />
          {ingredients.map((ing, idx) => (
            <View key={`ing-${idx}`} style={{ marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: "#121212", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
              <Text style={{ color: COLORS.textLight, marginBottom: 8 }}>Ingrediente #{idx + 1}</Text>
              <Input
                value={ing.name}
                onChangeText={(t) => updateIngredient(idx, "name", t)}
                placeholder="Nombre (obligatorio)"
              />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <Input
                  style={{ flex: 1 }}
                  value={ing.quantity}
                  onChangeText={(t) => updateIngredient(idx, "quantity", t)}
                  placeholder="Cantidad (ej. 200)"
                />
                <Input
                  style={{ flex: 1 }}
                  value={ing.unit}
                  onChangeText={(t) => updateIngredient(idx, "unit", t)}
                  placeholder="Unidad (g, ml, taza...)"
                />
              </View>
              <Input
                style={{ marginTop: 8 }}
                value={ing.notes}
                onChangeText={(t) => updateIngredient(idx, "notes", t)}
                placeholder="Notas (opcional)"
              />

              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <TouchableOpacity onPress={() => removeIngredient(idx)} style={smallBtn("#2b1b1b")}>
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={smallBtnText}>Eliminar</Text>
                </TouchableOpacity>
                {idx === ingredients.length - 1 && (
                  <TouchableOpacity onPress={addIngredient} style={ghostBtn}>
                    <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                    <Text style={{ color: COLORS.primary, marginLeft: 6 }}>Agregar ingrediente</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </Card>

        {/* Pasos */}
        <Card>
          <Label icon="book-outline" text="Pasos" />
          {steps.map((val, idx) => (
            <View key={`step-${idx}`} style={{ flexDirection: "row", gap: 8, alignItems: "center", marginTop: 10 }}>
              <View style={numBadge}><Text style={{ color: "#fff", fontWeight: "700" }}>{idx + 1}</Text></View>
              <Input
                style={{ flex: 1 }}
                value={val}
                onChangeText={(t) => updateStep(idx, t)}
                placeholder={`Descripción del paso #${idx + 1}`}
              />
              <TouchableOpacity onPress={() => removeStep(idx)} style={iconSquareBtn("#2b1b1b")}>
                <Ionicons name="trash-outline" size={16} color="#fff" />
              </TouchableOpacity>
              {idx === steps.length - 1 && (
                <TouchableOpacity onPress={addStep} style={iconSquareBtn("rgba(255,255,255,0.06)")}>
                  <Ionicons name="add-outline" size={18} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {steps.length === 0 && (
            <TouchableOpacity onPress={addStep} style={[ghostBtn, { marginTop: 10 }]}>
              <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
              <Text style={{ color: COLORS.primary, marginLeft: 6 }}>Agregar paso</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Tags */}
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Label icon="pricetags-outline" text="Tags" />
            <Text style={{ color: COLORS.textLight }}>(opcional)</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Input
              style={{ flex: 1 }}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Agrega una etiqueta y presiona +"
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={pushTag} style={iconSquareBtn("rgba(255,255,255,0.06)")}>
              <Ionicons name="add-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {tags.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {tags.map((t) => (
                <View key={t} style={chip}>
                  <Text style={{ color: "#fff" }}>{t}</Text>
                  <TouchableOpacity onPress={() => removeTag(t)} style={{ marginLeft: 6 }}>
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Submit */}
        <TouchableOpacity disabled={submitting} onPress={handleSubmit} style={{ marginTop: 10 }}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primary + "CC"]}
            style={submitBtn}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="save-outline" size={20} color="#fff" />
            )}
            <Text style={submitText}>{submitting ? "Creando..." : "Crear receta"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/* ---------- Sub-UI ---------- */
const Card = ({ children }) => (
  <View style={{
    borderRadius: 16,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 12,
    marginBottom: 16,
  }}>
    {children}
  </View>
);

const Label = ({ icon, text, style }) => (
  <View style={[{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }, style]}>
    <LinearGradient colors={["#2c2c2c", "#1a1a1a"]} style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={icon} size={16} color="#fff" />
    </LinearGradient>
    <Text style={{ color: COLORS.textLight }}>{text}</Text>
  </View>
);

const Input = ({ style, ...props }) => (
  <TextInput
    {...props}
    style={[{
      backgroundColor: "#121212",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
      color: "#fff",
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 12,
    }, style]}
    placeholderTextColor={COLORS.textMuted}
    autoCorrect={false}
  />
);

/* ---------- Styles pequeños ---------- */
const circleBtn = (bg) => ({
  width: 42, height: 42, borderRadius: 21,
  backgroundColor: bg, alignItems: "center", justifyContent: "center",
});

const iconSquareBtn = (bg) => ({
  width: 36, height: 36, borderRadius: 10,
  backgroundColor: bg, alignItems: "center", justifyContent: "center",
});

const smallBtn = (bg) => ({
  flexDirection: "row", alignItems: "center", gap: 6,
  paddingHorizontal: 10, paddingVertical: 8,
  borderRadius: 10, backgroundColor: bg,
});

const smallBtnText = { color: "#fff", fontSize: 12, fontWeight: "600" };

const ghostBtn = {
  alignSelf: "flex-start",
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.12)",
  flexDirection: "row",
  alignItems: "center",
};

const numBadge = {
  width: 24, height: 24, borderRadius: 12,
  backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
};

const chip = {
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 999,
  backgroundColor: "rgba(255,255,255,0.08)",
};

const submitBtn = {
  height: 54,
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  gap: 8,
};

const submitText = { color: "#fff", fontSize: 16, fontWeight: "700" };

export default CreateRecipeScreen;
