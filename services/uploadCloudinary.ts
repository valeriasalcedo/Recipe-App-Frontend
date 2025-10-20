// src/services/uploadCloudinary.ts
export async function getUploadSignature(API_URL: string, token: string) {
  const r = await fetch(`${API_URL}/api/upload/signature`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("No se pudo obtener la firma");
  return r.json() as Promise<{
    timestamp: number;
    folder: string;
    signature: string;
    apiKey: string;
    cloudName: string;
  }>;
}

export async function uploadToCloudinary(
  file: { uri: string; type?: string; name?: string },
  sig: { timestamp: number; folder: string; signature: string; apiKey: string; cloudName: string }
) {
  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    type: file.type || "image/jpeg",
    name: file.name || "recipe.jpg",
  } as any);
  form.append("api_key", String(sig.apiKey));
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);

  const resp = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!resp.ok) throw new Error("Fallo la subida a Cloudinary");
  const json = await resp.json();
  // Devuelve secure_url y public_id
  return { url: json.secure_url as string, publicId: json.public_id as string };
}
