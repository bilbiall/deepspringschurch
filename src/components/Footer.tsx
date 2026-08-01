import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import logo from "@/assets/deep-spring-logo-mark.png.asset.json";
import { SITE, SOCIAL_LINKS } from "@/lib/site";

const PRIMARY_LINKS = [
  { label: "About", to: "/about" },
  { label: "Beliefs", to: "/beliefs" },
  { label: "Ministries", to: "/ministries" },
  { label: "Children & Families", to: "/children-and-families" },
  { label: "Connection Groups", to: "/connection-groups" },
  { label: "Sermons", to: "/sermons" },
];

const SECONDARY_LINKS = [
  { label: "Events", to: "/events" },
  { label: "Give", to: "/give" },
  { label: "Blog & Resources", to: "/blog" },
  { label: "Plan Your Visit", to: "/plan-your-visit" },
  { label: "Contact", to: "/contact" },
];

const POLICY_LINKS = [
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Giving Policy", to: "/giving-policy" },
  { label: "Refund Policy", to: "/refund-policy" },
  { label: "Accessibility", to: "/accessibility" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-cream">
      <div className="container-page py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <img
              src={logo.url}
              alt={`${SITE.name} logo`}
              width={96}
              height={96}
              loading="lazy"
              className="h-20 w-20 object-contain"
            />
            <p className="mt-5 font-display text-xl leading-snug text-ink">
              Deep Spring Church of the Nazarene
            </p>
            <p className="mt-2 font-display text-base text-primary italic">
              “{SITE.tagline}”
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Visit
            </h2>
            <address className="mt-5 space-y-4 text-sm leading-relaxed not-italic text-foreground/85">
              <p className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  {SITE.address.line1}
                  <br />
                  {SITE.address.city}, {SITE.address.state} {SITE.address.zip}
                </span>
              </p>
              <p className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  Sunday Service
                  <br />
                  {SITE.serviceTime}
                </span>
              </p>
              <p className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <a href={SITE.phoneHref} className="hover:text-primary">
                  {SITE.phone}
                </a>
              </p>
              <p className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <a href={`mailto:${SITE.email}`} className="break-all hover:text-primary">
                  {SITE.email}
                </a>
              </p>
            </address>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Explore
            </h2>
            <ul className="mt-5 space-y-3 text-sm">
              {PRIMARY_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-foreground/85 transition-colors hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Connect
            </h2>
            <ul className="mt-5 space-y-3 text-sm">
              {SECONDARY_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-foreground/85 transition-colors hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            {SOCIAL_LINKS.length > 0 ? (
              <ul className="mt-6 flex gap-3">
                {SOCIAL_LINKS.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      className="text-sm text-primary hover:underline"
                      rel="noreferrer noopener"
                      target="_blank"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {POLICY_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={SITE.domain}
                className="transition-colors hover:text-primary"
                rel="noreferrer noopener"
              >
                deepspringchurch.org
              </a>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            © {year} Deep Spring Church of the Nazarene. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
