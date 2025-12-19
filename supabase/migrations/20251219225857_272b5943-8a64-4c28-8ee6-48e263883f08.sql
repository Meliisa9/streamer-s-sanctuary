-- Add linked_user_id column to streamers for clickable avatars
ALTER TABLE public.streamers ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Add streamer_type column to distinguish between streamers and team members
ALTER TABLE public.streamers ADD COLUMN IF NOT EXISTS streamer_type text DEFAULT 'streamer' CHECK (streamer_type IN ('streamer', 'team_member'));