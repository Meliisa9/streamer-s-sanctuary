-- ============================================
-- Storage Buckets Setup
-- ============================================
-- Creates storage buckets for videos and media
-- Run after migrations if buckets are missing
-- ============================================

-- Video uploads bucket (max 500MB per file)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('videos', 'videos', true, 524288000, ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- Media bucket for images/gifs in articles (max 50MB per file)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 52428800, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'])
ON CONFLICT (id) DO NOTHING;

-- Verify buckets
SELECT id, name, public, file_size_limit FROM storage.buckets;
