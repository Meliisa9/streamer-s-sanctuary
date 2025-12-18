-- Add new columns to bonus_hunts table for enhanced manager
ALTER TABLE public.bonus_hunts 
ADD COLUMN IF NOT EXISTS starting_balance numeric,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS winner_points integer DEFAULT 1000;