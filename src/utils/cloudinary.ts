export function cloudinaryThumb(url: string, opts?: { w?: number; h?: number; crop?: "fill" | "fit" }) {
  if (!url.includes("/upload/")) return url;
  const w = opts?.w ?? 300;
  const h = opts?.h ?? 300;
  const c = opts?.crop ?? "fill";
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${w},h_${h},c_${c}/`);
}
