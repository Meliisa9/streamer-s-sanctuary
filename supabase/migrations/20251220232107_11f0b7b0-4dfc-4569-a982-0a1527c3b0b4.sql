-- Stream Predictions table
CREATE TABLE public.stream_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'locked', 'resolved', 'cancelled')),
  outcome TEXT CHECK (outcome IN ('profit', 'loss', NULL)),
  profit_pool INTEGER NOT NULL DEFAULT 0,
  loss_pool INTEGER NOT NULL DEFAULT 0,
  min_bet INTEGER NOT NULL DEFAULT 10,
  max_bet INTEGER NOT NULL DEFAULT 1000,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  locked_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Prediction bets table
CREATE TABLE public.prediction_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID NOT NULL REFERENCES public.stream_predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  bet_amount INTEGER NOT NULL,
  predicted_outcome TEXT NOT NULL CHECK (predicted_outcome IN ('profit', 'loss')),
  payout INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Big Win Gallery table
CREATE TABLE public.big_wins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_name TEXT NOT NULL,
  provider TEXT,
  bet_amount NUMERIC,
  win_amount NUMERIC NOT NULL,
  multiplier NUMERIC,
  image_url TEXT,
  video_url TEXT,
  description TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_badge TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Big Win Likes table
CREATE TABLE public.big_win_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  win_id UUID NOT NULL REFERENCES public.big_wins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(win_id, user_id)
);

-- Streamer Stats table
CREATE TABLE public.streamer_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id UUID REFERENCES public.streamers(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  starting_balance NUMERIC,
  ending_balance NUMERIC,
  profit_loss NUMERIC,
  total_wagered NUMERIC,
  biggest_win NUMERIC,
  biggest_win_game TEXT,
  biggest_multiplier NUMERIC,
  games_played TEXT[],
  session_duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint to prevent duplicate entries per streamer per day
CREATE UNIQUE INDEX idx_streamer_stats_daily ON public.streamer_stats(streamer_id, date);

-- Enable RLS on all tables
ALTER TABLE public.stream_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.big_wins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.big_win_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streamer_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stream_predictions
CREATE POLICY "Predictions viewable by everyone" ON public.stream_predictions FOR SELECT USING (true);
CREATE POLICY "Admins can manage predictions" ON public.stream_predictions FOR INSERT WITH CHECK (is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can update predictions" ON public.stream_predictions FOR UPDATE USING (is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can delete predictions" ON public.stream_predictions FOR DELETE USING (is_admin_or_mod(auth.uid()));

-- RLS Policies for prediction_bets
CREATE POLICY "Users can view their own bets and completed predictions" ON public.prediction_bets FOR SELECT 
  USING (auth.uid() = user_id OR is_admin_or_mod(auth.uid()) OR EXISTS (
    SELECT 1 FROM stream_predictions WHERE id = prediction_id AND status = 'resolved'
  ));
CREATE POLICY "Users can place bets" ON public.prediction_bets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for big_wins
CREATE POLICY "Approved wins viewable by everyone" ON public.big_wins FOR SELECT 
  USING (status = 'approved' OR auth.uid() = user_id OR is_admin_or_mod(auth.uid()));
CREATE POLICY "Users can submit wins" ON public.big_wins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update pending wins or admins can manage" ON public.big_wins FOR UPDATE 
  USING (is_admin_or_mod(auth.uid()) OR (auth.uid() = user_id AND status = 'pending'));
CREATE POLICY "Admins can delete wins" ON public.big_wins FOR DELETE USING (is_admin_or_mod(auth.uid()));

-- RLS Policies for big_win_likes
CREATE POLICY "Anyone can view likes" ON public.big_win_likes FOR SELECT USING (true);
CREATE POLICY "Users can like wins" ON public.big_win_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike wins" ON public.big_win_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for streamer_stats
CREATE POLICY "Stats viewable by everyone" ON public.streamer_stats FOR SELECT USING (true);
CREATE POLICY "Admins can manage stats" ON public.streamer_stats FOR INSERT WITH CHECK (is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can update stats" ON public.streamer_stats FOR UPDATE USING (is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can delete stats" ON public.streamer_stats FOR DELETE USING (is_admin_or_mod(auth.uid()));

-- Add realtime for predictions
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prediction_bets;