-- Fix bonus_hunts status constraint to include 'to_be_played'
ALTER TABLE public.bonus_hunts DROP CONSTRAINT IF EXISTS bonus_hunts_status_check;
ALTER TABLE public.bonus_hunts ADD CONSTRAINT bonus_hunts_status_check CHECK (status = ANY (ARRAY['ongoing'::text, 'complete'::text, 'to_be_played'::text]));