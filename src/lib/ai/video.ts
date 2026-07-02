const ENV = process.env.SHOTSTACK_ENV || "v1";
const BASE = `https://api.shotstack.io/edit/${ENV}`;
const KEY = process.env.SHOTSTACK_API_KEY!;

export interface VideoScene {
  imageUrl: string;
  audioUrl: string;
  onScreenText: string;
  duration: number; // seconds
}

/**
 * Build a Shotstack edit that stacks each scene's image (vertical 1080x1920),
 * an on-screen text caption, and the scene voiceover audio. Returns render id.
 */
type Clip = { asset: Record<string, unknown>; start: number; length: number; fit?: string; effect?: string; transition?: Record<string, string> };

export async function submitVideoRender(scenes: VideoScene[]): Promise<string> {
  let cursor = 0;
  const imageClips: Clip[] = [];
  const textClips: Clip[] = [];
  const audioClips: Clip[] = [];

  for (const s of scenes) {
    const start = cursor;
    const length = Math.max(2, s.duration || 5);
    imageClips.push({
      asset: { type: "image", src: s.imageUrl },
      start,
      length,
      fit: "cover",
      effect: "zoomIn",
      transition: { in: "fade", out: "fade" },
    });
    textClips.push({
      asset: {
        type: "title",
        text: s.onScreenText,
        style: "future",
        size: "large",
        position: "bottom",
      },
      start,
      length,
      transition: { in: "slideUp", out: "fade" },
    });
    audioClips.push({
      asset: { type: "audio", src: s.audioUrl },
      start,
      length,
    });
    cursor += length;
  }

  const edit = {
    timeline: {
      background: "#000000",
      tracks: [
        { clips: textClips }, // top track = captions
        { clips: imageClips }, // images below captions
        { clips: audioClips }, // audio
      ],
    },
    output: {
      format: "mp4",
      size: { width: 1080, height: 1920 }, // vertical 9:16
      fps: 25,
    },
  };

  const res = await fetch(`${BASE}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": KEY },
    body: JSON.stringify(edit),
  });
  type ShotStackResponse = { success: boolean; response: { id: string } };
  const json = (await res.json()) as ShotStackResponse;
  if (!res.ok || !json?.success) {
    throw new Error(`Shotstack submit failed: ${JSON.stringify(json).slice(0, 400)}`);
  }
  return json.response.id as string;
}

/** Poll a Shotstack render until done. Returns the final MP4 URL. */
export async function pollVideoRender(
  renderId: string,
  { timeoutMs = 180000, intervalMs = 5000 } = {}
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${BASE}/render/${renderId}`, {
      headers: { "x-api-key": KEY },
    });
    const json = await res.json();
    const status = json?.response?.status;
    if (status === "done") return json.response.url as string;
    if (status === "failed")
      throw new Error(`Shotstack render failed: ${json?.response?.error || "unknown"}`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Shotstack render timed out");
}
