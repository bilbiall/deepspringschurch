// Server-only. Minimal fetch-based Stripe REST client — deliberately not the
// `stripe` npm SDK, to keep the Cloudflare Worker bundle small and avoid
// relying on Node-specific APIs beyond what `nodejs_compat` already covers.
// Stripe's API is plain HTTPS + form-encoded bodies, so a thin wrapper is
// enough for the handful of endpoints this app needs.

const STRIPE_API = "https://api.stripe.com/v1";

/** Encodes a (possibly nested) object into Stripe's bracket-notation form body. */
function toFormEntries(value: unknown, prefix: string, out: string[]): void {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => toFormEntries(item, `${prefix}[${i}]`, out));
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      toFormEntries(v, prefix ? `${prefix}[${k}]` : k, out);
    }
    return;
  }
  out.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`);
}

function toFormBody(params: Record<string, unknown>): string {
  const out: string[] = [];
  for (const [k, v] of Object.entries(params)) toFormEntries(v, k, out);
  return out.join("&");
}

async function stripeRequest<T>(
  secretKey: string,
  method: "GET" | "POST",
  path: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const url = method === "GET" && params ? `${STRIPE_API}${path}?${toFormBody(params)}` : `${STRIPE_API}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Basic ${btoa(`${secretKey}:`)}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    ...(method === "POST" && params ? { body: toFormBody(params) } : {}),
  });
  const body = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(body.error?.message ?? `Stripe request failed (${res.status})`);
  }
  return body;
}

export type CheckoutLineItem = {
  currency: string;
  unitAmountCents: number;
  productName: string;
  /** Present only for recurring (subscription-mode) donations. */
  recurringInterval?: "week" | "month";
};

export type CreateCheckoutSessionInput = {
  mode: "payment" | "subscription";
  paymentMethodTypes: Array<"card" | "us_bank_account">;
  lineItem: CheckoutLineItem;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata: Record<string, string>;
};

export type CheckoutSession = { id: string; url: string };

export async function createCheckoutSession(
  secretKey: string,
  input: CreateCheckoutSessionInput,
): Promise<CheckoutSession> {
  return stripeRequest<CheckoutSession>(secretKey, "POST", "/checkout/sessions", {
    mode: input.mode,
    payment_method_types: input.paymentMethodTypes,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: input.customerEmail,
    metadata: input.metadata,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.lineItem.currency,
          unit_amount: input.lineItem.unitAmountCents,
          product_data: { name: input.lineItem.productName },
          ...(input.lineItem.recurringInterval
            ? { recurring: { interval: input.lineItem.recurringInterval } }
            : {}),
        },
      },
    ],
  });
}

/** Used by the admin "Test connection" button — any 200 response confirms the key is valid. */
export async function retrieveBalance(secretKey: string): Promise<{ ok: true }> {
  await stripeRequest(secretKey, "GET", "/balance");
  return { ok: true };
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const WEBHOOK_TOLERANCE_SECONDS = 300;

/**
 * Verifies a Stripe-Signature header against the raw request body, replicating
 * what Stripe's own SDK does internally (see Stripe's "Verify webhook
 * signatures manually" docs). Rejects stale timestamps to guard against replay.
 */
export async function verifyWebhookSignature(
  payload: string,
  signatureHeader: string,
  webhookSecret: string,
): Promise<boolean> {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k, v];
    }),
  );
  const timestamp = parts["t"];
  const v1 = parts["v1"];
  if (!timestamp || !v1) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > WEBHOOK_TOLERANCE_SECONDS) return false;

  const expected = await hmacSha256Hex(webhookSecret, `${timestamp}.${payload}`);
  return timingSafeEqual(expected, v1);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
