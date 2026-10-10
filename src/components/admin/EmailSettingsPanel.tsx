import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Eye, EyeOff, XCircle } from "lucide-react";
import {
  getEmailSettingsStatus,
  saveEmailSettings,
  testEmailConnection,
  sendTestEmail,
} from "@/lib/email-settings.functions";

function inputClass() {
  return "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary";
}

function fieldLabelClass() {
  return "mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground uppercase";
}

function SecretInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={`${inputClass()} pr-11`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide value" : "Show value"}
        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

type Status = Awaited<ReturnType<typeof getEmailSettingsStatus>>;

export function EmailSettingsPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [secure, setSecure] = useState(false);
  const [from, setFrom] = useState("");
  const [fromName, setFromName] = useState("");
  const [allowSelfSigned, setAllowSelfSigned] = useState(false);
  const [notifyTo, setNotifyTo] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [isActive, setIsActive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getEmailSettingsStatus();
      setStatus(s);
      setHost(s.config?.host ?? "");
      setPort(String(s.config?.port ?? "587"));
      setSecure(s.config?.secure ?? false);
      setFrom(s.config?.from ?? "");
      setFromName(s.config?.fromName ?? "");
      setAllowSelfSigned(s.config?.allowSelfSigned ?? false);
      setNotifyTo(s.config?.notifyTo ?? "");
      setIsActive(s.isActive);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load email settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveEmailSettings({
        data: {
          host,
          port: Number(port),
          secure,
          from,
          fromName,
          allowSelfSigned,
          notifyTo,
          user,
          pass,
          isActive,
        },
      });
      toast.success("Email settings saved");
      setUser("");
      setPass("");
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save email settings");
    } finally {
      setSaving(false);
    }
  }

  async function runTest() {
    setTesting(true);
    try {
      await testEmailConnection();
      toast.success("SMTP connection is working");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connection test failed");
    } finally {
      setTesting(false);
    }
  }

  async function runSendTest(e: React.FormEvent) {
    e.preventDefault();
    setSendingTest(true);
    try {
      await sendTestEmail({ data: { to: testTo } });
      toast.success(`Test email sent to ${testTo}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send test email");
    } finally {
      setSendingTest(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const connected = Boolean(status?.configured && status.isActive);

  return (
    <div className="space-y-8">
      <div className="card-soft p-6 text-sm leading-relaxed text-muted-foreground">
        <p className="font-semibold text-ink">Website email (SMTP)</p>
        <p className="mt-1">
          Enter the SMTP details for a mailbox in your cPanel hosting (Email Accounts → Connect
          Devices shows the same host/port your email client uses). This mailbox sends the sign-up,
          invitation and password-reset emails for dashboard accounts. The password is stored
          encrypted and is never shown again. It also emails your staff whenever someone submits the
          Contact, Plan a Visit or Child Registration forms, or sends a prayer request.
        </p>
        <p className="mt-2">
          After saving and testing, connect it in Supabase: Authentication → Auth Hooks → Send Email
          → HTTPS, URL <code>/api/auth-email-hook</code> on this site.
        </p>
      </div>

      <div className="card-soft flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-3">
          {connected ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
          <div>
            <p className="text-sm font-semibold text-ink">
              {connected ? "Email sending is on" : "Email sending is off"}
            </p>
            {status?.secretMasks["user"] ? (
              <p className="text-xs text-muted-foreground">
                Mailbox saved ({status.secretMasks["user"]})
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No mailbox saved yet.</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void runTest()}
          disabled={testing || !status?.configured}
          className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold tracking-wider uppercase disabled:opacity-50"
        >
          {testing ? "Testing…" : "Test connection"}
        </button>
      </div>

      <form onSubmit={save} className="card-soft space-y-6 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="smtp-host" className={fieldLabelClass()}>
              SMTP host
            </label>
            <input
              id="smtp-host"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="mail.deepspringchurch.org"
              autoComplete="off"
              className={inputClass()}
            />
          </div>

          <div>
            <label htmlFor="smtp-port" className={fieldLabelClass()}>
              Port
            </label>
            <input
              id="smtp-port"
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="465"
              className={inputClass()}
            />
          </div>

          <div>
            <label htmlFor="smtp-user" className={fieldLabelClass()}>
              Mailbox username
            </label>
            <input
              id="smtp-user"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder={
                status?.secretMasks["user"]
                  ? `Saved (${status.secretMasks["user"]}) — leave blank to keep`
                  : "forms@deepspringchurch.org"
              }
              autoComplete="off"
              className={inputClass()}
            />
          </div>

          <div>
            <label htmlFor="smtp-pass" className={fieldLabelClass()}>
              Mailbox password
            </label>
            <SecretInput
              value={pass}
              onChange={setPass}
              placeholder={
                status?.secretMasks["pass"]
                  ? `Saved (${status.secretMasks["pass"]}) — leave blank to keep`
                  : "Mailbox password"
              }
            />
          </div>

          <div>
            <label htmlFor="smtp-from" className={fieldLabelClass()}>
              From address
            </label>
            <input
              id="smtp-from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="forms@deepspringchurch.org"
              autoComplete="off"
              className={inputClass()}
            />
          </div>

          <div>
            <label htmlFor="smtp-from-name" className={fieldLabelClass()}>
              Display name
            </label>
            <input
              id="smtp-from-name"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Deep Spring Church"
              autoComplete="off"
              className={inputClass()}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="smtp-notify-to" className={fieldLabelClass()}>
              Staff notification addresses
            </label>
            <input
              id="smtp-notify-to"
              value={notifyTo}
              onChange={(e) => setNotifyTo(e.target.value)}
              placeholder="office@deepspringchurch.org, pastor@deepspringchurch.org"
              autoComplete="off"
              className={inputClass()}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Every address here gets an email for each new contact message, prayer request, visit
              plan and child registration. Separate several addresses with commas. Replying to one
              of these emails reaches the person who submitted the form.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <label className="flex items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={secure}
              onChange={(e) => setSecure(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Use SSL (port 465) instead of STARTTLS
          </label>
          <label className="flex items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Turn email sending on
          </label>
          <label className="flex items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={allowSelfSigned}
              onChange={(e) => setAllowSelfSigned(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Trust a self-signed certificate (only for your own cPanel mail server)
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary px-6 py-3 text-xs font-semibold tracking-wider text-primary-foreground uppercase disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>

      <form onSubmit={runSendTest} className="card-soft space-y-4 p-6">
        <div>
          <p className="text-sm font-semibold text-ink">Send a test email</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sends a real email using the saved settings above to any address you enter — use this to
            check actual delivery (including to a different inbox than the ones configured above)
            rather than just whether the login works. If it fails, the error shown is the real one
            from your mail server.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[240px] flex-1">
            <label htmlFor="smtp-test-to" className={fieldLabelClass()}>
              Send test to
            </label>
            <input
              id="smtp-test-to"
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="you@gmail.com"
              autoComplete="off"
              className={inputClass()}
            />
          </div>
          <button
            type="submit"
            disabled={sendingTest || !status?.configured || !testTo}
            className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold tracking-wider uppercase disabled:opacity-50"
          >
            {sendingTest ? "Sending…" : "Send test email"}
          </button>
        </div>
      </form>
    </div>
  );
}
