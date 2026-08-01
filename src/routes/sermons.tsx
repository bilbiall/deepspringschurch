import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Play } from "lucide-react";
import { pageMeta, SITE } from "@/lib/site";
import { PageHero, SectionHeading, EmptyState, ActionLink } from "@/components/ui-kit";
import { Reveal } from "@/components/Reveal";

export const Route = createFileRoute("/sermons")({
  head: () =>
    pageMeta({
      title: "Sermons | Deep Spring Church of the Nazarene",
      description:
        "Watch and listen to teaching from Deep Spring Church of the Nazarene in Glenn Heights, Texas. Browse by series, speaker, topic and Scripture.",
      path: "/sermons",
    }),
  component: Sermons,
});

type Sermon = {
  slug: string;
  title: string;
  speaker: string;
  series: string;
  scripture: string;
  date: string;
  summary: string;
};

/** Published sermons are managed by administrators. */
const SERMONS: Sermon[] = [];

const FILTERS = ["Series", "Speaker", "Year", "Topic", "Bible book"];

function Sermons() {
  const [query, setQuery] = useState("");

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
                <p className="eyebrow">Coming soon</p>
                <h3 className="mt-3 text-2xl">Our first message will appear here</h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Once services begin, the newest sermon will be featured here with video,
                  audio, Scripture references and downloadable notes.
                </p>
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
            {SERMONS.length === 0 ? (
              <EmptyState message="No sermons have been published yet. Filters and search will become active as messages are added to the library.">
                <ActionLink to="/plan-your-visit" size="sm">
                  Join Us Sunday
                </ActionLink>
              </EmptyState>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
