// components/RecipeForm.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { COLORS } from "@/constants/colors";

export default function RecipeForm({ initialValues, onSubmit, submitting }) {
  // ------- estado local -------
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([""]); // string[]
  const [ingredients, setIngredients] = useState([
    { name: "", quantity: "", unit: "", notes: "" },
  ]);
  const [steps, setSteps] = useState([""]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [imageErrors, setImageErrors] = useState({});
  const [cookTime, setCookTime] = useState("1"); // guardamos como string, convertimos al enviar
  const [servings, setServings] = useState("1");

  useEffect(() => {
    if (!initialValues) return;
    setTitle(initialValues.title || "");
    setDescription(initialValues.description || "");
    setImages(initialValues.images?.length ? initialValues.images : [""]);
    setIngredients(
      initialValues.ingredients?.length
        ? initialValues.ingredients
        : [{ name: "", quantity: "", unit: "", notes: "" }]
    );
    setSteps(initialValues.steps?.length ? initialValues.steps : [""]);
    setTags(initialValues.tags || []);
    setCookTime(
      initialValues.cookTime != null ? String(initialValues.cookTime) : "1"
    );
    setServings(
      initialValues.servings != null ? String(initialValues.servings) : "1"
    );
  }, [initialValues]);

  // ------- helpers -------
  const validate = () => {
    if (!title.trim()) return "El título es obligatorio.";
    const ingClean = ingredients.filter((i) => i.name?.trim());
    if (ingClean.length === 0) return "Agrega al menos 1 ingrediente con nombre.";
    const stepsClean = steps.map((s) => s.trim()).filter(Boolean);
    if (stepsClean.length === 0) return "Agrega al menos 1 paso.";
    const ct = parseInt(cookTime || "0", 10);
    if (!Number.isFinite(ct) || ct < 1) return "Cook time debe ser al menos 1.";
    const sv = parseInt(servings || "0", 10);
    if (!Number.isFinite(sv) || sv < 1) return "Servings debe ser al menos 1.";
    return null;
  };

  const buildPayload = () => {
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
      cookTime: Math.max(1, parseInt(cookTime || "1", 10)),
      servings: Math.max(1, parseInt(servings || "1", 10)),
    };
    const imageList = images.map((u) => u.trim()).filter(Boolean);
    if (imageList.length) payload.images = imageList;
    if (tags.length) payload.tags = tags;
    return payload;
  };

  // ------- actions -------
  const handleSubmit = () => {
    const err = validate();
    if (err) return alert(err);
    onSubmit(buildPayload());
  };

  // images
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

  // ingredients
  const addIngredient = () =>
    setIngredients((arr) => [...arr, { name: "", quantity: "", unit: "", notes: "" }]);
  const updateIngredient = (idx, field, value) =>
    setIngredients((arr) => arr.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  const removeIngredient = (idx) =>
    setIngredients((arr) => arr.filter((_, i) => i !== idx));

  // steps
  const addStep = () => setSteps((arr) => [...arr, ""]);
  const updateStep = (idx, value) => setSteps((arr) => arr.map((s, i) => (i === idx ? value : s)));
  const removeStep = (idx) => setSteps((arr) => arr.filter((_, i) => i !== idx));

  // tags
  const pushTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags((arr) => [...arr, t]);
    setTagInput("");
  };
  const removeTag = (t) => setTags((arr) => arr.filter((x) => x !== t));

  const onlyDigits = (t) => t.replace(/[^0-9]/g, "");

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Título & Descripción */}
        <Card>
          <Label icon="restaurant-outline" text="Título" />
          <Input value={title} onChangeText={setTitle} placeholder="Ej. Arepas rellenas" />
          <Label icon="document-text-outline" text="Descripción (opcional)" style={{ marginTop: 10 }} />
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Breve descripción de la receta"
            multiline
          />
        </Card>

        {/* Tiempo y porciones */}
        <Card>
          <Label icon="hourglass-outline" text="Cook time (min)" />
          <Input
            keyboardType="numeric"
            inputMode="numeric"
            value={cookTime}
            onChangeText={(t) => setCookTime(onlyDigits(t))}
            placeholder="Minutos"
          />
          <Label icon="people-outline" text="Servings" style={{ marginTop: 10 }} />
          <Input
            keyboardType="numeric"
            inputMode="numeric"
            value={servings}
            onChangeText={(t) => setServings(onlyDigits(t))}
            placeholder="Número de porciones"
          />
        </Card>

        {/* Imágenes */}
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
                <View
                  style={{
                    height: 160,
                    borderRadius: 12,
                    overflow: "hidden",
                    marginTop: 8,
                    backgroundColor: "#111",
                  }}
                >
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
                <Text style={{ color: "#ffb3b3", marginTop: 6 }}>
                  No se pudo cargar la imagen. Verifica la URL.
                </Text>
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
            <View
              key={`ing-${idx}`}
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 12,
                backgroundColor: "#121212",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text style={{ color: COLORS.textLight, marginBottom: 8 }}>
                Ingrediente #{idx + 1}
              </Text>
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
                    <Text style={{ color: COLORS.primary, marginLeft: 6 }}>
                      Agregar ingrediente
                    </Text>
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
            <View
              key={`step-${idx}`}
              style={{ flexDirection: "row", gap: 8, alignItems: "center", marginTop: 10 }}
            >
              <View style={numBadge}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>{idx + 1}</Text>
              </View>
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
                <TouchableOpacity
                  onPress={addStep}
                  style={iconSquareBtn("rgba(255,255,255,0.06)")}
                >
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
          <LinearGradient colors={[COLORS.primary, COLORS.primary + "CC"]} style={submitBtn}>
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="save-outline" size={20} color="#fff" />
            )}
            <Text style={submitText}>{submitting ? "Guardando..." : "Guardar"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
/* ---------- THEME ---------- */
const UI = {
  surface: "#83a58dff",
  surface2: "#7fcaa1ff",
  border: "rgba(255,255,255,0.06)",
  borderFocus: "#5cff82ff",
  text: "#000000ff",
  textLight: "rgba(0, 0, 0, 0.8)",
  textMuted: "rgba(0, 0, 0, 0.55)",
  shadow: "rgba(211, 233, 225, 0.35)",
};

/* ---------- Card con borde degradado sutil ---------- */
const Card = ({ children, style }) => (
  <LinearGradient
    colors={["rgba(124,92,255,0.18)", "rgba(124,92,255,0.04)"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={[{
      padding: 1,
      borderRadius: 18,
      marginBottom: 18,
    }, style]}
  >
    <View
      style={{
        borderRadius: 17,
        backgroundColor: UI.surface,
        borderWidth: 1,
        borderColor: UI.border,
        padding: 14,
        shadowColor: UI.shadow,
        shadowOpacity: 0.5,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
      }}
    >
      {children}
    </View>
  </LinearGradient>
);

/* ---------- Label con icono pastilla ---------- */
const Label = ({ icon, text, style, right }) => (
  <View
    style={[
      { flexDirection: "row", alignItems: "center", marginBottom: 10 },
      style,
    ]}
  >
    <LinearGradient
      colors={["#254227ff", "#183022ff"]}
      style={{
        width: 28, height: 28, borderRadius: 14,
        alignItems: "center", justifyContent: "center",
        marginRight: 10,
      }}
    >
      <Ionicons name={icon} size={16} color="#fff" />
    </LinearGradient>
    <Text style={{ color: UI.textLight, fontWeight: "600", letterSpacing: 0.3 }}>
      {text}
    </Text>
    {!!right && <View style={{ marginLeft: "auto" }}>{right}</View>}
  </View>
);

/* ---------- Input con estado de focus ---------- */
const Input = ({ style, ...props }) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <TextInput
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      style={[
        {
          backgroundColor: UI.surface2,
          borderWidth: 1,
          borderColor: focused ? UI.borderFocus : UI.border,
          color: UI.text,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: 14,
          shadowColor: focused ? UI.borderFocus : "transparent",
          shadowOpacity: focused ? 0.35 : 0,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
        },
        style,
      ]}
      placeholderTextColor={UI.textMuted}
      autoCorrect={false}
    />
  );
};

/* ---------- Botones chicos y utilidades ---------- */
const iconSquareBtn = (bg = "rgba(255,255,255,0.06)") => ({
  width: 38, height: 38, borderRadius: 12,
  backgroundColor: bg, alignItems: "center", justifyContent: "center",
  borderWidth: 1, borderColor: UI.border,
});

const smallBtn = (bg = "#1b2b22ff") => ({
  flexDirection: "row", alignItems: "center", gap: 8,
  paddingHorizontal: 12, paddingVertical: 10,
  borderRadius: 12, backgroundColor: bg,
  borderWidth: 1, borderColor: UI.border,
});

const smallBtnText = { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 0.3 };

const ghostBtn = {
  alignSelf: "flex-start",
  paddingHorizontal: 12, paddingVertical: 10,
  borderRadius: 12,
  borderWidth: 1, borderColor: UI.border,
  backgroundColor: "rgba(255,255,255,0.04)",
  flexDirection: "row", alignItems: "center", gap: 8,
};

const numBadge = {
  width: 26, height: 26, borderRadius: 13,
  backgroundColor: "#1c5f2cff",
  alignItems: "center", justifyContent: "center",
  borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
};

const chip = {
  flexDirection: "row", alignItems: "center", gap: 6,
  paddingHorizontal: 12, paddingVertical: 7,
  borderRadius: 999,
  backgroundColor: "rgba(124,92,255,0.12)",
  borderWidth: 1, borderColor: "rgba(124,92,255,0.35)",
};

const submitBtn = {
  height: 56,
  borderRadius: 16,
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  gap: 10,
  shadowColor: UI.shadow,
  shadowOpacity: 0.45,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 5,
};

const submitText = { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.4 };
