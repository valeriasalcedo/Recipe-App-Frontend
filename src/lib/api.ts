import * as SecureStore from "expo-secure-store";

const BASE =
  (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined) ||
  "https://backend-recipeapp-production.up.railway.app";

export const api = {
  baseURL: BASE.replace(/\/$/, ""),
  async error(res: Response) {
    try {
      const body = await res.json();
      const message =
        (body && (body.message || body.error || body.errors?.[0]?.message)) ||
        `HTTP ${res.status}`;
      const err: any = new Error(message);
      err.status = res.status;
      err.body = body;
      return err;
    } catch {
      const err: any = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      return err;
    }
  },
};

let isRefreshing = false;
let queued: Array<(t: string) => void> = [];

async function getAccess() {
  return SecureStore.getItemAsync("accessToken");
}
async function getRefresh() {
  return SecureStore.getItemAsync("refreshToken");
}
async function setAccess(t: string) {
  return SecureStore.setItemAsync("accessToken", t);
}
async function setRefresh(t: string) {
  return SecureStore.setItemAsync("refreshToken", t);
}

export async function withAuth(doRequest: () => Promise<Response>): Promise<Response> {
  const res = await addAuth(doRequest);
  if (res.status !== 401) return res;

  return await refreshAndReplay(doRequest);
}

async function addAuth(doRequest: () => Promise<Response>) {
  const token = await getAccess();
  const originalFetch = global.fetch;
  global.fetch = ((input: any, init?: any) => {
    const headers = new Headers(init?.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return originalFetch(input, { ...init, headers });
  }) as any;

  try {
    return await doRequest();
  } finally {
    // restaurar fetch
    global.fetch = originalFetch;
  }
}

async function refreshAndReplay(doRequest: () => Promise<Response>) {
  if (isRefreshing) {
    const newToken = await new Promise<string>((resolve) => queued.push(resolve));
    return await addAuth(async () => {
      const res2 = await doRequest();
      return res2;
    });
  }

  isRefreshing = true;
  try {
    const rt = await getRefresh();
    if (!rt) throw new Error("No refresh token");

    const res = await fetch(`${api.baseURL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) throw await api.error(res);

    const data = (await res.json()) as { accessToken: string; refreshToken?: string };
    if (!data.accessToken) throw new Error("Refresh sin accessToken");

    await setAccess(data.accessToken);
    if (data.refreshToken) await setRefresh(data.refreshToken);

    queued.forEach((cb) => cb(data.accessToken));
    queued = [];

    return await addAuth(doRequest);
  } finally {
    isRefreshing = false;
  }
}
