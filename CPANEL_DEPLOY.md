# Deploying to cPanel shared hosting — what we did, and why

This app was originally built to run on **Cloudflare Workers only** (see
`wrangler.jsonc`, `@cloudflare/vite-plugin` in `vite.config.ts`, and the
hand-written `fetch`-based Stripe client in `src/lib/stripe.server.ts`, which
exists specifically to avoid Node-only APIs the Workers runtime doesn't have).
cPanel shared hosting can't run Cloudflare Workers at all — there's no
"install the Workers runtime" option on shared hosting.

What made this possible anyway: the build tool this project uses
(`@lovable.dev/vite-tanstack-config`, wrapping Nitro) supports swapping its
build target via a documented option, and the app's own server code only
relies on standard Web APIs (`fetch`, `crypto.subtle`) that Node 18+ provides
natively. So instead of one Cloudflare-only build, this project now has **two
build targets**: the existing Cloudflare one (unchanged, still used if you
deploy there) and a new Node one for cPanel. Nothing about the Cloudflare
deploy path changed.

This guide covers the cPanel-specific side end-to-end: what changed in the
repo, how to build and upload it, how to configure it in cPanel, how to
verify it's actually working, and how to move from a test subdomain to the
real production domain. For the Stripe business/live-account side (activating
live payments, ACH, receipts), see **`PAYMENTS_SETUP.md`** — this doc only
covers hosting-specific steps and cross-references that one where relevant.

## What changed in the repo for this to work

- **`vite.config.cpanel.ts`** (new file) — same app, different Nitro preset:
  `node-server` instead of the default `cloudflare-module`, and no
  `@cloudflare/vite-plugin` (that plugin is Workers-specific and irrelevant
  outside Workers). `node-server` is Nitro's standard preset for producing a
  self-contained Node HTTP server that listens on `process.env.PORT` — which
  is exactly what cPanel's Passenger-based "Setup Node.js App" expects.
- **`package.json`** — two new scripts:
  - `build:cpanel` — builds using the config above, output goes to `.output/`
  - `preview:cpanel` — builds, then runs the result locally
    (`node .output/server/index.mjs`) so you can smoke-test a build **before**
    uploading it anywhere. Use this every time before you upload — it catches
    problems in seconds instead of after a slow upload/restart cycle.

No application code changed. `stripe.server.ts`, `secrets.server.ts`, the
Supabase clients, and the webhook-interception middleware in `src/start.ts`
all run unmodified under the Node build — they only ever used standard
`fetch`/`crypto.subtle`/`process.env`, none of which are Cloudflare-specific.

## 1. Build and package

```
npm run build:cpanel
```

This produces `.output/` containing `server/` (the app) and `public/` (static
assets). It's **fully self-contained** — `.output/server/node_modules`
already has everything the server needs bundled in. No `npm install` is
required on the server afterward.

Zip the **contents** of `.output/` (so `server/`, `public/`, `nitro.json` sit
at the top level of the zip — not nested inside an extra `.output` folder,
which is a common extraction mistake).

## 2. Upload

cPanel → **File Manager** → navigate into the target domain/subdomain's
folder → Upload the zip → Extract.

## 3. Create the Node.js App

cPanel → **Setup Node.js App** → **Create Application**:

| Field | Value | Why |
|---|---|---|
| Node.js version | Highest available (we used **24.19.0**) | Must be **18 or newer**. The app's server code uses global `fetch` and `crypto.subtle`, which don't exist before Node 18, and modern JS syntax (optional chaining `?.`, etc.) in the bundled dependencies isn't parseable by anything much older. **This is not optional** — see Troubleshooting below for what happens on an old version. |
| Application mode | Production | |
| Application root | the folder you extracted into | |
| Application URL | the domain/subdomain for this app | |
| Application startup file | `server/index.mjs` | This is Nitro's `node-server` preset's actual entry point — confirmed by `.output/nitro.json`'s `serverEntry` field after every build. |

## 4. Set environment variables

This is the cPanel equivalent of `wrangler secret put` on the Cloudflare
side — same four secrets, same values, just entered through the cPanel UI's
"Environment Variables" section on the app's page instead:

```
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
ENCRYPTION_KEY
```

Where these come from (same source regardless of hosting target):
- `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` —
  Supabase dashboard → your project → **Settings → API**
- `ENCRYPTION_KEY` — a random 32-byte base64 value (see `PAYMENTS_SETUP.md`
  for how to generate one). **This is the important one to get right when
  adding a second deployment target (like this cPanel one) alongside an
  existing Cloudflare deployment**, because both point at the *same* Supabase
  database, and Stripe keys saved through `/admin` are encrypted with
  whichever `ENCRYPTION_KEY` the environment that saved them was using. If
  cPanel uses a different `ENCRYPTION_KEY` than Cloudflare, whichever
  environment didn't save the keys won't be able to decrypt them (shows up as
  the "Test connection" button failing on that environment, not a clear
  mismatched-key error). **Use the identical value everywhere.**

Your local `.env` file already has all four values filled in (from whoever
set this project up originally) — copy them from there rather than
regenerating anything, to avoid exactly the mismatch above.

Click **Restart** after saving.

## 5. Force HTTPS

The domain gets a valid Let's Encrypt certificate automatically (AutoSSL),
but plain `http://` requests aren't redirected to `https://` by default.
Fix: cPanel → **Domains** (or **SSL/TLS Status**) → toggle **"Force HTTPS
Redirect"** for the domain. This works at the Apache vhost level and doesn't
interfere with the Passenger/Node wiring underneath it.

## 6. Verify it's actually working

Don't trust the cPanel UI alone — confirm with real requests, especially the
Stripe webhook path, since raw-body handling through Apache/Passenger is the
one thing that's genuinely host-specific and worth not assuming:

```bash
curl -I https://your-domain/                     # expect 200
curl -I https://your-domain/give                  # expect 200
curl -I https://your-domain/admin                 # expect 200
curl -X POST https://your-domain/api/stripe-webhook -d '{}'
# expect: 400 "Missing signature" — this exact response (not a 404, not a
# framework error page) confirms src/start.ts's raw-request interception
# middleware is reaching handleStripeWebhook() with the body intact.
```

## 7. Connect Stripe (test mode) and run a real test donation

Follow **`PAYMENTS_SETUP.md`, section 3** exactly as written — it's identical
regardless of hosting target. One gotcha we hit worth knowing in advance: in
Stripe's newer dashboard, if you select events that span both "snapshot" and
"thin" payload styles, it'll insist on creating two separate destinations.
Avoid this by only selecting the classic/snapshot versions of the four events
`stripe-webhook.server.ts` actually listens for: `checkout.session.completed`,
`checkout.session.async_payment_succeeded`,
`checkout.session.async_payment_failed`, `invoice.paid`.

## Troubleshooting notes (things we actually hit)

- **Every route returns `503 Service Unavailable`, immediately, no
  cold-start delay**: check the Node.js version. We initially had this
  deployed on **Node 10.24.1** (cPanel's default) and got exactly this
  symptom — Node 10 predates global `fetch`/`crypto.subtle` and even basic
  modern syntax (`?.`) present in the built bundle, so the process fails to
  even start, which Passenger reports as a generic 503. Switching to 24.19.0
  fixed it immediately, confirmed by the curl checks in step 6 all returning
  correctly afterward. The Node version selector in cPanel's app page also
  doubles as the answer key — the venv path it shows you
  (`.../nodevenv/<domain>/<version>/bin/activate`) has the active major
  version baked into the path.
- **Browser shows "Be careful — someone pretending to be [domain]..."**: this
  is a browser reputation heuristic (Chrome's newer "unfamiliar site"
  warning), not a certificate or server misconfiguration — we confirmed the
  TLS cert itself was valid, correctly issued, and correctly scoped to the
  domain via `openssl s_client`. It's triggered by the domain being brand new
  (no browsing history yet) combined with using a TLD that has a high
  historical phishing-abuse rate (e.g. `.top`). It generally fades as the
  domain accumulates real, incident-free traffic; check
  `https://transparencyreport.google.com/safe-browsing/search?url=<domain>`
  to confirm nothing is actually blocklisted (as opposed to just the softer
  heuristic warning). Worth checking your production domain's TLD reputation
  *before* directing real donors to it.

## 8. Moving from the test subdomain to the real production domain

1. Add the production domain in cPanel (if not already the account's primary
   domain) and point its DNS at this server.
2. Repeat steps 1–6 above for the production domain: a **new** Node.js App
   entry (cPanel ties one app to one Application URL — you can point its
   Application Root at the same uploaded folder, or a fresh copy of the same
   `.output` build; either works since the server is stateless and reads
   everything from Supabase), same four environment variables (**identical
   `ENCRYPTION_KEY`** — see the warning in step 4), Force HTTPS Redirect on,
   and the same curl verification.
3. In `/admin` → Payment Settings, follow **`PAYMENTS_SETUP.md`, section 4**
   to go live: activate the Stripe account for live payments, create a
   **second, separate webhook endpoint** for live mode (test and live
   webhooks are entirely separate in Stripe, even at the same URL), switch
   Mode to Live with the live keys and new live signing secret.
4. Do one small real donation yourself to confirm the live path end-to-end,
   then check **"Online giving is live on the public site"** in Payment
   Settings.
5. You can leave the test subdomain running (or tear it down) — it has no
   effect on the production domain's app once they're separate Node.js App
   entries.
