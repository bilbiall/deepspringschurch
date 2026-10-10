import { Fragment, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  confirmUserEmail,
  createAccessLink,
  inviteUser,
  listManagedUsers,
  sendPasswordResetEmail,
  setUserPassword,
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

  const [openId, setOpenId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

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

  async function runAction(user: ManagedUser, label: string, action: () => Promise<void>) {
    setBusyId(user.id);
    try {
      await action();
      toast.success(`${label}: ${user.email}`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That did not work");
    } finally {
      setBusyId(null);
    }
  }

  const redirectTo = () => `${window.location.origin}/admin`;

  async function copyLink(user: ManagedUser) {
    setBusyId(user.id);
    try {
      const { url } = await createAccessLink({
        data: { userId: user.id, redirectTo: redirectTo() },
      });
      await navigator.clipboard.writeText(url);
      toast.success("Sign-in link copied. Send it to them; it works once.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the link");
    } finally {
      setBusyId(null);
    }
  }

  const pending = users.filter((u) => u.role === "none");

  return (
    <div className="space-y-8">
      <div className="card-soft p-6 text-sm leading-relaxed text-muted-foreground">
        <p className="font-semibold text-ink">Who can use this dashboard</p>
        <p className="mt-1">
          <strong>Admins</strong> can do everything, including managing people here.{" "}
          <strong>Editors</strong> can manage content and submissions only. Anyone who creates an
          account on the sign-in page appears below with
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
                <th className="px-4 py-3 font-semibold">
                  <span className="sr-only">Account actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <Fragment key={u.id}>
                  <tr className="border-t border-border">
                    <td className="px-4 py-3 text-ink">
                      {u.email}
                      {u.email === currentEmail ? (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      ) : null}
                      {!u.emailConfirmed ? (
                        <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wider text-ink uppercase">
                          Not confirmed
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(u.lastSignInAt)}
                    </td>
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
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenId(openId === u.id ? null : u.id);
                          setNewPassword("");
                        }}
                        className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold tracking-wider uppercase hover:text-primary"
                      >
                        {openId === u.id ? "Close" : "Manage"}
                      </button>
                    </td>
                  </tr>
                  {openId === u.id ? (
                    <tr className="bg-cream">
                      <td colSpan={5} className="space-y-4 px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {!u.emailConfirmed ? (
                            <button
                              type="button"
                              disabled={busyId === u.id}
                              onClick={() =>
                                void runAction(u, "Email confirmed", () =>
                                  confirmUserEmail({ data: { userId: u.id } }).then(
                                    () => undefined,
                                  ),
                                )
                              }
                              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold tracking-wider text-primary-foreground uppercase disabled:opacity-60"
                            >
                              Confirm email now
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={busyId === u.id}
                            onClick={() =>
                              void runAction(u, "Reset email sent", () =>
                                sendPasswordResetEmail({
                                  data: { userId: u.id, redirectTo: redirectTo() },
                                }).then(() => undefined),
                              )
                            }
                            className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold tracking-wider uppercase disabled:opacity-60"
                          >
                            Email a reset link
                          </button>
                          <button
                            type="button"
                            disabled={busyId === u.id}
                            onClick={() => void copyLink(u)}
                            className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold tracking-wider uppercase disabled:opacity-60"
                          >
                            Copy sign-in link
                          </button>
                        </div>
                        <form
                          className="flex flex-wrap items-center gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            void runAction(u, "Password updated", async () => {
                              await setUserPassword({
                                data: { userId: u.id, password: newPassword },
                              });
                              setNewPassword("");
                            });
                          }}
                        >
                          <input
                            type="text"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password (8+ characters)"
                            autoComplete="off"
                            minLength={8}
                            required
                            className="min-w-64 rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                          />
                          <button
                            type="submit"
                            disabled={busyId === u.id}
                            className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold tracking-wider uppercase disabled:opacity-60"
                          >
                            Set password
                          </button>
                        </form>
                        <p className="text-xs text-muted-foreground">
                          Setting a password also confirms the email, so they can sign in right
                          away. Share the password privately and ask them to keep it safe.
                        </p>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
