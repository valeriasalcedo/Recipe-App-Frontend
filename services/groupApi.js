import { Platform } from "react-native";
const API = Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";

export function withAuth(token) {
  const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  return {
    async listGroups({ q = "", page = 1, limit = 20 } = {}) {
      const url = new URL(`${API}/groups`);
      if (q) url.searchParams.set("q", q);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(limit));
      const r = await fetch(url.toString(), { headers: H });
      if (!r.ok) throw await r.json().catch(() => new Error(`HTTP ${r.status}`));
      return r.json(); // {page,limit,total,items}
    },
    async createGroup(payload) {
      const r = await fetch(`${API}/groups`, { method: "POST", headers: H, body: JSON.stringify(payload) });
      if (!r.ok) throw await r.json().catch(() => new Error(`HTTP ${r.status}`));
      return r.json(); // {group}
    },
    async getGroup(id) {
      const r = await fetch(`${API}/groups/${id}`, { headers: H });
      if (!r.ok) throw await r.json().catch(() => new Error(`HTTP ${r.status}`));
      return r.json(); // {group}
    },
    async updateGroup(id, patch) {
      const r = await fetch(`${API}/groups/${id}`, { method: "PATCH", headers: H, body: JSON.stringify(patch) });
      if (!r.ok) throw await r.json().catch(() => new Error(`HTTP ${r.status}`));
      return r.json(); // {group}
    },
    async deleteGroup(id) {
      const r = await fetch(`${API}/groups/${id}`, { method: "DELETE", headers: H });
      if (!r.ok) throw await r.json().catch(() => new Error(`HTTP ${r.status}`));
      return r.json(); // {ok:true}
    },
    async listRecipesInGroup(groupId, { scope = "general", q = "", page = 1, limit = 20 } = {}) {
      const url = new URL(`${API}/groups/${groupId}/recipes`);
      url.searchParams.set("scope", scope);
      if (q) url.searchParams.set("q", q);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(limit));
      const r = await fetch(url.toString(), { headers: H });
      if (!r.ok) throw await r.json().catch(() => new Error(`HTTP ${r.status}`));
      return r.json(); // {page,limit,total,items}
    },
    async addRecipeToGroup(groupId, recipeId) {
      const r = await fetch(`${API}/groups/${groupId}/recipes/${recipeId}`, { method: "POST", headers: H });
      if (!r.ok) throw await r.json().catch(() => new Error(`HTTP ${r.status}`));
      return r.json(); // {group,wasAdded}
    },
    async removeRecipeFromGroup(groupId, recipeId) {
      const r = await fetch(`${API}/groups/${groupId}/recipes/${recipeId}`, { method: "DELETE", headers: H });
      if (!r.ok) throw await r.json().catch(() => new Error(`HTTP ${r.status}`));
      return r.json(); // {group,wasRemoved}
    },
  };
}
