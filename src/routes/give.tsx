import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Info } from "lucide-react";
import { toast } from "sonner";
import { pageMeta, SITE, PAYMENTS_CONFIGURED } from "@/lib/site";
import { PageHero, SectionHeading, ActionLink, ActionButton } from "@/components/ui-kit";
import { Reveal } from "@/components/Reveal";
import { Field, Consent, PrivacyNotice } from "@/components/form-kit";
import { GIVING_FUNDS } from "@/content/church";

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

const AMOUNTS = [25, 50, 100, 250];

function GivePage() {
  const [fund, setFund] = useState(GIVING_FUNDS[0]!.slug);
  const [amount, setAmount] = useState<number | "custom">(50);
  const [frequency, setFrequency] = useState("one-time");
  const [anonymous, setAnonymous] = useState(false);
  const [consent, setConsent] = useState(false);

  return (
    <>
      <PageHero
        eyebrow="Give"
        title="Generosity that serves people"
        intro="Your generosity helps Deep Spring create a place of rest, spiritual growth, meaningful relationships, compassionate service and Christ-centred ministry."
      >
        <ActionLink href="#giving-form">Give Online</ActionLink>
        <ActionLink href="#other-ways" variant="outline">
          Other Ways to Give
        </ActionLink>
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

      <section className="section-y bg-cream">
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

      <section className="section-y bg-background">
        <div className="container-page">
          <SectionHeading eyebrow="Giving funds" title="Choose where your gift goes" />
          <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {GIVING_FUNDS.map((f, i) => (
              <Reveal as="li" key={f.slug} delay={(i % 3) * 0.07}>
                <button
                  type="button"
                  onClick={() => setFund(f.slug)}
                  aria-pressed={fund === f.slug}
                  className={`card-soft card-hover h-full w-full p-7 text-left ${
                    fund === f.slug ? "border-primary ring-1 ring-primary/30" : ""
                  }`}
                >
                  <h3 className="text-lg">{f.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                  <span className="mt-5 inline-block text-xs font-semibold tracking-wide text-primary uppercase">
                    {fund === f.slug ? "Selected" : "Select this fund"}
                  </span>
                </button>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section id="giving-form" className="section-y bg-cream">
        <div className="container-page max-w-2xl">
          <SectionHeading eyebrow="Give securely" title="Make a gift" />

          {!PAYMENTS_CONFIGURED ? (
            <div className="card-soft mt-8 flex gap-4 border-primary/30 bg-accent/60 p-6">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div className="text-sm leading-relaxed text-foreground/85">
                <p className="font-semibold text-ink">
                  Online giving is being prepared. Please contact the church for more information
                  about ways to give.
                </p>
                <p className="mt-2">
                  Phone:{" "}
                  <a href={SITE.phoneHref} className="text-primary hover:underline">
                    {SITE.phone}
                  </a>
                  <br />
                  Email:{" "}
                  <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">
                    {SITE.email}
                  </a>
                </p>
              </div>
            </div>
          ) : null}

          <form
            className="card-soft mt-8 space-y-7 p-8"
            onSubmit={(e) => {
              e.preventDefault();
              toast.info("Online giving is being prepared", {
                description: `Please contact the church at ${SITE.phone} for ways to give today.`,
              });
            }}
          >
            <fieldset>
              <legend className="text-sm font-semibold text-foreground">Donation amount</legend>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAmount(a)}
                    aria-pressed={amount === a}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                      amount === a
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background text-foreground hover:border-primary/50"
                    }`}
                  >
                    ${a}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount("custom")}
                  aria-pressed={amount === "custom"}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                    amount === "custom"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background text-foreground hover:border-primary/50"
                  }`}
                >
                  Custom
                </button>
              </div>
              {amount === "custom" ? (
                <div className="mt-4">
                  <Field label="Custom amount (USD)" required>
                    {(p) => (
                      <input
                        {...p}
                        name="custom_amount"
                        type="number"
                        min={1}
                        step="0.01"
                        required
                      />
                    )}
                  </Field>
                </div>
              ) : null}
            </fieldset>

            <Field label="Giving fund" required>
              {(p) => (
                <select {...p} name="fund" value={fund} onChange={(e) => setFund(e.target.value)}>
                  {GIVING_FUNDS.map((f) => (
                    <option key={f.slug} value={f.slug}>
                      {f.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            {fund === "other" ? (
              <Field label="Purpose of this gift" required>
                {(p) => <input {...p} name="fund_other" type="text" required />}
              </Field>
            ) : null}

            <fieldset>
              <legend className="text-sm font-semibold text-foreground">Frequency</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {[
                  { v: "one-time", l: "One-time" },
                  { v: "weekly", l: "Weekly" },
                  { v: "monthly", l: "Monthly" },
                ].map((f) => (
                  <label
                    key={f.v}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                      frequency === f.v ? "border-primary bg-accent" : "border-input"
                    }`}
                  >
                    <input
                      type="radio"
                      name="frequency"
                      value={f.v}
                      checked={frequency === f.v}
                      onChange={() => setFrequency(f.v)}
                      className="accent-[oklch(0.46_0.072_214)]"
                    />
                    {f.l}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Your name">
                {(p) => (
                  <input
                    {...p}
                    name="donor_name"
                    type="text"
                    autoComplete="name"
                    disabled={anonymous}
                  />
                )}
              </Field>
              <Field label="Email address" required hint="Used to send your receipt.">
                {(p) => (
                  <input {...p} name="donor_email" type="email" required autoComplete="email" />
                )}
              </Field>
            </div>
            <Field label="Phone number">
              {(p) => <input {...p} name="donor_phone" type="tel" autoComplete="tel" />}
            </Field>

            <div className="flex items-start gap-3">
              <input
                id="anon"
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-input accent-[oklch(0.46_0.072_214)]"
              />
              <label htmlFor="anon" className="text-sm text-muted-foreground">
                Give anonymously (your name will not be recorded with this gift)
              </label>
            </div>

            <Field label="Dedication">
              {(p) => (
                <input {...p} name="dedication" type="text" placeholder="In honour or memory of…" />
              )}
            </Field>
            <Field label="Message to the church">
              {(p) => <textarea {...p} name="donor_message" rows={3} />}
            </Field>

            <div className="flex items-start gap-3">
              <input
                id="fees"
                type="checkbox"
                name="cover_fees"
                className="mt-1 h-5 w-5 rounded border-input accent-[oklch(0.46_0.072_214)]"
              />
              <label htmlFor="fees" className="text-sm text-muted-foreground">
                I would like to cover the payment processing fee so the full gift reaches the
                ministry (entirely optional).
              </label>
            </div>

            <Consent checked={consent} onChange={setConsent}>
              I consent to Deep Spring Church processing this gift and sending me a receipt by
              email.
            </Consent>

            <PrivacyNotice>
              Payments are handled entirely by a secure external payment processor. Deep Spring
              never receives or stores card numbers, security codes or bank credentials.
            </PrivacyNotice>

            <div className="flex flex-wrap items-center gap-4">
              <ActionButton type="submit" size="lg">
                <Lock className="h-4 w-4" aria-hidden="true" />
                Give Securely
              </ActionButton>
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Encrypted connection · No card details stored by the church
              </span>
            </div>
          </form>
        </div>
      </section>

      <section id="other-ways" className="section-y bg-background">
        <div className="container-page">
          <SectionHeading eyebrow="Other ways to give" title="Beyond online giving" />
          <ul className="mt-12 grid gap-6 md:grid-cols-2">
            <li className="card-soft p-8">
              <h3 className="text-xl">In person</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Gifts may be given during a Deep Spring Church worship service.
              </p>
            </li>
            <li className="card-soft p-8">
              <h3 className="text-xl">By mail</h3>
              <address className="mt-3 leading-relaxed text-muted-foreground not-italic">
                Deep Spring Church
                <br />
                {SITE.address.line1}
                <br />
                {SITE.address.city}, {SITE.address.state} {SITE.address.zip}
              </address>
              <p className="mt-3 text-sm font-semibold text-ink">
                Please do not send cash through the mail.
              </p>
            </li>
            <li className="card-soft p-8">
              <h3 className="text-xl">Bank transfer</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Details coming soon. Bank information will be published only after it has been
                securely entered and approved by an authorized administrator.
              </p>
            </li>
            <li className="card-soft p-8">
              <h3 className="text-xl">Planned or non-cash giving</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Please contact the church before making gifts involving property, securities,
                estates, vehicles or other non-cash assets.
              </p>
              <p className="mt-3 text-sm">
                <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">
                  {SITE.email}
                </a>
                {" · "}
                <a href={SITE.phoneHref} className="text-primary hover:underline">
                  {SITE.phone}
                </a>
              </p>
            </li>
          </ul>
        </div>
      </section>

      <section className="section-y bg-cream">
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
          <p className="mt-8 rounded-xl bg-background px-5 py-4 text-sm leading-relaxed text-muted-foreground">
            Donors should consult their own financial or tax adviser regarding the deductibility or
            legal treatment of donations.
          </p>
        </div>
      </section>
    </>
  );
}
