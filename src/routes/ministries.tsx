import { createFileRoute } from "@tanstack/react-router";
import { pageMeta, SITE } from "@/lib/site";
import { PageHero, ActionLink, SectionHeading } from "@/components/ui-kit";
import { Reveal } from "@/components/Reveal";
import { MINISTRIES } from "@/content/church";

export const Route = createFileRoute("/ministries")({
  head: () =>
    pageMeta({
      title: "Ministries | Deep Spring Church of the Nazarene",
      description:
        "Children’s ministry, Connection Groups, prayer, worship, community service, mentoring, families, missions and young adults at Deep Spring Church in Glenn Heights, Texas.",
      path: "/ministries",
    }),
  component: Ministries,
});

function Ministries() {
  return (
    <>
      <PageHero
        eyebrow="Ministries"
        title="Ways to belong, grow and serve"
        intro="Deep Spring is intentionally relational rather than program-heavy. These are the areas where we are beginning to gather, grow and serve together."
      >
        <ActionLink to="/contact">Ask About Serving</ActionLink>
        <ActionLink to="/plan-your-visit" variant="outline">
          Plan Your Visit
        </ActionLink>
      </PageHero>

      <section className="section-y bg-background">
        <div className="container-page">
          <SectionHeading
            eyebrow="Our ministries"
            title="Details are being prepared"
            intro="We do not publish meeting times or ministry leaders until they are confirmed. Each ministry below will be updated as details are set."
          />
          <ul className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {MINISTRIES.map((m, i) => (
              <Reveal as="li" key={m.slug} delay={(i % 3) * 0.08}>
                <div className="card-soft card-hover flex h-full flex-col p-8">
                  <h3 className="text-xl">{m.name}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {m.description}
                  </p>
                  <dl className="mt-6 space-y-1.5 border-t border-border pt-5 text-xs text-muted-foreground">
                    <div className="flex justify-between gap-4">
                      <dt>Leader</dt>
                      <dd className="text-right">Details coming soon.</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Meets</dt>
                      <dd className="text-right">Details coming soon.</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Location</dt>
                      <dd className="text-right">Details coming soon.</dd>
                    </div>
                  </dl>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <ActionLink to="/contact" size="sm">
                      Join
                    </ActionLink>
                    <ActionLink to="/contact" variant="outline" size="sm">
                      Volunteer
                    </ActionLink>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-y bg-cream">
        <div className="container-page text-center">
          <h2 className="mx-auto max-w-2xl text-3xl md:text-4xl">
            Not sure where you fit? That is a good place to start.
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted-foreground">
            Tell us a little about your gifts, interests or availability and we will help you
            find a place to serve.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ActionLink to="/contact">Contact the Church</ActionLink>
            <ActionLink href={SITE.phoneHref} variant="outline">
              Call {SITE.phone}
            </ActionLink>
          </div>
        </div>
      </section>
    </>
  );
}
