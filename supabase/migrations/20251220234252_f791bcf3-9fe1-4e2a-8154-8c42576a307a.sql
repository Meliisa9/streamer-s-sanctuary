-- Add new columns to casino_bonuses table
ALTER TABLE public.casino_bonuses 
ADD COLUMN IF NOT EXISTS is_non_sticky boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_cashback boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS license text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_vip_friendly boolean DEFAULT false;