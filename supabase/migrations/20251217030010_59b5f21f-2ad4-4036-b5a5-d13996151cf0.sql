-- Create user activity tracking table
CREATE TABLE IF NOT EXISTS public.user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create admin notifications table for real-time activity
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create user admin access codes table for per-user unique codes
CREATE TABLE IF NOT EXISTS public.admin_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  access_code text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_access_codes ENABLE ROW LEVEL SECURITY;

-- RLS for user_activities
CREATE POLICY "Admins can view all activities" ON public.user_activities FOR SELECT USING (is_admin_or_mod(auth.uid()));
CREATE POLICY "System can insert activities" ON public.user_activities FOR INSERT WITH CHECK (true);

-- RLS for admin_notifications
CREATE POLICY "Admins can view notifications" ON public.admin_notifications FOR SELECT USING (is_admin_or_mod(auth.uid()));
CREATE POLICY "System can insert notifications" ON public.admin_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update notifications" ON public.admin_notifications FOR UPDATE USING (is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can delete notifications" ON public.admin_notifications FOR DELETE USING (is_admin_or_mod(auth.uid()));

-- RLS for admin_access_codes
CREATE POLICY "Users can view their own access code" ON public.admin_access_codes FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage all access codes" ON public.admin_access_codes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can update their own access code" ON public.admin_access_codes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own access code" ON public.admin_access_codes FOR INSERT WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

-- Create function to check if user has writer role
CREATE OR REPLACE FUNCTION public.has_writer_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'moderator', 'writer')
  )
$$;

-- Update storage policy to allow writers to upload media
DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
CREATE POLICY "Staff can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND has_writer_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can update media" ON storage.objects;
CREATE POLICY "Staff can update media" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND has_writer_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete media" ON storage.objects;
CREATE POLICY "Staff can delete media" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND is_admin_or_mod(auth.uid()));