-- Add biggest_win column to profiles for casino streamer theme
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS biggest_win text;