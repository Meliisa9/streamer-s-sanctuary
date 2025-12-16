-- Create role_permissions table to store configurable permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (role, permission)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Role permissions viewable by everyone"
  ON public.role_permissions FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage role permissions"
  ON public.role_permissions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Insert default permissions
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
  ('writer', 'change_live_status', false),
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
  ('moderator', 'change_live_status', true),
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

-- Create function to check permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id 
      AND rp.permission = _permission 
      AND rp.allowed = true
  )
$$;

-- Add trigger to update updated_at
CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update news_articles RLS to allow writers to edit their own articles
DROP POLICY IF EXISTS "Admins can manage articles" ON public.news_articles;
DROP POLICY IF EXISTS "Admins can update articles" ON public.news_articles;
DROP POLICY IF EXISTS "Admins can delete articles" ON public.news_articles;

CREATE POLICY "Users with permission can create articles"
  ON public.news_articles FOR INSERT
  WITH CHECK (
    is_admin_or_mod(auth.uid()) OR 
    has_permission(auth.uid(), 'create_articles')
  );

CREATE POLICY "Users can update their own articles or admins/mods can update any"
  ON public.news_articles FOR UPDATE
  USING (
    is_admin_or_mod(auth.uid()) OR 
    (author_id = auth.uid() AND has_permission(auth.uid(), 'edit_own_articles'))
  );

CREATE POLICY "Admins and mods can delete articles"
  ON public.news_articles FOR DELETE
  USING (is_admin_or_mod(auth.uid()));