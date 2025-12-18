-- Add community polls support - new column is_community for user-created polls
-- And is_approved for moderation status
ALTER TABLE public.polls 
ADD COLUMN IF NOT EXISTS is_community boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT true;

-- Add event_subscriptions table for event notification subscriptions
CREATE TABLE IF NOT EXISTS public.event_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.event_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can subscribe to events" 
ON public.event_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsubscribe from events" 
ON public.event_subscriptions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update polls policy to show community polls pending approval to users
DROP POLICY IF EXISTS "Polls are viewable by everyone" ON public.polls;
CREATE POLICY "Polls are viewable" 
ON public.polls 
FOR SELECT 
USING (
  is_active = true 
  AND (is_approved = true OR is_community = false OR created_by = auth.uid())
  OR is_admin_or_mod(auth.uid())
);

-- Allow authenticated users to create community polls
DROP POLICY IF EXISTS "Admins can manage polls" ON public.polls;
CREATE POLICY "Users can create community polls" 
ON public.polls 
FOR INSERT 
WITH CHECK (
  (is_community = true AND auth.uid() IS NOT NULL)
  OR is_admin_or_mod(auth.uid())
);