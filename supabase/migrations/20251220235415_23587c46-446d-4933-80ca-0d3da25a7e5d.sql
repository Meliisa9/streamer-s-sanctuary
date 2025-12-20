-- Add custom outcome options to stream_predictions table
ALTER TABLE public.stream_predictions
ADD COLUMN IF NOT EXISTS option_a_label TEXT DEFAULT 'Profit',
ADD COLUMN IF NOT EXISTS option_b_label TEXT DEFAULT 'Loss',
ADD COLUMN IF NOT EXISTS option_a_pool INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS option_b_pool INTEGER DEFAULT 0;

-- Comment for clarity
COMMENT ON COLUMN public.stream_predictions.option_a_label IS 'Custom label for first betting option';
COMMENT ON COLUMN public.stream_predictions.option_b_label IS 'Custom label for second betting option';