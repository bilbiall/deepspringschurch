import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

// Supabase's "Send Email" auth hook posts to a plain HTTP endpoint and needs the
// raw body for signature verification, so — as with any raw endpoint in this
// TanStack Start version — a requestMiddleware intercepts the path before
// routing runs.
const authEmailHookMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url);
  if (url.pathname === "/api/auth-email-hook" && request.method === "POST") {
    const { handleAuthEmailHook } = await import("./lib/auth-email-hook.server");
    return handleAuthEmailHook(request);
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
  requestMiddleware: [authEmailHookMiddleware, errorMiddleware, csrfMiddleware],
}));
