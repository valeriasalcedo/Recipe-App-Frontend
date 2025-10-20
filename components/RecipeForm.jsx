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
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/src/auth/AuthContext";

import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

const API_BASE =
  Platform.OS === "android" ? "https://backend-recipeapp-production.up.railway.app" : "http://localhost:4000";

async function getUploadSignature(API_URL, token) {
  const r = await fetch(`${API_URL}/api/upload/signature`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    let msg = "No se pudo obtener la firma";
    try {
      const j = await r.json();
      msg = j?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return r.json();
}

async function uploadToCloudinary(file, sig) {
  const form = new FormData();

  if (Platform.OS === "web") {
    const resp = await fetch(file.uri);
    const blob = await resp.blob();
    form.append("file", blob, file.name || "recipe.jpg");
  } else {
    form.append(
      "file",
      {
        uri: file.uri,
        type: file.type || "image/jpeg",
        name: file.name || "recipe.jpg",
      } 
    );
  }

  form.append("api_key", String(sig.apiKey));
  form.append("timestamp", String(sig.timestamp));
  if (sig.folder) form.append("folder", sig.folder);
  form.append("signature", sig.signature);
console.log("[cloudinary] sig", {
  cloudName: sig?.cloudName,
  hasSignature: !!sig?.signature,
  hasApiKey: !!sig?.apiKey,
  folder: sig?.folder,
  ts: sig?.timestamp,
});

  const resp = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    {
      method: "POST",
      body: form,
    }
  );

  if (!resp.ok) {
    let msg = "Falló la subida a Cloudinary";
    try {
      const j = await resp.json();
      msg = j?.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  const json = await resp.json();
  return { url: json.secure_url, publicId: json.public_id };
}



export default function RecipeForm({ initialValues, onSubmit, submitting }) {
  // -------- STATE CAMPOS --------
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [images, setImages] = useState([""]);
  const [imagePublicIds, setImagePublicIds] = useState([""]);

  const [ingredients, setIngredients] = useState([
    { name: "", quantity: "", unit: "", notes: "" },
  ]);
  const [steps, setSteps] = useState([""]);
  const [imageErrors, setImageErrors] = useState({});
  const [cookTime, setCookTime] = useState("1"); // string
  const [servings, setServings] = useState("1");

  // -------- GRUPOS --------
  const { accessToken } = useAuth();
  const [groups, setGroups] = useState([]); // [{id,name,...}]
  const [selectedGroupIds, setSelectedGroupIds] = useState(new Set());
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [gName, setGName] = useState("");
  const [gDesc, setGDesc] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Spinner por imagen
  const [uploadingIdx, setUploadingIdx] = useState(null);

  // -------- EFFECTS --------
  useEffect(() => {
    if (!initialValues) return;

    setTitle(initialValues.title || "");
    setDescription(initialValues.description || "");

    const imgs = initialValues.images?.length ? initialValues.images : [""];
    setImages(imgs);

    if (Array.isArray(initialValues.imagePublicIds) && initialValues.imagePublicIds.length) {
      setImagePublicIds(initialValues.imagePublicIds);
    } else {
      setImagePublicIds(Array(imgs.length).fill(""));
    }

    setIngredients(
      initialValues.ingredients?.length
        ? initialValues.ingredients
        : [{ name: "", quantity: "", unit: "", notes: "" }]
    );
    setSteps(initialValues.steps?.length ? initialValues.steps : [""]);
    setCookTime(
      initialValues.cookTime != null ? String(initialValues.cookTime) : "1"
    );
    setServings(
      initialValues.servings != null ? String(initialValues.servings) : "1"
    );

    if (Array.isArray(initialValues.groupIds) && initialValues.groupIds.length) {
      setSelectedGroupIds(new Set(initialValues.groupIds.map(String)));
    } else if (Array.isArray(initialValues.groups) && initialValues.groups.length) {
      setSelectedGroupIds(new Set(initialValues.groups.map(String)));
    } else {
      setSelectedGroupIds(new Set());
    }
  }, [initialValues]);

  useEffect(() => {
    fetchGroups();
  }, [accessToken]);

  // Mantener arrays images <> imagePublicIds sincronizados en largo
  useEffect(() => {
    setImagePublicIds((ids) => {
      const diff = images.length - ids.length;
      if (diff > 0) return [...ids, ...Array(diff).fill("")];
      if (diff < 0) return ids.slice(0, images.length);
      return ids;
    });
  }, [images]);

  // -------- HELPERS --------
  const onlyDigits = (t) => t.replace(/[^0-9]/g, "");

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
    };

    const stepsList = steps.map((s) => s.trim()).filter(Boolean);
    if (stepsList.length) payload.steps = stepsList;

    payload.cookTime = Math.max(1, parseInt(cookTime || "1", 10));
    payload.servings = Math.max(1, parseInt(servings || "1", 10));

    // imágenes
    const imageList = images.map((u) => u.trim()).filter(Boolean);
    if (imageList.length) payload.images = imageList;

    if (images.length) {
      const idsAligned = images.map((_, i) => imagePublicIds[i] || undefined);
      if (idsAligned.some((x) => !!x)) payload.imagePublicIds = idsAligned;
    }

    payload.groupIds = Array.from(selectedGroupIds);
    return payload;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) return alert(err);
    onSubmit(buildPayload());
  };

  // -------- IMÁGENES --------
  const addImage = () => {
    setImages((arr) => [...arr, ""]);
    setImagePublicIds((ids) => [...ids, ""]);
  };

  const updateImage = (idx, value) => {
    setImages((arr) => arr.map((u, i) => (i === idx ? value : u)));
    setImageErrors((err) => ({ ...err, [idx]: false }));
  };

  const removeImage = (idx) => {
    setImages((arr) => arr.filter((_, i) => i !== idx));
    setImagePublicIds((arr) => arr.filter((_, i) => i !== idx));
    setImageErrors((err) => {
      const copy = { ...err };
      delete copy[idx];
      return copy;
    });
  };

  const pickAndUploadAt = async (idx) => {
    try {
      console.log("[pickAndUploadAt] tap idx =", idx);

      if (!accessToken) {
        console.warn("[pickAndUploadAt] sin token");
        Alert.alert("Sesión requerida", "Inicia sesión para subir imágenes.");
        return;
      }

      if (Platform.OS !== "web") {
        let perm = await ImagePicker.getMediaLibraryPermissionsAsync();
        console.log("[pickAndUploadAt] permiso actual:", perm);
        if (!perm.granted) {
          perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          console.log("[pickAndUploadAt] permiso solicitado:", perm);
          if (!perm.granted) {
            Alert.alert("Permiso requerido", "Necesitamos acceso a la galería.");
            return;
          }
        }
      }

      console.log("[pickAndUploadAt] abriendo galería");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      console.log("[pickAndUploadAt] result:", result);
      if (!result || result.canceled) {
        Alert.alert("Sin selección", "No elegiste ninguna imagen.");
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        console.error("[pickAndUploadAt] asset inválido", result);
        Alert.alert("Error", "No se obtuvo la imagen seleccionada.");
        return;
      }

      setUploadingIdx(idx);

      let uploadUri = asset.uri;
      try {
        const manip = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1920 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        uploadUri = manip?.uri || asset.uri;
        console.log("[pickAndUploadAt] manip.uri:", uploadUri);
      } catch (err) {
        console.warn("[pickAndUploadAt] manipulate falló, uso original:", err);
      }

      // Firma + Subida
      console.log("[pickAndUploadAt] pidiendo firma…");
      const sig = await getUploadSignature(API_BASE, accessToken);
      console.log("[pickAndUploadAt] firma OK", { cloud: sig?.cloudName, folder: sig?.folder });

      console.log("[pickAndUploadAt] subiendo…");
      const { url, publicId } = await uploadToCloudinary(
        { uri: uploadUri, type: "image/jpeg", name: "recipe.jpg" },
        sig
      );
      console.log("[pickAndUploadAt] subida OK", { url, publicId });

      // Actualiza inputs
      updateImage(idx, url);
      setImagePublicIds((ids) => ids.map((v, i) => (i === idx ? publicId : v)));

      Alert.alert("Listo", "Imagen subida correctamente.");
    } catch (e) {
      console.error("[pickAndUploadAt] error:", e);
      Alert.alert("Error", String(e?.message || "No se pudo subir la imagen."));
    } finally {
      setUploadingIdx(null);
    }
  };

  // -------- INGREDIENTES --------
  const addIngredient = () =>
    setIngredients((arr) => [
      ...arr,
      { name: "", quantity: "", unit: "", notes: "" },
    ]);
  const updateIngredient = (idx, field, value) =>
    setIngredients((arr) =>
      arr.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    );
  const removeIngredient = (idx) =>
    setIngredients((arr) => arr.filter((_, i) => i !== idx));

  // -------- PASOS --------
  const addStep = () => setSteps((arr) => [...arr, ""]);
  const updateStep = (idx, value) =>
    setSteps((arr) => arr.map((s, i) => (i === idx ? value : s)));
  const removeStep = (idx) =>
    setSteps((arr) => arr.filter((_, i) => i !== idx));

  // -------- GRUPOS: API --------
  async function fetchGroups() {
    try {
      const r = await fetch(`${API_BASE}/groups?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setGroups(data.items || []);
    } catch (e) {
      console.log("No se pudieron cargar grupos", e);
      setGroups([]);
    }
  }

  const toggleGroup = (id) => {
    setSelectedGroupIds((s) => {
      const n = new Set(s);
      if (n.has(String(id))) n.delete(String(id));
      else n.add(String(id));
      return n;
    });
  };

  async function createGroupInline() {
    const name = (gName || "").trim();
    if (!name) {
      Alert.alert("Atención", "Escribe un nombre para el grupo.");
      return;
    }
    setCreatingGroup(true);
    try {
      const r = await fetch(`${API_BASE}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name,
          description: (gDesc || "").trim() || undefined,
        }),
      });
      const body = await r.json().catch(() => null);
      if (!r.ok) throw new Error(body?.error || body?.message || `HTTP ${r.status}`);

      await fetchGroups();
      if (body?.group?.id) {
        setSelectedGroupIds((s) => new Set([...s, String(body.group.id)]));
      }
      setGroupModalOpen(false);
      setGName("");
      setGDesc("");
    } catch (e) {
      Alert.alert("Error", String(e?.message || "No se pudo crear el grupo"));
    } finally {
      setCreatingGroup(false);
    }
  }

  // -------- UI --------
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
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
          <Label icon="hourglass-outline" text="Tiempo de preparación (min)" />
          <Input
            keyboardType="numeric"
            inputMode="numeric"
            value={cookTime}
            onChangeText={(t) => setCookTime(onlyDigits(t))}
            placeholder="Minutos"
          />
          <Label icon="people-outline" text="Porciones" style={{ marginTop: 10 }} />
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
            <Label icon="image-outline" text="Imágenes (URLs o subir)" />
            <Text style={{ color: COLORS.textLight }}>(opcional)</Text>
          </View>

          {images.map((url, idx) => (
            <View key={`img-${idx}`} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Input
                  style={{ flex: 1 }}
                  value={url}
                  onChangeText={(t) => updateImage(idx, t)}
                  placeholder="https://...jpg"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={async () => {
                    console.log("[UI] press subir idx", idx);
                    await pickAndUploadAt(idx);
                  }}
                  style={[smallBtn(), { minWidth: 140, justifyContent: "center" }]}
                  disabled={uploadingIdx === idx}
                >
                  {uploadingIdx === idx ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={smallBtnText}> Subiendo...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                      <Text style={smallBtnText}>Subir desde galería</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

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
                <Text style={{ color: "#b67373ff", marginTop: 6 }}>
                  No se pudo cargar la imagen. Verifica la URL.
                </Text>
              )}

              {imagePublicIds[idx] ? (
                <Text style={{ color: "#ddd", marginTop: 6, fontSize: 12 }}>
                  ID: {imagePublicIds[idx]}
                </Text>
              ) : null}

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
                padding: 20,
                borderRadius: 12,
                backgroundColor: "#ffe1e1ff",
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
              <View style={{ flexDirection: "row", gap: 4, marginTop: 8, }}>
                <Input
                  style={{ width: 150 }}
                  value={ing.quantity}
                  onChangeText={(t) => updateIngredient(idx, "quantity", t)}
                  placeholder="Cantidad (ej. 200)"
                />
                <Input
                  style={{ width: 155 }}
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
                  <Ionicons name="add-outline" size={18} color="#1b1b1bff" />
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

        {/* GRUPOS */}
        <Card>
          <Label
            icon="albums-outline"
            text="Grupos"
            right={
              <TouchableOpacity onPress={() => setGroupModalOpen(true)} style={ghostBtn}>
                <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                <Text style={{ color: COLORS.primary, marginLeft: 6 }}>Crear grupo</Text>
              </TouchableOpacity>
            }
          />
          {groups.length === 0 ? (
            <Text style={{ color: "#cdc3c3ff" }}>
              No tienes grupos. Crea uno con el botón “Crear grupo”.
            </Text>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {groups.map((g) => {
                const active = selectedGroupIds.has(String(g.id));
                return (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => toggleGroup(g.id)}
                    style={[
                      chip,
                      active && {
                        backgroundColor: "rgba(122, 78, 34, 0.25)",
                        borderColor: "#804715ff",
                      },
                    ]}
                  >
                    <Ionicons
                      name={active ? "checkmark-circle" : "ellipse-outline"}
                      size={14}
                      color="#865b5bea"
                    />
                    <Text style={{ color: "#000000c1" }}>{g.name}</Text>
                  </TouchableOpacity>
                );
              })}
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

      {/* MODAL CREAR GRUPO */}
      <Modal
        visible={groupModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setGroupModalOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(101, 76, 76, 0.6)",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 16,
              backgroundColor: "#ffffffff",
              padding: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
              Crear grupo
            </Text>

            <Text style={{ color: "#645e5eff", marginBottom: 6 }}>Nombre</Text>
            <Input value={gName} onChangeText={setGName} placeholder="Ej. Almuerzos" />

            <Text style={{ color: "#706969ff", marginTop: 12, marginBottom: 6 }}>
              Descripción (opcional)
            </Text>
            <Input
              value={gDesc}
              onChangeText={setGDesc}
              placeholder="Breve descripción"
              multiline
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
              <TouchableOpacity onPress={() => setGroupModalOpen(false)} style={ghostBtn}>
                <Text style={{ color: "#000000ff" }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={createGroupInline}
                disabled={creatingGroup}
                style={[smallBtn(COLORS.primary), { opacity: creatingGroup ? 0.6 : 1 }]}
              >
                <Ionicons name="save-outline" size={16} color="#faf5f5ff" />
                <Text style={smallBtnText}>{creatingGroup ? "Guardando..." : "Guardar"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* ---------- THEME ---------- */
const UI = {
  surface: "#faececd2",
  surface2: "#ffb8ab91",
  border: "rgba(43, 38, 38, 0.22)",
  borderFocus: "#c43838ff",
  text: "#000000ff",
  textLight: "rgba(0, 0, 0, 0.8)",
  textMuted: "rgba(0, 0, 0, 0.55)",
  shadow: "rgba(180, 73, 61, 0.35)",
};

const Card = ({ children, style }) => (
  <LinearGradient
    colors={["rgba(124,92,255,0.18)", "rgba(124,92,255,0.04)"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={[
      {
        padding: 1,
        borderRadius: 18,
        marginBottom: 18,
      },
      style,
    ]}
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

const Label = ({ icon, text, style, right }) => (
  <View
    style={[
      { flexDirection: "row", alignItems: "center", marginBottom: 10 },
      style,
    ]}
  >
    <LinearGradient
      colors={["#9c6538ff", "#302618ff"]}
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
      }}
    >
      <Ionicons name={icon} size={16} color="#ffffffff" />
    </LinearGradient>
    <Text style={{ color: UI.textLight, fontWeight: "600", letterSpacing: 0.3 }}>
      {text}
    </Text>
    {!!right && <View style={{ marginLeft: "auto" }}>{right}</View>}
  </View>
);

const Input = ({ style, ...props }) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <TextInput
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
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
  width: 38,
  height: 38,
  borderRadius: 12,
  backgroundColor: bg,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: UI.border,
});

const smallBtn = (bg = "#2b211bff") => ({
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 12,
  backgroundColor: bg,
  borderWidth: 1,
  borderColor: UI.border,
});

const smallBtnText = {
  color: "#ffffffff",
  fontSize: 12,
  fontWeight: "400",
  letterSpacing: 0.3,
};

const ghostBtn = {
  alignSelf: "flex-start",
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: UI.border,
  backgroundColor: "rgba(255,255,255,0.04)",
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
};

const numBadge = {
  width: 26,
  height: 26,
  borderRadius: 13,
  backgroundColor: "#ba7843ff",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.15)",
};

const chip = {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderRadius: 999,
  backgroundColor: "rgba(255, 195, 92, 0.12)",
  borderWidth: 1,
  borderColor: "rgba(255, 92, 100, 0.35)",
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

const submitText = {
  color: "#ffffffff",
  fontSize: 16,
  fontWeight: "800",
  letterSpacing: 0.4,
};
