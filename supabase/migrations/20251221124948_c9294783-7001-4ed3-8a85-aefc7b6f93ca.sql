-- Add currency column to giveaways for cash prize currency selection
ALTER TABLE public.giveaways ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

-- Verify the column was added
SELECT column_name, data_type, column_default FROM information_schema.columns 
WHERE table_name = 'giveaways' AND column_name = 'currency';