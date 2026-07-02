# OmniCampaign — Your AI Marketing Team in a Box

Turn one sentence into a complete marketing campaign: Instagram captions, Facebook ads, TikTok videos with voiceovers, and live landing pages. Plus CRM, inbox, and email — all in one command center.

## Features

- **AI Campaign Generation**: Claude writes copy, gpt-image-1 designs images, ElevenLabs records voiceovers, Shotstack renders vertical MP4s
- **Multi-Asset Publishing**: Download image + caption for manual social posting; live landing pages with lead capture
- **CRM Kanban**: Drag-and-drop lead pipeline (New → Contacted → Won → Lost)
- **Unified Inbox**: Website chat + lead forms; social DMs coming soon
- **Email Marketing**: Broadcast to subscribers via Resend
- **Stripe Billing**: Credit-based subscription plans (Starter, Pro, Agency)
- **Automatic Refunds**: Failed generations don't consume credits

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, dnd-kit
- **Backend**: Next.js API routes, Supabase (PostgreSQL + Auth + Storage)
- **AI/Video**: Claude 3.5 Sonnet, gpt-image-1, ElevenLabs, Shotstack
- **Email**: Resend
- **Payments**: Stripe
- **Hosting**: Vercel (recommended)

## Prerequisites

1. **Supabase project** (database already migrated)
2. **API keys**: Anthropic, OpenAI, ElevenLabs, Shotstack, Resend, Stripe
3. **Vercel account** (for deployment + cron)

## Local Setup

```bash
git clone <repo>
cd omni-campaign-os
npm install
cp .env.example .env.local
# Edit .env.local with your API keys
npm run dev
```

## Deployment to Vercel

1. Push code to GitHub
2. Import repo to Vercel
3. Add all environment variables
4. Set up Stripe webhook: `https://your-url.vercel.app/api/stripe/webhook`

## Key Routes

- `/` — Public landing page
- `/login` — Sign up / sign in
- `/dashboard` — Overview + navigation
- `/dashboard/create` — Magic prompt generator
- `/dashboard/campaigns` — Campaign grid
- `/dashboard/campaigns/[id]` — Workspace (tabs, co-pilot, downloads)
- `/dashboard/crm` — Kanban board
- `/dashboard/inbox` — Messages + AI draft replies
- `/dashboard/email` — Broadcast composer
- `/dashboard/billing` — Plans + subscription
- `/p/[id]` — Public landing page (with lead form + chat widget)

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/generate-campaign` | POST | Start async generation |
| `/api/chat` | POST | AI co-pilot tweaks |
| `/api/leads` | GET/POST/PATCH/DELETE | CRM CRUD |
| `/api/messages` | GET/POST | Inbox + AI draft |
| `/api/subscribers` | GET/POST | Email list |
| `/api/email/broadcast` | POST | Send broadcast |
| `/api/stripe/checkout` | POST | Start subscription |
| `/api/stripe/portal` | POST | Manage subscription |
| `/api/stripe/webhook` | POST | Credit grants |
| `/api/widget` | POST | Lead form + chat ingestion |
| `/api/public-campaign` | GET | Fetch landing page HTML |
| `/api/cron/scheduled-posts` | GET | Vercel cron (every 15 min) |

## Database Schema

6 tables (auto-migrated):
- **users**: credit_balance, subscription_tier, stripe_customer_id
- **campaigns**: prompt, status, output_data (JSON), image_url, video_url, landing_page_html
- **leads**: name, email, phone, status, value
- **messages**: platform, sender_name, message_text, ai_draft_reply, status
- **subscribers**: email
- **scheduled_posts**: campaign_id, platform, scheduled_time, status

All tables have RLS policies for user isolation.

## Generation Pipeline

1. Claude (tool-use) → campaign JSON (copy, script, landing page HTML)
2. gpt-image-1 → hero image + 3 scene images
3. ElevenLabs → 3 voiceovers
4. Shotstack → vertical MP4
5. On success: credit decremented; on failure: auto-refund

## Billing

- **Free**: 2 campaigns/month
- **Starter**: 15 campaigns/month (A$59)
- **Pro**: 50 campaigns/month (A$199)
- **Agency**: 200 campaigns/month (A$499)

Stripe webhook grants credits on subscription + renewal; reverts to free on cancellation.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Out of credits" | Upgrade plan or wait for monthly reset |
| Landing page form not working | Check `/api/widget` is accessible; verify ownerId in script |
| Stripe webhook not firing | Confirm URL + secret in Stripe dashboard |
| Video rendering stuck | Shotstack takes 1–2 min; check Shotstack dashboard |

## V2 Roadmap

- Live Meta OAuth + auto-posting
- Social DM inbox
- Analytics dashboard
- Team collaboration
- Custom brand kit
- A/B testing

## License

MIT
