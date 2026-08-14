/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string, supabase: unknown): Promise<void> {
  const { data, error } = await (supabase as any).rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || data !== true) throw new Error("Admin access required.");
}

export const getPaymentSettingsStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId, context.supabase);
    const { getIntegrationStatus } = await import("@/lib/secrets.server");
    return getIntegrationStatus("stripe");
  });

const saveSchema = z.object({
  mode: z.enum(["test", "live"]),
  publishableKey: z.string().trim().max(300).optional().default(""),
  secretKey: z.string().trim().max(300).optional().default(""),
  webhookSecret: z.string().trim().max(300).optional().default(""),
  achEnabled: z.boolean().default(false),
  isActive: z.boolean().default(false),
});

export const savePaymentSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, context.supabase);
    const { setIntegrationCredentials } = await import("@/lib/secrets.server");

    const secretFields: Record<string, string> = {};
    if (data.secretKey) secretFields["secret_key"] = data.secretKey;
    if (data.webhookSecret) secretFields["webhook_secret"] = data.webhookSecret;

    await setIntegrationCredentials("stripe", {
      mode: data.mode,
      achEnabled: data.achEnabled,
      isActive: data.isActive,
      updatedBy: context.userId,
      ...(data.publishableKey ? { publicValue: data.publishableKey } : {}),
      ...(Object.keys(secretFields).length ? { secretFields } : {}),
    });
    return { ok: true as const };
  });

export const testStripeConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId, context.supabase);
    const { getIntegrationSecret } = await import("@/lib/secrets.server");
    const secretKey = await getIntegrationSecret("stripe", "secret_key");
    if (!secretKey) throw new Error("Save a secret key before testing the connection.");
    const { retrieveBalance } = await import("@/lib/stripe.server");
    await retrieveBalance(secretKey);
    return { ok: true as const };
  });
