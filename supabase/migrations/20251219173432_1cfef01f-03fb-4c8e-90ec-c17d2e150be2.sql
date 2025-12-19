-- Enable REPLICA IDENTITY FULL for realtime updates
ALTER TABLE public.bonus_hunts REPLICA IDENTITY FULL;
ALTER TABLE public.bonus_hunt_slots REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.bonus_hunts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bonus_hunt_slots;