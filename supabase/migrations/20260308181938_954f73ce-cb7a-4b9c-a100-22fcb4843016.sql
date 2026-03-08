
-- Create feedback_reports table for bug reports, feature suggestions, and surveys
CREATE TABLE public.feedback_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'survey', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'closed', 'planned')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT,
  page_url TEXT,
  user_agent TEXT,
  screenshot_url TEXT,
  votes INTEGER NOT NULL DEFAULT 0,
  admin_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
  ON public.feedback_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own reports
CREATE POLICY "Users can insert their own reports"
  ON public.feedback_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports (e.g., edit description)
CREATE POLICY "Users can update their own reports"
  ON public.feedback_reports FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own reports
CREATE POLICY "Users can delete their own reports"
  ON public.feedback_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view ALL reports
CREATE POLICY "Admins can view all reports"
  ON public.feedback_reports FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update any report (change status, priority, admin_notes)
CREATE POLICY "Admins can update all reports"
  ON public.feedback_reports FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete any report
CREATE POLICY "Admins can delete all reports"
  ON public.feedback_reports FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_feedback_reports_updated_at
  BEFORE UPDATE ON public.feedback_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create survey_responses table for in-app surveys
CREATE TABLE public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  survey_id TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  nps_score INTEGER CHECK (nps_score BETWEEN 0 AND 10),
  responses JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own surveys"
  ON public.survey_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own surveys"
  ON public.survey_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all surveys"
  ON public.survey_responses FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Index for performance
CREATE INDEX idx_feedback_reports_user_id ON public.feedback_reports(user_id);
CREATE INDEX idx_feedback_reports_type ON public.feedback_reports(type);
CREATE INDEX idx_feedback_reports_status ON public.feedback_reports(status);
CREATE INDEX idx_feedback_reports_created_at ON public.feedback_reports(created_at DESC);
CREATE INDEX idx_survey_responses_user_id ON public.survey_responses(user_id);
