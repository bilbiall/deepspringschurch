// Server-only. Handles Supabase's "Send Email" auth hook: instead of Supabase
// emailing sign-up / invite / password-reset messages itself (and hitting its
// tiny built-in rate limit), it POSTs here and we send them through the
// church's own SMTP mailbox configured in the admin Email Settings panel.
//
// Supabase signs each request with the Standard Webhooks scheme:
//   signature = base64(HMAC-SHA256(secret, `${id}.${timestamp}.${body}`))
// where the secret is the base64 part of the hook secret ("v1,whsec_<base64>").
// Set that secret as SEND_EMAIL_HOOK_SECRET in the server environment.

const TOLERANCE_SECONDS = 5 * 60;

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyHookSignature(
  request: Request,
  rawBody: string,
  secret: string,
): Promise<boolean> {
  const id = request.headers.get("webhook-id");
  const timestamp = request.headers.get("webhook-timestamp");
  const signatureHeader = request.headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) return false;

  const secretB64 = secret.replace(/^v1,/, "").replace(/^whsec_/, "");
  let keyBytes: Uint8Array<ArrayBuffer>;
  try {
    keyBytes = base64ToBytes(secretB64);
  } catch {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`),
  );
  const expected = bytesToBase64(new Uint8Array(signed));

  // The header holds one or more space-separated "v1,<signature>" entries.
  return signatureHeader
    .split(" ")
    .map((part) => part.split(",")[1] ?? "")
    .some((sig) => timingSafeEqual(sig, expected));
}

type HookPayload = {
  user: { id?: string; email?: string; new_email?: string };
  email_data: {
    token?: string;
    token_hash?: string;
    token_new?: string;
    token_hash_new?: string;
    redirect_to?: string;
    email_action_type?: string;
    site_url?: string;
  };
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function verifyUrl(tokenHash: string, type: string, redirectTo: string | undefined): string {
  const base = (process.env["SUPABASE_URL"] ?? "").replace(/\/$/, "");
  const params = new URLSearchParams({ token: tokenHash, type });
  if (redirectTo) params.set("redirect_to", redirectTo);
  return `${base}/auth/v1/verify?${params.toString()}`;
}

type Template = { subject: string; heading: string; body: string; button: string };

const TEMPLATES: Record<string, Template> = {
  signup: {
    subject: "Confirm your email — Deep Spring Church",
    heading: "Confirm your email",
    body: "Thanks for creating an account. Please confirm your email address to finish signing up.",
    button: "Confirm email",
  },
  invite: {
    subject: "You've been invited — Deep Spring Church",
    heading: "You've been invited",
    body: "You have been invited to help manage the Deep Spring Church website. Accept the invitation to set up your account.",
    button: "Accept invitation",
  },
  magiclink: {
    subject: "Your sign-in link — Deep Spring Church",
    heading: "Sign in",
    body: "Use the button below to sign in. The link works once and expires soon.",
    button: "Sign in",
  },
  recovery: {
    subject: "Reset your password — Deep Spring Church",
    heading: "Reset your password",
    body: "We received a request to reset your password. Use the button below to choose a new one. If you didn't ask for this, you can ignore this email.",
    button: "Reset password",
  },
  email_change: {
    subject: "Confirm your new email — Deep Spring Church",
    heading: "Confirm your new email",
    body: "Confirm this address to finish changing the email on your account.",
    button: "Confirm new email",
  },
  reauthentication: {
    subject: "Your confirmation code — Deep Spring Church",
    heading: "Confirm it's you",
    body: "Enter the code below to confirm this action.",
    button: "",
  },
};

function render(
  type: string,
  link: string | null,
  code: string | undefined,
): { subject: string; text: string; html: string } {
  const t = TEMPLATES[type] ?? TEMPLATES["magiclink"]!;
  const codeText = code ? `\n\nOr enter this code: ${code}` : "";
  const text = `${t.heading}\n\n${t.body}${link ? `\n\n${link}` : ""}${codeText}\n\nDeep Spring Church`;

  const codeHtml = code
    ? `<p style="margin:24px 0 0;font-size:14px;color:#555">Or enter this code:</p><p style="margin:6px 0 0;font-size:24px;letter-spacing:4px;font-weight:700;color:#1a1a1a">${escapeHtml(code)}</p>`
    : "";
  const buttonHtml =
    link && t.button
      ? `<p style="margin:28px 0 0"><a href="${escapeHtml(link)}" style="background:#1f5f6b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;font-size:14px;display:inline-block">${escapeHtml(t.button)}</a></p>`
      : "";
  const html = `<!doctype html><html><body style="margin:0;background:#faf8f2;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td>
<p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#1f5f6b;font-weight:700">Deep Spring Church</p>
<h1 style="margin:0;font-size:24px;color:#1a1a1a">${escapeHtml(t.heading)}</h1>
<p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#444">${escapeHtml(t.body)}</p>
${buttonHtml}${codeHtml}
<p style="margin:32px 0 0;font-size:12px;color:#888">If the button doesn't work, copy this link into your browser:<br>${link ? escapeHtml(link) : ""}</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject: t.subject, text, html };
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function handleAuthEmailHook(request: Request): Promise<Response> {
  const secret = process.env["SEND_EMAIL_HOOK_SECRET"];
  if (!secret) {
    console.error("[auth-email-hook] SEND_EMAIL_HOOK_SECRET is not set");
    return json(500, { error: { http_code: 500, message: "Email hook is not configured." } });
  }

  const rawBody = await request.text();
  if (!(await verifyHookSignature(request, rawBody, secret))) {
    return json(401, { error: { http_code: 401, message: "Invalid signature." } });
  }

  let payload: HookPayload;
  try {
    payload = JSON.parse(rawBody) as HookPayload;
  } catch {
    return json(400, { error: { http_code: 400, message: "Invalid JSON." } });
  }

  const type = payload.email_data?.email_action_type ?? "";
  const email = payload.user?.email;
  if (!type || !email) {
    return json(400, { error: { http_code: 400, message: "Missing email data." } });
  }

  const data = payload.email_data;
  const redirectTo = data.redirect_to || data.site_url;

  try {
    const { sendEmail } = await import("@/lib/mailer.server");

    const messages: Array<{ to: string; link: string | null; code?: string }> = [];
    if (type === "email_change" && payload.user.new_email) {
      // Secure email change: each address gets its own confirmation.
      if (data.token_hash_new) {
        messages.push({
          to: email,
          link: verifyUrl(data.token_hash_new, type, redirectTo),
          ...(data.token_new ? { code: data.token_new } : {}),
        });
      }
      if (data.token_hash) {
        messages.push({
          to: payload.user.new_email,
          link: verifyUrl(data.token_hash, type, redirectTo),
          ...(data.token ? { code: data.token } : {}),
        });
      }
    } else {
      messages.push({
        to: email,
        link: data.token_hash ? verifyUrl(data.token_hash, type, redirectTo) : null,
        ...(data.token ? { code: data.token } : {}),
      });
    }

    for (const m of messages) {
      const { subject, text, html } = render(
        type,
        m.link,
        type === "reauthentication" ? m.code : undefined,
      );
      await sendEmail({ to: m.to, subject, text, html });
    }
    return json(200, {});
  } catch (error) {
    console.error("[auth-email-hook] Failed to send email:", error);
    const message = error instanceof Error ? error.message : "Could not send the email.";
    return json(500, { error: { http_code: 500, message } });
  }
}
