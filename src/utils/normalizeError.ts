export type AnyErr =
  | string
  | Error
  | { message?: string; body?: any; response?: any; data?: any; [k: string]: any };

function pick(obj: any, paths: string[]): string | undefined {
  for (const p of paths) {
    const parts = p.split(".");
    let cur = obj;
    for (const part of parts) {
      if (cur && typeof cur === "object" && part in cur) cur = cur[part];
      else { cur = undefined; break; }
    }
    if (typeof cur === "string" && cur.trim()) return cur;
  }
  return undefined;
}

function tryParseJsonString(str: string): any {
  try { return JSON.parse(str); } catch { return null; }
}

export function normalizeError(err: unknown, fallback = "Algo salió mal."): string {
  if (typeof err === "string") {
    const maybe = tryParseJsonString(err);
    if (maybe && typeof maybe === "object") {
      const fromJson = pick(maybe, ["message", "error", "detail"]);
      if (fromJson) return fromJson;
    }
    const m = err.match(/"message"\s*:\s*"([^"]+)"/);
    if (m) return m[1];
    return err;
  }

  if (err instanceof Error) {
    return err.message || fallback;
  }

  if (err && typeof err === "object") {
    const candidate =
      pick(err, [
        "body.message",
        "response.data.message",
        "response.data.error",
        "data.message",
        "data.error",
        "message",
        "error",
        "detail",
      ]) ||
      (() => {
        const raw = pick(err, ["body", "response.data", "data"]);
        if (raw && typeof raw === "string") {
          const parsed = tryParseJsonString(raw);
          if (parsed && typeof parsed === "object") {
            return pick(parsed, ["message", "error", "detail"]);
          }
          const m = raw.match(/"message"\s*:\s*"([^"]+)"/);
          if (m) return m[1];
        }
        return undefined;
      })();

    if (candidate) return candidate;

    if (Array.isArray((err as any)?.errors)) {
      return (err as any).errors.map((e: any) => e?.message || String(e)).join("\n");
    }

    try {
      const s = JSON.stringify(err);
      const m = s.match(/"message"\s*:\s*"([^"]+)"/);
      if (m) return m[1];
    } catch {}
  }

  return fallback;
}
