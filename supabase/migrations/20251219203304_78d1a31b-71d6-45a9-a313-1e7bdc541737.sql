-- Add avgx_bet_ranges column to bonus_hunts for storing auto-generated groups
ALTER TABLE public.bonus_hunts ADD COLUMN IF NOT EXISTS avgx_bet_ranges jsonb DEFAULT '[]'::jsonb;

-- Add placement field to avgx guesses if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bonus_hunt_avgx_guesses' AND column_name = 'placement') THEN
    ALTER TABLE public.bonus_hunt_avgx_guesses ADD COLUMN placement integer;
  END IF;
END $$;

-- Create or replace the determine_avgx_winners function with top 10 placements
CREATE OR REPLACE FUNCTION public.determine_avgx_winners(hunt_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  actual_avg_x numeric;
  guess_record RECORD;
  placement_counter integer := 1;
BEGIN
  -- Get the actual average X from the hunt stats
  SELECT 
    CASE 
      WHEN COUNT(*) FILTER (WHERE is_played AND multiplier IS NOT NULL) > 0 
      THEN SUM(multiplier) FILTER (WHERE is_played AND multiplier IS NOT NULL) / 
           COUNT(*) FILTER (WHERE is_played AND multiplier IS NOT NULL)
      ELSE 0
    END INTO actual_avg_x
  FROM bonus_hunt_slots
  WHERE hunt_id = hunt_id_param;

  -- Reset all placements for this hunt
  UPDATE bonus_hunt_avgx_guesses SET placement = NULL, points_earned = 0 WHERE hunt_id = hunt_id_param;

  -- Rank guesses by closeness to actual average X and assign placements (top 10)
  FOR guess_record IN 
    SELECT id, user_id, guess_x, ABS(guess_x - actual_avg_x) as diff
    FROM bonus_hunt_avgx_guesses
    WHERE hunt_id = hunt_id_param
    ORDER BY ABS(guess_x - actual_avg_x) ASC, created_at ASC
    LIMIT 10
  LOOP
    UPDATE bonus_hunt_avgx_guesses 
    SET placement = placement_counter,
        points_earned = CASE 
          WHEN placement_counter = 1 THEN 1000
          WHEN placement_counter = 2 THEN 500
          WHEN placement_counter = 3 THEN 250
          ELSE 100
        END
    WHERE id = guess_record.id;
    
    -- Award points to user
    UPDATE profiles 
    SET points = COALESCE(points, 0) + CASE 
      WHEN placement_counter = 1 THEN 1000
      WHEN placement_counter = 2 THEN 500
      WHEN placement_counter = 3 THEN 250
      ELSE 100
    END
    WHERE user_id = guess_record.user_id;

    -- Create notification for winners
    INSERT INTO user_notifications (user_id, title, message, type, link)
    VALUES (
      guess_record.user_id,
      CASE 
        WHEN placement_counter = 1 THEN 'You won 1st place in Avg X!'
        WHEN placement_counter = 2 THEN 'You won 2nd place in Avg X!'
        WHEN placement_counter = 3 THEN 'You won 3rd place in Avg X!'
        ELSE 'You placed top 10 in Avg X!'
      END,
      'Your guess of ' || ROUND(guess_record.guess_x, 2) || 'x was ' || placement_counter || 
      CASE placement_counter 
        WHEN 1 THEN 'st' 
        WHEN 2 THEN 'nd' 
        WHEN 3 THEN 'rd' 
        ELSE 'th' 
      END || ' closest to the final average!',
      'achievement',
      '/bonus-hunt?tab=avgx'
    );
    
    placement_counter := placement_counter + 1;
  END LOOP;
END;
$function$;

-- Function to auto-generate bet ranges based on guesses
CREATE OR REPLACE FUNCTION public.generate_avgx_bet_ranges(hunt_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  min_guess numeric;
  max_guess numeric;
  range_size numeric;
  ranges jsonb := '[]'::jsonb;
  i integer;
  range_start numeric;
  range_end numeric;
  range_label text;
BEGIN
  -- Get min and max guesses
  SELECT MIN(guess_x), MAX(guess_x) INTO min_guess, max_guess
  FROM bonus_hunt_avgx_guesses
  WHERE hunt_id = hunt_id_param;

  IF min_guess IS NULL OR max_guess IS NULL THEN
    RETURN ranges;
  END IF;

  -- Calculate range size for 10 groups (A-J)
  range_size := (max_guess - min_guess) / 10.0;
  IF range_size < 0.1 THEN range_size := 0.1; END IF;

  -- Generate 10 ranges (A-J)
  FOR i IN 0..9 LOOP
    range_start := min_guess + (i * range_size);
    range_end := min_guess + ((i + 1) * range_size);
    range_label := CHR(65 + i); -- A=65, B=66, etc.
    
    ranges := ranges || jsonb_build_object(
      'label', range_label,
      'min', ROUND(range_start, 2),
      'max', ROUND(range_end, 2),
      'count', (SELECT COUNT(*) FROM bonus_hunt_avgx_guesses 
                WHERE hunt_id = hunt_id_param 
                AND guess_x >= range_start 
                AND guess_x < CASE WHEN i = 9 THEN range_end + 1 ELSE range_end END)
    );
  END LOOP;

  -- Update the hunt with the generated ranges
  UPDATE bonus_hunts SET avgx_bet_ranges = ranges WHERE id = hunt_id_param;

  RETURN ranges;
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_avgx_bet_ranges(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.determine_avgx_winners(uuid) TO authenticated;