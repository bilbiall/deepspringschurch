import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { GIVING_FUNDS } from "@/content/church";

const FUND_SLUGS = GIVING_FUNDS.map((f) => f.slug) as [string, ...string[]];

const checkoutSchema = z
  .object({
    fund: z.enum(FUND_SLUGS),
    fund_other: z.string().trim().max(200).optional().default(""),
    amount: z.coerce.number().min(1).max(1_000_000),
    frequency: z.enum(["one-time", "weekly", "monthly"]),
    donor_name: z.string().trim().max(200).optional().default(""),
    donor_email: z.string().trim().email().max(255),
    donor_phone: z.string().trim().max(40).optional().default(""),
    anonymous: z.boolean().default(false),
    dedication: z.string().trim().max(300).optional().default(""),
    donor_message: z.string().trim().max(2000).optional().default(""),
    cover_fees: z.boolean().default(false),
  })
  .refine((data) => data.fund !== "other" || data.fund_other.length > 0, {
    message: "Please describe the purpose of this gift.",
    path: ["fund_other"],
  });

export const getPublicPaymentStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getIntegrationStatus } = await import("@/lib/secrets.server");
  const [stripeStatus, tithelyStatus] = await Promise.all([
    getIntegrationStatus("stripe"),
    getIntegrationStatus("tithely"),
  ]);
  return {
    active: stripeStatus.configured && stripeStatus.isActive,
    achEnabled: stripeStatus.achEnabled,
    tithelyUrl:
      tithelyStatus.isActive && tithelyStatus.publicValue ? tithelyStatus.publicValue : null,
  };
});

export const createDonationCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => checkoutSchema.parse(data))
  .handler(async ({ data }) => {
    const { getIntegrationStatus, getIntegrationSecret } = await import("@/lib/secrets.server");
    const status = await getIntegrationStatus("stripe");
    const secretKey = status.isActive ? await getIntegrationSecret("stripe", "secret_key") : null;
    if (!status.isActive || !secretKey) {
      throw new Error("Online giving is not available right now. Please try again later.");
    }

    const { createCheckoutSession } = await import("@/lib/stripe.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const fundMeta = GIVING_FUNDS.find((f) => f.slug === data.fund)!;
    const fundLabel = data.fund === "other" && data.fund_other ? data.fund_other : fundMeta.name;

    const request = getRequest();
    const origin = new URL(request.url).origin;

    const paymentMethodTypes: Array<"card" | "us_bank_account"> = status.achEnabled
      ? ["card", "us_bank_account"]
      : ["card"];

    // Flat estimate of Stripe's card processing fee (2.9% + $0.30). Real fees vary by
    // card network/country; this only affects the optional "cover the fee" surcharge.
    const amountCents = Math.round(data.amount * 100);
    const feeCents = data.cover_fees ? Math.round(amountCents * 0.029 + 30) : 0;
    const totalCents = amountCents + feeCents;

    const session = await createCheckoutSession(secretKey, {
      mode: data.frequency === "one-time" ? "payment" : "subscription",
      paymentMethodTypes,
      lineItem: {
        currency: "usd",
        unitAmountCents: totalCents,
        productName: `${fundLabel} — Deep Spring Church giving`,
        ...(data.frequency === "weekly"
          ? { recurringInterval: "week" as const }
          : data.frequency === "monthly"
            ? { recurringInterval: "month" as const }
            : {}),
      },
      successUrl: `${origin}/give?donation=success`,
      cancelUrl: `${origin}/give?donation=cancelled`,
      customerEmail: data.donor_email,
      metadata: {
        fund: data.fund,
        fund_label: fundLabel,
        frequency: data.frequency,
        donor_name: data.anonymous ? "" : data.donor_name,
        anonymous: String(data.anonymous),
        dedication: data.dedication,
        donor_message: data.donor_message,
        cover_fees: String(data.cover_fees),
      },
    });

    const { error } = await supabaseAdmin.from("donations").insert({
      donor_name: data.anonymous ? null : data.donor_name || null,
      donor_email: data.donor_email,
      amount_cents: totalCents,
      currency: "usd",
      fund: fundLabel,
      frequency: data.frequency,
      status: "pending",
      provider: "stripe",
      provider_reference: session.id,
      notes: [data.dedication, data.donor_message].filter(Boolean).join(" | ") || null,
    });
    if (error) throw new Error("Could not start checkout. Please try again.");

    return { checkoutUrl: session.url };
  });
