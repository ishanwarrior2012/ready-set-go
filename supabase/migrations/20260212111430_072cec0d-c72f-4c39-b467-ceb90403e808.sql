
-- Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'media';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pro_member';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'member';
