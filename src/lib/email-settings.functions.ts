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

export const getEmailSettingsStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId, context.supabase);
    const { getIntegrationStatus } = await import("@/lib/secrets.server");
    const status = await getIntegrationStatus("smtp");
    let config: {
      host: string;
      port: number;
      secure: boolean;
      from: string;
      fromName?: string;
      notifyTo?: string;
      allowSelfSigned?: boolean;
    } | null = null;
    if (status.publicValue) {
      try {
        config = JSON.parse(status.publicValue);
      } catch {
        config = null;
      }
    }
    return { ...status, config };
  });

const notifyToSchema = z
  .string()
  .trim()
  .max(1000)
  .optional()
  .default("")
  .transform((v) =>
    v
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean),
  )
  .refine((addrs) => addrs.every((a) => z.string().email().safeParse(a).success), {
    message: "Enter valid email addresses, separated by commas",
  })
  .transform((addrs) => addrs.join(", "));

const saveSchema = z.object({
  host: z.string().trim().min(1).max(255),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean().default(false),
  from: z.string().trim().email().max(255),
  fromName: z.string().trim().max(100).optional().default(""),
  allowSelfSigned: z.boolean().default(false),
  notifyTo: notifyToSchema,
  user: z.string().trim().max(255).optional().default(""),
  pass: z.string().trim().max(255).optional().default(""),
  isActive: z.boolean().default(false),
});

export const saveEmailSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, context.supabase);
    const { setIntegrationCredentials, getIntegrationSecret } =
      await import("@/lib/secrets.server");

    if (data.isActive) {
      const hasUser = data.user || (await getIntegrationSecret("smtp", "user"));
      const hasPass = data.pass || (await getIntegrationSecret("smtp", "pass"));
      if (!hasUser || !hasPass) {
        throw new Error("Save a mailbox username and password before turning email sending on.");
      }
    }

    const secretFields: Record<string, string> = {};
    if (data.user) secretFields["user"] = data.user;
    if (data.pass) secretFields["pass"] = data.pass;

    await setIntegrationCredentials("smtp", {
      isActive: data.isActive,
      updatedBy: context.userId,
      publicValue: JSON.stringify({
        host: data.host,
        port: data.port,
        secure: data.secure,
        from: data.from,
        fromName: data.fromName,
        allowSelfSigned: data.allowSelfSigned,
        notifyTo: data.notifyTo,
      }),
      ...(Object.keys(secretFields).length ? { secretFields } : {}),
    });
    return { ok: true as const };
  });

export const testEmailConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId, context.supabase);
    const { verifySmtpConnection } = await import("@/lib/mailer.server");
    await verifySmtpConnection();
    return { ok: true as const };
  });

const sendTestSchema = z.object({
  to: z.string().trim().email().max(255),
});

export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => sendTestSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, context.supabase);
    const { sendTestEmail: send } = await import("@/lib/mailer.server");
    await send(data.to);
    return { ok: true as const };
  });
