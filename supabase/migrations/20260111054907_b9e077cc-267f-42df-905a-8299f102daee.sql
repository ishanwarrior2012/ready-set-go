-- =============================================
-- USER SETTINGS TABLE (preferences & configuration)
-- =============================================
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Display preferences
  theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  -- Notification preferences
  push_notifications_enabled boolean DEFAULT true,
  email_notifications_enabled boolean DEFAULT false,
  sound_enabled boolean DEFAULT true,
  -- Map preferences
  default_map_layer text DEFAULT 'standard',
  default_zoom_level integer DEFAULT 5 CHECK (default_zoom_level BETWEEN 1 AND 18),
  default_latitude double precision,
  default_longitude double precision,
  -- Feature preferences
  auto_refresh_enabled boolean DEFAULT true,
  refresh_interval_seconds integer DEFAULT 30 CHECK (refresh_interval_seconds >= 10),
  show_offline_data boolean DEFAULT true,
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  -- Ensure one settings record per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own settings"
ON public.user_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.user_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.user_settings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
ON public.user_settings FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- CACHED DATA TABLE (API response caching)
-- =============================================
CREATE TABLE public.cached_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL,
  cache_type text NOT NULL CHECK (cache_type IN ('flight', 'marine', 'earthquake', 'volcano', 'weather', 'radio', 'tsunami', 'iss')),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  -- Unique constraint on cache key
  UNIQUE(cache_key)
);

-- Enable RLS (public read for cached data)
ALTER TABLE public.cached_data ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read cached data
CREATE POLICY "Authenticated users can read cached data"
ON public.cached_data FOR SELECT
TO authenticated
USING (true);

-- Only service role can modify cached data (via edge functions)
CREATE POLICY "Service role can manage cached data"
ON public.cached_data FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_cached_data_updated_at
BEFORE UPDATE ON public.cached_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- USER BOOKMARKS TABLE (saved locations/items)
-- =============================================
CREATE TABLE public.user_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bookmark_type text NOT NULL CHECK (bookmark_type IN ('location', 'flight', 'vessel', 'earthquake', 'volcano', 'radio_station', 'weather_location')),
  title text NOT NULL,
  description text,
  latitude double precision,
  longitude double precision,
  metadata jsonb DEFAULT '{}'::jsonb,
  folder text DEFAULT 'default',
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Trigger for updated_at
CREATE TRIGGER update_user_bookmarks_updated_at
BEFORE UPDATE ON public.user_bookmarks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_display_name ON public.profiles(display_name);

-- User settings indexes
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);

-- User favorites indexes
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_item_type ON public.user_favorites(item_type);
CREATE INDEX idx_user_favorites_user_type ON public.user_favorites(user_id, item_type);

-- User alerts indexes
CREATE INDEX idx_user_alerts_user_id ON public.user_alerts(user_id);
CREATE INDEX idx_user_alerts_type ON public.user_alerts(alert_type);
CREATE INDEX idx_user_alerts_enabled ON public.user_alerts(user_id, enabled);

-- User bookmarks indexes
CREATE INDEX idx_user_bookmarks_user_id ON public.user_bookmarks(user_id);
CREATE INDEX idx_user_bookmarks_type ON public.user_bookmarks(bookmark_type);
CREATE INDEX idx_user_bookmarks_folder ON public.user_bookmarks(user_id, folder);
CREATE INDEX idx_user_bookmarks_pinned ON public.user_bookmarks(user_id, is_pinned);
CREATE INDEX idx_user_bookmarks_location ON public.user_bookmarks(latitude, longitude) WHERE latitude IS NOT NULL;

-- Cached data indexes
CREATE INDEX idx_cached_data_key ON public.cached_data(cache_key);
CREATE INDEX idx_cached_data_type ON public.cached_data(cache_type);
CREATE INDEX idx_cached_data_expires ON public.cached_data(expires_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- Chat messages indexes
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at DESC);

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- =============================================
-- AUTO-CREATE SETTINGS ON USER SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_settings
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();