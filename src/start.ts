import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

// Stripe posts webhook events to a plain HTTP endpoint (no router file-route
// mechanism exists in this TanStack Start version, and a webhook needs the
// raw body for signature verification anyway) — a requestMiddleware is the
// only hook that sees every incoming request before the router does, so it
// intercepts this one path and returns the response directly, bypassing
// routing entirely.
const stripeWebhookMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url);
  if (url.pathname === "/api/stripe-webhook" && request.method === "POST") {
    const { handleStripeWebhook } = await import("./lib/stripe-webhook.server");
    return handleStripeWebhook(request);
  }
  return next();
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [stripeWebhookMiddleware, errorMiddleware, csrfMiddleware],
}));
