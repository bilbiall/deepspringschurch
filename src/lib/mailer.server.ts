// Server-only. Sends email over SMTP using the credentials saved through the
// admin Email Settings panel (encrypted at rest — see secrets.server.ts).
// Used for Supabase auth emails (sign-up, invite, password reset) via the
// Send Email hook, and for admin test sends.
//
// Load inside server handlers, same convention as supabaseAdmin:
// const { sendEmail } = await import("@/lib/mailer.server");

export type SmtpPublicConfig = {
  host: string;
  port: number;
  secure: boolean;
  from: string;
  /** Optional display name shown in the recipient's inbox, e.g. "Deep Spring Church". */
  fromName: string;
  /** Optional comma-separated list of addresses for staff notifications. */
  notifyTo: string;
  /** Accept a self-signed certificate (only for your own cPanel mail server). */
  allowSelfSigned: boolean;
};

function parsePublicConfig(publicValue: string | null): SmtpPublicConfig | null {
  if (!publicValue) return null;
  try {
    const parsed = JSON.parse(publicValue) as Partial<SmtpPublicConfig>;
    if (!parsed.host || !parsed.port || !parsed.from) return null;
    return {
      host: parsed.host,
      port: parsed.port,
      secure: Boolean(parsed.secure),
      from: parsed.from,
      fromName: parsed.fromName ?? "",
      notifyTo: parsed.notifyTo ?? "",
      allowSelfSigned: Boolean(parsed.allowSelfSigned),
    };
  } catch {
    return null;
  }
}

type LoadedSmtpConfig = SmtpPublicConfig & { user: string; pass: string };

export async function loadSmtpSettings(): Promise<LoadedSmtpConfig | null> {
  const { getIntegrationStatus, getIntegrationSecret } = await import("@/lib/secrets.server");
  const status = await getIntegrationStatus("smtp");
  const config = parsePublicConfig(status.publicValue);
  if (!config) return null;

  const [user, pass] = await Promise.all([
    getIntegrationSecret("smtp", "user"),
    getIntegrationSecret("smtp", "pass"),
  ]);
  if (!user || !pass) return null;

  return { ...config, user, pass };
}

function formatFrom(config: SmtpPublicConfig): string | { name: string; address: string } {
  return config.fromName ? { name: config.fromName, address: config.from } : config.from;
}

async function createTransporter(config: LoadedSmtpConfig) {
  const nodemailer = await import("nodemailer");
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
    ...(config.allowSelfSigned ? { tls: { rejectUnauthorized: false } } : {}),
  });
}

/** Verifies the saved SMTP settings can actually authenticate. Throws on failure. */
export async function verifySmtpConnection(): Promise<void> {
  const config = await loadSmtpSettings();
  if (!config) throw new Error("Save SMTP settings before testing the connection.");
  const transporter = await createTransporter(config);
  await transporter.verify();
}

/**
 * Sends an email using the saved settings. Throws with the real underlying
 * error on failure, so callers (the auth hook, the test button) can report it.
 * Refuses to send while the admin has switched sending off.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<void> {
  const { getIntegrationStatus } = await import("@/lib/secrets.server");
  const status = await getIntegrationStatus("smtp");
  if (!status.isActive) throw new Error("Email sending is switched off in Email Settings.");

  const config = await loadSmtpSettings();
  if (!config) throw new Error("Email settings are incomplete.");

  const transporter = await createTransporter(config);
  await transporter.sendMail({
    from: formatFrom(config),
    to: opts.to,
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    subject: opts.subject,
    text: opts.text,
    ...(opts.html ? { html: opts.html } : {}),
  });
}

/**
 * Sends a real test email to an arbitrary address using the saved settings,
 * even while sending is switched off, so an admin can confirm delivery
 * before turning it on.
 */
export async function sendTestEmail(to: string): Promise<void> {
  const config = await loadSmtpSettings();
  if (!config) throw new Error("Save SMTP settings before sending a test email.");
  const transporter = await createTransporter(config);
  await transporter.sendMail({
    from: formatFrom(config),
    to,
    subject: "Deep Spring Church — test email",
    text: "This is a test email from the Deep Spring Church website's Email Settings. If you received this, SMTP delivery is working.",
  });
}

/**
 * Best-effort notification to the staff addresses saved in Email Settings for a
 * new public form submission. Never throws: the submission is already safely
 * stored in the database by the time this runs, so a broken mail server must
 * not turn a successful submission into an error for the visitor. Failures are
 * logged for an admin to notice separately.
 */
export async function sendStaffNotification(opts: {
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<void> {
  try {
    const { getIntegrationStatus } = await import("@/lib/secrets.server");
    const status = await getIntegrationStatus("smtp");
    if (!status.isActive) return;

    const config = await loadSmtpSettings();
    if (!config || !config.notifyTo) return;

    const transporter = await createTransporter(config);
    await transporter.sendMail({
      from: formatFrom(config),
      to: config.notifyTo,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
      subject: opts.subject.replace(/[\r\n]+/g, " ").slice(0, 200),
      text: opts.text,
    });
  } catch (error) {
    console.error("[mailer] Failed to send staff notification email:", error);
  }
}
