-- Add cover photo, age, country, and other optional profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_url text,
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS favorite_slot text,
ADD COLUMN IF NOT EXISTS favorite_casino text,
ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.cover_url IS 'Profile cover/banner photo URL';
COMMENT ON COLUMN public.profiles.is_private IS 'When true, only logged-in users can see personal info like age/country';