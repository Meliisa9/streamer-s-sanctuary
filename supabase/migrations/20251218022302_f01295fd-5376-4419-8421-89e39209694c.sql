-- Add timezone column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';

-- Add currency column to gtw_sessions table  
ALTER TABLE public.gtw_sessions ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';