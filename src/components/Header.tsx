import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X, Phone, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/deep-spring-logo-mark.png.asset.json";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

type NavChild = { label: string; to: string };
type NavItem = { label: string; to?: string; children?: NavChild[] };

const NAV: NavItem[] = [
  { label: "Home", to: "/" },
  {
    label: "About",
    children: [
      { label: "Our Story", to: "/about" },
      { label: "What We Believe", to: "/beliefs" },
      { label: "Plan Your Visit", to: "/plan-your-visit" },
    ],
  },
  {
    label: "Ministries",
    children: [
      { label: "All Ministries", to: "/ministries" },
      { label: "Children & Families", to: "/children-and-families" },
      { label: "Connection Groups", to: "/connection-groups" },
    ],
  },
  {
    label: "Media",
    children: [
      { label: "Sermons", to: "/sermons" },
      { label: "Blog & Resources", to: "/blog" },
    ],
  },
  { label: "Events", to: "/events" },
  { label: "Give", to: "/give" },
  { label: "Contact", to: "/contact" },
];

export function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setOpenMenu(null);
    setOpenMobileGroup(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = scrolled || !isHome || open;

  const hoverOpen = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(label);
  };
  const hoverClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140);
  };

  const isGroupActive = (children: NavChild[]) =>
    children.some((c) => pathname === c.to || pathname.startsWith(`${c.to}/`));

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
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full transition-all duration-500",
              solid ? "" : "bg-white/92 p-1.5 shadow-[0_4px_18px_rgba(0,0,0,0.18)] backdrop-blur-sm",
            )}
          >
            <img
              src={logo.url}
              alt={`${SITE.name} logo`}
              width={56}
              height={56}
              className="h-12 w-12 object-contain md:h-14 md:w-14"
            />
          </span>

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

        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => hoverOpen(item.label)}
                onMouseLeave={hoverClose}
              >
                <button
                  type="button"
                  onClick={() => setOpenMenu((v) => (v === item.label ? null : item.label))}
                  aria-expanded={openMenu === item.label}
                  className={cn(
                    "inline-flex items-center gap-1 text-sm font-medium transition-colors duration-300",
                    solid
                      ? isGroupActive(item.children)
                        ? "font-semibold text-primary"
                        : "text-foreground/80 hover:text-primary"
                      : isGroupActive(item.children)
                        ? "font-semibold text-white"
                        : "text-white/85 hover:text-white",
                  )}
                >
                  {item.label}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-300",
                      openMenu === item.label && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>

                <AnimatePresence>
                  {openMenu === item.label ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute left-1/2 top-full z-50 w-60 -translate-x-1/2 pt-4"
                    >
                      <ul className="overflow-hidden rounded-2xl border border-border bg-background p-2 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)]">
                        {item.children.map((child) => (
                          <li key={child.to}>
                            <Link
                              to={child.to}
                              className="block rounded-xl px-4 py-2.5 text-sm text-foreground/85 transition-colors hover:bg-muted hover:text-primary"
                              activeProps={{ className: "text-primary font-semibold" }}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={item.to}
                to={item.to!}
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
            ),
          )}
        </nav>

        <div className="hidden items-center lg:flex">
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
            className="max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-border bg-background lg:hidden"
          >
            <nav aria-label="Mobile" className="container-page flex flex-col py-4">
              {NAV.map((item) =>
                item.children ? (
                  <div key={item.label} className="border-b border-border/70">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMobileGroup((v) => (v === item.label ? null : item.label))
                      }
                      aria-expanded={openMobileGroup === item.label}
                      className="flex w-full items-center justify-between py-4 font-display text-xl text-ink"
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 text-muted-foreground transition-transform duration-300",
                          openMobileGroup === item.label && "rotate-180",
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {openMobileGroup === item.label ? (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          {item.children.map((child) => (
                            <li key={child.to}>
                              <Link
                                to={child.to}
                                className="block py-3 pl-4 text-base text-muted-foreground"
                                activeProps={{ className: "text-primary font-semibold" }}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                          <li className="h-2" />
                        </motion.ul>
                      ) : null}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={item.to}
                    to={item.to!}
                    activeOptions={{ exact: item.to === "/" }}
                    className="border-b border-border/70 py-4 font-display text-xl text-ink"
                    activeProps={{ className: "text-primary" }}
                  >
                    {item.label}
                  </Link>
                ),
              )}
              <Link
                to="/plan-your-visit"
                className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-xs font-semibold tracking-wider text-primary-foreground uppercase"
              >
                Plan Your Visit
              </Link>
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
