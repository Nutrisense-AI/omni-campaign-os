import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET = "assets";

/** Upload a Buffer to the public `assets` bucket and return its public URL. */
export async function uploadBufferToStorage(
  path: string,
  data: Buffer,
  contentType: string
): Promise<string> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.storage.from(BUCKET).upload(path, data, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Storage upload failed (${path}): ${error.message}`);
  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  return pub.publicUrl;
}

/** Upload a base64 (no data: prefix) image and return public URL. */
export async function uploadBase64Image(
  path: string,
  b64: string,
  contentType = "image/png"
): Promise<string> {
  return uploadBufferToStorage(path, Buffer.from(b64, "base64"), contentType);
}

/** Download a remote URL and re-upload to our storage (used for durable copies). */
export async function mirrorRemoteToStorage(
  path: string,
  remoteUrl: string,
  contentType: string
): Promise<string> {
  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`Failed to fetch ${remoteUrl}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return uploadBufferToStorage(path, buf, contentType);
}
