-- Fix the foreign key constraint on events.streamer_id to allow deletion of streamers
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_streamer_id_fkey;

ALTER TABLE public.events 
ADD CONSTRAINT events_streamer_id_fkey 
FOREIGN KEY (streamer_id) 
REFERENCES public.streamers(id) 
ON DELETE SET NULL;