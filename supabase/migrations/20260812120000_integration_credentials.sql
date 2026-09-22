-- ============ integration credentials (payment/email providers) ============
-- Holds encrypted API credentials entered by an admin through the settings UI.
-- Secrets are envelope-encrypted (AES-GCM) in application code before they ever
-- reach this table — the master key lives only as a Worker secret
-- (ENCRYPTION_KEY), never in the database. No RLS policies are defined for
-- anon/authenticated, so only the service-role client (supabaseAdmin) can
-- read or write this table.
CREATE TABLE public.integration_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  mode text NOT NULL DEFAULT 'test' CHECK (mode IN ('test', 'live')),
  is_active boolean NOT NULL DEFAULT false,
  public_value text,
  secrets jsonb NOT NULL DEFAULT '{}'::jsonb,
  ach_enabled boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.integration_credentials TO service_role;
ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER integration_credentials_updated_at BEFORE UPDATE ON public.integration_credentials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
