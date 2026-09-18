import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Copy, Eye, EyeOff, XCircle } from "lucide-react";
import {
  getPaymentSettingsStatus,
  savePaymentSettings,
  testStripeConnection,
  getTithelySettingsStatus,
  saveTithelySettings,
} from "@/lib/payment-settings.functions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "invoice.paid",
];

function CopyableCode({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-background px-3 py-1.5 font-mono text-xs text-foreground">
      {value}
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(value);
          toast.success("Copied");
        }}
        aria-label={`Copy ${value}`}
        className="text-muted-foreground hover:text-foreground"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

function SetupGuide() {
  const webhookUrl =
    (typeof window !== "undefined" ? window.location.origin : "https://yourdomain.org") +
    "/api/stripe-webhook";

  return (
    <div className="card-soft p-6">
      <Accordion type="single" collapsible defaultValue="guide">
        <AccordionItem value="guide" className="border-none">
          <AccordionTrigger className="py-0 text-sm font-semibold text-ink hover:no-underline">
            How to connect Stripe (setup guide)
          </AccordionTrigger>
          <AccordionContent>
            <ol className="mt-2 space-y-5 text-sm text-muted-foreground">
              <li>
                <p className="font-semibold text-foreground">1. Get your Stripe keys</p>
                <p className="mt-1">
                  Sign up or log in at{" "}
                  <a
                    href="https://stripe.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    stripe.com
                  </a>
                  . Use the toggle in the top-right of the Stripe dashboard to pick{" "}
                  <strong>Test mode</strong> (for trying things out, no real money moves)
                  or <strong>Live mode</strong> (for real donations). Then go to{" "}
                  <strong>Developers → API keys</strong> and copy the{" "}
                  <strong>Publishable key</strong> and <strong>Secret key</strong>.
                </p>
              </li>
              <li>
                <p className="font-semibold text-foreground">2. Paste them below and save</p>
                <p className="mt-1">
                  Set <strong>Mode</strong> to match what you copied, paste both keys into
                  the fields below, check <strong>"Online giving is live on the public
                  site"</strong> when you're ready for donors to actually see the giving
                  form, then click <strong>Save settings</strong>.
                </p>
              </li>
              <li>
                <p className="font-semibold text-foreground">3. Connect the webhook</p>
                <p className="mt-1">
                  This step tells Stripe to notify this site when a payment succeeds. In
                  the Stripe dashboard, go to <strong>Developers → Webhooks → Add
                  endpoint</strong> and enter this exact URL:
                </p>
                <p className="mt-2">
                  <CopyableCode value={webhookUrl} />
                </p>
                <p className="mt-2">Select these events, then save the endpoint:</p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {WEBHOOK_EVENTS.map((ev) => (
                    <li key={ev}>
                      <CopyableCode value={ev} />
                    </li>
                  ))}
                </ul>
                <p className="mt-2">
                  Stripe will show a <strong>Signing secret</strong> starting with{" "}
                  <code>whsec_</code> — copy it, paste it into{" "}
                  <strong>Webhook signing secret</strong> below, and save again.
                </p>
              </li>
              <li>
                <p className="font-semibold text-foreground">4. Test it</p>
                <p className="mt-1">
                  Click <strong>Test connection</strong> above to confirm the keys work.
                  Then make a donation on the public <strong>Give</strong> page and check
                  it shows up in the <strong>Giving Reports</strong> tab with status
                  "succeeded."
                </p>
              </li>
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

type Status = Awaited<ReturnType<typeof getPaymentSettingsStatus>>;

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

type TithelyStatus = Awaited<ReturnType<typeof getTithelySettingsStatus>>;

function TithelySettings() {
  const [status, setStatus] = useState<TithelyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [url, setUrl] = useState("");
  const [isActive, setIsActive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getTithelySettingsStatus();
      setStatus(s);
      setUrl(s.publicValue ?? "");
      setIsActive(s.isActive);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load Tithe.ly settings");
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
      await saveTithelySettings({ data: { url, isActive } });
      toast.success("Tithe.ly settings saved");
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save Tithe.ly settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  const live = Boolean(status?.isActive && status.publicValue);

  return (
    <form onSubmit={save} className="card-soft space-y-5 p-6">
      <div>
        <p className="text-sm font-semibold text-ink">
          Tithe.ly (alternate giving link) {live ? "· showing on Give page" : ""}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Optional. Adds a "Give via Tithe.ly" link on the public Give page that opens your
          Tithe.ly giving page in a new tab. Gifts made there are tracked by Tithe.ly, not by this
          site — they won't appear in Giving Reports.
        </p>
      </div>

      <div>
        <label htmlFor="tithely-url" className={fieldLabelClass()}>
          Tithe.ly giving link
        </label>
        <input
          id="tithely-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://give.tithe.ly/?formId=…"
          autoComplete="off"
          className={inputClass()}
        />
      </div>

      <label className="flex items-center gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        Show this link on the public Give page
      </label>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full border border-border px-6 py-2.5 text-xs font-semibold tracking-wider uppercase disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Tithe.ly settings"}
      </button>
    </form>
  );
}

export function PaymentSettingsPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [mode, setMode] = useState<"test" | "live">("test");
  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [achEnabled, setAchEnabled] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getPaymentSettingsStatus();
      setStatus(s);
      setMode(s.mode === "live" ? "live" : "test");
      setPublishableKey(s.publicValue ?? "");
      setAchEnabled(s.achEnabled);
      setIsActive(s.isActive);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load payment settings");
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
      await savePaymentSettings({
        data: { mode, publishableKey, secretKey, webhookSecret, achEnabled, isActive },
      });
      toast.success("Payment settings saved");
      setSecretKey("");
      setWebhookSecret("");
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  async function runTest() {
    setTesting(true);
    try {
      await testStripeConnection();
      toast.success("Stripe connection is working");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connection test failed");
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const connected = Boolean(status?.configured && status.isActive);

  return (
    <div className="space-y-8">
      <SetupGuide />

      <div className="card-soft flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-3">
          {connected ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
          <div>
            <p className="text-sm font-semibold text-ink">
              {connected ? "Stripe connected and live" : "Stripe not active"}
              {status?.configured ? ` · ${status.mode} mode` : ""}
            </p>
            {status?.secretMasks["secret_key"] ? (
              <p className="text-xs text-muted-foreground">
                Secret key {status.secretMasks["secret_key"]}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No secret key saved yet.</p>
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
            <label className={fieldLabelClass()}>Mode</label>
            <Select value={mode} onValueChange={(v) => setMode(v as "test" | "live")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Test</SelectItem>
                <SelectItem value="live">Live</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="publishable-key" className={fieldLabelClass()}>
              Publishable key
            </label>
            <input
              id="publishable-key"
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              placeholder="pk_test_…"
              autoComplete="off"
              className={inputClass()}
            />
          </div>

          <div>
            <label htmlFor="secret-key" className={fieldLabelClass()}>
              Secret key
            </label>
            <SecretInput
              value={secretKey}
              onChange={setSecretKey}
              placeholder={
                status?.secretMasks["secret_key"]
                  ? `Saved (${status.secretMasks["secret_key"]}) — leave blank to keep`
                  : "sk_test_…"
              }
            />
          </div>

          <div>
            <label htmlFor="webhook-secret" className={fieldLabelClass()}>
              Webhook signing secret
            </label>
            <SecretInput
              value={webhookSecret}
              onChange={setWebhookSecret}
              placeholder={
                status?.secretMasks["webhook_secret"]
                  ? `Saved (${status.secretMasks["webhook_secret"]}) — leave blank to keep`
                  : "whsec_…"
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <label className="flex items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={achEnabled}
              onChange={(e) => setAchEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Enable ACH bank transfer
          </label>
          <label className="flex items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Online giving is live on the public site
          </label>
        </div>

        <div className="space-y-1 rounded-xl bg-cream px-5 py-4 text-xs leading-relaxed text-muted-foreground">
          <p>
            Enabling ACH requires turning on Financial Connections for this Stripe account first
            (Stripe Dashboard → Settings → Payment methods).
          </p>
          <p>See the setup guide above for connecting your Stripe webhook.</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary px-6 py-3 text-xs font-semibold tracking-wider text-primary-foreground uppercase disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>

      <TithelySettings />
    </div>
  );
}
