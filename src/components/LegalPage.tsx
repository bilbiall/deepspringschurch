import type { ReactNode } from "react";
import { PageHero } from "@/components/ui-kit";
import { SITE } from "@/lib/site";

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} intro={intro} />
      <div className="section-y bg-background">
        <div className="container-page max-w-3xl">
          {children}
          <section className="card-soft mt-14 bg-cream p-7 text-sm leading-relaxed text-muted-foreground">
            <p className="font-semibold text-ink">Questions about this policy?</p>
            <p className="mt-2">
              Contact Deep Spring Church of the Nazarene, {SITE.address.line1},{" "}
              {SITE.address.city}, {SITE.address.state} {SITE.address.zip} · {SITE.phone} ·{" "}
              <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">
                {SITE.email}
              </a>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
