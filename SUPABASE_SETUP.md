# Supabase Backend Setup Guide

## Required Secrets (Dashboard > Edge Functions > Secrets)

| Secret | Description | Required By |
|--------|-------------|-------------|
| `AI_API_KEY` | OpenAI-compatible API key (OpenAI, OpenRouter, etc.) | `interpret-dream`, `generate-seo`, `generate-content-suggestions`, `generate-internal-links` |
| `AI_API_URL` | API endpoint (default: `https://api.openai.com/v1/chat/completions`) | Same as above (optional) |
| `AI_MODEL` | Model name (default: `gpt-4o-mini`) | Same as above (optional) |
| `RESEND_API_KEY` | Resend API key for transactional emails | `send-newsletter`, `subscribe-newsletter` |
| `CRON_SECRET` | Secure random string for cron authentication | `publish-scheduled-posts`, `sitemap` |
| `SITE_URL` | Production domain (e.g., `https://ruya-tabirleri.com`) | `sitemap` |

## Edge Functions Overview

| Function | Auth | Purpose | Trigger |
|----------|------|---------|---------|
| `interpret-dream` | Public | AI dream interpretation | User request |
| `generate-seo` | Admin | Generate SEO meta tags | Admin panel |
| `generate-content-suggestions` | Admin | AI content suggestions | Admin panel |
| `generate-internal-links` | Admin | Auto-link related dreams | Admin panel |
| `send-newsletter` | Admin | Email subscribers | Admin panel |
| `subscribe-newsletter` | Public | Newsletter signup | Footer form |
| `sitemap` | Cron | Generate sitemap.xml | Scheduled cron |
| `publish-scheduled-posts` | Cron | Publish scheduled posts | Scheduled cron |

## Cron Job Setup

### Option 1: Supabase pg_cron (Recommended)

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule publish-scheduled-posts every 5 minutes
SELECT cron.schedule(
  'publish-scheduled-posts',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/publish-scheduled-posts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule sitemap generation daily at 2 AM
SELECT cron.schedule(
  'generate-sitemap',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sitemap',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Add to `supabase/config.toml` or set via SQL:
```sql
ALTER DATABASE postgres SET app.cron_secret = 'your-secure-random-string';
```

### Option 2: External Cron (cron-job.org, GitHub Actions, etc.)

**publish-scheduled-posts** (every 5 minutes):
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/publish-scheduled-posts \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**sitemap** (daily):
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/sitemap \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Option 3: Supabase Scheduled Functions (if available)

In Supabase Dashboard > Edge Functions > [function] > Settings > Schedule.

## Database Migrations

Run all migrations in order:
```bash
supabase db push
```

Or apply manually:
```bash
supabase migration up
```

## AI Provider Options

### OpenAI (Default)
```env
AI_API_KEY=sk-...
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4o-mini
```

### OpenRouter (Multiple models)
```env
AI_API_KEY=sk-or-...
AI_API_URL=https://openrouter.ai/api/v1/chat/completions
AI_MODEL=anthropic/claude-3.5-sonnet
```

### Local/Ollama
```env
AI_API_KEY=ollama
AI_API_URL=http://localhost:11434/v1/chat/completions
AI_MODEL=llama3.1
```

## Email Setup (Resend)

1. Create account at [resend.com](https://resend.com)
2. Verify domain or use `onboarding@resend.dev` for testing
3. Create API key
4. Add `RESEND_API_KEY` to secrets
5. Update `from` email in `send-newsletter` and `subscribe-newsletter` functions

## Deployment

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy interpret-dream

# View logs
supabase functions logs interpret-dream --tail
```

## Testing Functions Locally

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve --env-file .env.local

# Test interpret-dream
curl -X POST http://localhost:54321/functions/v1/interpret-dream \
  -H "Content-Type: application/json" \
  -d '{"dream": "Gece karanlık bir ormanda yürüyordum, uzakta bir ışık gördüm."}'
```

## Security Checklist

- [ ] All secrets configured in Dashboard (not in code)
- [ ] `CRON_SECRET` is a strong random string (32+ chars)
- [ ] `SITE_URL` matches production domain
- [ ] RLS policies enabled on all tables
- [ ] `verify_jwt` set correctly per function
- [ ] Rate limiting considered for public endpoints
- [ ] CORS headers configured properly