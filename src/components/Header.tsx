import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/deep-spring-logo.png.asset.json";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Beliefs", to: "/beliefs" },
  { label: "Ministries", to: "/ministries" },
  { label: "Sermons", to: "/sermons" },
  { label: "Events", to: "/events" },
  { label: "Blog", to: "/blog" },
  { label: "Give", to: "/give" },
  { label: "Contact", to: "/contact" },
];

export function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = scrolled || !isHome || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-out",
        solid
          ? "border-b border-border bg-background/95 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container-page flex items-center justify-between gap-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-3" aria-label={`${SITE.name} — home`}>
          <img
            src={logo.url}
            alt={`${SITE.name} logo`}
            width={56}
            height={56}
            className={cn(
              "h-12 w-12 object-contain transition-all duration-500 md:h-14 md:w-14",
              solid ? "" : "brightness-0 invert",
            )}
          />
          <span className="hidden leading-tight sm:block">
            <span
              className={cn(
                "block font-display text-base tracking-tight transition-colors duration-500 md:text-lg",
                solid ? "text-ink" : "text-white",
              )}
            >
              Deep Spring Church
            </span>
            <span
              className={cn(
                "block text-[0.62rem] font-semibold tracking-[0.2em] uppercase transition-colors duration-500",
                solid ? "text-muted-foreground" : "text-white/75",
              )}
            >
              of the Nazarene
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className={cn(
                "text-sm font-medium transition-colors duration-300",
                solid
                  ? "text-foreground/80 hover:text-primary"
                  : "text-white/85 hover:text-white",
              )}
              activeProps={{
                className: solid ? "text-primary font-semibold" : "text-white font-semibold",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/sermons"
            className={cn(
              "text-xs font-semibold tracking-wider uppercase transition-colors duration-300",
              solid ? "text-muted-foreground hover:text-primary" : "text-white/80 hover:text-white",
            )}
          >
            Watch a Sermon
          </Link>
          <Link
            to="/plan-your-visit"
            className={cn(
              "inline-flex items-center rounded-full px-5 py-2.5 text-xs font-semibold tracking-wider uppercase transition-all duration-300 hover:-translate-y-0.5",
              solid
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-white/50 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20",
            )}
          >
            Plan Your Visit
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-300 lg:hidden",
            solid ? "border-border text-foreground" : "border-white/40 text-white",
          )}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-border bg-background lg:hidden"
          >
            <nav aria-label="Mobile" className="container-page flex flex-col py-4">
              {[...NAV, { label: "Plan Your Visit", to: "/plan-your-visit" }].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  className="border-b border-border/70 py-4 font-display text-xl text-ink last:border-0"
                  activeProps={{ className: "text-primary" }}
                >
                  {item.label}
                </Link>
              ))}
              <a
                href={SITE.phoneHref}
                className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {SITE.phone}
              </a>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
