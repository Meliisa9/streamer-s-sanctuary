-- Create comment_likes table for liking comments
CREATE TABLE public.comment_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.news_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- Add likes_count to news_comments
ALTER TABLE public.news_comments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_likes
CREATE POLICY "Anyone can view comment likes" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like comments" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike comments" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    achievement_key TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    progress INTEGER DEFAULT 0,
    UNIQUE(user_id, achievement_key)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_achievements
CREATE POLICY "Anyone can view achievements" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "System can insert achievements" ON public.user_achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update achievements" ON public.user_achievements FOR UPDATE USING (true);