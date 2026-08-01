import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import groupsImage from "@/assets/connection-groups.jpg";
import { pageMeta, SITE } from "@/lib/site";
import { PageHero, SectionHeading, EmptyState, ActionLink } from "@/components/ui-kit";
import { Reveal } from "@/components/Reveal";
import { listPublishedGroups } from "@/lib/public-content.functions";

export const Route = createFileRoute("/connection-groups")({
  head: () =>
    pageMeta({
      title: "Connection Groups | Deep Spring Church of the Nazarene",
      description:
        "Connection Groups are small groups of three to five people at Deep Spring Church, built for deep relationships, prayer, honest conversation and growth in Christ.",
      path: "/connection-groups",
    }),
  loader: () => listPublishedGroups(),
  component: ConnectionGroups,
});

function ConnectionGroups() {
  const groups = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const results = useMemo(
    () =>
      groups.filter((g) =>
        [g.name, g.host_name, g.age_focus, g.meeting_day, g.location]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [groups, query],
  );

  return (
    <>
      <PageHero
        eyebrow="Connection Groups"
        title="Life is better in community"
        intro="Connection Groups are small groups of approximately three to five people designed to encourage deep relationships, spiritual growth, prayer, honest conversation and growth in Christ."
      >
        <ActionLink href={SITE.phoneHref}>Call {SITE.phone}</ActionLink>
        <ActionLink to="/contact" variant="outline">
          Ask About a Group
        </ActionLink>
      </PageHero>

      <section className="section-y bg-background">
        <div className="container-page grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <SectionHeading
              eyebrow="Why small"
              title="Small enough to be honest"
              intro="Three to five people is small enough that nobody disappears. Groups may meet at different times and may be organized for different ages and life stages."
            />
            <p className="mt-6 leading-relaxed text-muted-foreground">
              A Connection Group is not a class or a program. It is a few people who agree to
              walk together for a season — praying, reading Scripture, telling the truth about
              life, and showing up for one another.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="overflow-hidden rounded-3xl border border-border">
              <img
                src={groupsImage}
                alt="A small group of adults talking together with open Bibles"
                width={1408}
                height={1008}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.03]"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-y bg-cream">
        <div className="container-page">
          <SectionHeading eyebrow="Group directory" title="Find a group" />

          <div className="mt-8 max-w-md">
            <label htmlFor="group-search" className="sr-only">
              Search Connection Groups
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="group-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, day, leader or location"
                className="w-full rounded-full border border-input bg-background py-3 pr-4 pl-11 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-10">
            {results.length === 0 ? (
              <EmptyState message="Connection Group details are being prepared. Please contact the church to learn more.">
                <ActionLink href={SITE.phoneHref} size="sm">
                  Call {SITE.phone}
                </ActionLink>
                <ActionLink to="/contact" variant="outline" size="sm">
                  Send a Message
                </ActionLink>
              </EmptyState>
            ) : (
              <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {results.map((g) => (
                  <li key={g.id} className="card-soft card-hover p-7">
                    <h3 className="text-xl">{g.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {g.description}
                    </p>
                    <dl className="mt-5 space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between gap-3">
                        <dt>Leader</dt>
                        <dd>{g.leader}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Meets</dt>
                        <dd>
                          {g.day} · {g.time}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Location</dt>
                        <dd>{g.location}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Format</dt>
                        <dd>{g.meetingType}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Availability</dt>
                        <dd>{g.availability}</dd>
                      </div>
                    </dl>
                    <div className="mt-6">
                      <ActionLink to="/contact" size="sm">
                        Request to Join
                      </ActionLink>
                    </div>
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
