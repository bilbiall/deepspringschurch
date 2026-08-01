import { createFileRoute } from "@tanstack/react-router";
import { pageMeta, SITE } from "@/lib/site";
import { Reveal } from "@/components/Reveal";
import { PageHero, SectionHeading, ActionLink } from "@/components/ui-kit";
import { LEADERSHIP } from "@/content/church";
import kenPhoto from "@/assets/ken-merrifield.png.asset.json";
import janetPhoto from "@/assets/janet-merrifield.webp.asset.json";
import familyPhoto from "@/assets/merrifield-family.png.asset.json";
import couplePhoto from "@/assets/ken-and-janet.png.asset.json";

const LEADER_PHOTOS: Record<string, { url: string; alt: string }> = {
  "Pastor Ken Merrifield": { url: kenPhoto.url, alt: "Pastor Ken Merrifield" },
  "Janet Merrifield": { url: janetPhoto.url, alt: "Janet Merrifield" },
};

export const Route = createFileRoute("/about")({
  head: () =>
    pageMeta({
      title: "Our Story and Purpose | Deep Spring Church of the Nazarene",
      description:
        "Learn why Deep Spring Church of the Nazarene exists in Glenn Heights, Texas: rest for weary souls, growth in intimacy with God, and service to hurting and marginalized people.",
      path: "/about",
    }),
  component: About,
});

const APPROACH = [
  "Less complicated",
  "Less program-centred",
  "More relational",
  "Biblically grounded",
  "Spirit empowered",
  "Compassionate",
  "Welcoming to people from every background",
  "Focused on meaningful relationships",
  "Committed to serving the hurting and marginalized",
];

const VISION = [
  "Rest for weary souls",
  "Growth in intimacy with God",
  "Service to marginalized and hurting people",
];

function About() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Our story and purpose"
        intro="Deep Spring is a new church in Glenn Heights, Texas, rooted in the Wesleyan-Holiness tradition of the Church of the Nazarene."
      />

      <section className="section-y bg-background">
        <div className="container-page grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <SectionHeading eyebrow="Our heritage" title="The Church of the Nazarene" />
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted-foreground">
              <p>
                The Church of the Nazarene is a Protestant Christian church in the
                Wesleyan-Holiness tradition. Its roots are traced to 1908, and it was founded
                to spread the message of scriptural holiness, meaning Christlike living,
                across the world. Today, the Church of the Nazarene is located in 156 world
                areas.
              </p>
              <p>
                The Church of the Nazarene is a Great Commission church. Its mission is to
                make Christlike disciples in the nations.
              </p>
              <p>
                We believe God offers forgiveness, peace, joy, purpose, love, meaning in life
                and the promise of eternal life through a personal relationship with God
                through Jesus Christ. We are called to take this message to people everywhere.
              </p>
              <p>
                The Church of the Nazarene is also a holiness church. We believe Christians
                can experience a deeper life with God marked by victory over sin, power to
                witness and serve, and richer fellowship with God through the infilling of the
                Holy Spirit.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <aside className="card-soft bg-cream p-8">
              <h2 className="text-2xl">Why “Deep Spring”?</h2>
              <div className="rule-gold mt-5" />
              <blockquote className="mt-6 border-l-2 border-primary/40 pl-5 font-display text-lg leading-relaxed text-ink italic">
                “For the Lord your God is bringing you into a good land — a land with brooks,
                streams, and deep springs gushing out into the valleys and hills.”
                <footer className="mt-3 font-sans text-xs font-semibold tracking-widest text-primary uppercase not-italic">
                  Deuteronomy 8:6–9
                </footer>
              </blockquote>
              <p className="mt-6 leading-relaxed text-muted-foreground">
                Our name is inspired by this biblical image of God leading His people into a
                good land, with brooks, streams and deep springs flowing through valleys and
                hills. A deep spring is quiet, steady and life-giving — water that keeps
                flowing long after the surface runs dry.
              </p>
            </aside>
          </Reveal>
        </div>
      </section>

      <section className="section-y bg-cream">
        <div className="container-page grid gap-14 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow="Our vision" title="A new church with a clear purpose" />
            <ul className="mt-8 space-y-4">
              {VISION.map((v) => (
                <li key={v} className="card-soft flex items-start gap-4 p-6">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                  <span className="font-display text-xl text-ink">{v}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.12}>
            <SectionHeading eyebrow="Our mission" title="Journeying together" />
            <p className="mt-8 font-display text-2xl leading-relaxed text-ink">
              Our mission is to glorify God and grow disciples as we journey together,
              encouraging and serving others from a place of intimate rest with God.
            </p>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              Every person has God-given purpose, gifts, experiences and skills that can be
              used in service to God and others. Part of walking together is helping one
              another discover and use them.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-y bg-background">
        <div className="container-page">
          <SectionHeading
            eyebrow="Our approach"
            title="Simple, relational, and grounded in Scripture"
            align="center"
          />
          <ul className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-3">
            {APPROACH.map((a) => (
              <li
                key={a}
                className="rounded-full border border-border bg-cream px-5 py-2.5 text-sm text-foreground/85"
              >
                {a}
              </li>
            ))}
          </ul>
          <Reveal>
            <p className="mx-auto mt-14 max-w-3xl border-y border-border py-10 text-center font-display text-2xl leading-relaxed text-ink md:text-[1.75rem]">
              If you need a place of rest and encouragement while also experiencing challenge
              and growth in your walk with Christ, Deep Spring may be a good place for you.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="leadership" className="section-y bg-sand">
        <div className="container-page">
          <SectionHeading
            eyebrow="Leadership"
            title="The people serving Deep Spring"
            intro="Additional staff, board members, ministry leaders and volunteers will be added here as the church grows."
          />
          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            {LEADERSHIP.map((person, i) => (
              <Reveal as="article" key={person.name} delay={i * 0.1}>
                <div className="card-soft card-hover h-full overflow-hidden">
                  <div className="flex items-center gap-5 border-b border-border bg-cream p-8">
                    <div
                      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-2xl text-primary"
                      aria-hidden="true"
                    >
                      {person.name
                        .replace("Pastor ", "")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <h3 className="text-2xl">{person.name}</h3>
                      <p className="mt-1 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                        {person.role}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Photograph coming soon.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 p-8 leading-relaxed text-muted-foreground">
                    {person.bio.map((para) => (
                      <p key={para.slice(0, 30)}>{para}</p>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap gap-3">
            <ActionLink to="/plan-your-visit">Plan Your Visit</ActionLink>
            <ActionLink to="/contact" variant="outline">
              Contact the Church
            </ActionLink>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Prefer to talk with someone? Call{" "}
            <a href={SITE.phoneHref} className="text-primary hover:underline">
              {SITE.phone}
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
