import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { withRetry } from "@/lib/utils";
import { generateCampaignJSON, type CampaignJSON } from "@/lib/ai/claude";
import { generateImage } from "@/lib/ai/images";
import { generateVoiceover } from "@/lib/ai/voice";
import { submitVideoRender, pollVideoRender, type VideoScene } from "@/lib/ai/video";
import { uploadBufferToStorage } from "@/lib/storage";

async function setStep(campaignId: string, step: string) {
  const admin = createSupabaseAdminClient();
  await admin
    .from("campaigns")
    .update({ status: "processing", status_step: step })
    .eq("id", campaignId);
}

/**
 * The full async generation pipeline. Each external step is wrapped in a
 * single retry. If anything fails after the retry, the campaign is marked
 * "failed" and the user's credit is NOT decremented. Credit is only
 * decremented on 100% success.
 */
export async function runCampaignPipeline(
  campaignId: string,
  userId: string,
  prompt: string
) {
  const admin = createSupabaseAdminClient();
  try {
    // ---- Step 1: Claude — campaign JSON ----
    await setStep(campaignId, "Writing your campaign copy & script...");
    const campaign: CampaignJSON = await withRetry(
      () => generateCampaignJSON(prompt),
      "claude:campaign"
    );
    await admin
      .from("campaigns")
      .update({
        output_data: campaign,
        landing_page_html: campaign.landing_page_html,
      })
      .eq("id", campaignId);

    // ---- Step 2: gpt-image-1 — hero + 3 scene images ----
    await setStep(campaignId, "Designing your Instagram image...");
    const heroBuf = await withRetry(
      () => generateImage(campaign.image_prompt, "1024x1024"),
      "image:hero"
    );
    const heroUrl = await uploadBufferToStorage(
      `campaigns/${campaignId}/hero.png`,
      heroBuf,
      "image/png"
    );
    await admin.from("campaigns").update({ image_url: heroUrl }).eq("id", campaignId);

    await setStep(campaignId, "Illustrating your video scenes...");
    const sceneImageUrls: string[] = [];
    for (let i = 0; i < campaign.tiktok_script.length; i++) {
      const scene = campaign.tiktok_script[i];
      const buf = await withRetry(
        () => generateImage(scene.visual_prompt, "1024x1536"),
        `image:scene${i}`
      );
      const url = await uploadBufferToStorage(
        `campaigns/${campaignId}/scene-${i}.png`,
        buf,
        "image/png"
      );
      sceneImageUrls.push(url);
    }

    // ---- Step 3: ElevenLabs — 3 voiceovers ----
    await setStep(campaignId, "Recording AI voiceovers...");
    const sceneAudioUrls: string[] = [];
    const sceneDurations: number[] = [];
    for (let i = 0; i < campaign.tiktok_script.length; i++) {
      const scene = campaign.tiktok_script[i];
      const buf = await withRetry(
        () => generateVoiceover(scene.scene_text),
        `voice:scene${i}`
      );
      const url = await uploadBufferToStorage(
        `campaigns/${campaignId}/voice-${i}.mp3`,
        buf,
        "audio/mpeg"
      );
      sceneAudioUrls.push(url);
      // rough duration estimate: ~14 chars/sec speech, min 3s, max 6s
      const est = Math.min(6, Math.max(3, Math.round(scene.scene_text.length / 14)));
      sceneDurations.push(est);
    }

    // ---- Step 4: Shotstack — stitch into MP4 ----
    await setStep(campaignId, "Rendering your 15-second video...");
    const scenes: VideoScene[] = campaign.tiktok_script.map((s, i) => ({
      imageUrl: sceneImageUrls[i],
      audioUrl: sceneAudioUrls[i],
      onScreenText: s.on_screen_text,
      duration: sceneDurations[i],
    }));
    const renderId = await withRetry(
      () => submitVideoRender(scenes),
      "shotstack:submit"
    );
    const videoUrl = await pollVideoRender(renderId);

    // ---- Success: mark complete + decrement credit ----
    await admin
      .from("campaigns")
      .update({
        status: "complete",
        status_step: "Done!",
        video_url: videoUrl,
      })
      .eq("id", campaignId);

    // Decrement credit ONLY on full success (guard against going negative).
    const { data: u } = await admin
      .from("users")
      .select("credit_balance")
      .eq("id", userId)
      .single();
    const userData = u as { credit_balance: number } | null;
    const current = userData?.credit_balance ?? 0;
    if (current > 0) {
      await admin
        .from("users")
        .update({ credit_balance: current - 1 })
        .eq("id", userId);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[pipeline] campaign failed", campaignId, msg);
    await admin
      .from("campaigns")
      .update({
        status: "failed",
        status_step: "Generation failed",
        error_message: msg.slice(0, 500),
      })
      .eq("id", campaignId);
    // NOTE: credit intentionally NOT decremented -> automatic "refund".
  }
}
