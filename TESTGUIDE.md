# Testing the Stripe donations feature

This guide walks through testing the new online-giving feature (Stripe checkout,
admin payment settings, giving reports) on your own machine. Check items off as
you go — this file is meant to be picked back up later without losing your place.

Where things stand as of writing this guide: nothing below has been done yet.
You're helping a friend on this project and don't have access to the real
Supabase backend behind it, so this guide sets you up with your own free,
independent sandbox instead.

## Part 1 — Your own sandbox Supabase project

- [ ] Go to [supabase.com](https://supabase.com), sign up (free), click "New project."
      Pick any name/region, set a database password (save it — you likely won't
      need it directly, but keep it somewhere safe), wait ~2 minutes for it to provision.
- [ ] In the new project: **Settings → API** — copy three values:
  - Project URL
  - `anon` / `public` key (this is the "publishable" key)
  - `service_role` key (keep this one private — it bypasses all security rules)
- [ ] Also grab the **Project ID** (the short reference string, visible in the
      dashboard URL or Settings → General).
- [ ] Recreate the database schema: open **SQL Editor → New query** in your new
      project, then run each file in this repo's `supabase/migrations/` folder,
      **in filename order** (they're timestamp-named, so alphabetical order is
      correct — oldest first). There are 7 files total. You can paste them one at
      a time and run each, or paste all 7 concatenated into one query and run once.
- [ ] Update your local `.env` file with the new project's values, plus two new
      keys this feature needs:
  ```
  SUPABASE_URL=<your new project URL>
  SUPABASE_PUBLISHABLE_KEY=<your new anon/public key>
  SUPABASE_PROJECT_ID=<your new project ref>
  VITE_SUPABASE_URL=<same as SUPABASE_URL>
  VITE_SUPABASE_PUBLISHABLE_KEY=<same as SUPABASE_PUBLISHABLE_KEY>
  VITE_SUPABASE_PROJECT_ID=<same as SUPABASE_PROJECT_ID>
  SUPABASE_SERVICE_ROLE_KEY=<your new service_role key>
  ENCRYPTION_KEY=syhXMoyde/YnDhJb600XUXnQ/3IxigKP94e1IpggaO0=
  ```
  (The `ENCRYPTION_KEY` above was generated with `openssl rand -base64 32` — it's
  a throwaway value for local testing, fine to use as-is, or generate your own
  the same way.)

## Part 2 — Run the app

- [ ] `npm install` (only needed once, or after pulling new dependency changes)
- [ ] `npm run dev`
- [ ] Open `http://localhost:8080`

If a page loads without errors, your `.env` values are wired up correctly.

## Part 3 — Create your admin account

- [ ] Go to `http://localhost:8080/admin`
- [ ] Sign up with any email/password (this writes to your own sandbox database,
      not anyone else's — nothing real is at risk)
- [ ] Click "Claim administrator access" (only works for the very first account)
- [ ] Confirm you land in the admin dashboard and see a "Payment Settings" tab
      and a "Giving Reports" tab

## Part 4 — Connect Stripe (test mode)

- [ ] Create a free Stripe account at [stripe.com](https://stripe.com) — no business
      verification is needed for test mode
- [ ] In the Stripe dashboard (make sure it's in **test mode**, toggle top-right),
      copy the test **publishable key** (`pk_test_...`) and **secret key** (`sk_test_...`)
- [ ] In your app's admin dashboard → **Payment Settings**: paste both keys, leave
      mode as "test," check "Online giving is live," save
- [ ] Click "Test connection" to confirm the keys are valid
- [ ] Optional but recommended — test the webhook too:
  - Install the [Stripe CLI](https://docs.stripe.com/stripe-cli)
  - Run: `stripe listen --forward-to http://localhost:8080/api/stripe-webhook`
  - It prints a `whsec_...` value — paste that into the "Webhook signing secret"
    field in Payment Settings and save
  - Leave this command running in a terminal while you test donations below

## Part 5 — Make a test donation end to end

- [ ] Go to `http://localhost:8080/give`
- [ ] Fill out the form — pick an amount, a fund, one-time or recurring
- [ ] Use Stripe's test card: `4242 4242 4242 4242`, any future expiry date, any
      3-digit CVC, any ZIP
- [ ] Submit — you should be redirected to a Stripe-hosted Checkout page
- [ ] Complete the Checkout — you should land back on `/give?donation=success`
- [ ] Back in the admin dashboard: check the "Giving" tab (raw list) and the new
      "Giving Reports" tab (totals, chart, CSV export) for the donation you just made
- [ ] If the Stripe CLI was running, the donation's status should show
      "succeeded" (webhook fired); if not, it'll sit at "pending"/"processing"
- [ ] Try a recurring (weekly/monthly) donation too, to see a subscription created
- [ ] Try the CSV export button in Giving Reports

## Reference

- Local app URL: `http://localhost:8080`
- Webhook endpoint: `/api/stripe-webhook`
- New/changed files for this feature, if you want to review the code:
  - `supabase/migrations/20260812120000_integration_credentials.sql`
  - `supabase/migrations/20260812120100_donations_stripe_columns.sql`
  - `src/lib/secrets.server.ts`, `src/lib/stripe.server.ts`, `src/lib/stripe-webhook.server.ts`
  - `src/lib/donations.functions.ts`, `src/lib/payment-settings.functions.ts`
  - `src/components/admin/PaymentSettingsPanel.tsx`, `src/components/admin/GivingReportsPanel.tsx`
  - `src/start.ts` (webhook is wired here as a `requestMiddleware`)
  - `src/routes/give.tsx`, `src/routes/admin.tsx`, `src/components/admin/AdminDashboard.tsx`

## Already fixed, no action needed

An earlier version of this feature tried to intercept the webhook inside
`src/server.ts`, which silently didn't work (verified by building and curling a
running instance — it 404'd). It's now wired correctly as a `requestMiddleware`
in `src/start.ts` and has been tested working under both `npm run dev` and a full
production build. If you ever see the webhook return a 404 instead of processing,
that's a regression worth flagging — it shouldn't happen with the current code.
