import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { pageMeta } from "@/lib/site";
import { PageHero, ActionLink } from "@/components/ui-kit";
import { Reveal } from "@/components/Reveal";
import { BELIEFS } from "@/content/church";

export const Route = createFileRoute("/beliefs")({
  head: () =>
    pageMeta({
      title: "What We Believe | Deep Spring Church of the Nazarene",
      description:
        "Our beliefs are grounded in Scripture, centred on Jesus Christ and shaped by the Wesleyan-Holiness tradition of the Church of the Nazarene.",
      path: "/beliefs",
    }),
  component: Beliefs,
});

function Beliefs() {
  return (
    <>
      <PageHero
        eyebrow="What we believe"
        title="Grounded in Scripture, centred on Jesus"
        intro="Our beliefs are grounded in Scripture, centred on Jesus Christ and shaped by the Wesleyan-Holiness tradition of the Church of the Nazarene."
      />

      <section className="section-y bg-background">
        <div className="container-page max-w-3xl">
          <Reveal>
            <Accordion type="single" collapsible defaultValue="belief-0" className="w-full">
              {BELIEFS.map((b, i) => (
                <AccordionItem
                  key={b.title}
                  value={`belief-${i}`}
                  className="border-b border-border"
                >
                  <AccordionTrigger className="py-6 text-left font-display text-xl text-ink hover:no-underline md:text-2xl">
                    <span className="flex items-baseline gap-4">
                      <span className="font-sans text-xs font-semibold tracking-widest text-gold">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {b.title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-8">
                    <p className="text-base leading-relaxed text-muted-foreground">{b.body}</p>
                    {b.references.length > 0 ? (
                      <ul className="mt-5 flex flex-wrap gap-2">
                        {b.references.map((r) => (
                          <li
                            key={r}
                            className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold tracking-wide text-accent-foreground"
                          >
                            {r}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="card-soft mt-14 bg-cream p-8 text-center">
              <h2 className="text-2xl">Want to go deeper?</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                The Church of the Nazarene publishes its full Articles of Faith and its
                worldwide mission online.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <ActionLink
                  href="https://nazarene.org/who-we-are/beliefs"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Learn More About the Church of the Nazarene
                </ActionLink>
                <ActionLink to="/contact" variant="outline">
                  Ask a Question
                </ActionLink>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
