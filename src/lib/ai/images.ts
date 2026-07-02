import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

/**
 * Generate an image with gpt-image-1. Returns raw PNG bytes as a Buffer.
 * size: "1024x1024" (square IG) or "1024x1536" (vertical 9:16-ish for TikTok scenes).
 */
export async function generateImage(
  prompt: string,
  size: "1024x1024" | "1024x1536" | "1536x1024" = "1024x1024"
): Promise<Buffer> {
  const res = await openai.images.generate({
    model: IMAGE_MODEL,
    prompt,
    n: 1,
    size,
  });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error("gpt-image-1 returned no image data");
  return Buffer.from(b64, "base64");
}
