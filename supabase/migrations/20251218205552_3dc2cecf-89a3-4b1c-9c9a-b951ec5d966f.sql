-- Create bonus_hunts table for tracking bonus hunts
CREATE TABLE public.bonus_hunts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'complete')),
  target_balance NUMERIC,
  ending_balance NUMERIC,
  average_bet NUMERIC,
  highest_win NUMERIC,
  highest_multiplier NUMERIC,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bonus_hunt_slots table for slot list in bonus hunts
CREATE TABLE public.bonus_hunt_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hunt_id UUID NOT NULL REFERENCES public.bonus_hunts(id) ON DELETE CASCADE,
  slot_name TEXT NOT NULL,
  provider TEXT,
  bet_amount NUMERIC,
  win_amount NUMERIC,
  multiplier NUMERIC,
  sort_order INTEGER DEFAULT 0,
  is_played BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bonus_hunt_guesses table for user guesses on final balance
CREATE TABLE public.bonus_hunt_guesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hunt_id UUID NOT NULL REFERENCES public.bonus_hunts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  guess_amount NUMERIC NOT NULL,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hunt_id, user_id)
);

-- Enable RLS
ALTER TABLE public.bonus_hunts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_hunt_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_hunt_guesses ENABLE ROW LEVEL SECURITY;

-- Bonus hunts policies
CREATE POLICY "Bonus hunts are viewable by everyone" ON public.bonus_hunts FOR SELECT USING (true);
CREATE POLICY "Admins can manage bonus hunts" ON public.bonus_hunts FOR INSERT WITH CHECK (is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can update bonus hunts" ON public.bonus_hunts FOR UPDATE USING (is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can delete bonus hunts" ON public.bonus_hunts FOR DELETE USING (is_admin_or_mod(auth.uid()));

-- Bonus hunt slots policies  
CREATE POLICY "Slots are viewable by everyone" ON public.bonus_hunt_slots FOR SELECT USING (true);
CREATE POLICY "Admins can manage slots" ON public.bonus_hunt_slots FOR INSERT WITH CHECK (is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can update slots" ON public.bonus_hunt_slots FOR UPDATE USING (is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can delete slots" ON public.bonus_hunt_slots FOR DELETE USING (is_admin_or_mod(auth.uid()));

-- Bonus hunt guesses policies
CREATE POLICY "Users can view their guesses and completed hunt guesses" ON public.bonus_hunt_guesses FOR SELECT USING (
  auth.uid() = user_id OR is_admin_or_mod(auth.uid()) OR 
  EXISTS (SELECT 1 FROM bonus_hunts WHERE id = hunt_id AND status = 'complete')
);
CREATE POLICY "Users can make guesses" ON public.bonus_hunt_guesses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own guesses" ON public.bonus_hunt_guesses FOR UPDATE USING (auth.uid() = user_id);

-- Update trigger for bonus_hunts
CREATE TRIGGER update_bonus_hunts_updated_at
  BEFORE UPDATE ON public.bonus_hunts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Drop the status check constraint on gtw_sessions if it exists (to fix the GTW winner error)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'gtw_sessions_status_check' 
    AND table_name = 'gtw_sessions'
  ) THEN
    ALTER TABLE public.gtw_sessions DROP CONSTRAINT gtw_sessions_status_check;
  END IF;
END $$;