-- Add user_restrictions table for moderation actions (warn, restrict, etc.)
CREATE TABLE IF NOT EXISTS public.user_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  restriction_type TEXT NOT NULL,
  reason TEXT,
  created_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.user_restrictions ENABLE ROW LEVEL SECURITY;

-- Admins/mods can manage restrictions
CREATE POLICY "Admins and mods can manage restrictions"
  ON public.user_restrictions
  FOR ALL
  USING (is_admin_or_mod(auth.uid()));

-- Users can view their own restrictions
CREATE POLICY "Users can view own restrictions"
  ON public.user_restrictions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add user_warnings table for warning log
CREATE TABLE IF NOT EXISTS public.user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  warned_by UUID NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and mods can manage warnings"
  ON public.user_warnings
  FOR ALL
  USING (is_admin_or_mod(auth.uid()));

CREATE POLICY "Users can view own warnings"
  ON public.user_warnings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add configurable GTW points settings (value is jsonb, so cast properly)
INSERT INTO public.site_settings (key, value) VALUES 
  ('gtw_points_1st', '300'::jsonb),
  ('gtw_points_2nd', '200'::jsonb),
  ('gtw_points_3rd', '100'::jsonb),
  ('gtw_points_4th_10th', '25'::jsonb),
  ('leaderboard_how_to_earn', '"Earn points by participating in bonus hunts, giveaways, and daily activities!"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Add video categories for Big Wins and Max Wins
INSERT INTO public.video_categories (name, slug, sort_order) VALUES
  ('Big Wins', 'big-wins', 10),
  ('Max Wins', 'max-wins', 11)
ON CONFLICT DO NOTHING;