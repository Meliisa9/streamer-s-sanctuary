-- Add new permission for dev diagnostics visibility
INSERT INTO public.role_permissions (role, permission, allowed)
VALUES 
  ('admin', 'view_dev_diagnostics', true),
  ('moderator', 'view_dev_diagnostics', false),
  ('writer', 'view_dev_diagnostics', false),
  ('user', 'view_dev_diagnostics', false)
ON CONFLICT (role, permission) DO NOTHING;

-- Create email_templates table for configurable email notifications
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  template_type TEXT NOT NULL DEFAULT 'notification',
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for email_templates
CREATE POLICY "Admins can manage email templates" ON public.email_templates
  FOR ALL USING (is_admin_or_mod(auth.uid()));

CREATE POLICY "Email templates viewable by admins" ON public.email_templates
  FOR SELECT USING (is_admin_or_mod(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, body_html, body_text, template_type, variables) VALUES
  ('welcome', 'Welcome to {{site_name}}!', 
   '<h1>Welcome, {{username}}!</h1><p>Thank you for joining {{site_name}}. We''re excited to have you!</p><p>Start exploring giveaways, events, and more.</p>', 
   'Welcome, {{username}}! Thank you for joining {{site_name}}. Start exploring giveaways, events, and more.',
   'system', '["username", "site_name"]'::jsonb),
  ('giveaway_winner', 'Congratulations! You Won a Giveaway!', 
   '<h1>🎉 You Won!</h1><p>Congratulations {{username}}! You''ve won the "{{giveaway_title}}" giveaway.</p><p>Prize: {{prize}}</p><p>We''ll be in touch soon with details.</p>', 
   'Congratulations {{username}}! You''ve won the "{{giveaway_title}}" giveaway. Prize: {{prize}}. We''ll be in touch soon.',
   'giveaway', '["username", "giveaway_title", "prize"]'::jsonb),
  ('event_reminder', 'Event Starting Soon: {{event_title}}', 
   '<h1>📅 Event Reminder</h1><p>Hey {{username}}, the event "{{event_title}}" is starting soon!</p><p>Platform: {{platform}}</p><p>Time: {{event_time}}</p><p>Don''t miss it!</p>', 
   'Hey {{username}}, the event "{{event_title}}" is starting soon on {{platform}} at {{event_time}}. Don''t miss it!',
   'event', '["username", "event_title", "platform", "event_time"]'::jsonb),
  ('bonus_hunt_winner', 'You Won in the Bonus Hunt!', 
   '<h1>🎯 Bonus Hunt Winner!</h1><p>Congratulations {{username}}! Your guess was the closest in the Bonus Hunt.</p><p>You earned {{points}} points!</p>', 
   'Congratulations {{username}}! You won the Bonus Hunt guess and earned {{points}} points!',
   'bonus_hunt', '["username", "points"]'::jsonb),
  ('mention_notification', 'You were mentioned by {{author}}', 
   '<h1>💬 New Mention</h1><p>Hey {{username}}, {{author}} mentioned you in a comment.</p><p>"{{comment_preview}}"</p><p><a href="{{link}}">View Comment</a></p>', 
   'Hey {{username}}, {{author}} mentioned you: "{{comment_preview}}"',
   'social', '["username", "author", "comment_preview", "link"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Add is_configurable and display_title columns to video_categories for admin management
ALTER TABLE public.video_categories ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.video_categories ADD COLUMN IF NOT EXISTS display_title TEXT;
ALTER TABLE public.video_categories ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Video';

-- Update existing categories with is_default flag
UPDATE public.video_categories SET is_default = true, display_title = 'Big Wins', icon = 'Flame' WHERE slug = 'big-wins';
UPDATE public.video_categories SET is_default = true, display_title = 'Max Wins', icon = 'Crown' WHERE slug = 'max-wins';

-- Add unique constraint on role-permission combo if not exists
ALTER TABLE public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_permission_key;
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_permission_key UNIQUE (role, permission);