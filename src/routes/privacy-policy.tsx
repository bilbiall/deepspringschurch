import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/site";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy-policy")({
  head: () =>
    pageMeta({
      title: "Privacy Policy | Deep Spring Church of the Nazarene",
      description:
        "How Deep Spring Church of the Nazarene collects, uses, stores and protects the personal information you share with us.",
      path: "/privacy-policy",
    }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="We collect only what we need in order to care for people well, and we protect it carefully."
    >
      <LegalSection title="Information we collect">
        <p>
          We collect information you choose to give us through the forms on this website: your
          name, email address, phone number, the content of your message, visit details you
          share, prayer requests, and — where a parent or guardian chooses to register a child —
          the information required to care for that child safely.
        </p>
        <p>
          If you give online once a payment provider has been configured, that provider collects
          and processes your payment details directly. Deep Spring never receives or stores card
          numbers, card security codes or bank credentials.
        </p>
      </LegalSection>

      <LegalSection title="How we use your information">
        <p>
          We use your information only to respond to you, to prepare for your visit, to care for
          your child, to pray for the requests you share, and to keep accurate records of gifts
          received. We do not sell, rent or trade personal information.
        </p>
      </LegalSection>

      <LegalSection title="Children’s information">
        <p>
          Child registration information is never displayed publicly. It is accessible only to
          authorized administrators and approved children’s ministry personnel, and is used
          solely for the care and safety of the child.
        </p>
      </LegalSection>

      <LegalSection title="Prayer requests">
        <p>
          Prayer requests marked confidential are restricted to pastoral staff. Requests are
          never published, shared publicly or used in any communication without your explicit
          permission.
        </p>
      </LegalSection>

      <LegalSection title="Storage and security">
        <p>
          Information submitted through this website is stored in a secure database with
          access controls, row-level security policies and role-based permissions. Access is
          limited to the people who need it to carry out ministry responsibilities, and
          sensitive actions are logged.
        </p>
      </LegalSection>

      <LegalSection title="Cookies and analytics">
        <p>
          This website uses only the cookies necessary for it to function. If cookies requiring
          consent are ever introduced, a notice will be displayed before they are used.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You may ask us at any time to correct or delete the information we hold about you, or
          to stop contacting you. Contact us using the details below and we will act on your
          request.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
