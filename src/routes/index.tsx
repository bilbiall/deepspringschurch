import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Clock, MapPin, Calendar, Heart, Sprout, HandHeart } from "lucide-react";
import heroImage from "@/assets/hero-journey.jpg";
import groupsImage from "@/assets/connection-groups.jpg";
import prayerImage from "@/assets/prayer.jpg";
import { SITE, DIRECTIONS_URL, pageMeta } from "@/lib/site";
import { Reveal } from "@/components/Reveal";
import { ActionLink, SectionHeading, EmptyState } from "@/components/ui-kit";
import {
  MISSION_CARDS,
  COMMITMENTS,
  VISITOR_STEPS,
  MINISTRIES,
  GRAND_OPENING,
} from "@/content/church";
import { listPublishedSermons, listPublishedPosts } from "@/lib/public-content.functions";
import { safeLoad } from "@/lib/safe-load";

export const Route = createFileRoute("/")({
  head: () =>
    pageMeta({
      title: "Deep Spring Church of the Nazarene | Glenn Heights, Texas",
      description:
        "Deep Spring Church of the Nazarene is a welcoming Christian community in Glenn Heights, Texas, where people find rest, grow in Christ, build relationships and serve others.",
      path: "/",
      image: `${SITE.domain}/og-image.png`,
    }),
  loader: async () => {
    const [sermons, posts] = await Promise.all([
      safeLoad(() => listPublishedSermons(), [] as Awaited<ReturnType<typeof listPublishedSermons>>),
      safeLoad(() => listPublishedPosts(), [] as Awaited<ReturnType<typeof listPublishedPosts>>),
    ]);
    return { sermons: sermons.slice(0, 3), posts: posts.slice(0, 3) };
  },
  component: Home,
});

const MISSION_ICONS = [Heart, Sprout, HandHeart];

function Home() {
  const { sermons, posts } = Route.useLoaderData() as {
    sermons: { id: string; title: string; speaker: string | null; preached_on: string | null }[];
    posts: { id: string; title: string; excerpt: string | null; category: string | null }[];
  };
  const reduced = useReducedMotion();
  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden">
        <motion.img
          src={heroImage}
          alt="People of different ages walking together along a sunlit path"
          width={1920}
          height={1280}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
          initial={reduced ? false : { opacity: 0, scale: 1.06 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/55 to-ink/75" />

        <div className="container-page relative z-10 py-32 md:py-40">
          <div className="max-w-3xl">
            <motion.p
              {...rise(0.15)}
              className="text-[0.7rem] font-semibold tracking-[0.24em] text-white/80 uppercase"
            >
              Deep Spring Church of the Nazarene
            </motion.p>
            <motion.h1
              {...rise(0.3)}
              className="mt-5 font-display text-4xl leading-[1.08] text-white sm:text-5xl md:text-6xl lg:text-[4.25rem]"
            >
              Life is a journey best walked together.
            </motion.h1>
            <motion.p
              {...rise(0.45)}
              className="mt-6 max-w-xl text-base leading-relaxed text-white/85 md:text-lg"
            >
              A place to find rest, grow in Christ, build meaningful relationships, and serve
              others as we journey through life together.
            </motion.p>
            <motion.div {...rise(0.6)} className="mt-9 flex flex-wrap gap-3">
              <ActionLink to="/plan-your-visit" size="lg">
                Plan Your Visit
              </ActionLink>
              <ActionLink to="/about" variant="ghostLight" size="lg">
                Discover Deep Spring
              </ActionLink>
            </motion.div>
          </div>

          <motion.div
            {...rise(0.78)}
            className="mt-14 grid max-w-4xl gap-px overflow-hidden rounded-2xl border border-white/20 bg-white/15 backdrop-blur-sm sm:grid-cols-3"
          >
            <div className="bg-ink/40 p-6">
              <p className="flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.18em] text-white/70 uppercase">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Sunday Morning Service
              </p>
              <p className="mt-3 font-display text-3xl text-white">10:30 AM</p>
              <p className="mt-2 text-sm text-white/75">
                Dress is casual. Jeans and everyday clothing are welcome.
              </p>
            </div>
            <div className="bg-ink/40 p-6">
              <p className="flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.18em] text-white/70 uppercase">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Where We Meet
              </p>
              <address className="mt-3 text-sm leading-relaxed text-white not-italic">
                Deep Spring Church
                <br />
                {SITE.address.line1}
                <br />
                {SITE.address.city}, {SITE.address.state} {SITE.address.zip}
              </address>
            </div>
            <div className="flex items-center bg-ink/40 p-6">
              <ActionLink
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noreferrer noopener"
                variant="ghostLight"
              >
                Get Directions
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ActionLink>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Welcome */}
      <section className="section-y bg-background">
        <div className="container-page grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow">You do not have to journey alone</p>
            <h2 className="mt-4 text-3xl leading-tight md:text-[2.75rem]">
              A place of rest for weary souls
            </h2>
            <div className="rule-gold mt-6" />
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Life includes seasons of hope, difficulty, growth, uncertainty, joy and
              weariness. Deep Spring exists to be a place of rest for weary souls, growth in
              intimacy with God, and service to people who are hurting or marginalized.
            </p>
            <div className="mt-8">
              <ActionLink to="/about" variant="outline">
                Learn About Our Mission
              </ActionLink>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="overflow-hidden rounded-3xl border border-border">
              <img
                src={prayerImage}
                alt="An older hand and a child’s hand folded together in prayer at a wooden table"
                width={1408}
                height={1008}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.03]"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Mission cards */}
      <section className="section-y bg-cream">
        <div className="container-page">
          <SectionHeading
            eyebrow="Why we exist"
            title="Rest. Growth. Service."
            align="center"
            intro="Deep Spring exists to help people rest in God, grow in Christ, build genuine relationships and serve others."
          />
          <ul className="mt-14 grid gap-6 md:grid-cols-3">
            {MISSION_CARDS.map((card, i) => {
              const Icon = MISSION_ICONS[i] ?? Heart;
              return (
                <Reveal as="li" key={card.title} delay={i * 0.1}>
                  <div className="card-soft card-hover h-full p-8">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-6 text-2xl">{card.title}</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{card.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Commitments */}
      <section className="section-y bg-background">
        <div className="container-page">
          <SectionHeading
            eyebrow="Our commitments"
            title="Love God. Love people. Make disciples."
          />
          <ul className="mt-14 grid gap-6 md:grid-cols-3">
            {COMMITMENTS.map((c, i) => (
              <Reveal as="li" key={c.title} delay={i * 0.1}>
                <div className="card-soft card-hover flex h-full flex-col border-l-2 border-l-gold p-8">
                  <h3 className="text-xl">{c.title}</h3>
                  <p className="mt-4 flex-1 leading-relaxed text-muted-foreground">{c.body}</p>
                  <p className="mt-6 font-display text-sm text-primary italic">{c.reference}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Grand Opening */}
      <section className="section-y bg-sand">
        <div className="container-page">
          <Reveal>
            <div className="card-soft grid gap-10 p-8 md:grid-cols-[auto_1fr] md:items-center md:p-12">
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Calendar className="h-5 w-5" aria-hidden="true" />
                <p className="mt-2 font-display text-2xl">November</p>
                <p className="font-display text-3xl leading-none">1</p>
              </div>
              <div>
                <p className="eyebrow">Upcoming event</p>
                <h2 className="mt-3 text-3xl md:text-4xl">Grand Opening</h2>
                <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
                  Our official Grand Opening will take place on November 1. Before that date,
                  visitors are welcome to join us on Sundays at 10:30 AM while we continue
                  setting up and preparing the church.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <ActionLink to="/events">View Event Details</ActionLink>
                  <ActionLink to="/plan-your-visit" variant="outline">
                    Plan Your Visit
                  </ActionLink>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* New here */}
      <section className="section-y bg-background">
        <div className="container-page">
          <SectionHeading
            eyebrow="New to Deep Spring?"
            title="Come as you are"
            intro="You do not need to dress formally or understand everything about church before attending. Our Sunday morning service begins at 10:30 AM, and casual clothing is welcome."
          />
          <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VISITOR_STEPS.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 0.08}>
                <div className="card-soft card-hover h-full p-7">
                  <span className="font-display text-4xl text-gold">{i + 1}</span>
                  <h3 className="mt-4 text-lg tracking-wide uppercase">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
          <div className="mt-10">
            <ActionLink to="/plan-your-visit" variant="outline">
              Tell Us You’re Coming
            </ActionLink>
          </div>
        </div>
      </section>

      {/* Sermons + resources empty states */}
      <section className="section-y bg-cream">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow="Featured sermons" title="Teaching from our services" />
            <div className="mt-8">
              {sermons.length === 0 ? (
                <EmptyState message="Our sermon library is being prepared. The three most recent published sermons will appear here.">
                  <ActionLink to="/sermons" variant="outline" size="sm">
                    Visit the sermon library
                  </ActionLink>
                </EmptyState>
              ) : (
                <ul className="space-y-4">
                  {sermons.map((s) => (
                    <li key={s.id} className="card-soft card-hover p-6">
                      <h3 className="text-lg">{s.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {[
                          s.speaker,
                          s.preached_on
                            ? new Date(s.preached_on).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </li>
                  ))}
                  <li>
                    <ActionLink to="/sermons" variant="outline" size="sm">
                      Visit the sermon library
                    </ActionLink>
                  </li>
                </ul>
              )}
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <SectionHeading eyebrow="Latest resources" title="Reading and encouragement" />
            <div className="mt-8">
              {posts.length === 0 ? (
                <EmptyState message="Our first articles are being written. The three most recent published posts will appear here.">
                  <ActionLink to="/blog" variant="outline" size="sm">
                    Visit blog & resources
                  </ActionLink>
                </EmptyState>
              ) : (
                <ul className="space-y-4">
                  {posts.map((p) => (
                    <li key={p.id} className="card-soft card-hover p-6">
                      {p.category ? <p className="eyebrow">{p.category}</p> : null}
                      <h3 className="mt-2 text-lg">{p.title}</h3>
                      {p.excerpt ? (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {p.excerpt}
                        </p>
                      ) : null}
                    </li>
                  ))}
                  <li>
                    <ActionLink to="/blog" variant="outline" size="sm">
                      Visit blog & resources
                    </ActionLink>
                  </li>
                </ul>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Featured ministries */}
      <section className="section-y bg-background">
        <div className="container-page grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <div className="overflow-hidden rounded-3xl border border-border">
              <img
                src={groupsImage}
                alt="Four adults sitting together in a living room with open Bibles and coffee"
                width={1408}
                height={1008}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.03]"
              />
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <SectionHeading
              eyebrow="Ministries"
              title="Ways to belong and serve"
              intro="Every person has God-given purpose, gifts, experiences and skills that can be used in service to God and others."
            />
            <ul className="mt-8 space-y-4">
              {MINISTRIES.filter((m) => m.featured).map((m) => (
                <li key={m.slug} className="card-soft card-hover p-6">
                  <h3 className="text-lg">{m.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {m.description}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <ActionLink to="/ministries" variant="outline">
                Explore All Ministries
              </ActionLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Giving callout */}
      <section className="section-y bg-primary">
        <div className="container-page">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-primary-foreground/70 uppercase">
                Generosity that serves people
              </p>
              <h2 className="mt-4 font-display text-3xl leading-tight text-white md:text-[2.6rem]">
                Your giving helps people find rest, growth and care
              </h2>
              <p className="mt-6 leading-relaxed text-white/80">
                Your generosity helps Deep Spring provide a place of rest, encourage spiritual
                growth, strengthen families, serve people compassionately and make Christlike
                disciples.
              </p>
              <div className="mt-9">
                <ActionLink to="/give" variant="ghostLight" size="lg">
                  Give to Deep Spring
                </ActionLink>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-y bg-background">
        <div className="container-page">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl md:text-[2.6rem]">There is a place for you here</h2>
              <div className="rule-gold mx-auto mt-6" />
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Whether you need rest, encouragement, friendship, spiritual growth or an
                opportunity to serve, we would love to meet you.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <ActionLink to="/plan-your-visit" size="lg">
                  Plan Your Visit
                </ActionLink>
                <ActionLink to="/contact" variant="outline" size="lg">
                  Contact the Church
                </ActionLink>
              </div>
              <p className="mt-8 text-sm text-muted-foreground">
                Questions? Call{" "}
                <a href={SITE.phoneHref} className="text-primary hover:underline">
                  {SITE.phone}
                </a>{" "}
                or email{" "}
                <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">
                  {SITE.email}
                </a>
                .
              </p>
              <p className="mt-10">
                <Link to="/beliefs" className="text-sm text-primary hover:underline">
                  Read what we believe →
                </Link>
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
