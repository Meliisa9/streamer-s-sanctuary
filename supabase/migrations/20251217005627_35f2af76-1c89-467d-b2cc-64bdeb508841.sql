-- Create streamers table
CREATE TABLE public.streamers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  twitch_url TEXT,
  kick_url TEXT,
  youtube_url TEXT,
  twitter_url TEXT,
  discord_url TEXT,
  instagram_url TEXT,
  is_main_streamer BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.streamers ENABLE ROW LEVEL SECURITY;

-- RLS policies for streamers
CREATE POLICY "Streamers are viewable by everyone" ON public.streamers FOR SELECT USING (true);
CREATE POLICY "Admins can manage streamers" ON public.streamers FOR INSERT WITH CHECK (is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can update streamers" ON public.streamers FOR UPDATE USING (is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can delete streamers" ON public.streamers FOR DELETE USING (is_admin_or_mod(auth.uid()));

-- Add streamer_id and end_time to events
ALTER TABLE public.events 
ADD COLUMN streamer_id UUID REFERENCES public.streamers(id),
ADD COLUMN end_time TEXT;

-- Trigger for updated_at
CREATE TRIGGER update_streamers_updated_at
  BEFORE UPDATE ON public.streamers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();