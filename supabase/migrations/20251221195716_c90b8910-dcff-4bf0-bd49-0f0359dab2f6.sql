-- Drop the existing check constraint
ALTER TABLE public.store_items DROP CONSTRAINT store_items_points_cost_check;

-- Add new constraint allowing points_cost to be 0 (for items without site points)
ALTER TABLE public.store_items ADD CONSTRAINT store_items_points_cost_check CHECK (points_cost >= 0);