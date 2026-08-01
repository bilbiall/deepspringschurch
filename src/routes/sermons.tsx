import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Play } from "lucide-react";
import { pageMeta, SITE } from "@/lib/site";
import { PageHero, SectionHeading, EmptyState, ActionLink } from "@/components/ui-kit";
import { Reveal } from "@/components/Reveal";
import { listPublishedSermons } from "@/lib/public-content.functions";

export const Route = createFileRoute("/sermons")({
  head: () =>
    pageMeta({
      title: "Sermons | Deep Spring Church of the Nazarene",
      description:
        "Watch and listen to teaching from Deep Spring Church of the Nazarene in Glenn Heights, Texas. Browse by series, speaker, topic and Scripture.",
      path: "/sermons",
    }),
  loader: () => listPublishedSermons(),
  component: Sermons,
});

const FILTERS = ["Series", "Speaker", "Year", "Topic", "Bible book"];

function Sermons() {
  const sermons = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = sermons.filter((s) =>
    [s.title, s.speaker, s.series, s.scripture].filter(Boolean).join(" ").toLowerCase().includes(q),
  );
  const featured = sermons[0];

  return (
    <>
      <PageHero
        eyebrow="Sermons"
        title="Teaching for everyday life"
        intro="Practical, Scripture-centred messages from our Sunday gatherings. Recordings will be published here as our services begin."
      >
        <ActionLink to="/plan-your-visit">Plan Your Visit</ActionLink>
      </PageHero>

      <section className="section-y bg-background">
        <div className="container-page">
          <SectionHeading eyebrow="Featured" title="Latest message" />
          <Reveal>
            <div className="card-soft mt-10 grid gap-8 overflow-hidden md:grid-cols-2">
              <div className="flex aspect-video items-center justify-center bg-cream">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300">
                  <Play className="h-6 w-6" aria-hidden="true" />
                </span>
              </div>
              <div className="p-8">
                <p className="eyebrow">{featured ? "Most recent" : "Coming soon"}</p>
                <h3 className="mt-3 text-2xl">
                  {featured ? featured.title : "Our first message will appear here"}
                </h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {featured
                    ? (featured.description ??
                      [featured.speaker, featured.scripture].filter(Boolean).join(" · "))
                    : "Once services begin, the newest sermon will be featured here with video, audio, Scripture references and downloadable notes."}
                </p>
                {featured?.video_url || featured?.audio_url ? (
                  <p className="mt-5">
                    <ActionLink
                      href={(featured.video_url ?? featured.audio_url)!}
                      target="_blank"
                      rel="noreferrer noopener"
                      size="sm"
                    >
                      Watch or listen
                    </ActionLink>
                  </p>
                ) : null}
                <p className="mt-6 text-sm text-muted-foreground">
                  Join us Sunday at {SITE.serviceTime} · {SITE.addressOneLine}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-y bg-cream">
        <div className="container-page">
          <SectionHeading eyebrow="Sermon library" title="Browse and search" />

          <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <label htmlFor="sermon-search" className="sr-only">
                Search sermons
              </label>
              <Search
                className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="sermon-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, speaker or Scripture"
                className="w-full rounded-full border border-input bg-background py-3 pr-4 pl-11 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <ul className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <li key={f}>
                  <button
                    type="button"
                    disabled
                    className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase disabled:opacity-70"
                  >
                    {f}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10">
            {results.length === 0 ? (
              <EmptyState message="No sermons have been published yet. Filters and search will become active as messages are added to the library.">
                <ActionLink to="/plan-your-visit" size="sm">
                  Join Us Sunday
                </ActionLink>
              </EmptyState>
            ) : (
              <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {results.map((s) => (
                  <li key={s.id} className="card-soft card-hover flex h-full flex-col p-7">
                    {s.series ? <p className="eyebrow">{s.series}</p> : null}
                    <h3 className="mt-2 text-xl">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {[s.speaker, s.scripture].filter(Boolean).join(" · ")}
                    </p>
                    {s.description ? (
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {s.description}
                      </p>
                    ) : null}
                    <p className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">
                      {s.preached_on
                        ? new Date(s.preached_on).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : ""}
                    </p>
                    {s.video_url || s.audio_url ? (
                      <div className="mt-5">
                        <ActionLink
                          href={(s.video_url ?? s.audio_url)!}
                          target="_blank"
                          rel="noreferrer noopener"
                          variant="outline"
                          size="sm"
                        >
                          Watch or listen
                        </ActionLink>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
