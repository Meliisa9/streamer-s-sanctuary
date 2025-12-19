-- Ensure the trigger for auto winner determination exists and works correctly
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_determine_bonus_hunt_winner ON public.bonus_hunts;

-- Create an improved trigger that fires before update
CREATE OR REPLACE FUNCTION public.determine_bonus_hunt_winner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_winner_id uuid;
  v_closest_guess_amount numeric;
  v_winner_points integer;
  v_ending_balance numeric;
BEGIN
  -- Only run when status changes to 'complete' and ending_balance is set
  IF NEW.status = 'complete' AND OLD.status != 'complete' AND NEW.ending_balance IS NOT NULL THEN
    v_ending_balance := NEW.ending_balance;
    
    -- Find the closest guess
    SELECT user_id, guess_amount INTO v_winner_id, v_closest_guess_amount
    FROM bonus_hunt_guesses
    WHERE hunt_id = NEW.id
    ORDER BY ABS(guess_amount - v_ending_balance) ASC, created_at ASC
    LIMIT 1;
    
    IF v_winner_id IS NOT NULL THEN
      -- Get the points to award (default 1000)
      v_winner_points := COALESCE(NEW.winner_points, 1000);
      
      -- Update the winner in bonus_hunts
      NEW.winner_user_id := v_winner_id;
      
      -- Award points to the winner
      UPDATE profiles 
      SET points = COALESCE(points, 0) + v_winner_points
      WHERE user_id = v_winner_id;
      
      -- Update points_earned in the winning guess
      UPDATE bonus_hunt_guesses
      SET points_earned = v_winner_points
      WHERE hunt_id = NEW.id AND user_id = v_winner_id;
      
      -- Create a notification for the winner
      INSERT INTO user_notifications (user_id, title, message, type, link)
      VALUES (
        v_winner_id,
        'You won the Bonus Hunt guess!',
        'Congratulations! Your guess of ' || v_closest_guess_amount || ' was closest to the final balance of ' || v_ending_balance || '. You earned ' || v_winner_points || ' points!',
        'achievement',
        '/bonus-hunt'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trigger_determine_bonus_hunt_winner
  BEFORE UPDATE ON public.bonus_hunts
  FOR EACH ROW
  EXECUTE FUNCTION public.determine_bonus_hunt_winner();