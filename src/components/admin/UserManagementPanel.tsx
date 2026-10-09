import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  inviteUser,
  listManagedUsers,
  setUserRole,
  type ManagedUser,
} from "@/lib/user-management.functions";

type RoleChoice = "admin" | "editor" | "none";

const ROLE_LABELS: Record<RoleChoice, string> = {
  admin: "Admin",
  editor: "Editor",
  none: "No access",
};

function inputClass() {
  return "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary";
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function UserManagementPanel({ currentEmail }: { currentEmail: string }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor">("editor");
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await listManagedUsers());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeRole(user: ManagedUser, role: RoleChoice) {
    if (role === user.role) return;
    if (
      user.email === currentEmail &&
      role !== "admin" &&
      !window.confirm("You are changing your own access. Continue?")
    ) {
      return;
    }
    setBusyId(user.id);
    try {
      await setUserRole({ data: { userId: user.id, role } });
      toast.success(`${user.email}: ${ROLE_LABELS[role]}`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the role");
    } finally {
      setBusyId(null);
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      await inviteUser({
        data: {
          email: inviteEmail,
          role: inviteRole,
          redirectTo: `${window.location.origin}/admin`,
        },
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the invitation");
    } finally {
      setInviting(false);
    }
  }

  const pending = users.filter((u) => u.role === "none");

  return (
    <div className="space-y-8">
      <div className="card-soft p-6 text-sm leading-relaxed text-muted-foreground">
        <p className="font-semibold text-ink">Who can use this dashboard</p>
        <p className="mt-1">
          <strong>Admins</strong> can do everything, including payments, email settings, giving
          reports and managing people here. <strong>Editors</strong> can manage content and
          submissions only. Anyone who creates an account on the sign-in page appears below with
          <em> No access</em> until you give them a role.
        </p>
      </div>

      <form onSubmit={invite} className="card-soft space-y-4 p-6">
        <p className="text-sm font-semibold text-ink">Invite someone by email</p>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="name@example.com"
            className={inputClass()}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as "admin" | "editor")}
            className={inputClass()}
            aria-label="Role for the invited person"
          >
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="rounded-full bg-primary px-6 py-2.5 text-xs font-semibold tracking-wider text-primary-foreground uppercase disabled:opacity-60"
          >
            {inviting ? "Sending…" : "Send invite"}
          </button>
        </div>
      </form>

      {pending.length > 0 ? (
        <p className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink">
          {pending.length} {pending.length === 1 ? "account is" : "accounts are"} waiting for
          access. Set a role below to let them in.
        </p>
      ) : null}

      <div className="card-soft overflow-x-auto p-2">
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No accounts yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs tracking-wider text-muted-foreground uppercase">
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Last sign-in</th>
                <th className="px-4 py-3 font-semibold">Access</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3 text-ink">
                    {u.email}
                    {u.email === currentEmail ? (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(u.lastSignInAt)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) => void changeRole(u, e.target.value as RoleChoice)}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                      aria-label={`Access level for ${u.email}`}
                    >
                      <option value="admin">{ROLE_LABELS.admin}</option>
                      <option value="editor">{ROLE_LABELS.editor}</option>
                      <option value="none">{ROLE_LABELS.none}</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
