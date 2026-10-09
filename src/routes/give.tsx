import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { pageMeta } from "@/lib/site";
import { PageHero, SectionHeading, ActionLink } from "@/components/ui-kit";
import { Reveal } from "@/components/Reveal";
import { GIVING_FUNDS } from "@/content/church";

const TITHELY_URL = "https://give.tithe.ly/?formId=d3b4c3ed-af75-48cc-b9af-21671bd1989a";

export const Route = createFileRoute("/give")({
  head: () =>
    pageMeta({
      title: "Give | Deep Spring Church of the Nazarene",
      description:
        "Support the mission and ministries of Deep Spring Church of the Nazarene through secure online giving.",
      path: "/give",
    }),
  component: GivePage,
});

const SCRIPTURES = [
  { ref: "2 Corinthians 9:6–8", line: "God loves a cheerful giver." },
  { ref: "Acts 20:35", line: "It is more blessed to give than to receive." },
  { ref: "Matthew 6:19–21", line: "Where your treasure is, there your heart will be also." },
];

function GivePage() {
  return (
    <>
      <PageHero
        eyebrow="Give"
        title="Generosity that serves people"
        intro="Your generosity helps Deep Spring create a place of rest, spiritual growth, meaningful relationships, compassionate service and Christ-centred ministry."
      >
        <ActionLink href="#giving-form">Give Online</ActionLink>
      </PageHero>

      <section className="section-y bg-background">
        <div className="container-page max-w-3xl">
          <Reveal>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Giving is one of the ways we worship God, support the work of the church, care for
              people in need and participate in what God is doing within our community and beyond.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              At Deep Spring Church of the Nazarene, giving should always be voluntary, prayerful
              and handled with integrity. No visitor should feel pressured to give.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="giving-form" className="section-y bg-cream">
        <div className="container-page max-w-3xl">
          <SectionHeading
            eyebrow="Give securely"
            title="Make a gift"
            intro="Complete your gift below. Giving is processed securely by Tithe.ly — the church never sees or stores your card or bank details."
          />

          <Reveal>
            <div className="card-soft mt-10 overflow-hidden p-2 sm:p-4">
              <iframe
                src={TITHELY_URL}
                title="Deep Spring Church online giving form"
                className="h-[900px] w-full rounded-xl border-0"
                allow="payment"
                loading="lazy"
              />
            </div>
          </Reveal>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Encrypted connection · No card details stored by the church
            </span>
            <ActionLink href={TITHELY_URL} target="_blank" rel="noreferrer" variant="outline">
              Open the giving form in a new tab ↗
            </ActionLink>
          </div>
        </div>
      </section>

      <section className="section-y bg-background">
        <div className="container-page">
          <SectionHeading
            eyebrow="Why we give"
            title="An act of worship, gratitude and trust"
            intro="We give because God has generously given to us. Giving helps support ministry, care for people, develop disciples, serve families, strengthen the local church and respond compassionately to needs within the community."
          />
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {SCRIPTURES.map((s, i) => (
              <Reveal as="li" key={s.ref} delay={i * 0.08}>
                <div className="card-soft h-full border-l-2 border-l-gold p-7">
                  <p className="font-display text-lg leading-relaxed text-ink italic">“{s.line}”</p>
                  <p className="mt-4 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                    {s.ref}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-y bg-cream">
        <div className="container-page">
          <SectionHeading
            eyebrow="Giving funds"
            title="Where your gift can go"
            intro="Choose a fund inside the giving form above."
          />
          <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {GIVING_FUNDS.map((f, i) => (
              <Reveal as="li" key={f.slug} delay={(i % 3) * 0.07}>
                <div className="card-soft h-full p-7">
                  <h3 className="text-lg">{f.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-y bg-background">
        <div className="container-page max-w-3xl">
          <SectionHeading eyebrow="Giving with trust" title="Handled responsibly" />
          <p className="mt-6 leading-relaxed text-muted-foreground">
            Deep Spring Church is committed to handling financial gifts responsibly, transparently
            and with integrity. Gifts are used to support the mission, ministries, administration,
            outreach and compassionate service of the church.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              { label: "Financial accountability statement", to: "/giving-policy" },
              { label: "Annual ministry report", to: "/giving-policy" },
              { label: "Giving policy", to: "/giving-policy" },
              { label: "Refund policy", to: "/refund-policy" },
              { label: "Privacy policy", to: "/privacy-policy" },
              { label: "Contact the church", to: "/contact" },
            ].map((l) => (
              <li key={l.label}>
                <ActionLink to={l.to} variant="quiet" size="sm">
                  {l.label} →
                </ActionLink>
              </li>
            ))}
          </ul>
          <p className="mt-8 rounded-xl bg-cream px-5 py-4 text-sm leading-relaxed text-muted-foreground">
            Donors should consult their own financial or tax adviser regarding the deductibility or
            legal treatment of donations.
          </p>
        </div>
      </section>
    </>
  );
}
