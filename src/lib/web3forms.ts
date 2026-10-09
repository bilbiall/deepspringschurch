// Website → Web3Forms API → info@deepspringchurch.org
// ⚠️ PASTE YOUR WEB3FORMS ACCESS KEY BELOW (get it free at https://web3forms.com
// by entering info@deepspringchurch.org). This key is safe to be public.
export const WEB3FORMS_ACCESS_KEY = "d2e98db7-7d0c-4c5e-8a4e-45caad1b5f5a";

const ENDPOINT = "https://api.web3forms.com/submit";

export const MSG_SENDING = "Sending your message...";
export const MSG_SUCCESS =
  "Thank you. Your message has been received successfully. We will get back to you soon.";
export const MSG_FAILURE =
  "We couldn't send your message right now. Please try again or contact us directly.";

/** Sends every field of a form to Web3Forms. Returns false if the honeypot was filled. */
export async function sendToWeb3Forms(
  form: HTMLFormElement,
  formName: string,
  extra: Record<string, string> = {},
): Promise<void> {
  const fd = new FormData(form);
  if (String(fd.get("botcheck") ?? "")) return; // bot — silently ignore
  const payload: Record<string, unknown> = {};
  fd.forEach((v, k) => {
    if (k === "botcheck" || k === "company") return;
    const s = String(v).trim();
    if (s) payload[k] = s;
  });
  Object.assign(payload, extra);
  const email = String(payload["email"] ?? payload["parent_email"] ?? "");
  const name = String(payload["name"] ?? payload["parent_name"] ?? "Website visitor");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: `[${formName}] ${payload["subject"] ?? `New submission from ${name}`}`,
      from_name: "Deep Spring Church Website",
      form_type: formName,
      ...(email ? { replyto: email } : {}),
      botcheck: "",
      ...payload,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as { success?: boolean };
  if (!res.ok || !json.success) throw new Error("send failed");
}
