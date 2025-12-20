-- ============================================
-- Default Role Permissions
-- ============================================
-- Sets up the permission matrix for each role
-- Safe to run multiple times (uses ON CONFLICT)
-- ============================================

-- Writer permissions (limited access)
INSERT INTO public.role_permissions (role, permission, allowed) VALUES
  ('writer', 'create_articles', true),
  ('writer', 'edit_own_articles', true),
  ('writer', 'delete_own_articles', false),
  ('writer', 'manage_videos', false),
  ('writer', 'manage_bonuses', false),
  ('writer', 'manage_giveaways', false),
  ('writer', 'manage_events', false),
  ('writer', 'manage_gtw', false),
  ('writer', 'manage_users', false),
  ('writer', 'manage_settings', false),
  ('writer', 'change_live_status', false)
ON CONFLICT (role, permission) DO NOTHING;

-- Moderator permissions (content management)
INSERT INTO public.role_permissions (role, permission, allowed) VALUES
  ('moderator', 'create_articles', true),
  ('moderator', 'edit_own_articles', true),
  ('moderator', 'delete_own_articles', true),
  ('moderator', 'manage_videos', true),
  ('moderator', 'manage_bonuses', true),
  ('moderator', 'manage_giveaways', true),
  ('moderator', 'manage_events', true),
  ('moderator', 'manage_gtw', true),
  ('moderator', 'manage_users', false),
  ('moderator', 'manage_settings', false),
  ('moderator', 'change_live_status', true)
ON CONFLICT (role, permission) DO NOTHING;

-- Admin permissions (full access)
INSERT INTO public.role_permissions (role, permission, allowed) VALUES
  ('admin', 'create_articles', true),
  ('admin', 'edit_own_articles', true),
  ('admin', 'delete_own_articles', true),
  ('admin', 'manage_videos', true),
  ('admin', 'manage_bonuses', true),
  ('admin', 'manage_giveaways', true),
  ('admin', 'manage_events', true),
  ('admin', 'manage_gtw', true),
  ('admin', 'manage_users', true),
  ('admin', 'manage_settings', true),
  ('admin', 'change_live_status', true)
ON CONFLICT (role, permission) DO NOTHING;

-- Verify permissions
SELECT role, permission, allowed 
FROM public.role_permissions 
ORDER BY role, permission;
