-- Create article_likes table for tracking user likes on articles
CREATE TABLE IF NOT EXISTS public.article_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(article_id, user_id)
);

ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see likes" ON public.article_likes FOR SELECT USING (true);
CREATE POLICY "Users can like articles" ON public.article_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike articles" ON public.article_likes FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for site_settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;