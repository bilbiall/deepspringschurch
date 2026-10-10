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

const STAFF_ROLES = ["admin", "editor"] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

export type ManagedUser = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
  role: StaffRole | "none";
};

export const listManagedUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagedUser[]> => {
    await assertAdmin(context.userId, context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (error) throw new Error(error.message);

    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rolesError) throw new Error(rolesError.message);

    const byUser = new Map<string, StaffRole>();
    for (const r of roles ?? []) {
      // admin outranks editor if both rows somehow exist
      if (r.role === "admin") byUser.set(r.user_id, "admin");
      else if (r.role === "editor" && !byUser.has(r.user_id)) byUser.set(r.user_id, "editor");
    }

    return list.users
      .map((u) => ({
        id: u.id,
        email: u.email ?? "(no email)",
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        emailConfirmed: Boolean(u.email_confirmed_at),
        role: byUser.get(u.id) ?? ("none" as const),
      }))
      .sort((a, b) => a.email.localeCompare(b.email));
  });

async function applyRole(targetId: string, role: StaffRole | "none") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (role !== "admin") {
    // Never allow the site to be left without an administrator.
    const { data: otherAdmins, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .neq("user_id", targetId);
    if (error) throw new Error(error.message);
    const { data: targetIsAdmin } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("role", "admin")
      .eq("user_id", targetId)
      .maybeSingle();
    if (targetIsAdmin && (otherAdmins ?? []).length === 0) {
      throw new Error("You can't remove the last administrator. Make someone else an admin first.");
    }
  }

  const { error: delError } = await supabaseAdmin
    .from("user_roles")
    .delete()
    .eq("user_id", targetId)
    .in("role", [...STAFF_ROLES]);
  if (delError) throw new Error(delError.message);

  if (role !== "none") {
    const { error: insError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: targetId, role });
    if (insError) throw new Error(insError.message);
  }
}

const setRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "editor", "none"]),
});

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => setRoleSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, context.supabase);
    await applyRole(data.userId, data.role);
    return { ok: true as const };
  });

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(["admin", "editor"]),
  redirectTo: z.string().url().max(500).optional(),
});

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inviteSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      ...(data.redirectTo ? { redirectTo: data.redirectTo } : {}),
    });
    if (error) throw new Error(error.message);
    if (!invited.user) throw new Error("The invitation could not be created.");

    await applyRole(invited.user.id, data.role);
    return { ok: true as const };
  });

async function emailOf(userId: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data.user?.email) throw new Error(error?.message ?? "User not found.");
  return data.user.email;
}

const userIdSchema = z.object({ userId: z.string().uuid() });

export const confirmUserEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => userIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

const passwordSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(8, "Use at least 8 characters.").max(72),
});

export const setUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => passwordSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Setting a password by hand also confirms the address, so the person can sign in at once.
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

const linkSchema = z.object({
  userId: z.string().uuid(),
  redirectTo: z.string().url().max(500).optional(),
});

export const sendPasswordResetEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => linkSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = await emailOf(data.userId);
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      ...(data.redirectTo ? { redirectTo: data.redirectTo } : {}),
    });
    if (error) throw new Error(error.message);
    return { ok: true as const, email };
  });

/** Creates a one-time sign-in link the admin can send by WhatsApp/SMS when email is slow. */
export const createAccessLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => linkSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = await emailOf(data.userId);
    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      ...(data.redirectTo ? { options: { redirectTo: data.redirectTo } } : {}),
    });
    if (error) throw new Error(error.message);
    return { ok: true as const, url: link.properties.action_link };
  });
