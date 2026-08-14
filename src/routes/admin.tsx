/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import logo from "@/assets/deep-spring-logo-mark.png.asset.json";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Sign In | Deep Spring Church" },
      { name: "description", content: "Private staff area for Deep Spring Church." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminRoute,
});

type State = "loading" | "signed-out" | "no-access" | "ready";

function AdminRoute() {
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const check = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      setState("signed-out");
      return;
    }
    setUserEmail(user.email ?? "");
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roleNames = (roles ?? []).map((r: any) => r.role);
    setIsAdmin(roleNames.includes("admin"));
    const isStaff = roleNames.includes("admin") || roleNames.includes("editor");
    setState(isStaff ? "ready" : "no-access");
  }, []);

  useEffect(() => {
    void check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void check();
    });
    return () => sub.subscription.unsubscribe();
  }, [check]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setBusy(false);
      if (error) toast.error(error.message);
      else toast.success("Account created. Check your email to confirm, then sign in.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      setPassword("");
      void check();
    }
  }

  async function claimAdmin() {
    setBusy(true);
    const { data, error } = await (supabase as any).rpc("claim_first_admin");
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data === true) {
      toast.success("You are now the site administrator.");
      void check();
    } else {
      toast.error("An administrator already exists. Ask them to grant you access.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setState("signed-out");
  }

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (state === "ready") {
    return <AdminDashboard email={userEmail} isAdmin={isAdmin} onSignOut={signOut} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-24">
      <div className="w-full max-w-md">
        <div className="card-soft p-8">
          <img
            src={logo.url}
            alt="Deep Spring Church logo"
            width={64}
            height={64}
            className="mx-auto h-16 w-16 object-contain"
          />
          <h1 className="mt-6 text-center font-display text-2xl text-ink">
            {state === "no-access" ? "Access required" : "Staff sign in"}
          </h1>

          {state === "no-access" ? (
            <div className="mt-6 space-y-5 text-center">
              <p className="text-sm text-muted-foreground">
                You are signed in as {userEmail}, but this account does not have staff
                access yet.
              </p>
              <button
                type="button"
                onClick={() => void claimAdmin()}
                disabled={busy}
                className="w-full rounded-full bg-primary px-6 py-3 text-xs font-semibold tracking-wider text-primary-foreground uppercase disabled:opacity-60"
              >
                Claim administrator access
              </button>
              <p className="text-xs text-muted-foreground">
                This works only for the very first administrator. After that, an existing
                administrator must grant access.
              </p>
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-xs font-semibold tracking-wider text-primary uppercase"
              >
                Sign out
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                  >
                    Email
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="admin-password"
                    className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                  >
                    Password
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-primary px-6 py-3 text-xs font-semibold tracking-wider text-primary-foreground uppercase disabled:opacity-60"
                >
                  {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
                </button>
              </form>
              <button
                type="button"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                className="mt-5 w-full text-center text-xs font-semibold tracking-wider text-primary uppercase"
              >
                {mode === "signup"
                  ? "Already have an account? Sign in"
                  : "Set up the first staff account"}
              </button>
            </>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          This area is for Deep Spring Church staff only.
        </p>
      </div>
    </div>
  );
}
