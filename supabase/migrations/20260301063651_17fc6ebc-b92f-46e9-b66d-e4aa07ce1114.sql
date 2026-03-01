
-- Fix cached_data public exposure: remove overly permissive authenticated read policy
-- Since cached_data is system-level cache (no user_id), only service role should manage it
-- Authenticated users should not be able to directly read all cached data

DROP POLICY IF EXISTS "Authenticated users can read cached data" ON public.cached_data;
