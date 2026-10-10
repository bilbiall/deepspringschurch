import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Clock, MapPin, Shirt, Users, Baby, Accessibility, Car } from "lucide-react";
import { pageMeta, SITE, DIRECTIONS_URL, MAP_EMBED_URL } from "@/lib/site";
import { PageHero, SectionHeading, ActionLink, ActionButton } from "@/components/ui-kit";
import { Reveal } from "@/components/Reveal";
import { Field, Consent, PrivacyNotice } from "@/components/form-kit";
import { MSG_SENDING, MSG_SUCCESS, MSG_FAILURE } from "@/lib/form-messages";
import { submitVisitPlan } from "@/lib/public-forms.functions";

export const Route = createFileRoute("/plan-your-visit")({
  head: () =>
    pageMeta({
      title: "Plan Your Visit | Deep Spring Church of the Nazarene",
      description:
        "Everything you need for your first Sunday at Deep Spring Church in Glenn Heights, Texas: service time, location, dress, children’s ministry and accessibility.",
      path: "/plan-your-visit",
    }),
  component: PlanYourVisit,
});

const FACTS = [
  {
    icon: Clock,
    title: "Service time",
    body: "Sunday at 10:30 AM. Plan to arrive a few minutes early if you would like to check in children.",
  },
  {
    icon: MapPin,
    title: "Location",
    body: "Deep Spring Church, 315 W. Ovilla Rd., Glenn Heights, TX 75154.",
  },
  {
    icon: Shirt,
    title: "Dress",
    body: "Casual clothing is welcome. Jeans and everyday clothes are completely appropriate.",
  },
  {
    icon: Users,
    title: "What to expect",
    body: "A welcoming environment, prayer, worship, Scripture, a practical message and opportunities to build relationships.",
  },
  {
    icon: Baby,
    title: "Children",
    body: "Caring children’s ministry with sensory rooms, quiet areas and support for children with special needs.",
  },
  {
    icon: Users,
    title: "Connection Groups",
    body: "Small groups of approximately three to five people designed for relationship and growth in Christ.",
  },
];

function PlanYourVisit() {
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);

  return (
    <>
      <PageHero
        eyebrow="Plan your visit"
        title="Your first visit does not have to feel complicated"
        intro="Here is everything you need to know before Sunday. If anything is still unclear, call us — a real person will answer."
      >
        <ActionLink href="#tell-us">Tell Us You’re Coming</ActionLink>
        <ActionLink
          href={DIRECTIONS_URL}
          target="_blank"
          rel="noreferrer noopener"
          variant="outline"
        >
          Get Directions
        </ActionLink>
      </PageHero>

      <section className="section-y bg-background">
        <div className="container-page">
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FACTS.map((f, i) => (
              <Reveal as="li" key={f.title} delay={(i % 3) * 0.08}>
                <div className="card-soft card-hover h-full p-7">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent text-primary">
                    <f.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-5 text-lg">{f.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-y bg-cream">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow="Finding us" title="Getting here" />
            <ul className="mt-8 space-y-5">
              <li className="flex gap-4">
                <Car className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="text-base font-semibold">Parking</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    On-site parking is available at 315 W. Ovilla Rd. Full parking and entrance
                    details will be confirmed here before the Grand Opening.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <Accessibility className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="text-base font-semibold">Accessibility</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Tell us in the form below what you need — mobility access, seating, hearing
                    support, sensory considerations — and we will have it ready.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <Baby className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="text-base font-semibold">Children’s check-in</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    A team member will walk you through secure check-in on your first visit. You can{" "}
                    <a
                      href="/children-and-families#register"
                      className="text-primary hover:underline"
                    >
                      register your child in advance
                    </a>{" "}
                    to save time.
                  </p>
                </div>
              </li>
            </ul>
            <div className="mt-8 space-y-1 text-sm text-muted-foreground">
              <p>
                Phone:{" "}
                <a href={SITE.phoneHref} className="text-primary hover:underline">
                  {SITE.phone}
                </a>
              </p>
              <p>
                Email:{" "}
                <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">
                  {SITE.email}
                </a>
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="overflow-hidden rounded-3xl border border-border">
              <iframe
                title="Map showing Deep Spring Church, 315 W. Ovilla Rd., Glenn Heights, TX"
                src={MAP_EMBED_URL}
                width="100%"
                height="460"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: 0 }}
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section id="tell-us" className="section-y bg-background">
        <div className="container-page max-w-2xl">
          <SectionHeading
            eyebrow="Tell us you’re coming"
            title="We will be watching for you"
            intro="This is entirely optional — but it helps us welcome you well and prepare anything your family needs."
          />
          <form
            className="card-soft mt-10 space-y-6 p-8"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              setSending(true);
              try {
                const fd = new FormData(form);
                const field = (name: string) => String(fd.get(name) ?? "");
                await submitVisitPlan({
                  data: {
                    name: field("name"),
                    email: field("email"),
                    phone: field("phone"),
                    preferred_contact: field("preferred_contact") || "email",
                    adults: Number(field("adults") || 1),
                    children: Number(field("children") || 0),
                    accessibility_needs: field("accessibility_needs"),
                    accommodation_needs: field("accommodation_needs"),
                    prayer_request: field("prayer_request"),
                    botcheck: field("botcheck"),
                  },
                });
                toast.success(MSG_SUCCESS);
                form.reset();
                setConsent(false);
              } catch {
                toast.error(MSG_FAILURE);
              } finally {
                setSending(false);
              }
            }}
          >
            <input
              type="checkbox"
              name="botcheck"
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Your name" required>
                {(p) => <input {...p} name="name" type="text" required autoComplete="name" />}
              </Field>
              <Field label="Email" required>
                {(p) => <input {...p} name="email" type="email" required autoComplete="email" />}
              </Field>
              <Field label="Phone">
                {(p) => <input {...p} name="phone" type="tel" autoComplete="tel" />}
              </Field>
              <Field label="Preferred contact method">
                {(p) => (
                  <select {...p} name="preferred_contact" defaultValue="email">
                    <option value="email">Email</option>
                    <option value="phone">Phone call</option>
                    <option value="text">Text message</option>
                    <option value="none">No follow-up, thank you</option>
                  </select>
                )}
              </Field>
              <Field label="Number of adults">
                {(p) => <input {...p} name="adults" type="number" min={0} defaultValue={1} />}
              </Field>
              <Field label="Number of children">
                {(p) => <input {...p} name="children" type="number" min={0} defaultValue={0} />}
              </Field>
            </div>
            <Field label="Accessibility needs">
              {(p) => <textarea {...p} name="accessibility_needs" rows={2} />}
            </Field>
            <Field label="Special accommodation needs">
              {(p) => <textarea {...p} name="accommodation_needs" rows={2} />}
            </Field>
            <Field label="Prayer request">
              {(p) => <textarea {...p} name="prayer_request" rows={3} />}
            </Field>

            <Consent checked={consent} onChange={setConsent}>
              I consent to Deep Spring Church contacting me about my visit.
            </Consent>
            <PrivacyNotice />

            <ActionButton type="submit" size="lg" disabled={sending}>
              {sending ? MSG_SENDING : "Tell Us You’re Coming"}
            </ActionButton>
          </form>
        </div>
      </section>
    </>
  );
}
