# jobs-lifecycle — Edge Function

Daily cron that automates two lifecycle transitions for `job_listings`:

| Transition | Condition | Action |
|-----------|-----------|--------|
| **Auto-publish** | `status = 'draft'`, `published_at <= NOW()`, `is_archived = false` | Sets `status = 'published'`; emails the job creator |
| **Auto-expire** | `status = 'published'`, `expires_at <= NOW()`, `is_archived = false` | Sets `status = 'archived'`, `is_archived = true`, `archived_at = NOW()`; emails the job creator |

## Authentication

The function rejects any request that does not carry:

```
Authorization: Bearer <CRON_SECRET>
```

This must **not** be a Supabase user JWT. Use the same `CRON_SECRET` as `scrape-jobs`.

## Required Supabase secrets

Set these with `supabase secrets set --env-file .env.production` or via the Supabase Dashboard:

| Secret | Description |
|--------|-------------|
| `CRON_SECRET` | Shared secret compared against the `Authorization` header |
| `SUPABASE_SERVICE_ROLE_KEY` | Allows the function to read/write `job_listings` and resolve poster contacts |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin used in email links, e.g. `https://legaljobs.ro` |
| `RESEND_API_KEY` | Required by the `notifications` function for email delivery |
| `RESEND_FROM` | Verified sender, e.g. `LegalJobs <noreply@legaljobs.ro>` |

## Scheduling (Supabase Cron)

Paste the following SQL in the Supabase SQL Editor to create a daily trigger at
**05:00 UTC** (≈ 08:00 Europe/Bucharest in summer):

```sql
SELECT cron.schedule(
  'jobs-lifecycle-daily',        -- job name
  '0 5 * * *',                   -- every day at 05:00 UTC
  $$
  SELECT net.http_post(
    url     => 'https://<PROJECT_REF>.supabase.co/functions/v1/jobs-lifecycle',
    headers => jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || current_setting('app.cron_secret')
               ),
    body    => '{}'::jsonb
  );
  $$
);
```

Before running, set the Postgres runtime parameter that holds the secret:

```sql
ALTER DATABASE postgres SET "app.cron_secret" = '<your CRON_SECRET value>';
```

Or call the function with `curl` from an external scheduler (GitHub Actions, etc.):

```bash
curl -X POST \
  https://<PROJECT_REF>.supabase.co/functions/v1/jobs-lifecycle \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Deploy

```bash
npm run supabase:deploy:all
# or just this function:
npx supabase functions deploy jobs-lifecycle --project-ref <PROJECT_REF> --no-verify-jwt
```

## Response

```jsonc
// 200 — all steps succeeded
{ "published": 2, "expired": 1, "errors": [] }

// 207 — partial success (some notifications failed, DB writes succeeded)
{ "published": 1, "expired": 0, "errors": ["expire-notify:abc123: ..."] }
```
