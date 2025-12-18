-- Create daily_sign_ins table to track user sign-in streaks
CREATE TABLE public.daily_sign_ins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  last_sign_in_date date NOT NULL DEFAULT CURRENT_DATE,
  consecutive_days integer NOT NULL DEFAULT 1,
  total_sign_ins integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT daily_sign_ins_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.daily_sign_ins ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own sign-in data"
ON public.daily_sign_ins FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sign-in data"
ON public.daily_sign_ins FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sign-in data"
ON public.daily_sign_ins FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all sign-in data"
ON public.daily_sign_ins FOR SELECT
USING (is_admin_or_mod(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_daily_sign_ins_updated_at
BEFORE UPDATE ON public.daily_sign_ins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();