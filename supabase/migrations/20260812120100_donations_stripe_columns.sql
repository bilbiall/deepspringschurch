-- ============ donations: Stripe fields ============
ALTER TABLE public.donations
  ADD COLUMN stripe_customer_id text,
  ADD COLUMN stripe_subscription_id text,
  ADD COLUMN payment_method_type text;

CREATE INDEX idx_donations_stripe_subscription ON public.donations (stripe_subscription_id);
