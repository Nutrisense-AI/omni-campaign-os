# OmniCampaign Deployment Guide

## Overview

This guide walks you through deploying OmniCampaign to Vercel with a Supabase backend. The app is fully built and ready — you just need to wire up the hosting, database, and webhooks.

## Prerequisites

✅ **Already done:**
- Supabase project created (`gdotbojvogyzyttdhbta`)
- Database schema migrated (6 tables with RLS)
- All API keys tested and working
- Next.js app fully built and type-checked

⚠️ **You need:**
- GitHub account (to host the repo)
- Vercel account (for hosting)
- Stripe account (for billing webhooks)

## Step 1: Push Code to GitHub

```bash
# Create a private GitHub repo named "omni-campaign-os"
# Then from your local machine:

cd /path/to/omni-campaign-os
git remote add origin https://github.com/YOUR_USERNAME/omni-campaign-os.git
git branch -M main
git push -u origin main
```

## Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..." → "Project"**
3. Select **"Import Git Repository"**
4. Paste your GitHub repo URL
5. Click **"Import"**
6. **Do NOT deploy yet** — you need to add environment variables first

## Step 3: Add Environment Variables in Vercel

In the Vercel project settings, go to **Settings → Environment Variables** and add each key-value pair:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://gdotbojvogyzyttdhbta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI & Video
ANTHROPIC_API_KEY=your_anthropic_key_here
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
OPENAI_API_KEY=your_openai_key_here
OPENAI_IMAGE_MODEL=gpt-image-1
ELEVENLABS_API_KEY=your_elevenlabs_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
SHOTSTACK_API_KEY=your_shotstack_key_here
SHOTSTACK_ENV=v1

# Email
RESEND_API_KEY=your_resend_key_here
RESEND_FROM=OmniCampaign <onboarding@resend.dev>

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PRICE_STARTER=your_price_id_here
STRIPE_PRICE_PRO=your_price_id_here
STRIPE_PRICE_AGENCY=your_price_id_here
STRIPE_WEBHOOK_SECRET=your_webhook_secret_here

# Site
NEXT_PUBLIC_SITE_URL=https://your-vercel-url.vercel.app
CRON_SECRET=your-random-secret-here
```

**Note:** For Stripe prices, log into your Stripe dashboard and find the price IDs for your 3 recurring products.

## Step 4: Deploy to Vercel

1. In Vercel dashboard, click **"Deploy"**
2. Wait for the build to complete (2–3 minutes)
3. Once deployed, you'll get a live URL like `https://omni-campaign-os-xxxxx.vercel.app`
4. Copy this URL — you'll need it next

## Step 5: Set Up Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers → Webhooks**
3. Click **"Add Endpoint"**
4. Paste your Vercel URL + `/api/stripe/webhook`:
   ```
   https://your-vercel-url.vercel.app/api/stripe/webhook
   ```
5. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
6. Click **"Add Endpoint"**
7. Copy the **Signing Secret** (starts with `whsec_`)
8. Go back to Vercel → Environment Variables
9. Add `STRIPE_WEBHOOK_SECRET=whsec_...`
10. Redeploy

## Step 6: Update Stripe Checkout URLs

In Stripe, for each of your 3 prices (Starter, Pro, Agency), you need to set the success/cancel URLs:

1. Go to **Products** in Stripe
2. For each product, edit the price
3. Set:
   - **Success URL**: `https://your-vercel-url.vercel.app/dashboard/billing`
   - **Cancel URL**: `https://your-vercel-url.vercel.app/dashboard/billing`

## Step 7: Test the Full Flow

1. Open your Vercel URL in a browser
2. Sign up with an email
3. Go to **Billing** and click **"Subscribe to Starter"**
4. Use Stripe test card: `4242 4242 4242 4242` (exp: any future date, CVC: any 3 digits)
5. Complete checkout
6. Verify you're redirected back to the dashboard
7. Check that your credit balance increased to 15

If this works, **you're live!** 🎉

## Step 8: Optional — Custom Domain

To use your own domain (e.g., `omnicampaign.com`):

1. In Vercel, go to **Settings → Domains**
2. Add your domain
3. Follow Vercel's DNS setup instructions
4. Update `NEXT_PUBLIC_SITE_URL` to your domain

## Monitoring & Troubleshooting

### Check Logs

In Vercel dashboard:
- **Deployments** tab: see build logs
- **Functions** tab: see API route logs
- **Logs** tab: real-time request logs

### Common Issues

| Issue | Solution |
|-------|----------|
| "Unauthorized" on signup | Check Supabase auth is enabled (Dashboard → Authentication → Providers → Email) |
| Stripe webhook not firing | Verify webhook URL is correct and signing secret matches |
| "Out of credits" immediately | Check Stripe webhook is working (Stripe → Webhooks → view recent attempts) |
| Landing page form not submitting | Check browser console for CORS errors; verify `/api/widget` is accessible |
| Video generation stuck | Shotstack can take 1–2 min; check Shotstack dashboard for render status |

### Useful Links

- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

## Scaling Tips

- **Database**: Supabase auto-scales; monitor usage in Supabase dashboard
- **API**: Vercel serverless functions scale automatically
- **Storage**: Supabase Storage has generous free tier; upgrade if needed
- **Video rendering**: Shotstack charges per render; monitor usage

## Security Checklist

- [ ] All `.env` variables are secret (not in GitHub)
- [ ] Supabase RLS policies are enforced (checked in migration)
- [ ] Stripe webhook signing is verified
- [ ] CORS is restricted to your domain
- [ ] Rate limiting is in place (optional: add Vercel rate limiting)

## Next Steps

1. **Test thoroughly** — run through the full user flow
2. **Monitor** — check logs daily for the first week
3. **Iterate** — collect user feedback and ship V2 features
4. **Scale** — upgrade Supabase/Stripe plans as you grow

---

**Questions?** Check the README.md or review the API route implementations in `src/app/api/`.

Good luck! 🚀
