import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import RecipeCard from "../../components/RecipeCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import CategoryFilter from "../../components/CategoryFilter";
import { homeStyles } from "../../assets/styles/home.styles";
import { COLORS } from "../../constants/colors";
import { useAuth } from "@/src/auth/AuthContext";
import { toCardVM } from "@/services/recipeMapper";

const API_BASE = Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";
const ALL = "__ALL__";

export default function HomeScreen() {
  const router = useRouter();
  const { accessToken, user } = useAuth();

  const [recipes, setRecipes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(ALL);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog grupo
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [gName, setGName] = useState("");
  const [gDesc, setGDesc] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);

  async function fetchRecipes() {
    const r = await fetch(`${API_BASE}/recipes?scope=general&limit=100`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!r.ok) throw new Error(`RECIPES HTTP ${r.status}`);
    const data = await r.json();
    const cards = (data.items || []).map((raw) => {
      const vm = toCardVM(raw);
      return { ...vm, groups: raw.groups || [] }; // clave para filtrar
    });
    setRecipes(cards);
  }

  async function fetchGroups() {
    const r = await fetch(`${API_BASE}/groups?page=1&limit=100`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!r.ok) throw new Error(`GROUPS HTTP ${r.status}`);
    const data = await r.json();
    setGroups(data.items || []);
  }

  async function loadAll() {
    setLoading(true);
    try {
      await Promise.all([fetchRecipes(), fetchGroups()]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [accessToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchRecipes(), fetchGroups()]);
    } finally {
      setRefreshing(false);
    }
  };

  // Filtrado por grupo
  const filteredRecipes = useMemo(() => {
    if (selectedGroupId === ALL) return recipes;
    return recipes.filter((r) => Array.isArray(r.groups) && r.groups.includes(String(selectedGroupId)));
  }, [recipes, selectedGroupId]);

  // ----- Crear/Editar/Eliminar Grupo -----
  function openCreateDialog() {
    setEditingGroup(null);
    setGName("");
    setGDesc("");
    setDialogVisible(true);
  }
  function openEditDialog(group) {
    setEditingGroup(group);
    setGName(group?.name || "");
    setGDesc(group?.description || "");
    setDialogVisible(true);
  }
  async function saveGroup() {
    const name = gName.trim();
    if (!name) return Alert.alert("Atención", "El nombre del grupo es requerido.");
    setSavingGroup(true);
    try {
      if (editingGroup) {
        const r = await fetch(`${API_BASE}/groups/${editingGroup.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ name, description: gDesc.trim() || undefined }),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      } else {
        const r = await fetch(`${API_BASE}/groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ name, description: gDesc.trim() || undefined }),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      }
      await fetchGroups();
      setDialogVisible(false);
    } catch (e) {
      Alert.alert("Error", String(e?.message || "No se pudo guardar el grupo"));
    } finally {
      setSavingGroup(false);
    }
  }


function confirmDelete(group) {
  Alert.alert(
    "Eliminar grupo",
    "Se eliminará el grupo. Las recetas NO se borran: solo quedarán fuera del grupo.",
    [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => deleteGroup(group) },
    ]
  );
}

async function deleteGroup(group) {
  try {
    const r = await fetch(`${API_BASE}/groups/${group.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    let body = null;
    try { body = await r.json(); } catch (_) {}

    if (!r.ok) {
      const msg = (body && (body.error || body.message)) || `HTTP ${r.status}`;
      throw new Error(msg);
    }

    if (selectedGroupId === group.id) setSelectedGroupId(ALL);
    await fetchGroups();
  } catch (e) {
    Alert.alert("Error", String(e?.message || "No se pudo eliminar el grupo"));
    console.error("[DELETE /groups/:id]", e);
  }
}



  // Grupo seleccionado (obj)
  const selectedGroup = selectedGroupId === ALL ? null : groups.find((g) => g.id === selectedGroupId);

  if (loading && !refreshing) return <LoadingSpinner message="Loading delicious recipes..." />;

  return (
    <View style={homeStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={homeStyles.scrollContent}
      >
        {/* Chips de grupos */}
        <CategoryFilter
          groups={groups}
          selectedId={selectedGroupId}
          onSelect={setSelectedGroupId}
          onCreate={openCreateDialog}   // solo el “+”
        />

        {/* Encabezado con nombre del grupo y acciones (si es tuyo) */}
        <View style={[homeStyles.sectionHeader, { alignItems: "center", gap: 8, flexDirection: "row" }]}>
          <Text style={homeStyles.sectionTitle}>
            {selectedGroup ? selectedGroup.name : "All"}
          </Text>

          {selectedGroup && selectedGroup.owner === user?.id && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={{
                  width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
                }}
                onPress={() => openEditDialog(selectedGroup)}
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center",
                  backgroundColor: "#7c1a1a",
                }}
                onPress={() =>{ setGroupToDelete(selectedGroup); setConfirmOpen(true);}}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Grid de recetas */}
        {filteredRecipes.length > 0 ? (
          <FlatList
            data={filteredRecipes}
            renderItem={({ item }) => (
              <RecipeCard
                recipe={{
                  id: item.id,
                  title: item.title,
                  image: item.image,
                  cookTime: item.cookTime,
                  servings: item.servings,
                }}
                onPress={() =>
                  router.push({ pathname: "/(recipes)/[id]", params: { id: String(item.id) } })
                }
              />
            )}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            columnWrapperStyle={homeStyles.row}
            contentContainerStyle={homeStyles.recipesGrid}
            scrollEnabled={false}
          />
        ) : (
          <View style={homeStyles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color={COLORS.textLight} />
            <Text style={homeStyles.emptyTitle}>No recipes found</Text>
            <Text style={homeStyles.emptyDescription}>
              {selectedGroup ? "Este grupo no tiene recetas aún." : "Prueba creando o importando recetas."}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal Crear / Editar Grupo */}
      <Modal visible={dialogVisible} transparent animationType="fade" onRequestClose={() => setDialogVisible(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <View style={{ width: "100%", maxWidth: 420, borderRadius: 16, backgroundColor: "#111", padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
              {editingGroup ? "Editar grupo" : "Crear grupo"}
            </Text>

            <Text style={{ color: "#aaa", marginBottom: 6 }}>Nombre</Text>
            <TextInput
              value={gName}
              onChangeText={setGName}
              placeholder="Ej. Almuerzos"
              placeholderTextColor={COLORS.textMuted}
              style={{ backgroundColor: "#151515", color: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", paddingHorizontal: 12, paddingVertical: 12 }}
            />

            <Text style={{ color: "#aaa", marginTop: 12, marginBottom: 6 }}>Descripción (opcional)</Text>
            <TextInput
              value={gDesc}
              onChangeText={setGDesc}
              placeholder="Breve descripción"
              placeholderTextColor={COLORS.textMuted}
              multiline
              style={{ backgroundColor: "#151515", color: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", paddingHorizontal: 12, paddingVertical: 12, minHeight: 84 }}
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                onPress={() => setDialogVisible(false)}
                style={{ paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}
                disabled={savingGroup}
              >
                <Text style={{ color: "#fff" }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={saveGroup}
                disabled={savingGroup}
                style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.primary, flexDirection: "row", alignItems: "center", gap: 6, opacity: savingGroup ? 0.6 : 1 }}
              >
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700" }}>{savingGroup ? "Guardando..." : "Guardar"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal Confirmar eliminación de grupo */}
<Modal
  visible={confirmOpen}
  transparent
  animationType="fade"
  onRequestClose={() => setConfirmOpen(false)}
>
  <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.6)", alignItems:"center", justifyContent:"center", padding:16 }}>
    <View style={{ width:"100%", maxWidth:420, borderRadius:16, backgroundColor:"#111", padding:16, borderWidth:1, borderColor:"rgba(255,255,255,0.08)" }}>
      <Text style={{ color:"#fff", fontSize:18, fontWeight:"700", marginBottom:8 }}>
        Eliminar grupo
      </Text>
      <Text style={{ color:"#ddd", lineHeight:20 }}>
        Se eliminará el grupo <Text style={{ fontWeight:"700" }}>{groupToDelete?.name}</Text>.
        {"\n"}Las recetas NO se borran: solo quedarán fuera del grupo.
      </Text>

      <View style={{ flexDirection:"row", justifyContent:"flex-end", gap:10, marginTop:16 }}>
        <TouchableOpacity
          onPress={() => setConfirmOpen(false)}
          style={{ paddingHorizontal:14, paddingVertical:12, borderRadius:10, borderWidth:1, borderColor:"rgba(255,255,255,0.12)" }}
        >
          <Text style={{ color:"#fff" }}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            if (!groupToDelete) return;
            // opcional: disabled con estado si quieres
            await deleteGroup(groupToDelete);
            setConfirmOpen(false);
            setGroupToDelete(null);
          }}
          style={{ paddingHorizontal:16, paddingVertical:12, borderRadius:10, backgroundColor:"#b00020", flexDirection:"row", alignItems:"center", gap:6 }}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={{ color:"#fff", fontWeight:"700" }}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
    </View>
  );
}
