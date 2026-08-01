import { createFileRoute } from "@tanstack/react-router";
import { pageMeta, SITE } from "@/lib/site";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/accessibility")({
  head: () =>
    pageMeta({
      title: "Accessibility Statement | Deep Spring Church of the Nazarene",
      description:
        "Our commitment to an accessible website and an accessible church for people of every age, ability and need.",
      path: "/accessibility",
    }),
  component: AccessibilityPage,
});

function AccessibilityPage() {
  return (
    <LegalPage
      eyebrow="Accessibility"
      title="Accessibility Statement"
      intro="Everyone should be able to use this website and take part in the life of this church."
    >
      <LegalSection title="Our commitment">
        <p>
          Deep Spring Church of the Nazarene is committed to making both this website and our
          gatherings accessible to people of every age, ability and need. Accessibility is not
          an add-on for us — it is part of what it means to say that every person is seen and
          loved.
        </p>
      </LegalSection>

      <LegalSection title="This website">
        <p>We aim to meet WCAG 2.1 Level AA. The site is built with:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Semantic HTML and clear heading structure</li>
          <li>A skip-to-content link and full keyboard navigation</li>
          <li>Visible focus indicators on every interactive element</li>
          <li>Labelled, accessible forms with clear error and success messages</li>
          <li>Descriptive alternative text for meaningful images</li>
          <li>Strong colour contrast between text and backgrounds</li>
          <li>Respect for the “reduce motion” setting in your browser or operating system</li>
          <li>Responsive layouts and large touch targets on mobile devices</li>
        </ul>
      </LegalSection>

      <LegalSection title="In our building">
        <p>
          Our children’s ministry provides sensory rooms, quiet spaces and practical support for
          children with special needs. Tell us what you or your family need before you visit and
          we will prepare for it.
        </p>
        <p>
          Parking, entrance and in-building accessibility details for 315 W. Ovilla Rd. will be
          published here as our facility is prepared.
        </p>
      </LegalSection>

      <LegalSection title="Tell us where we fall short">
        <p>
          If you encounter a barrier on this website or in our gatherings, please tell us. Email{" "}
          <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">
            {SITE.email}
          </a>{" "}
          or call{" "}
          <a href={SITE.phoneHref} className="text-primary hover:underline">
            {SITE.phone}
          </a>
          . We will respond and work to fix it.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
