# Online Giving (Stripe) — what changed, and how to go live

This branch (`feature/payments`) adds Stripe-powered online giving: donors can give
by card (and optionally ACH bank transfer) on `/give`, admins manage the Stripe
connection from the admin dashboard, and donations/subscriptions get tracked
automatically. This guide covers what to do with **your real, live site** — not
a sandbox. It assumes you already have this site running in production on
Cloudflare Workers with its existing Supabase project.

## What's new

New files:
- `src/lib/stripe.server.ts` — thin Stripe REST client (checkout sessions, balance check, webhook signature verification)
- `src/lib/stripe-webhook.server.ts` — handles Stripe's webhook events, updates donation status
- `src/lib/secrets.server.ts` — encrypts/decrypts your Stripe keys before storing them in the database
- `src/lib/donations.functions.ts` — server functions backing the public `/give` checkout flow
- `src/lib/payment-settings.functions.ts` — server functions backing the admin Payment Settings screen
- `src/components/admin/PaymentSettingsPanel.tsx` — admin UI to connect Stripe (includes an in-app "How to connect Stripe" guide)
- `src/components/admin/GivingReportsPanel.tsx` — totals, chart and CSV export of successful gifts
- `supabase/migrations/20260812120000_integration_credentials.sql` — new table storing encrypted provider credentials (Stripe keys)
- `supabase/migrations/20260812120100_donations_stripe_columns.sql` — adds Stripe-related columns to `donations`

Changed files: `src/start.ts` (registers the webhook endpoint), `src/routes/admin.tsx` /
`AdminDashboard.tsx` (new admin tabs), `src/routes/give.tsx` (checkout flow + a
thank-you/cancelled banner after returning from Stripe).

No donor bank account or card details are ever stored by this app or in
Supabase — Stripe's hosted Checkout page handles all of that directly.

## 1. Apply the two new migrations to your live Supabase project

Only **two** files are new here (your production database already has
everything before `20260812...`):
- `supabase/migrations/20260812120000_integration_credentials.sql`
- `supabase/migrations/20260812120100_donations_stripe_columns.sql`

In your Supabase dashboard: **SQL Editor → New query**, paste the first file's
contents, run it, confirm no errors, then repeat for the second file.

## 2. Add two new secrets to your deployment

This feature needs two environment variables your site didn't need before.
Since this deploys to Cloudflare Workers, set them as Worker secrets (not in
`.env`, which isn't available at runtime):

```
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put ENCRYPTION_KEY
```

- `SUPABASE_SERVICE_ROLE_KEY`: from your Supabase project → **Settings → API
  Keys → Secret keys tab** (or "Legacy anon, service_role API keys" tab if
  your project still uses the old key format) — copy the secret/service_role
  key. Keep this private; it bypasses row-level security.
- `ENCRYPTION_KEY`: a random 32-byte base64 value, used to encrypt your Stripe
  keys before they're stored in the database. Generate one with:
  ```
  openssl rand -base64 32
  ```
  (or on Windows PowerShell: `[Convert]::ToBase64String((New-Object byte[] 32 | %{ [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($_); $_ }))`)

  **Back this value up somewhere safe (a password manager), outside of
  Cloudflare.** Wrangler secrets can't be read back once set. If you ever lose
  this key, the encrypted Stripe keys already in your database become
  unreadable — not catastrophic, but you'd need to re-enter your Stripe keys
  in Payment Settings afterward.

Your existing `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` (and their `VITE_`
build-time equivalents) should already be set up from before — no change
needed there.

## 3. Connect Stripe — start in test mode

1. Deploy this branch (`npm run build && wrangler deploy`, or your usual
   deploy process).
2. Log into (or create) your Stripe account at stripe.com. Make sure the
   toggle top-right says **Test mode**.
3. **Developers → API keys** — copy the **Publishable key** (`pk_test_...`)
   and **Secret key** (`sk_test_...`).
4. On your live site: **Admin → Payment Settings** — expand the "How to
   connect Stripe" guide if you want the in-app walkthrough. Set Mode to
   "Test", paste both keys, save, then click **Test connection**.
5. **Developers → Webhooks → Add endpoint** in Stripe. Endpoint URL:
   `https://your-real-domain.org/api/stripe-webhook`. Select these events:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `invoice.paid`. Save, then copy
   the **Signing secret** (`whsec_...`) it shows you.
6. Paste that signing secret into Payment Settings → **Webhook signing
   secret** → save.
7. Do a real test donation on `/give` with card `4242 4242 4242 4242` (any
   future expiry/CVC/ZIP). Confirm it shows as "succeeded" in the **Giving**
   and **Giving Reports** tabs, and that Stripe's Dashboard → Webhooks →
   your endpoint shows a successful (200) delivery.

## 4. Go live for real

1. **Activate your Stripe account for live payments**: Stripe Dashboard will
   prompt you to complete your business profile (legal business/church
   details, bank account for payouts, tax info). This can take Stripe a
   little time to review — start this well before you plan to announce
   online giving publicly.
2. Once activated, flip the dashboard toggle to **Live mode**. Go to
   **Developers → API keys** again — this shows a *different* set of keys
   (`pk_live_...` / `sk_live_...`).
3. **Create a second webhook endpoint for live mode** — Stripe treats test
   and live webhooks as entirely separate, with separate signing secrets,
   even at the same URL. Repeat step 3.5 above (same URL, same 4 events),
   and copy this new live signing secret.
4. In Payment Settings: switch **Mode** to "Live", paste the live
   publishable/secret keys and the new live webhook signing secret, save.
5. (Optional, recommended) Turn on Stripe's built-in receipt emails:
   **Stripe Dashboard → Settings → Business → Emails → "Email customers
   about successful payments."** Note this sends Stripe's own generic
   receipt — it does not include charitable tax-deduction wording (e.g. your
   EIN or "no goods or services were provided"); that would need a custom
   email built separately if you want proper tax receipts.
6. If you want to accept bank transfers (ACH): **Stripe Dashboard →
   Settings → Payment methods** → enable US bank account / Financial
   Connections, then check **"Enable ACH bank transfer"** in Payment
   Settings and save. No code changes are needed — it's already built in.
7. Make one small real donation yourself (e.g. $1) with a real card to
   confirm the full live flow works end-to-end, then refund it from the
   Stripe Dashboard if you like.
8. Check **"Online giving is live on the public site"** in Payment Settings
   and save — this is what actually makes the `/give` form usable by
   visitors instead of showing the "being prepared" message.

## Troubleshooting notes

- **Giving Reports shows totals of $0** even though donations exist: Giving
  Reports only counts donations with status `succeeded`. A donation stuck on
  `pending` (visible in the raw **Giving** tab) means Stripe's webhook isn't
  reaching your site — check Stripe Dashboard → Developers → Webhooks → your
  endpoint → recent deliveries for the error.
- **"Amount (cents)" in the raw Giving tab** is the raw database value (e.g.
  `2603` = $26.03) — money is stored in cents to avoid rounding errors;
  Giving Reports displays it correctly formatted as dollars.
- **Checkout says "you must set an account or business name"**: set one at
  `https://dashboard.stripe.com/account` — needed before Checkout will work,
  even in test mode.
