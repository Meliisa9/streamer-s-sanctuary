-- ============================================
-- Default Site Settings
-- ============================================
-- Initializes default configuration values
-- Safe to run multiple times (uses ON CONFLICT)
-- ============================================

-- Core site settings
INSERT INTO public.site_settings (key, value) VALUES 
  ('site_name', '"StreamHub"'::jsonb),
  ('site_description', '"Your ultimate streaming community hub"'::jsonb),
  ('is_live', 'false'::jsonb),
  ('live_platform', '"twitch"'::jsonb),
  ('auto_detect_enabled', 'false'::jsonb),
  ('twitch_channel', '""'::jsonb),
  ('kick_channel', '""'::jsonb),
  ('last_check', 'null'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- GTW (Guess The Win) points configuration
INSERT INTO public.site_settings (key, value) VALUES 
  ('gtw_points_1st', '300'::jsonb),
  ('gtw_points_2nd', '200'::jsonb),
  ('gtw_points_3rd', '100'::jsonb),
  ('gtw_points_4th_10th', '25'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Leaderboard settings
INSERT INTO public.site_settings (key, value) VALUES 
  ('leaderboard_how_to_earn', '"Earn points by participating in bonus hunts, giveaways, and daily activities!"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Navigation visibility settings
INSERT INTO public.site_settings (key, value) VALUES 
  ('nav_videos', 'true'::jsonb),
  ('nav_news', 'true'::jsonb),
  ('nav_bonuses', 'true'::jsonb),
  ('nav_giveaways', 'true'::jsonb),
  ('nav_events', 'true'::jsonb),
  ('nav_polls', 'true'::jsonb),
  ('nav_leaderboard', 'true'::jsonb),
  ('nav_streamers', 'true'::jsonb),
  ('nav_bonus_hunt', 'true'::jsonb),
  ('nav_about', 'true'::jsonb),
  ('nav_achievements', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Social media links (update with your actual URLs)
INSERT INTO public.site_settings (key, value) VALUES 
  ('social_twitch', '""'::jsonb),
  ('social_kick', '""'::jsonb),
  ('social_youtube', '""'::jsonb),
  ('social_twitter', '""'::jsonb),
  ('social_discord', '""'::jsonb),
  ('social_instagram', '""'::jsonb),
  ('social_tiktok', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Verify settings
SELECT key, value FROM public.site_settings ORDER BY key;
