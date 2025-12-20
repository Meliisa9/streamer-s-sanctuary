-- Add privacy settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{"show_age": true, "show_country": true, "show_city": true, "show_activity": true, "show_connected_accounts": true}'::jsonb;

-- Comment for clarity
COMMENT ON COLUMN public.profiles.privacy_settings IS 'User privacy settings for profile visibility';