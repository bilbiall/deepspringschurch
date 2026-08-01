import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Heart, Baby, Volume2, DoorOpen, HandHeart } from "lucide-react";
import childrenImage from "@/assets/children.jpg";
import { pageMeta, SITE } from "@/lib/site";
import { PageHero, SectionHeading, ActionButton } from "@/components/ui-kit";
import { Reveal } from "@/components/Reveal";
import { Field, Consent, PrivacyNotice } from "@/components/form-kit";
import { submitChildRegistration } from "@/lib/public-forms.functions";

import { LEADERSHIP } from "@/content/church";

export const Route = createFileRoute("/children-and-families")({
  head: () =>
    pageMeta({
      title: "Children and Families | Deep Spring Church of the Nazarene",
      description:
        "A place where every child is seen and loved — biblically grounded teaching, caring volunteers, sensory rooms, quiet spaces and support for children with special needs.",
      path: "/children-and-families",
    }),
  component: ChildrenAndFamilies,
});

const HIGHLIGHTS = [
  { icon: Heart, title: "Biblically grounded teaching", body: "Age-appropriate Bible teaching that children can understand and carry with them." },
  { icon: ShieldCheck, title: "Safe and caring volunteers", body: "Screened, trained volunteers who know each child by name." },
  { icon: Baby, title: "Age-appropriate activities", body: "Learning, play and conversation shaped for each stage of childhood." },
  { icon: HandHeart, title: "Support for special needs", body: "Practical accommodation so every child can take part fully." },
  { icon: Volume2, title: "Sensory rooms and quiet spaces", body: "Calm places to regulate, rest and rejoin at each child’s own pace." },
  { icon: DoorOpen, title: "Secure check-in", body: "A simple, secure check-in and pick-up procedure for every service." },
];

function ChildrenAndFamilies() {
  const [consent, setConsent] = useState(false);

  return (
    <>
      <PageHero
        eyebrow="Children and families"
        title="A place where every child is seen and loved"
        intro="Deep Spring seeks to create a compassionate environment for children of different backgrounds, abilities and needs — including children who often find church hard."
      />

      <section className="section-y bg-background">
        <div className="container-page grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <div className="overflow-hidden rounded-3xl border border-border">
              <img
                src={childrenImage}
                alt="A volunteer sitting on a rug with young children in a bright, calm classroom"
                width={1408}
                height={1008}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.03]"
              />
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <SectionHeading
              eyebrow="What families can expect"
              title="Care that adapts to your child"
              intro="Some children need noise. Some need quiet. Some need a familiar adult nearby. We would rather adjust to your child than ask your child to adjust to us."
            />
          </Reveal>
        </div>

        <div className="container-page mt-16">
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHTS.map((h, i) => (
              <Reveal as="li" key={h.title} delay={(i % 3) * 0.08}>
                <div className="card-soft card-hover h-full p-7">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent text-primary">
                    <h.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg">{h.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{h.body}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-y bg-cream">
        <div className="container-page">
          <Reveal>
            <article className="card-soft mx-auto max-w-3xl p-8 md:p-12">
              <p className="eyebrow">Children’s Director</p>
              <h2 className="mt-3 text-3xl">{LEADERSHIP[1]!.name}</h2>
              <div className="rule-gold mt-5" />
              <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
                {LEADERSHIP[1]!.bio.map((p) => (
                  <p key={p.slice(0, 30)}>{p}</p>
                ))}
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      <section id="register" className="section-y bg-background">
        <div className="container-page max-w-3xl">
          <SectionHeading
            eyebrow="Child registration"
            title="Tell us about your child before you visit"
            intro="Sharing this ahead of time helps our team prepare well. You may also complete registration in person at check-in."
          />

          <form
            className="card-soft mt-10 space-y-6 p-8"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const fd = new FormData(form);
              const get = (k: string) => String(fd.get(k) ?? "");
              const notes = [
                get("medical_information"),
                get("sensory_needs") ? `Sensory needs: ${get("sensory_needs")}` : "",
                get("additional_information")
                  ? `Other: ${get("additional_information")}`
                  : "",
              ]
                .filter(Boolean)
                .join("\n");
              try {
                await submitChildRegistration({
                  data: {
                    parent_name: get("parent_name"),
                    parent_email: get("parent_email"),
                    parent_phone: get("parent_phone"),
                    child_first_name: get("child_name"),
                    child_last_name: "",
                    child_age: fd.get("child_age") ? Number(fd.get("child_age")) : null,
                    allergies: get("allergies"),
                    medical_notes: notes,
                    special_needs: get("accommodation_needs"),
                    emergency_contact_name: get("emergency_contact"),
                    emergency_contact_phone: "",
                    authorized_pickup: "",
                    photo_consent: false,
                  },
                });
                toast.success("Registration received", {
                  description:
                    "Thank you. Our children’s ministry team will be in touch before your visit.",
                });
                form.reset();
                setConsent(false);
              } catch {
                toast.error("Registration could not be saved. Please try again.");
              }
            }}

          >
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Parent or guardian name" required>
                {(p) => <input {...p} name="parent_name" type="text" required autoComplete="name" />}
              </Field>
              <Field label="Parent email" required>
                {(p) => <input {...p} name="parent_email" type="email" required autoComplete="email" />}
              </Field>
              <Field label="Parent phone number" required>
                {(p) => <input {...p} name="parent_phone" type="tel" required autoComplete="tel" />}
              </Field>
              <Field label="Emergency contact" required hint="Name and phone number">
                {(p) => <input {...p} name="emergency_contact" type="text" required />}
              </Field>
              <Field label="Child’s name" required>
                {(p) => <input {...p} name="child_name" type="text" required />}
              </Field>
              <Field label="Child’s age" required>
                {(p) => <input {...p} name="child_age" type="number" min={0} max={18} required />}
              </Field>
            </div>

            <Field label="Allergies">
              {(p) => <textarea {...p} name="allergies" rows={2} />}
            </Field>
            <Field label="Medical information">
              {(p) => <textarea {...p} name="medical_information" rows={2} />}
            </Field>
            <Field label="Special accommodation needs">
              {(p) => <textarea {...p} name="accommodation_needs" rows={2} />}
            </Field>
            <Field label="Sensory needs">
              {(p) => <textarea {...p} name="sensory_needs" rows={2} />}
            </Field>
            <Field label="Anything else we should know">
              {(p) => <textarea {...p} name="additional_information" rows={3} />}
            </Field>

            <Consent checked={consent} onChange={setConsent}>
              I confirm I am the parent or legal guardian of this child and I consent to Deep
              Spring Church holding this information for the care and safety of my child.
            </Consent>

            <PrivacyNotice>
              Children’s information is never displayed publicly. It is accessible only to
              authorized administrators and approved children’s ministry personnel, and is used
              solely for the care and safety of your child.
            </PrivacyNotice>

            <ActionButton type="submit" size="lg">
              Submit Registration
            </ActionButton>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Questions about your child’s needs? Call{" "}
            <a href={SITE.phoneHref} className="text-primary hover:underline">
              {SITE.phone}
            </a>{" "}
            or email{" "}
            <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">
              {SITE.email}
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
