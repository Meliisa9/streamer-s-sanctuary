-- Create storage buckets for win uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('win-screenshots', 'win-screenshots', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('win-videos', 'win-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for win-screenshots bucket
CREATE POLICY "Anyone can view win screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'win-screenshots');

CREATE POLICY "Authenticated users can upload win screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'win-screenshots' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own win screenshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'win-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policies for win-videos bucket
CREATE POLICY "Anyone can view win videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'win-videos');

CREATE POLICY "Authenticated users can upload win videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'win-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own win videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'win-videos' AND auth.uid()::text = (storage.foldername(name))[1]);