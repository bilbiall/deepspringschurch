// Server-only. Encrypts/decrypts provider API credentials (Stripe secret key,
// webhook signing secret, etc.) before they are stored in
// public.integration_credentials, and reads them back for use inside server
// functions/the webhook handler. The master key never leaves this process —
// it is a Worker secret (ENCRYPTION_KEY), set once via `wrangler secret put`,
// never stored in the database or sent to the browser.
//
// Load inside server handlers, same convention as supabaseAdmin:
// const { getIntegrationSecret } = await import("@/lib/secrets.server");

const ALGO = "AES-GCM";
const IV_BYTES = 12;

let cachedKey: Promise<CryptoKey> | undefined;

function getEncryptionKey(): Promise<CryptoKey> {
  if (!cachedKey) {
    const raw = process.env["ENCRYPTION_KEY"];
    if (!raw) {
      throw new Error(
        "Missing ENCRYPTION_KEY environment variable. Set it with `wrangler secret put ENCRYPTION_KEY` (a random 32-byte base64 value).",
      );
    }
    const keyBytes = base64ToBytes(raw);
    if (keyBytes.length !== 32) {
      throw new Error("ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256).");
    }
    cachedKey = crypto.subtle.importKey("raw", keyBytes, ALGO, false, ["encrypt", "decrypt"]);
  }
  return cachedKey;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export type EncryptedValue = { ciphertext: string; iv: string };

export async function encryptSecret(plain: string): Promise<EncryptedValue> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plain);
  const ciphertext = await crypto.subtle.encrypt({ name: ALGO, iv }, key, encoded);
  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
  };
}

export async function decryptSecret(value: EncryptedValue): Promise<string> {
  const key = await getEncryptionKey();
  const iv = base64ToBytes(value.iv);
  const ciphertext = base64ToBytes(value.ciphertext);
  const decrypted = await crypto.subtle.decrypt({ name: ALGO, iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}

/** Masks a secret for display, e.g. "sk_live_51H..." -> "••••1234" */
export function maskSecret(plain: string, visible = 4): string {
  return `••••${plain.slice(-visible)}`;
}

type CredentialsRow = {
  mode: string;
  is_active: boolean;
  public_value: string | null;
  secrets: Record<string, EncryptedValue>;
  ach_enabled: boolean;
};

async function loadRow(provider: string): Promise<CredentialsRow | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("integration_credentials")
    .select("mode, is_active, public_value, secrets, ach_enabled")
    .eq("provider", provider)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as CredentialsRow | null) ?? null;
}

/** Reads and decrypts a single named secret (e.g. "secret_key", "webhook_secret") for a provider. */
export async function getIntegrationSecret(
  provider: string,
  key: string,
): Promise<string | null> {
  const row = await loadRow(provider);
  const encrypted = row?.secrets?.[key];
  if (!encrypted) return null;
  return decryptSecret(encrypted);
}

export type IntegrationStatus = {
  configured: boolean;
  isActive: boolean;
  mode: string;
  achEnabled: boolean;
  publicValue: string | null;
  secretMasks: Record<string, string>;
};

/** Public-safe status for the admin settings screen — never returns decrypted secret values. */
export async function getIntegrationStatus(provider: string): Promise<IntegrationStatus> {
  const row = await loadRow(provider);
  if (!row) {
    return {
      configured: false,
      isActive: false,
      mode: "test",
      achEnabled: false,
      publicValue: null,
      secretMasks: {},
    };
  }
  const secretMasks: Record<string, string> = {};
  for (const [key, value] of Object.entries(row.secrets ?? {})) {
    try {
      secretMasks[key] = maskSecret(await decryptSecret(value));
    } catch {
      secretMasks[key] = "••••";
    }
  }
  return {
    configured: Object.keys(row.secrets ?? {}).length > 0,
    isActive: row.is_active,
    mode: row.mode,
    achEnabled: row.ach_enabled,
    publicValue: row.public_value,
    secretMasks,
  };
}

export type SaveCredentialsInput = {
  mode?: "test" | "live";
  publicValue?: string;
  achEnabled?: boolean;
  isActive?: boolean;
  updatedBy?: string;
  /** Plaintext secrets to encrypt and merge into storage. Omitted keys are left untouched. */
  secretFields?: Record<string, string>;
};

export async function setIntegrationCredentials(
  provider: string,
  input: SaveCredentialsInput,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const existing = await loadRow(provider);

  const nextSecrets: Record<string, EncryptedValue> = { ...(existing?.secrets ?? {}) };
  if (input.secretFields) {
    for (const [key, plain] of Object.entries(input.secretFields)) {
      if (plain) nextSecrets[key] = await encryptSecret(plain);
    }
  }

  const { error } = await supabaseAdmin.from("integration_credentials").upsert(
    {
      provider,
      mode: input.mode ?? existing?.mode ?? "test",
      public_value: input.publicValue ?? existing?.public_value ?? null,
      ach_enabled: input.achEnabled ?? existing?.ach_enabled ?? false,
      is_active: input.isActive ?? existing?.is_active ?? false,
      secrets: nextSecrets,
      updated_by: input.updatedBy ?? null,
    },
    { onConflict: "provider" },
  );
  if (error) throw new Error(error.message);
}
