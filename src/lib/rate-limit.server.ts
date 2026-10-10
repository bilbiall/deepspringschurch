// Server-only. Tiny per-visitor allowance for public form endpoints, which save
// to the database and email staff and so are an obvious spam target. In-memory
// is enough: the app runs as a single Node process, and a restart only resets it.
import { getRequest } from "@tanstack/react-start/server";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_SUBMISSIONS = 6;
const hits = new Map<string, number[]>();

export function assertWithinRateLimit(): void {
  const request = getRequest();
  const forwarded = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = forwarded || request?.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_SUBMISSIONS) {
    throw new Error("Too many submissions. Please wait a few minutes and try again.");
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
}
