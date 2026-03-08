
-- Fix: Replace all RESTRICTIVE policies with PERMISSIVE policies for proper data access
-- Drop all existing policies first, then recreate them as PERMISSIVE

-- ── profiles ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── notifications ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ── user_favorites ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.user_favorites;

CREATE POLICY "Users can view their own favorites"
  ON public.user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON public.user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.user_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ── user_bookmarks ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.user_bookmarks;
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON public.user_bookmarks;
DROP POLICY IF EXISTS "Users can update their own bookmarks" ON public.user_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.user_bookmarks;

CREATE POLICY "Users can view their own bookmarks"
  ON public.user_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON public.user_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks"
  ON public.user_bookmarks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON public.user_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ── user_settings ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;

CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- ── chat_messages ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.chat_messages;

CREATE POLICY "Users can view their own messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── user_alerts ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own alerts" ON public.user_alerts;
DROP POLICY IF EXISTS "Users can insert their own alerts" ON public.user_alerts;
DROP POLICY IF EXISTS "Users can update their own alerts" ON public.user_alerts;
DROP POLICY IF EXISTS "Users can delete their own alerts" ON public.user_alerts;

CREATE POLICY "Users can view their own alerts"
  ON public.user_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts"
  ON public.user_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON public.user_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON public.user_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- ── user_roles ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- ── cached_data (service role only — no user access needed) ──────────────────
DROP POLICY IF EXISTS "Service role can manage cached data" ON public.cached_data;

CREATE POLICY "Service role can manage cached data"
  ON public.cached_data
  USING (false)
  WITH CHECK (false);
