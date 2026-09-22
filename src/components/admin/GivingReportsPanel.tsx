import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { CalendarIcon, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type DonationRow = {
  id: string;
  created_at: string;
  donor_name: string | null;
  donor_email: string | null;
  fund: string;
  frequency: string;
  amount_cents: number;
  status: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function toCsv(rows: DonationRow[]) {
  const header = ["Date", "Donor", "Email", "Fund", "Frequency", "Amount", "Status"];
  const lines = rows.map((r) =>
    [
      new Date(r.created_at).toISOString(),
      r.donor_name ?? "Anonymous",
      r.donor_email ?? "",
      r.fund,
      r.frequency,
      (r.amount_cents / 100).toFixed(2),
      r.status,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function GivingReportsPanel() {
  const [range, setRange] = useState<{ from: Date; to: Date }>(() => {
    const to = new Date();
    const from = new Date(to.getTime() - 29 * DAY_MS);
    return { from, to };
  });
  const [fund, setFund] = useState("all");
  const [rows, setRows] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const endOfDay = new Date(range.to);
    endOfDay.setHours(23, 59, 59, 999);
    void supabase
      .from("donations")
      .select("id, created_at, donor_name, donor_email, fund, frequency, amount_cents, status")
      .gte("created_at", range.from.toISOString())
      .lte("created_at", endOfDay.toISOString())
      .order("created_at", { ascending: false })
      .limit(2000)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error(error.message);
        else setRows(data ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const funds = useMemo(() => Array.from(new Set(rows.map((r) => r.fund))).sort(), [rows]);
  const filtered = useMemo(
    () => (fund === "all" ? rows : rows.filter((r) => r.fund === fund)),
    [rows, fund],
  );
  const succeeded = useMemo(() => filtered.filter((r) => r.status === "succeeded"), [filtered]);
  const totalCents = useMemo(
    () => succeeded.reduce((sum, r) => sum + r.amount_cents, 0),
    [succeeded],
  );
  const recurringCount = useMemo(
    () => succeeded.filter((r) => r.frequency !== "one-time").length,
    [succeeded],
  );
  const chartData = useMemo(() => {
    const byFund = new Map<string, number>();
    for (const r of succeeded) byFund.set(r.fund, (byFund.get(r.fund) ?? 0) + r.amount_cents);
    return Array.from(byFund.entries()).map(([name, cents]) => ({ name, total: cents / 100 }));
  }, [succeeded]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
              >
                <CalendarIcon className="h-4 w-4" aria-hidden="true" />
                {range.from.toLocaleDateString()} – {range.to.toLocaleDateString()}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={range}
                onSelect={(next) => {
                  if (next?.from && next?.to) setRange({ from: next.from, to: next.to });
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Select value={fund} onValueChange={setFund}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All funds</SelectItem>
              {funds.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={() =>
            downloadCsv(
              toCsv(filtered),
              `giving-${range.from.toISOString().slice(0, 10)}-to-${range.to
                .toISOString()
                .slice(0, 10)}.csv`,
            )
          }
          disabled={filtered.length === 0}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold tracking-wider text-primary-foreground uppercase disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-soft p-6">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Total raised
              </p>
              <p className="mt-2 font-display text-2xl text-ink">{formatMoney(totalCents)}</p>
            </div>
            <div className="card-soft p-6">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Gifts received
              </p>
              <p className="mt-2 font-display text-2xl text-ink">{succeeded.length}</p>
            </div>
            <div className="card-soft p-6">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Recurring gifts
              </p>
              <p className="mt-2 font-display text-2xl text-ink">{recurringCount}</p>
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="card-soft p-6">
              <p className="mb-4 text-sm font-semibold text-ink">Total by fund</p>
              <ChartContainer config={{ total: { label: "Total", color: "oklch(0.46 0.072 214)" } }}>
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={60} tickFormatter={(v) => `$${v}`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                </BarChart>
              </ChartContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No succeeded gifts in this range yet.</p>
          )}
        </>
      )}
    </div>
  );
}
