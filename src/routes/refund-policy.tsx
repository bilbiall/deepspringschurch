import { createFileRoute } from "@tanstack/react-router";
import { pageMeta, SITE } from "@/lib/site";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/refund-policy")({
  head: () =>
    pageMeta({
      title: "Refund Policy | Deep Spring Church of the Nazarene",
      description:
        "How Deep Spring Church of the Nazarene handles requests to correct or refund a donation or event payment.",
      path: "/refund-policy",
    }),
  component: RefundPolicy,
});

function RefundPolicy() {
  return (
    <LegalPage
      eyebrow="Refunds"
      title="Refund Policy"
      intro="Mistakes happen. If a gift was given in error, we will make it right."
    >
      <LegalSection title="Donations are generally final">
        <p>
          Gifts to Deep Spring Church are made voluntarily and are generally considered final
          once processed, because they are put to work in ministry.
        </p>
      </LegalSection>

      <LegalSection title="Errors and duplicate gifts">
        <p>
          If a gift was made in error — an incorrect amount, a duplicate transaction, an
          unintended recurring gift, or an unauthorized charge — please contact the church as
          soon as possible. Requests made within 30 days of the transaction date will normally
          be refunded in full to the original payment method.
        </p>
        <p>
          Requests made after 30 days will be reviewed individually and handled fairly.
        </p>
      </LegalSection>

      <LegalSection title="Cancelling a recurring gift">
        <p>
          Recurring gifts may be cancelled at any time by contacting the church. Cancellation
          stops future gifts; it does not automatically refund gifts already processed.
        </p>
      </LegalSection>

      <LegalSection title="Event registrations">
        <p>
          Refund terms for paid event registrations will be stated on each event page. Where no
          terms are stated, please contact the church.
        </p>
      </LegalSection>

      <LegalSection title="How to request a refund">
        <p>
          Email{" "}
          <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">
            {SITE.email}
          </a>{" "}
          or call{" "}
          <a href={SITE.phoneHref} className="text-primary hover:underline">
            {SITE.phone}
          </a>{" "}
          with the transaction date, amount and transaction reference from your receipt.
          Approved refunds are processed through the original payment provider and typically
          appear within five to ten business days.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
