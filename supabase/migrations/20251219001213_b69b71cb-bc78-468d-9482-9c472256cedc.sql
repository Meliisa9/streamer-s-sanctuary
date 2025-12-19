-- Create profile_comment_likes table for liking profile comments
CREATE TABLE public.profile_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.profile_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.profile_comment_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view comment likes"
ON public.profile_comment_likes
FOR SELECT
USING (true);

CREATE POLICY "Users can like comments"
ON public.profile_comment_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
ON public.profile_comment_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Add likes_count column to profile_comments if not exists
ALTER TABLE public.profile_comments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;