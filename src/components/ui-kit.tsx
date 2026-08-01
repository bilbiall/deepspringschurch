import { Link } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-sans text-sm font-semibold tracking-wide uppercase transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-60";

const variants = {
  primary:
    "bg-primary text-primary-foreground hover:-translate-y-0.5 hover:bg-primary/90 shadow-[0_6px_18px_oklch(0.46_0.072_214/0.22)]",
  outline:
    "border border-primary/35 text-primary bg-transparent hover:-translate-y-0.5 hover:bg-accent",
  ghostLight:
    "border border-primary-foreground/45 text-primary-foreground bg-primary-foreground/10 backdrop-blur-sm hover:-translate-y-0.5 hover:bg-primary-foreground/20",
  quiet: "text-primary hover:text-primary/75 underline-offset-4 hover:underline",
} as const;

const sizes = {
  md: "px-6 py-3",
  lg: "px-8 py-4 text-[0.8rem]",
  sm: "px-4 py-2 text-xs",
} as const;

export type ActionProps = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
};

export function ActionLink({
  to,
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ActionProps & { to?: string; href?: string } & Omit<
    ComponentProps<"a">,
    "href" | "className" | "children"
  >) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} {...rest}>
      {children}
    </a>
  );
}

export function ActionButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ActionProps & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="mt-3 text-3xl leading-tight md:text-[2.6rem]">{title}</h2>
      <div className={cn("rule-gold mt-5", align === "center" && "mx-auto")} />
      {intro ? (
        <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
          {intro}
        </p>
      ) : null}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-border bg-cream pt-32 pb-16 md:pt-44 md:pb-24">
      <div className="container-page">
        <div className="max-w-3xl">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 className="mt-3 text-4xl leading-[1.1] md:text-6xl">{title}</h1>
          <div className="rule-gold mt-6" />
          {intro ? (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {intro}
            </p>
          ) : null}
          {children ? <div className="mt-8 flex flex-wrap gap-3">{children}</div> : null}
        </div>
      </div>
    </header>
  );
}

export function EmptyState({
  title,
  message,
  children,
}: {
  title?: string;
  message: string;
  children?: ReactNode;
}) {
  return (
    <div className="card-soft border-dashed bg-cream/60 px-6 py-12 text-center">
      {title ? <h3 className="text-xl">{title}</h3> : null}
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>
      {children ? <div className="mt-6 flex justify-center gap-3">{children}</div> : null}
    </div>
  );
}
