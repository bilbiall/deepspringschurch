/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  CONTENT_TABLES,
  SUBMISSION_TABLES,
  type ContentTable,
  type FieldDef,
  type SubmissionTable,
} from "./config";
import { PaymentSettingsPanel } from "./PaymentSettingsPanel";
import { GivingReportsPanel } from "./GivingReportsPanel";

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

function SubmissionsPanel({ table }: { table: SubmissionTable }) {
  const { rows, loading, error, reload } = useRows(table.key, table.orderBy);

  async function updateStatus(id: string, status: string) {
    const { error } = await db.from(table.key).update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Status updated");
      void reload();
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">No entries yet.</p>;

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <article key={row["id"]} className="card-soft p-6">
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

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: any;
  onChange: (v: any) => void;
}) {
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
      ...(isAdmin
        ? [
            { id: "giving-reports", label: "Giving Reports", kind: "reports" as const },
            { id: "payment-settings", label: "Payment Settings", kind: "payment-settings" as const },
          ]
        : []),
    ],
    [isAdmin],
  );
  const [active, setActive] = useState(tabs[0]!.id);
  const current = tabs.find((t) => t.id === active)!;

  return (
    <div className="min-h-screen bg-cream pt-28 pb-24">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Admin dashboard</p>
            <h1 className="mt-3 font-display text-3xl text-ink md:text-4xl">
              Deep Spring control centre
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Signed in as {email}</p>
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
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={cn(
                "rounded-full px-5 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors",
                active === t.id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-foreground/75 hover:text-primary",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <section className="mt-10">
          {current.kind === "content" ? (
            <ContentPanel
              key={current.id}
              table={CONTENT_TABLES.find((t) => t.key === current.id)!}
            />
          ) : current.kind === "submission" ? (
            <SubmissionsPanel
              key={current.id}
              table={SUBMISSION_TABLES.find((t) => t.key === current.id)!}
            />
          ) : current.kind === "reports" ? (
            <GivingReportsPanel key={current.id} />
          ) : (
            <PaymentSettingsPanel key={current.id} />
          )}
        </section>
      </div>
    </div>
  );
}
