
-- App config table for global settings (registration toggle, etc.)
CREATE TABLE public.app_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app config"
  ON public.app_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert app config"
  ON public.app_config FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins can update app config"
  ON public.app_config FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins can delete app config"
  ON public.app_config FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Domains table
CREATE TABLE public.managed_domains (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  domain text NOT NULL UNIQUE,
  description text,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.managed_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view domains"
  ON public.managed_domains FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert domains"
  ON public.managed_domains FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins can update domains"
  ON public.managed_domains FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins can delete domains"
  ON public.managed_domains FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE TRIGGER update_managed_domains_updated_at
  BEFORE UPDATE ON public.managed_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_config (key, value) VALUES ('registration_enabled', 'true'::jsonb);

INSERT INTO public.managed_domains (name, domain, description, sort_order) VALUES
  ('Hydra', 'hydra.qzz.io', 'Hydra project website', 1),
  ('Unique Online', 'uniqueonline.qzz.io', 'Unique Online platform', 2),
  ('Lazer', 'lazer.qzz.io', 'Lazer project website', 3),
  ('Hunter x Hunter', 'hunterxhunter.qzz.io', 'Hunter x Hunter fan site', 4),
  ('Shadow Dark', 'shadowdark.qzz.io', 'Shadow Dark project website', 5);
