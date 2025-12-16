-- Create storage bucket for video uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('videos', 'videos', true, 524288000, ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for media (images, gifs) in articles
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 52428800, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for videos bucket
CREATE POLICY "Public can view videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Admins can upload videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos' AND is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can update videos" ON storage.objects FOR UPDATE USING (bucket_id = 'videos' AND is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can delete videos" ON storage.objects FOR DELETE USING (bucket_id = 'videos' AND is_admin_or_mod(auth.uid()));

-- Storage policies for media bucket
CREATE POLICY "Public can view media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Admins can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can update media" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can delete media" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND is_admin_or_mod(auth.uid()));

-- Add video_file_url to videos table for direct uploads
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS video_file_url text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_external boolean DEFAULT true;

-- Add rich content field to news_articles for media embeds
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS content_html text;