-- Add bypass_maintenance permission for admin and moderator roles
INSERT INTO public.role_permissions (role, permission, allowed)
VALUES 
  ('admin', 'bypass_maintenance', true),
  ('moderator', 'bypass_maintenance', true)
ON CONFLICT DO NOTHING;