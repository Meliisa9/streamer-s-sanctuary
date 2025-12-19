-- 1) Add start time to bonus hunts
ALTER TABLE public.bonus_hunts
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE;

-- 2) Avg X guesses table
CREATE TABLE IF NOT EXISTS public.bonus_hunt_avgx_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id UUID NOT NULL REFERENCES public.bonus_hunts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  guess_x NUMERIC NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bonus_hunt_avgx_guesses ENABLE ROW LEVEL SECURITY;

-- Similar access pattern to bonus_hunt_guesses
DO $$ BEGIN
  CREATE POLICY "Users can make avgx guesses"
  ON public.bonus_hunt_avgx_guesses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own avgx guesses"
  ON public.bonus_hunt_avgx_guesses
  FOR UPDATE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their avgx guesses and completed hunt avgx guesses"
  ON public.bonus_hunt_avgx_guesses
  FOR SELECT
  USING (
    (auth.uid() = user_id)
    OR is_admin_or_mod(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.bonus_hunts h
      WHERE h.id = bonus_hunt_avgx_guesses.hunt_id
        AND h.status = 'complete'
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Locking triggers: prevent creating/updating guesses after hunt start_time
CREATE OR REPLACE FUNCTION public.validate_guess_before_hunt_start()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT start_time INTO v_start_time
  FROM public.bonus_hunts
  WHERE id = NEW.hunt_id;

  IF v_start_time IS NOT NULL AND now() >= v_start_time THEN
    RAISE EXCEPTION 'Guesses are locked for this hunt';
  END IF;

  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER bonus_hunt_guesses_lock_before_start
  BEFORE INSERT OR UPDATE ON public.bonus_hunt_guesses
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_guess_before_hunt_start();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER bonus_hunt_avgx_guesses_lock_before_start
  BEFORE INSERT OR UPDATE ON public.bonus_hunt_avgx_guesses
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_guess_before_hunt_start();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;