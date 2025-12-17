-- Add unique constraints for username, display_name, twitch_username, and discord_tag
-- Using COALESCE with unique index to allow multiple NULLs but prevent duplicate non-null values

-- Unique constraint for username (allowing multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique 
ON public.profiles (LOWER(username)) 
WHERE username IS NOT NULL;

-- Unique constraint for display_name (allowing multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_display_name_unique 
ON public.profiles (LOWER(display_name)) 
WHERE display_name IS NOT NULL;

-- Unique constraint for twitch_username (allowing multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_twitch_username_unique 
ON public.profiles (LOWER(twitch_username)) 
WHERE twitch_username IS NOT NULL;

-- Unique constraint for discord_tag (allowing multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_discord_tag_unique 
ON public.profiles (LOWER(discord_tag)) 
WHERE discord_tag IS NOT NULL;