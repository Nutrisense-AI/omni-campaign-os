import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

export interface TikTokScene {
  scene_text: string; // spoken voiceover
  visual_prompt: string; // image prompt for the scene
  on_screen_text: string; // caption overlay
}

export interface CampaignJSON {
  instagram_caption: string;
  facebook_ad_copy: string;
  tiktok_script: TikTokScene[];
  image_prompt: string;
  landing_page_html: string;
}

/**
 * Tool schema forces Claude to emit a fully structured object. The SDK returns
 * `tool_use.input` already parsed as an object, so newlines inside the HTML
 * string can never break JSON parsing (the failure mode we saw with free text).
 */
const CAMPAIGN_TOOL: Anthropic.Tool = {
  name: "deliver_campaign",
  description: "Return the complete generated marketing campaign.",
  input_schema: {
    type: "object",
    properties: {
      instagram_caption: {
        type: "string",
        description: "Punchy IG caption with 3-6 hashtags and 1-2 emojis.",
      },
      facebook_ad_copy: {
        type: "string",
        description: "Persuasive FB ad, 2-3 short paragraphs, clear CTA.",
      },
      tiktok_script: {
        type: "array",
        description: "EXACTLY 3 scenes for a ~15s vertical video.",
        items: {
          type: "object",
          properties: {
            scene_text: {
              type: "string",
              description: "Spoken voiceover, 1 energetic sentence, no hashtags/emojis.",
            },
            visual_prompt: {
              type: "string",
              description: "Vivid image-gen prompt for a vertical 9:16 scene.",
            },
            on_screen_text: {
              type: "string",
              description: "Short bold overlay caption, max ~6 words.",
            },
          },
          required: ["scene_text", "visual_prompt", "on_screen_text"],
        },
      },
      image_prompt: {
        type: "string",
        description: "Detailed prompt for a square 1:1 hero Instagram image.",
      },
      landing_page_html: {
        type: "string",
        description:
          "A COMPLETE, self-contained, responsive HTML document starting with <!doctype html>, with inline <style>, modern design, hero section, benefits, and a lead capture form. The form MUST use method=POST and contain fields named exactly name, email, phone. No external scripts.",
      },
    },
    required: [
      "instagram_caption",
      "facebook_ad_copy",
      "tiktok_script",
      "image_prompt",
      "landing_page_html",
    ],
  },
};

function normalize(parsed: CampaignJSON, prompt: string): CampaignJSON {
  if (!Array.isArray(parsed.tiktok_script)) parsed.tiktok_script = [];
  parsed.tiktok_script = parsed.tiktok_script.slice(0, 3);
  while (parsed.tiktok_script.length < 3) {
    parsed.tiktok_script.push({
      scene_text: parsed.instagram_caption?.slice(0, 80) || prompt,
      visual_prompt: parsed.image_prompt || prompt,
      on_screen_text: "Learn more",
    });
  }
  return parsed;
}

async function callTool(
  system: string,
  userContent: string
): Promise<CampaignJSON> {
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system,
    tools: [CAMPAIGN_TOOL],
    tool_choice: { type: "tool", name: "deliver_campaign" },
    messages: [{ role: "user", content: userContent }],
  });
  const toolBlock = msg.content.find((b) => b.type === "tool_use");
  if (!toolBlock || !("input" in toolBlock)) {
    throw new Error("Claude did not return structured tool output");
  }
  return toolBlock.input as CampaignJSON;
}

export async function generateCampaignJSON(prompt: string): Promise<CampaignJSON> {
  const system =
    "You are OmniCampaign's senior marketing creative director. Given a business prompt, produce a complete, cohesive marketing campaign and return it by calling the deliver_campaign tool. The landing page HTML must be beautiful, modern, mobile-responsive, and match the campaign topic.";
  const parsed = await callTool(
    system,
    `Create a full marketing campaign for: "${prompt}"`
  );
  return normalize(parsed, prompt);
}

/** Co-pilot: tweak an existing campaign JSON via natural language. */
export async function tweakCampaignJSON(
  current: CampaignJSON,
  instruction: string
): Promise<CampaignJSON> {
  const system =
    "You are OmniCampaign's creative director. You will receive an existing campaign and an edit instruction. Apply the instruction and return the FULL updated campaign via the deliver_campaign tool. Preserve fields not mentioned in the instruction.";
  const parsed = await callTool(
    system,
    `EXISTING CAMPAIGN JSON:\n${JSON.stringify(
      current
    )}\n\nEDIT INSTRUCTION: ${instruction}`
  );
  return normalize(parsed, instruction);
}

/** Draft a reply to an inbound customer message (used by inbox). */
export async function draftReply(
  senderName: string,
  messageText: string
): Promise<string> {
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 500,
    system:
      "You are a friendly, professional business support agent. Draft a concise, helpful reply to the customer message. Return only the reply text.",
    messages: [
      {
        role: "user",
        content: `Customer ${senderName} wrote: "${messageText}"\n\nDraft a reply.`,
      },
    ],
  });
  const textBlock = msg.content.find((b) => b.type === "text");
  return textBlock && "text" in textBlock ? textBlock.text.trim() : "";
}
