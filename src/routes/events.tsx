import { createFileRoute } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";
import { useState } from "react";
import { Calendar, MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";
import { pageMeta, SITE, DIRECTIONS_URL } from "@/lib/site";
import { PageHero, SectionHeading, EmptyState, ActionLink, ActionButton } from "@/components/ui-kit";
import { Reveal } from "@/components/Reveal";
import { GRAND_OPENING } from "@/content/church";
import { listPublishedEvents } from "@/lib/public-content.functions";
import { safeLoad } from "@/lib/safe-load";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export const Route = createFileRoute("/events")({
  head: () =>
    pageMeta({
      title: "Events and Calendar | Deep Spring Church of the Nazarene",
      description:
        "Upcoming events at Deep Spring Church of the Nazarene in Glenn Heights, Texas, including our Grand Opening on November 1 and Sunday services at 10:30 AM.",
      path: "/events",
    }),
  loader: () => safeLoad(() => listPublishedEvents(), []),
  component: Events,
});

function Events() {
  const events = Route.useLoaderData() as EventRow[];
  const [view, setView] = useState<"list" | "month">("list");

  const share = async () => {
    const url = `${SITE.domain}/events`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${GRAND_OPENING.title} — ${SITE.shortName}`, url });
        return;
      } catch {
        /* user dismissed */
      }
    }
    await navigator.clipboard?.writeText(url);
    toast.success("Event link copied to your clipboard");
  };

  return (
    <>
      <PageHero
        eyebrow="Events and calendar"
        title="What is coming up at Deep Spring"
        intro="Sunday services begin at 10:30 AM each week. Additional events will be published here as they are scheduled."
      />

      <section className="section-y bg-background">
        <div className="container-page">
          <Reveal>
            <article id="grand-opening" className="card-soft scroll-mt-28 overflow-hidden">
              <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                <div className="flex flex-col items-center justify-center bg-primary p-10 text-primary-foreground">
                  <Calendar className="h-5 w-5" aria-hidden="true" />
                  <p className="mt-3 font-display text-2xl">November</p>
                  <p className="font-display text-5xl leading-none">4</p>
                  <p className="mt-3 text-[0.65rem] tracking-[0.16em] uppercase opacity-80">
                    2026
                  </p>
                </div>
                <div className="p-8 md:p-10">
                  <p className="eyebrow">Featured event</p>
                  <h2 className="mt-3 text-3xl md:text-4xl">{GRAND_OPENING.title}</h2>
                  <div className="rule-gold mt-5" />
                  <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">
                    {GRAND_OPENING.description}
                  </p>
                  <address className="mt-6 flex gap-3 text-sm leading-relaxed text-foreground/85 not-italic">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>
                      Deep Spring Church
                      <br />
                      {SITE.address.line1}
                      <br />
                      {SITE.address.city}, {SITE.address.state} {SITE.address.zip}
                    </span>
                  </address>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <ActionLink to="/plan-your-visit">Plan Your Visit</ActionLink>
                    <ActionLink
                      href={DIRECTIONS_URL}
                      target="_blank"
                      rel="noreferrer noopener"
                      variant="outline"
                    >
                      Get Directions
                    </ActionLink>
                    <ActionButton variant="quiet" onClick={share}>
                      <Share2 className="h-4 w-4" aria-hidden="true" />
                      Share Event
                    </ActionButton>
                  </div>
                  <p className="mt-6 text-xs text-muted-foreground">
                    Calendar downloads for Google Calendar and Apple Calendar will be enabled
                    soon.
                  </p>
                </div>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      <section className="section-y bg-cream">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="All events" title="Calendar" />
            <div
              className="inline-flex rounded-full border border-border bg-background p-1"
              role="group"
              aria-label="Calendar view"
            >
              {(["list", "month"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wide uppercase transition-colors ${
                    view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {v === "list" ? "List view" : "Month view"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10">
            {view === "list" ? (
              <ul className="space-y-4">
                <li className="card-soft card-hover flex flex-wrap items-center justify-between gap-6 p-7">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                      Every Sunday
                    </p>
                    <h3 className="mt-2 text-xl">Sunday Morning Service</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      10:30 AM · {SITE.addressOneLine} · Casual dress welcome
                    </p>
                  </div>
                  <ActionLink to="/plan-your-visit" variant="outline" size="sm">
                    Plan Your Visit
                  </ActionLink>
                </li>
                <li className="card-soft card-hover flex flex-wrap items-center justify-between gap-6 p-7">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                      November 1
                    </p>
                    <h3 className="mt-2 text-xl">Grand Opening</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Deep Spring Church · {SITE.address.city}, {SITE.address.state}
                    </p>
                  </div>
                  <ActionLink href="#grand-opening" variant="outline" size="sm">
                    View Details
                  </ActionLink>
                </li>
                {events.map((ev) => (
                  <li
                    key={ev.id}
                    className="card-soft card-hover flex flex-wrap items-center justify-between gap-6 p-7"
                  >
                    <div>
                      <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                        {ev.starts_at
                          ? new Date(ev.starts_at).toLocaleString("en-US", {
                              month: "long",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : "Date to be confirmed"}
                      </p>
                      <h3 className="mt-2 text-xl">{ev.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[ev.location ?? SITE.addressOneLine, ev.category].filter(Boolean).join(" · ")}
                      </p>
                      {ev.description ? (
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                          {ev.description}
                        </p>
                      ) : null}
                    </div>
                    {ev.registration_url ? (
                      <ActionLink
                        href={ev.registration_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        variant="outline"
                        size="sm"
                      >
                        Register
                      </ActionLink>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Month view"
                message="A full month calendar will appear here once recurring and scheduled events have been added by an administrator."
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
