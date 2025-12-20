-- ============================================
-- Video Categories Setup
-- ============================================
-- Creates default video categories
-- ============================================

INSERT INTO public.video_categories (name, slug, sort_order) VALUES
  ('Highlights', 'highlights', 1),
  ('Tutorials', 'tutorials', 2),
  ('Reviews', 'reviews', 3),
  ('Bonus Buys', 'bonus-buys', 4),
  ('Slot Sessions', 'slot-sessions', 5),
  ('Table Games', 'table-games', 6),
  ('Live Moments', 'live-moments', 7),
  ('Compilations', 'compilations', 8),
  ('Community', 'community', 9),
  ('Big Wins', 'big-wins', 10),
  ('Max Wins', 'max-wins', 11)
ON CONFLICT DO NOTHING;

-- Verify categories
SELECT name, slug, sort_order FROM public.video_categories ORDER BY sort_order;
