# OmniCampaign OS — Build Notes (internal)

## Project
- Path: /home/ubuntu/omni-campaign-os
- Stack: Next.js 14 (App Router, src dir, TS, Tailwind), Supabase, Stripe, Claude, OpenAI gpt-image-1, ElevenLabs, Shotstack, Resend
- GitHub repo name to create: `omni-campaign-os` (private)
- Deploy target: Vercel (USER handles deploy). We push code + provide instructions.

## V1 Scope decisions (confirmed by user)
- DROP all live Meta integration. No OAuth, no DM polling, no Meta code.
- Social "publish" = download image + caption for manual posting.
- Unified Inbox UI = show "Coming Soon" badge (but website chat widget still feeds messages table; keep inbox UI functional-ish but labeled coming soon per user — implement basic inbox reading website-widget messages, badge "Beta/Coming Soon" for social).
- CRM Kanban = YES, full (New/Contacted/Won/Lost), dnd-kit.
- Live: Claude text, OpenAI images, ElevenLabs voice, Shotstack video, Resend email. No mocks.

## Verified integrations (all working)
- Supabase URL: https://gdotbojvogyzyttdhbta.supabase.co  (project ref gdotbojvogyzyttdhbta)
  - anon JWT + service_role JWT in .env.local (legacy JWT keys).
  - Migration APPLIED successfully. All 6 tables exist (200 via REST). RLS enabled. handle_new_user trigger installed.
- Claude: model `claude-sonnet-4-5-20250929` (NOT 3.5 — user's key only has sonnet-4-5 etc.). Endpoint https://api.anthropic.com/v1/messages, header x-api-key, anthropic-version 2023-06-01.
- OpenAI images: model `gpt-image-1` (NO dall-e-3 access). Endpoint /v1/images/generations. Returns b64_json by default for gpt-image-1.
- ElevenLabs: works. Default voice George = JBFqnCBsd6RMkjVDRZzb. Endpoint /v1/text-to-speech/{voice_id}.
- Shotstack: PRODUCTION key = i7QGdO3i1qn4Gcm2dj9cbOK0LlRI4CO6PSVl6AoB (env v1, no watermark). STAGE key = XGJntGO1iZ6Wl2hkbgOCmToPeGwLLcknxV3ti2mH. Base https://api.shotstack.io/edit/{v1|stage}/render, header x-api-key. Poll GET /edit/{env}/render/{id}.
- Resend: re_i1yv5bcr_... From = onboarding@resend.dev (test). Endpoint /emails.
- Stripe: TEST key sk_test_51ToaGe... Prices (AUD, recurring):
  - Starter price_1Tob1XCdJupt8GShFWCeiNeS = 5900 AUD -> 15 credits
  - Pro price_1Tob2jCdJupt8GShSQfYhqAS = 19900 AUD -> 50 credits
  - Agency price_1Tob3dCdJupt8GShdOjFpHdr = 49900 AUD -> 200 credits

## Supabase login (used once for migration; captcha solved by user)
- email loukmanbah223@outlook.com (do not store password in repo)

## DB schema (tables)
- users(id uuid PK->auth.users, email, stripe_customer_id, credit_balance def 2, subscription_tier def 'free', meta_access_token, created_at)
- campaigns(id, user_id, prompt, status[pending|processing|complete|failed], status_step, output_data jsonb, image_url, video_url, landing_page_html, published_status def 'draft', error_message, created_at)
- messages(id, user_id, platform, sender_name, message_text, ai_draft_reply, status[pending|replied], created_at)
- leads(id, user_id, name, email, phone, status[new|contacted|won|lost], value numeric, created_at)
- subscribers(id, user_id, email, created_at)
- scheduled_posts(id, user_id, campaign_id, platform, scheduled_time, status[scheduled|posted|failed], created_at)

## Architecture plan
- Async generation: /api/generate-campaign creates a campaign row (status pending) and kicks off processing; client polls campaigns row every 3s. Because Vercel serverless has time limits, do generation in the SAME request but return campaign id immediately using waitUntil / fire-and-forget on a route with maxDuration, OR use a /api/process-campaign invoked internally. Plan: generate-campaign inserts row then triggers processing via internal fetch to /api/process-campaign (no await) and returns id. process-campaign has maxDuration=300 (Vercel Pro) — but user on hobby may be 60s. Mitigate: keep steps efficient; document maxDuration.
- Retry once per external step; on final fail set status=failed, do NOT decrement credit. Decrement credit only on full success.
- Storage: upload generated image + audio + video-derived assets. Shotstack returns hosted mp4 URL (use that). Images from gpt-image-1 are b64 -> upload to Supabase Storage bucket 'assets' (need to create bucket) to get public URL for Shotstack to fetch. ElevenLabs audio -> upload to storage too.
- Need Supabase Storage bucket 'assets' (public). Create via API with service role.

## TODO order
1. lib: supabase clients (browser/server/admin), env, ai providers, stripe
2. auth: middleware, callback route, login page
3. storage bucket creation script
4. /api/generate-campaign + /api/process-campaign (pipeline)
5. /api/chat (co-pilot)
6. /api/stripe/checkout, /api/stripe/portal, /api/stripe/webhook
7. /api/leads CRUD, /api/messages, /api/publish-email, widget.js, /api/widget ingest
8. /api/cron/scheduled-posts, /api/cron/... (vercel.json crons)
9. Frontend: landing, auth, dashboard shell + sidebar, campaigns, workspace tabs, inbox, crm, email list, settings
10. marketing/ folder assets
11. push to GitHub, deliver


## PROGRESS CHECKPOINT (frontend build)
DONE backend routes: generate-campaign, chat, stripe(checkout/portal/webhook), leads, messages, subscribers, email/broadcast, widget, scheduled-posts, cron/scheduled-posts, public-campaign.
DONE lib: supabase(server/client/admin), utils(TIER_CONFIG, priceIdToTier, formatCurrencyAUD, withRetry), storage, ai/claude(tool-use), ai/images(gpt-image-1), ai/voice(elevenlabs), ai/video(shotstack), stripe, pipeline.
DONE frontend: globals.css(dark theme tokens), tailwind.config(colors bg/elev/card/borderc/text/muted/brand/brand2/accent), components/ui.tsx(Button,Card,Badge), components/Sidebar.tsx, middleware.ts, auth/callback, layout.tsx(Inter), page.tsx(landing), login/page.tsx, dashboard/layout.tsx, dashboard/page.tsx(overview), dashboard/create/page.tsx.

E2E pipeline test PASSED -> real MP4 produced. Claude sometimes returns >3 scenes; normalize() clamps to 3.

## REMAINING FRONTEND TODO
- dashboard/campaigns/page.tsx : grid list of campaigns
- dashboard/campaigns/[id]/page.tsx : server load campaign, render Workspace client component
- components/Workspace.tsx : tabs (Instagram caption, Facebook ad, TikTok video player, Landing page iframe preview + public link + copy/download buttons) + AI co-pilot chat calling /api/chat + "download image+caption" (social publish = manual) + schedule button + Inbox "Coming Soon" note
- dashboard/crm/page.tsx : dnd-kit Kanban 4 columns (new/contacted/won/lost), add lead, drag updates via PATCH /api/leads
- dashboard/inbox/page.tsx : list messages (website), AI draft reply button, mark replied; social = Coming Soon badge
- dashboard/email/page.tsx : subscribers list + broadcast composer -> /api/email/broadcast
- dashboard/billing/page.tsx : show tier+credits, 3 plan buttons -> /api/stripe/checkout (redirect to Stripe), manage -> /api/stripe/portal
- p/[id]/page.tsx (PUBLIC landing page render): fetch /api/public-campaign, render html in iframe srcdoc, inject widget form posting to /api/widget with ownerId
- vercel.json : cron for /api/cron/scheduled-posts every 15 min + env note
- README.md : full deploy instructions (Vercel env vars, Stripe webhook setup, supabase already migrated)
- Then: npm run build to catch TS errors, fix, push to GitHub (private) via gh.

## Stripe price IDs (env)
STRIPE_PRICE_STARTER=price_1Tob1XCdJupt8GShFWCeiNeS
STRIPE_PRICE_PRO=price_1Tob2jCdJupt8GShSQfYhqAS
STRIPE_PRICE_AGENCY=price_1Tob3dCdJupt8GShdOjFpHdr
