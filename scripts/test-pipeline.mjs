// Standalone end-to-end test of the generation chain using real keys.
// Run: node scripts/test-pipeline.mjs
import fs from "node:fs";

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const log = (...a) => console.log("[test]", ...a);

// ---- Step 1: Claude via tool-use (structured output) ----
log("Step 1: Claude campaign JSON (tool-use)...");
const tool = {
  name: "deliver_campaign",
  description: "Return the complete generated marketing campaign.",
  input_schema: {
    type: "object",
    properties: {
      instagram_caption: { type: "string" },
      facebook_ad_copy: { type: "string" },
      tiktok_script: {
        type: "array",
        items: {
          type: "object",
          properties: {
            scene_text: { type: "string" },
            visual_prompt: { type: "string" },
            on_screen_text: { type: "string" },
          },
          required: ["scene_text", "visual_prompt", "on_screen_text"],
        },
      },
      image_prompt: { type: "string" },
      landing_page_html: { type: "string" },
    },
    required: ["instagram_caption", "facebook_ad_copy", "tiktok_script", "image_prompt", "landing_page_html"],
  },
};
const cRes = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 8000,
    tools: [tool],
    tool_choice: { type: "tool", name: "deliver_campaign" },
    messages: [{ role: "user", content: "Create a full marketing campaign for: a cozy artisan coffee shop grand opening" }],
  }),
});
const cJson = await cRes.json();
if (!cRes.ok) { console.error("Claude error", JSON.stringify(cJson).slice(0, 500)); process.exit(1); }
const toolBlock = cJson.content.find((b) => b.type === "tool_use");
const campaign = toolBlock.input;
log("  ok. scenes:", campaign.tiktok_script.length, "| html len:", campaign.landing_page_html.length);

// ---- Step 2: gpt-image-1 (1 scene only to save cost/time) ----
log("Step 2: gpt-image-1 (one vertical scene image)...");
const iRes = await fetch("https://api.openai.com/v1/images/generations", {
  method: "POST",
  headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ model: env.OPENAI_IMAGE_MODEL, prompt: campaign.tiktok_script[0].visual_prompt, n: 1, size: "1024x1536" }),
});
const iJson = await iRes.json();
if (!iRes.ok) { console.error("Image error", JSON.stringify(iJson).slice(0, 500)); process.exit(1); }
const imgBuf = Buffer.from(iJson.data[0].b64_json, "base64");
log("  ok. image bytes:", imgBuf.length);

// ---- Upload image to Supabase storage ----
log("Uploading image to Supabase storage...");
const upRes = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/assets/test/scene0.png`, {
  method: "POST",
  headers: {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "image/png",
    "x-upsert": "true",
  },
  body: imgBuf,
});
log("  upload status:", upRes.status);
const imgUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/test/scene0.png`;
log("  public url:", imgUrl);

// ---- Step 3: ElevenLabs ----
log("Step 3: ElevenLabs voiceover...");
const vRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${env.ELEVENLABS_VOICE_ID}`, {
  method: "POST",
  headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
  body: JSON.stringify({ text: campaign.tiktok_script[0].scene_text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
});
if (!vRes.ok) { console.error("Voice error", vRes.status, (await vRes.text()).slice(0, 300)); process.exit(1); }
const audBuf = Buffer.from(await vRes.arrayBuffer());
log("  ok. audio bytes:", audBuf.length);
const upA = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/assets/test/voice0.mp3`, {
  method: "POST",
  headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "audio/mpeg", "x-upsert": "true" },
  body: audBuf,
});
log("  audio upload status:", upA.status);
const audUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/test/voice0.mp3`;

// ---- Step 4: Shotstack (single scene) ----
log("Step 4: Shotstack render...");
const edit = {
  timeline: {
    background: "#000000",
    tracks: [
      { clips: [{ asset: { type: "title", text: campaign.tiktok_script[0].on_screen_text, style: "future", size: "large", position: "bottom" }, start: 0, length: 4 }] },
      { clips: [{ asset: { type: "image", src: imgUrl }, start: 0, length: 4, fit: "cover", effect: "zoomIn" }] },
      { clips: [{ asset: { type: "audio", src: audUrl }, start: 0, length: 4 }] },
    ],
  },
  output: { format: "mp4", size: { width: 1080, height: 1920 }, fps: 25 },
};
const sRes = await fetch(`https://api.shotstack.io/edit/${env.SHOTSTACK_ENV}/render`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": env.SHOTSTACK_API_KEY },
  body: JSON.stringify(edit),
});
const sJson = await sRes.json();
if (!sRes.ok || !sJson.success) { console.error("Shotstack submit error", JSON.stringify(sJson).slice(0, 500)); process.exit(1); }
const renderId = sJson.response.id;
log("  render id:", renderId);

let url = null;
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  const pr = await fetch(`https://api.shotstack.io/edit/${env.SHOTSTACK_ENV}/render/${renderId}`, { headers: { "x-api-key": env.SHOTSTACK_API_KEY } });
  const pj = await pr.json();
  log("  poll:", pj.response.status);
  if (pj.response.status === "done") { url = pj.response.url; break; }
  if (pj.response.status === "failed") { console.error("render failed", pj.response.error); process.exit(1); }
}
log("FINAL VIDEO URL:", url);
if (!url) process.exit(1);
log("ALL STEPS PASSED");
