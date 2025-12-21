-- Drop the existing check constraint on prediction_bets
ALTER TABLE public.prediction_bets DROP CONSTRAINT prediction_bets_predicted_outcome_check;

-- Add new constraint that allows option_a and option_b
ALTER TABLE public.prediction_bets ADD CONSTRAINT prediction_bets_predicted_outcome_check CHECK (predicted_outcome = ANY (ARRAY['option_a'::text, 'option_b'::text]));

-- Also update the stream_predictions outcome constraint to be consistent
ALTER TABLE public.stream_predictions DROP CONSTRAINT stream_predictions_outcome_check;

-- Add new constraint that allows option_a, option_b, and NULL
ALTER TABLE public.stream_predictions ADD CONSTRAINT stream_predictions_outcome_check CHECK (outcome IS NULL OR outcome = ANY (ARRAY['option_a'::text, 'option_b'::text]));