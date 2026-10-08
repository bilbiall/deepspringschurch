import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { pageMeta, SITE, DIRECTIONS_URL, MAP_EMBED_URL } from "@/lib/site";
import { PageHero, SectionHeading, ActionLink, ActionButton } from "@/components/ui-kit";
import { Reveal } from "@/components/Reveal";
import { Field, Consent, PrivacyNotice } from "@/components/form-kit";
import { sendToWeb3Forms, MSG_SENDING, MSG_SUCCESS, MSG_FAILURE } from "@/lib/web3forms";


export const Route = createFileRoute("/contact")({
  head: () =>
    pageMeta({
      title: "Contact Us | Deep Spring Church of the Nazarene",
      description:
        "Contact Deep Spring Church of the Nazarene in Glenn Heights, Texas. Call +1 214 810 6356, email info@deepspringchurch.org, or send us a message.",
      path: "/contact",
    }),
  component: Contact,
});

const INQUIRY_TYPES = [
  "General Information",
  "Plan a Visit",
  "Connection Groups",
  "Children’s Ministry",
  "Prayer Request",
  "Volunteering",
  "Pastoral Care",
  "Giving",
  "Website Support",
];

function Contact() {
  const [consent, setConsent] = useState(false);
  const [isPrayer, setIsPrayer] = useState(false);
  const [sending, setSending] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  return (
    <>
      <PageHero
        eyebrow="Contact us"
        title="We would love to hear from you"
        intro="Questions, prayer requests, pastoral care or simply wanting to know more — reach out however is easiest for you."
      >
        <ActionLink href={SITE.phoneHref}>Call {SITE.phone}</ActionLink>
        <ActionLink href={`mailto:${SITE.email}`} variant="outline">
          Email the Church
        </ActionLink>
      </PageHero>

      <section className="section-y bg-background">
        <div className="container-page grid gap-14 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <SectionHeading eyebrow="Church details" title="Where to find us" />
            <ul className="mt-8 space-y-6 text-sm">
              <li className="flex gap-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <address className="leading-relaxed not-italic">
                  Deep Spring Church
                  <br />
                  {SITE.address.line1}
                  <br />
                  {SITE.address.city}, {SITE.address.state} {SITE.address.zip}
                </address>
              </li>
              <li className="flex gap-4">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <a href={SITE.phoneHref} className="hover:text-primary">
                  {SITE.phone}
                </a>
              </li>
              <li className="flex gap-4">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <a href={`mailto:${SITE.email}`} className="break-all hover:text-primary">
                  {SITE.email}
                </a>
              </li>
              <li className="flex gap-4">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span>Sunday service at {SITE.serviceTime}</span>
              </li>
            </ul>
            <div className="mt-8">
              <ActionLink
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noreferrer noopener"
                variant="outline"
                size="sm"
              >
                Get Directions
              </ActionLink>
            </div>
            <div className="mt-8 overflow-hidden rounded-2xl border border-border">
              <iframe
                title="Map showing Deep Spring Church, Glenn Heights, Texas"
                src={MAP_EMBED_URL}
                width="100%"
                height="280"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: 0 }}
              />
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <SectionHeading eyebrow="Send a message" title="How can we help?" />
            <form
              className="card-soft mt-8 space-y-6 p-8"
              onSubmit={async (e) => {
                e.preventDefault();
                if (honeypot) return;
                const form = e.currentTarget;
                setSending(true);
                try {
                  await sendToWeb3Forms(form, isPrayer ? "Prayer Request" : "Contact Us", {
                    is_prayer_request: isPrayer ? "Yes — please treat confidentially" : "No",
                  });
                  toast.success(MSG_SUCCESS);
                  form.reset();
                  setConsent(false);
                  setIsPrayer(false);
                } catch {
                  toast.error(MSG_FAILURE);
                } finally {
                  setSending(false);
                }
              }}
            >
              {/* Simple spam trap — hidden from users and assistive technology */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input
                  id="company"
                  name="botcheck"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Full name" required>
                  {(p) => <input {...p} name="name" type="text" required autoComplete="name" />}
                </Field>
                <Field label="Email address" required>
                  {(p) => <input {...p} name="email" type="email" required autoComplete="email" />}
                </Field>
                <Field label="Phone number">
                  {(p) => <input {...p} name="phone" type="tel" autoComplete="tel" />}
                </Field>
                <Field label="Inquiry type" required>
                  {(p) => (
                    <select {...p} name="inquiry_type" required defaultValue="General Information">
                      {INQUIRY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              </div>
              <Field label="Subject" required>
                {(p) => <input {...p} name="subject" type="text" required />}
              </Field>
              <Field label="Message" required>
                {(p) => <textarea {...p} name="message" rows={6} required />}
              </Field>

              <div className="flex items-start gap-3">
                <input
                  id="prayer"
                  type="checkbox"
                  checked={isPrayer}
                  onChange={(e) => setIsPrayer(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-input accent-[oklch(0.46_0.072_214)]"
                />
                <label htmlFor="prayer" className="text-sm text-muted-foreground">
                  This is a prayer request. Please treat it confidentially.
                </label>
              </div>

              <Consent checked={consent} onChange={setConsent}>
                I consent to Deep Spring Church storing this message in order to respond to me.
              </Consent>
              <PrivacyNotice />

              <ActionButton type="submit" size="lg" disabled={sending}>
                {sending ? MSG_SENDING : "Send Message"}
              </ActionButton>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  );
}
