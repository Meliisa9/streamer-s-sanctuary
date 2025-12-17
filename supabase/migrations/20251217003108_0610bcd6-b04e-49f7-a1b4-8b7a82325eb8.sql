-- Update the handle_new_user function to sync OAuth usernames properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  provider text;
  oauth_username text;
BEGIN
  -- Get the OAuth provider if available
  provider := NEW.raw_app_meta_data->>'provider';
  
  -- Get the username from OAuth metadata
  oauth_username := COALESCE(
    NEW.raw_user_meta_data->>'preferred_username',
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (
    user_id, 
    username, 
    display_name, 
    avatar_url,
    twitch_username,
    discord_tag
  )
  VALUES (
    NEW.id,
    oauth_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', oauth_username),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE WHEN provider = 'twitch' THEN oauth_username ELSE NULL END,
    CASE WHEN provider = 'discord' THEN COALESCE(NEW.raw_user_meta_data->>'full_name', oauth_username) ELSE NULL END
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;