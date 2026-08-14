// Server-only. Handles POST /api/stripe-webhook, intercepted by the
// stripeWebhookMiddleware requestMiddleware registered in src/start.ts —
// this app has no file-based "server route" mechanism, and a webhook needs
// the raw request body for signature verification anyway, which the
// CSRF-protected serverFn RPC contract isn't meant for. requestMiddleware is
// the only hook that sees every request before routing, so it short-circuits
// here directly.

type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

const UNIQUE_VIOLATION = "23505";

export async function handleStripeWebhook(request: Request): Promise<Response> {
  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) return new Response("Missing signature", { status: 400 });

    const payload = await request.text();

    const { getIntegrationSecret } = await import("@/lib/secrets.server");
    const webhookSecret = await getIntegrationSecret("stripe", "webhook_secret");
    if (!webhookSecret) return new Response("Webhook not configured", { status: 503 });

    const { verifyWebhookSignature } = await import("@/lib/stripe.server");
    const isValid = await verifyWebhookSignature(payload, signature, webhookSecret);
    if (!isValid) return new Response("Invalid signature", { status: 400 });

    let event: StripeEvent;
    try {
      event = JSON.parse(payload);
    } catch {
      return new Response("Invalid payload", { status: 400 });
    }

    await processStripeEvent(event);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("[stripe-webhook]", error);
    return new Response("Internal error", { status: 500 });
  }
}

async function processStripeEvent(event: StripeEvent): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  switch (event.type) {
    // Fires as soon as checkout completes. Card payments confirm immediately
    // (payment_status "paid"); ACH starts "unpaid" and resolves days later via
    // the async_payment_* events below.
    case "checkout.session.completed": {
      const session = event.data.object as {
        id: string;
        payment_status: string;
        customer: string | null;
        subscription: string | null;
      };
      await supabaseAdmin
        .from("donations")
        .update({
          status: session.payment_status === "paid" ? "succeeded" : "processing",
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        })
        .eq("provider_reference", session.id);
      break;
    }

    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as { id: string };
      await supabaseAdmin
        .from("donations")
        .update({ status: "succeeded", payment_method_type: "us_bank_account" })
        .eq("provider_reference", session.id);
      break;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as { id: string };
      await supabaseAdmin
        .from("donations")
        .update({ status: "failed" })
        .eq("provider_reference", session.id);
      break;
    }

    // Recurring renewals: the first payment already created a donations row via
    // checkout.session.completed; each later billing cycle needs its own row.
    case "invoice.paid": {
      const invoice = event.data.object as {
        id: string;
        subscription: string | null;
        billing_reason: string;
        amount_paid: number;
        currency: string;
        customer: string | null;
      };
      if (invoice.subscription && invoice.billing_reason === "subscription_cycle") {
        const { data: template } = await supabaseAdmin
          .from("donations")
          .select("donor_name, donor_email, fund, frequency")
          .eq("stripe_subscription_id", invoice.subscription)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (template) {
          const { error } = await supabaseAdmin.from("donations").insert({
            donor_name: template.donor_name,
            donor_email: template.donor_email,
            amount_cents: invoice.amount_paid,
            currency: invoice.currency,
            fund: template.fund,
            frequency: template.frequency,
            status: "succeeded",
            provider: "stripe",
            provider_reference: invoice.id,
            stripe_subscription_id: invoice.subscription,
            stripe_customer_id: invoice.customer,
          });
          // Stripe retries webhook deliveries; a unique-violation here just means
          // this invoice was already recorded by an earlier delivery attempt.
          if (error && error.code !== UNIQUE_VIOLATION) throw new Error(error.message);
        }
      }
      break;
    }

    default:
      break;
  }
}
