-- 1. User Bans table for ban/unban/IP ban functionality
CREATE TABLE public.user_bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  banned_by UUID NOT NULL,
  reason TEXT,
  ip_address TEXT,
  is_ip_ban BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_permanent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unbanned_at TIMESTAMP WITH TIME ZONE,
  unbanned_by UUID
);

ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and moderators can manage bans"
ON public.user_bans FOR ALL
USING (is_admin_or_mod(auth.uid()));

CREATE POLICY "Users can view their own bans"
ON public.user_bans FOR SELECT
USING (auth.uid() = user_id);

-- 2. Scheduled Posts table
CREATE TABLE public.scheduled_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_type TEXT NOT NULL CHECK (post_type IN ('news', 'giveaway')),
  post_data JSONB NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'cancelled', 'failed')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and mods can manage scheduled posts"
ON public.scheduled_posts FOR ALL
USING (is_admin_or_mod(auth.uid()));

-- 3. Content Flags table for moderation queue
CREATE TABLE public.content_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('comment', 'poll', 'profile_comment', 'article')),
  content_id UUID NOT NULL,
  flagged_by UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'removed')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can flag content"
ON public.content_flags FOR INSERT
WITH CHECK (auth.uid() = flagged_by);

CREATE POLICY "Admins and mods can manage flags"
ON public.content_flags FOR ALL
USING (is_admin_or_mod(auth.uid()));

CREATE POLICY "Users can view their own flags"
ON public.content_flags FOR SELECT
USING (auth.uid() = flagged_by);

-- 4. Leaderboard Periods table
CREATE TABLE public.leaderboard_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'all_time')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view periods"
ON public.leaderboard_periods FOR SELECT
USING (true);

CREATE POLICY "Admins can manage periods"
ON public.leaderboard_periods FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Leaderboard Snapshots table (stores points at end of period)
CREATE TABLE public.leaderboard_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_id UUID NOT NULL REFERENCES public.leaderboard_periods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view snapshots"
ON public.leaderboard_snapshots FOR SELECT
USING (true);

CREATE POLICY "System can insert snapshots"
ON public.leaderboard_snapshots FOR INSERT
WITH CHECK (true);

-- 6. User Follows table
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can follow others"
ON public.user_follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.user_follows FOR DELETE
USING (auth.uid() = follower_id);

CREATE POLICY "Everyone can view follows"
ON public.user_follows FOR SELECT
USING (true);

-- 7. User Badges table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_key TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT,
  badge_color TEXT,
  is_title BOOLEAN DEFAULT false,
  is_equipped BOOLEAN DEFAULT false,
  awarded_by UUID,
  awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view badges"
ON public.user_badges FOR SELECT
USING (true);

CREATE POLICY "Admins can manage badges"
ON public.user_badges FOR ALL
USING (is_admin_or_mod(auth.uid()));

CREATE POLICY "Users can equip their badges"
ON public.user_badges FOR UPDATE
USING (auth.uid() = user_id);

-- 8. Profile Comments table
CREATE TABLE public.profile_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_user_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view approved comments"
ON public.profile_comments FOR SELECT
USING (is_approved = true OR auth.uid() = author_id OR auth.uid() = profile_user_id OR is_admin_or_mod(auth.uid()));

CREATE POLICY "Users can post comments"
ON public.profile_comments FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can edit/delete own comments"
ON public.profile_comments FOR UPDATE
USING (auth.uid() = author_id OR auth.uid() = profile_user_id OR is_admin_or_mod(auth.uid()));

CREATE POLICY "Users can delete own comments or profile owner can delete"
ON public.profile_comments FOR DELETE
USING (auth.uid() = author_id OR auth.uid() = profile_user_id OR is_admin_or_mod(auth.uid()));

-- 9. User Bookmarks table
CREATE TABLE public.user_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'article', 'giveaway')),
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bookmarks"
ON public.user_bookmarks FOR ALL
USING (auth.uid() = user_id);

-- Add followers/following counts to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_badge TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_title TEXT;

-- Create indexes for performance
CREATE INDEX idx_user_bans_user_id ON public.user_bans(user_id);
CREATE INDEX idx_user_bans_ip ON public.user_bans(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX idx_scheduled_posts_status ON public.scheduled_posts(status, scheduled_for);
CREATE INDEX idx_content_flags_status ON public.content_flags(status);
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX idx_profile_comments_profile ON public.profile_comments(profile_user_id);
CREATE INDEX idx_user_bookmarks_user ON public.user_bookmarks(user_id);