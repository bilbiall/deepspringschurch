import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { pageMeta } from "@/lib/site";
import { PageHero, SectionHeading, EmptyState, ActionLink } from "@/components/ui-kit";

export const Route = createFileRoute("/blog")({
  head: () =>
    pageMeta({
      title: "Blog and Resources | Deep Spring Church of the Nazarene",
      description:
        "Articles and resources on faith, spiritual growth, community, relationships, family, prayer and discipleship from Deep Spring Church of the Nazarene.",
      path: "/blog",
    }),
  component: Blog,
});

const CATEGORIES = [
  "Faith and Spiritual Growth",
  "Community",
  "Relationships",
  "Family",
  "Prayer",
  "Discipleship",
  "Church News",
  "Resources",
];

type Post = { slug: string; title: string; excerpt: string; category: string; date: string };
const POSTS: Post[] = [];

function Blog() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);

  return (
    <>
      <PageHero
        eyebrow="Blog and resources"
        title="Encouragement for the journey"
        intro="Short, honest writing on faith, prayer, relationships and everyday discipleship. Our first articles are being written."
      />

      <section className="section-y bg-background">
        <div className="container-page">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <label htmlFor="post-search" className="sr-only">
                Search articles
              </label>
              <Search
                className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="post-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles"
                className="w-full rounded-full border border-input bg-background py-3 pr-4 pl-11 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <ul className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() => setActive(active === c ? null : c)}
                    aria-pressed={active === c}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                      active === c
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-cream text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12">
            {POSTS.length === 0 ? (
              <EmptyState
                title="No articles published yet"
                message="Deep Spring has not published its first article. Rather than fill this page with placeholder writing, we are leaving it open until there is something worth reading."
              >
                <ActionLink to="/contact" variant="outline" size="sm">
                  Suggest a Topic
                </ActionLink>
              </EmptyState>
            ) : null}
          </div>

          <div className="mt-16">
            <SectionHeading
              eyebrow="In the meantime"
              title="Other places to start"
              align="center"
            />
            <ul className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-3">
              {[
                { title: "What we believe", to: "/beliefs", body: "Six short statements about the faith we share." },
                { title: "Connection Groups", to: "/connection-groups", body: "How three to five people can change a season of life." },
                { title: "Plan your visit", to: "/plan-your-visit", body: "Everything you need before your first Sunday." },
              ].map((c) => (
                <li key={c.to} className="card-soft card-hover p-7">
                  <h3 className="text-lg">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                  <div className="mt-5">
                    <ActionLink to={c.to} variant="quiet" size="sm">
                      Read more →
                    </ActionLink>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
