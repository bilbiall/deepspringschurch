import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/site";
import { ActionLink } from "@/components/ui-kit";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-cream px-4 py-32">
      <div className="max-w-md text-center">
        <p className="eyebrow">Page not found</p>
        <h1 className="mt-4 font-display text-5xl text-ink">This path leads nowhere</h1>
        <div className="rule-gold mx-auto mt-6" />
        <p className="mt-5 text-muted-foreground">
          The page you are looking for may have moved. Let us help you find your way — you
          do not have to journey alone.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ActionLink to="/">Return home</ActionLink>
          <ActionLink to="/contact" variant="outline">
            Contact the church
          </ActionLink>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: import("@tanstack/react-router").ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-cream px-4 py-32">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl text-ink">This page didn’t load</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Something went wrong on our end. You can try again, or contact the church at{" "}
          {SITE.phone}.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-xs font-semibold tracking-wider text-primary-foreground uppercase"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center rounded-full border border-primary/35 px-6 py-3 text-xs font-semibold tracking-wider text-primary uppercase"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const churchSchema = {
  "@context": "https://schema.org",
  "@type": "Church",
  name: SITE.name,
  alternateName: SITE.shortName,
  slogan: SITE.tagline,
  url: SITE.domain,
  telephone: SITE.phone,
  email: SITE.email,
  logo: `${SITE.domain}/favicon.png`,
  image: `${SITE.domain}/og-image.png`,
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE.address.line1,
    addressLocality: SITE.address.city,
    addressRegion: SITE.address.state,
    postalCode: SITE.address.zip,
    addressCountry: "US",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "https://schema.org/Sunday",
      opens: "10:30",
    },
  ],
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Deep Spring Church of the Nazarene | Glenn Heights, Texas" },
      {
        name: "description",
        content:
          "Deep Spring Church of the Nazarene is a welcoming Christian community in Glenn Heights, Texas, where people find rest, grow in Christ, build relationships and serve others.",
      },
      { name: "author", content: SITE.name },
      { property: "og:site_name", content: SITE.name },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#ffffff" },
      { property: "og:title", content: "Deep Spring Church of the Nazarene | Glenn Heights, Texas" },
      { name: "twitter:title", content: "Deep Spring Church of the Nazarene | Glenn Heights, Texas" },
      { property: "og:description", content: "Deep Spring Church of the Nazarene is a welcoming Christian community in Glenn Heights, Texas, where people find rest, grow in Christ, build relationships and serve others." },
      { name: "twitter:description", content: "Deep Spring Church of the Nazarene is a welcoming Christian community in Glenn Heights, Texas, where people find rest, grow in Christ, build relationships and serve others." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d47109af-7eaa-4a18-8b38-7942e7e23755/id-preview-572458bf--1aac4d57-7feb-493b-a211-1beb41d9c1e4.lovable.app-1785593882921.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d47109af-7eaa-4a18-8b38-7942e7e23755/id-preview-572458bf--1aac4d57-7feb-493b-a211-1beb41d9c1e4.lovable.app-1785593882921.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Karla:ital,wght@0,300..700;1,300..600&display=swap",
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(churchSchema),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to content
      </a>
      {isAdmin ? null : <Header />}
      <main id="main">
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </main>
      {isAdmin ? null : <Footer />}
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
