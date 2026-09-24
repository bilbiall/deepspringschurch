// Server-only. Sends notification emails for public form submissions over
// SMTP, using credentials saved through the admin Email Settings panel
// (encrypted the same way as the Stripe keys — see secrets.server.ts).
//
// Load inside server handlers, same convention as supabaseAdmin:
// const { sendFormNotification } = await import("@/lib/mailer.server");

export type SmtpPublicConfig = {
  host: string;
  port: number;
  secure: boolean;
  from: string;
  /** Comma-separated list of one or more recipient addresses. */
  notifyTo: string;
};

function parsePublicConfig(publicValue: string | null): SmtpPublicConfig | null {
  if (!publicValue) return null;
  try {
    const parsed = JSON.parse(publicValue) as Partial<SmtpPublicConfig>;
    if (!parsed.host || !parsed.port || !parsed.from || !parsed.notifyTo) return null;
    return {
      host: parsed.host,
      port: parsed.port,
      secure: Boolean(parsed.secure),
      from: parsed.from,
      notifyTo: parsed.notifyTo,
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

async function createTransporter(config: LoadedSmtpConfig) {
  const nodemailer = await import("nodemailer");
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
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
 * Sends a real test email to an arbitrary address using the saved SMTP
 * settings, so an admin can confirm actual delivery (not just that
 * credentials authenticate) — including to a mailbox other than the
 * configured notify-to address. Throws with the real underlying error on
 * failure, unlike sendFormNotification, since this is an explicit admin
 * action that should surface what went wrong.
 */
export async function sendTestEmail(to: string): Promise<void> {
  const config = await loadSmtpSettings();
  if (!config) throw new Error("Save SMTP settings before sending a test email.");
  const transporter = await createTransporter(config);
  await transporter.sendMail({
    from: config.from,
    to,
    subject: "Deep Spring Church — test email",
    text: "This is a test email from the Deep Spring Church website's Email Settings panel. If you received this, SMTP delivery is working.",
  });
}

/**
 * Best-effort notification email for a public form submission. Never throws —
 * the form data is already safely saved in Supabase by the time this runs, so
 * a broken mail server should not turn a successful submission into an error
 * for the visitor. Failures are logged for the admin to notice separately.
 */
export async function sendFormNotification(opts: {
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<void> {
  try {
    const { getIntegrationStatus } = await import("@/lib/secrets.server");
    const status = await getIntegrationStatus("smtp");
    if (!status.isActive) return;

    const config = await loadSmtpSettings();
    if (!config) return;

    const transporter = await createTransporter(config);
    await transporter.sendMail({
      from: config.from,
      to: config.notifyTo,
      replyTo: opts.replyTo,
      subject: opts.subject,
      text: opts.text,
    });
  } catch (error) {
    console.error("[mailer] Failed to send form notification email:", error);
  }
}
