-- Add site_logo field to site_settings for sidebar logo upload
INSERT INTO public.site_settings (key, value) 
VALUES ('site_logo_url', null)
ON CONFLICT (key) DO NOTHING;

-- Add site_tagline field (value must be proper JSON)
INSERT INTO public.site_settings (key, value)
VALUES ('site_tagline', '"Casino Streams"')
ON CONFLICT (key) DO NOTHING;

-- Create audit log triggers to automatically record changes
-- This will fix the audit logs not showing anything

-- Function to record audit logs
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id::text, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id::text, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers for key tables
CREATE TRIGGER audit_videos_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_news_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.news_articles
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_bonuses_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.casino_bonuses
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_giveaways_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.giveaways
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_events_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_bonus_hunts_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.bonus_hunts
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_polls_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.polls
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_streamers_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.streamers
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_site_settings_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Add more permissions to role_permissions
INSERT INTO public.role_permissions (role, permission, allowed)
VALUES 
  ('admin', 'manage_streamers', true),
  ('admin', 'manage_bonus_hunt', true),
  ('admin', 'view_audit_logs', true),
  ('admin', 'manage_legal_pages', true),
  ('admin', 'manage_branding', true),
  ('admin', 'manage_webhooks', true),
  ('admin', 'bulk_actions', true),
  ('admin', 'send_notifications', true),
  ('moderator', 'manage_streamers', true),
  ('moderator', 'manage_bonus_hunt', true),
  ('moderator', 'view_user_details', true),
  ('moderator', 'moderate_comments', true),
  ('moderator', 'manage_content_flags', true),
  ('writer', 'view_own_analytics', true)
ON CONFLICT DO NOTHING;