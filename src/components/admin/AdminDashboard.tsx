/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { UPLOAD_KINDS, uploadMedia, type UploadKind } from "@/lib/upload";
import {
  CONTENT_TABLES,
  SUBMISSION_TABLES,
  type ContentTable,
  type FieldDef,
  type SubmissionTable,
} from "./config";
import { UserManagementPanel } from "./UserManagementPanel";

const db = supabase as any;

type Row = Record<string, any>;

function formatValue(value: unknown, key?: string) {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "amount_cents" && typeof value === "number") {
    return (value / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).toLocaleString();
  }
  return String(value);
}

function inputClass() {
  return "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary";
}

function useRows(table: string, orderBy: { column: string; ascending: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await db
      .from(table)
      .select("*")
      .order(orderBy.column, { ascending: orderBy.ascending })
      .limit(500);
    if (error) setError(error.message);
    else {
      setError(null);
      setRows(data ?? []);
    }
    setLoading(false);
  }, [table, orderBy.column, orderBy.ascending]);

  useEffect(() => {
    void load();
  }, [load]);

  return { rows, loading, error, reload: load, setRows };
}

const TRACKED = SUBMISSION_TABLES.filter((t) => t.statusOptions);

/** Count of rows with status = 'new' per submission table; live via realtime, with a polling fallback. */
function useNewCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  const refresh = useCallback(async () => {
    const results = await Promise.all(
      TRACKED.map(async (t) => {
        const { count } = await db
          .from(t.key)
          .select("id", { count: "exact", head: true })
          .eq("status", "new");
        return [t.key, count ?? 0] as const;
      }),
    );
    setCounts(Object.fromEntries(results));
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    const channel = db.channel("admin-new-submissions");
    for (const t of TRACKED) {
      channel.on("postgres_changes", { event: "*", schema: "public", table: t.key }, () =>
        void refresh(),
      );
    }
    channel.subscribe();
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      void db.removeChannel(channel);
    };
  }, [refresh]);

  return { counts, refresh };
}

function SubmissionsPanel({
  table,
  onChanged,
}: {
  table: SubmissionTable;
  onChanged: () => void;
}) {
  const { rows, loading, error, reload } = useRows(table.key, table.orderBy);

  async function updateStatus(id: string, status: string) {
    const { error } = await db.from(table.key).update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Status updated");
      void reload();
      onChanged();
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">No entries yet.</p>;

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <article
          key={row["id"]}
          className={cn(
            "card-soft p-6",
            table.statusOptions && (row["status"] ?? "new") === "new" && "border-l-4 border-l-gold",
          )}
        >
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {table.columns.map((c) => (
              <div key={c.name}>
                <dt className="text-[0.65rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  {c.label}
                </dt>
                <dd className="mt-1 text-sm break-words text-foreground">
                  {formatValue(row[c.name], c.name)}
                </dd>
              </div>
            ))}
          </dl>
          {table.statusOptions ? (
            <div className="mt-5 flex items-center gap-3">
              <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Status
              </label>
              <select
                value={row["status"] ?? "new"}
                onChange={(e) => void updateStatus(row["id"], e.target.value)}
                className="rounded-full border border-border bg-background px-4 py-1.5 text-sm"
              >
                {table.statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function UploadField({
  field,
  kind,
  value,
  onChange,
}: {
  field: FieldDef;
  kind: UploadKind;
  value: any;
  onChange: (v: any) => void;
}) {
  const [busy, setBusy] = useState(false);
  const cfg = UPLOAD_KINDS[kind];
  const url = typeof value === "string" ? value : "";

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadMedia(file, kind));
      toast.success("Uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label
        htmlFor={field.name}
        className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground uppercase"
      >
        {field.label}
        {field.required ? " *" : ""}
      </label>
      <div className="flex gap-2">
        <input
          id={field.name}
          type="text"
          value={url}
          required={field.required}
          placeholder="Paste a link, or upload →"
          onChange={(e) => onChange(e.target.value)}
          className={inputClass()}
        />
        <label
          className={cn(
            "inline-flex shrink-0 cursor-pointer items-center rounded-xl border border-primary/35 px-4 text-xs font-semibold text-primary",
            busy && "pointer-events-none opacity-60",
          )}
        >
          {busy ? "Uploading…" : "Upload"}
          <input type="file" accept={cfg.accept} onChange={onPick} className="sr-only" />
        </label>
      </div>
      <p className="mt-1 text-[0.7rem] text-muted-foreground">Max {cfg.maxMB} MB.</p>
      {url && kind === "image" ? (
        <img src={url} alt="" className="mt-2 h-24 rounded-lg border border-border object-cover" />
      ) : null}
      {url && kind === "audio" ? <audio src={url} controls className="mt-2 w-full" /> : null}
      {url && kind === "file" ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-2 inline-block text-xs text-primary underline"
        >
          View current file
        </a>
      ) : null}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: any;
  onChange: (v: any) => void;
}) {
  if (field.type === "image" || field.type === "audio" || field.type === "file") {
    return <UploadField field={field} kind={field.type} value={value} onChange={onChange} />;
  }
  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        {field.label}
      </label>
    );
  }
  const common = {
    id: field.name,
    value: value ?? "",
    required: field.required,
    placeholder: field.placeholder,
    className: inputClass(),
    onChange: (e: any) => onChange(e.target.value),
  };
  return (
    <div>
      <label
        htmlFor={field.name}
        className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground uppercase"
      >
        {field.label}
        {field.required ? " *" : ""}
      </label>
      {field.type === "textarea" ? (
        <textarea rows={4} {...common} />
      ) : (
        <input
          type={
            field.type === "date"
              ? "date"
              : field.type === "datetime"
                ? "datetime-local"
                : field.type === "number"
                  ? "number"
                  : "text"
          }
          {...common}
        />
      )}
    </div>
  );
}

function ContentPanel({ table }: { table: ContentTable }) {
  const { rows, loading, error, reload } = useRows(table.key, table.orderBy);
  const [form, setForm] = useState<Row>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  function buildPayload() {
    const payload: Row = {};
    for (const f of table.fields) {
      let v = form[f.name];
      if (f.type === "checkbox") v = Boolean(v);
      else if (v === "" || v === undefined) v = null;
      else if (f.type === "number") v = Number(v);
      else if (f.type === "datetime" && typeof v === "string")
        v = new Date(v).toISOString();
      payload[f.name] = v;
    }
    return payload;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = buildPayload();
    const { error } = editingId
      ? await db.from(table.key).update(payload).eq("id", editingId)
      : await db.from(table.key).insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editingId ? "Saved" : "Created");
    setForm({});
    setEditingId(null);
    setShowForm(false);
    void reload();
  }

  async function togglePublish(row: Row) {
    const { error } = await db
      .from(table.key)
      .update({ is_published: !row["is_published"] })
      .eq("id", row["id"]);
    if (error) toast.error(error.message);
    else void reload();
  }

  async function remove(row: Row) {
    if (!window.confirm("Delete this item permanently?")) return;
    const { error } = await db.from(table.key).delete().eq("id", row["id"]);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      void reload();
    }
  }

  function startEdit(row: Row) {
    const next: Row = {};
    for (const f of table.fields) {
      const v = row[f.name];
      next[f.name] =
        f.type === "datetime" && typeof v === "string" ? v.slice(0, 16) : (v ?? "");
    }
    setForm(next);
    setEditingId(row["id"]);
    setShowForm(true);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {rows.length} {table.label.toLowerCase()}
        </p>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm({});
            setShowForm((v) => !v);
          }}
          className="rounded-full bg-primary px-5 py-2.5 text-xs font-semibold tracking-wider text-primary-foreground uppercase"
        >
          {showForm ? "Close form" : `New ${table.label.replace(/s$/, "").toLowerCase()}`}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={save} className="card-soft space-y-5 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            {table.fields.map((f) => (
              <div key={f.name} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                <FieldInput
                  field={f}
                  value={form[f.name]}
                  onChange={(v) => setForm((p) => ({ ...p, [f.name]: v }))}
                />
              </div>
            ))}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-primary px-6 py-3 text-xs font-semibold tracking-wider text-primary-foreground uppercase disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Save changes" : "Create"}
          </button>
        </form>
      ) : null}

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!loading && rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here yet.</p>
      ) : null}

      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={row["id"]}
            className="card-soft flex flex-wrap items-center justify-between gap-4 p-5"
          >
            <div className="min-w-0">
              <p className="font-display text-lg text-ink">{row[table.titleField]}</p>
              <p className="mt-1 text-xs text-muted-foreground">{table.subtitle(row)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-[0.65rem] font-semibold tracking-wider uppercase",
                  row["is_published"]
                    ? "bg-accent text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {row["is_published"] ? "Published" : "Draft"}
              </span>
              <button
                type="button"
                onClick={() => void togglePublish(row)}
                className="rounded-full border border-primary/35 px-4 py-1.5 text-xs font-semibold text-primary"
              >
                {row["is_published"] ? "Unpublish" : "Publish"}
              </button>
              <button
                type="button"
                onClick={() => startEdit(row)}
                className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-foreground"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void remove(row)}
                className="rounded-full border border-destructive/40 px-4 py-1.5 text-xs font-semibold text-destructive"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminDashboard({
  email,
  isAdmin,
  onSignOut,
}: {
  email: string;
  isAdmin: boolean;
  onSignOut: () => void;
}) {
  const tabs = useMemo(
    () => [
      ...CONTENT_TABLES.map((t) => ({ id: t.key, label: t.label, kind: "content" as const })),
      ...SUBMISSION_TABLES.map((t) => ({
        id: t.key,
        label: t.label,
        kind: "submission" as const,
      })),
      ...(isAdmin ? [{ id: "users", label: "Users & Roles", kind: "users" as const }] : []),
    ],
    [isAdmin],
  );
  const [active, setActive] = useState(tabs[0]!.id);
  const current = tabs.find((t) => t.id === active)!;
  const { counts, refresh } = useNewCounts();
  const totalNew = Object.values(counts).reduce((a, b) => a + b, 0);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = totalNew > 0 ? `(${totalNew}) ${base}` : base;
    return () => {
      document.title = base;
    };
  }, [totalNew]);

  return (
    <div className="min-h-screen bg-cream pt-28 pb-24">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Admin dashboard</p>
            <h1 className="mt-3 font-display text-3xl text-ink md:text-4xl">
              Deep Spring control centre
            </h1>
<p className="mt-2 text-sm text-muted-foreground">
              Signed in as {email}
              {isAdmin ? " · Administrator" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold tracking-wider uppercase"
          >
            Sign out
          </button>
        </div>

        <nav className="mt-10 flex flex-wrap gap-2">
          {tabs.map((t) => {
            const n = counts[t.id] ?? 0;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(t.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors",
                  active === t.id
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-foreground/75 hover:text-primary",
                  n > 0 && active !== t.id && "admin-tab-glow",
                )}
              >
                {t.label}
                {n > 0 ? (
                  <span
                    aria-label={`${n} new`}
                    className="inline-flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 py-0.5 text-[0.65rem] leading-none font-bold text-ink"
                  >
                    {n}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <section className="mt-10">
          {current.kind === "content" ? (
            <ContentPanel
              key={current.id}
              table={CONTENT_TABLES.find((t) => t.key === current.id)!}
            />
          ) : current.kind === "users" ? (
            <UserManagementPanel key={current.id} currentEmail={email} />
          ) : (
            <SubmissionsPanel
              key={current.id}
              table={SUBMISSION_TABLES.find((t) => t.key === current.id)!}
              onChanged={() => void refresh()}
            />
          )}
        </section>
      </div>
    </div>
  );
}
