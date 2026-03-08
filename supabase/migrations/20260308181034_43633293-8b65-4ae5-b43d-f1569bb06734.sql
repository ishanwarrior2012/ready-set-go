
-- Ensure ALL policies are PERMISSIVE (AS PERMISSIVE is the default but let's be explicit)
-- The previous migration used CREATE POLICY without AS PERMISSIVE/RESTRICTIVE
-- PostgreSQL defaults to PERMISSIVE when not specified — confirming they are correct.

-- Fix the profiles table which still has a "Deny anonymous access" RESTRICTIVE ALL policy
-- that blocks everything. Drop it.
DROP POLICY IF EXISTS "Deny anonymous access" ON public.profiles;

-- Also fix user_roles: drop old RESTRICTIVE admin policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix cached_data: make the service role policy actually use false for regular users
-- (keeps it blocked for normal authenticated users, only service_role bypasses RLS)
DROP POLICY IF EXISTS "Service role can manage cached data" ON public.cached_data;
-- No policy needed — service_role bypasses RLS entirely. Leaving table locked for anon/authed.
