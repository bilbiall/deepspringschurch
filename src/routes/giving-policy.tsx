import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/site";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/giving-policy")({
  head: () =>
    pageMeta({
      title: "Giving Policy | Deep Spring Church of the Nazarene",
      description:
        "How gifts to Deep Spring Church of the Nazarene are received, allocated, recorded and reported.",
      path: "/giving-policy",
    }),
  component: GivingPolicy,
});

function GivingPolicy() {
  return (
    <LegalPage
      eyebrow="Giving"
      title="Giving Policy"
      intro="Gifts are voluntary, prayerful and handled with integrity. This policy explains how they are received and used."
    >
      <LegalSection title="Voluntary giving">
        <p>
          All giving to Deep Spring Church is voluntary. No person is required to give in order
          to attend, participate, serve or belong. We do not use Scripture, imagery or language
          to pressure, shame or manipulate anyone into giving.
        </p>
      </LegalSection>

      <LegalSection title="How gifts are allocated">
        <p>
          Gifts are applied to the fund selected by the donor. Where no fund is chosen, gifts
          are applied to General Ministry. Gifts support the mission, ministries,
          administration, outreach and compassionate service of the church.
        </p>
        <p>
          If a designated fund is closed or fully funded, the church may redirect the gift to
          the area of greatest ministry need. Donors may contact the church to discuss this.
        </p>
      </LegalSection>

      <LegalSection title="Records and receipts">
        <p>
          Donors receive an emailed confirmation of each gift showing the amount, fund,
          transaction date and transaction reference. This receipt is confirmation of payment.
          It is not automatically a legal tax document unless the church confirms the
          appropriate legal status.
        </p>
        <p>
          Donors should consult their own financial or tax adviser regarding the deductibility
          or legal treatment of donations.
        </p>
      </LegalSection>

      <LegalSection title="Non-cash and planned gifts">
        <p>
          Please contact the church before making gifts involving property, securities, estates,
          vehicles or other non-cash assets so they can be received appropriately.
        </p>
      </LegalSection>

      <LegalSection title="Financial accountability">
        <p>
          Deep Spring Church is committed to handling financial gifts responsibly,
          transparently and with integrity. Financial accountability statements and annual
          ministry reports will be published on this page as they become available.
        </p>
        <p>
          Deep Spring makes no claim of external accreditation, tax-exempt status, audited
          accounts or accountability memberships. Any such information will be published here
          only once it has been verified and provided by an authorized administrator.
        </p>
      </LegalSection>

      <LegalSection title="Payment security">
        <p>
          Online gifts are processed by a secure external payment provider. The church never
          receives or stores full card numbers, card security codes or bank credentials. Payment
          amounts are validated on the server and duplicate submissions are prevented.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
