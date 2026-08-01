export const SITE = {
  name: "Deep Spring Church of the Nazarene",
  shortName: "Deep Spring Church",
  tagline: "Life is a journey best walked together.",
  domain: "https://deepspringchurch.org",
  email: "info@deepspringchurch.org",
  phone: "+1 214 810 6356",
  phoneHref: "tel:+12148106356",
  serviceDay: "Sunday",
  serviceTime: "10:30 AM",
  address: {
    line1: "315 W. Ovilla Rd.",
    city: "Glenn Heights",
    state: "TX",
    zip: "75154",
  },
  addressOneLine: "315 W. Ovilla Rd., Glenn Heights, TX 75154",
  mapsQuery: "Deep Spring Church, 315 W. Ovilla Rd., Glenn Heights, TX 75154",
} as const;

export const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  SITE.mapsQuery,
)}`;

export const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  SITE.mapsQuery,
)}&output=embed`;

/**
 * Social links are intentionally empty. Icons only render once an
 * administrator supplies verified account URLs.
 */
export const SOCIAL_LINKS: { label: string; url: string }[] = [];

/**
 * Online giving stays in "preparing" mode until a payment provider is
 * configured by an authorized administrator.
 */
export const PAYMENTS_CONFIGURED = false;

export function pageMeta({
  title,
  description,
  path = "/",
  image,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
}) {
  const url = `${SITE.domain}${path}`;
  const meta = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
  if (image) {
    meta.push(
      { property: "og:image", content: image },
      { name: "twitter:image", content: image },
    );
  }
  return { meta, links: [{ rel: "canonical", href: url }] };
}
