-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE public.app_role AS ENUM ('user', 'moderator', 'admin');

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  twitch_username TEXT,
  discord_tag TEXT,
  bio TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Video categories
CREATE TABLE public.video_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Videos table
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT NOT NULL,
  duration TEXT,
  category_id UUID REFERENCES public.video_categories(id),
  multiplier TEXT,
  views INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Video likes
CREATE TABLE public.video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (video_id, user_id)
);

-- News articles
CREATE TABLE public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT DEFAULT 'Updates',
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- News comments
CREATE TABLE public.news_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Casino bonuses
CREATE TABLE public.casino_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  bonus_text TEXT NOT NULL,
  bonus_type TEXT DEFAULT 'Welcome Bonus',
  wagering TEXT,
  min_deposit TEXT,
  free_spins INTEGER DEFAULT 0,
  countries TEXT[],
  features TEXT[],
  promo_code TEXT,
  affiliate_url TEXT,
  rating DECIMAL(2,1) DEFAULT 4.5,
  is_exclusive BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Giveaways
CREATE TABLE public.giveaways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  prize TEXT NOT NULL,
  prize_type TEXT DEFAULT 'Cash',
  image_url TEXT,
  max_entries INTEGER,
  winners_count INTEGER DEFAULT 1,
  requirements TEXT[],
  is_exclusive BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('upcoming', 'active', 'locked', 'ended')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  winner_ids UUID[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Giveaway entries
CREATE TABLE public.giveaway_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id UUID REFERENCES public.giveaways(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (giveaway_id, user_id)
);

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'Stream',
  event_date DATE NOT NULL,
  event_time TEXT,
  platform TEXT DEFAULT 'Twitch',
  expected_viewers TEXT,
  is_recurring BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Guess The Win sessions
CREATE TABLE public.gtw_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'locked', 'ended')),
  pot_amount TEXT,
  actual_total DECIMAL(12,2),
  lock_time TIMESTAMP WITH TIME ZONE,
  reveal_time TIMESTAMP WITH TIME ZONE,
  winner_id UUID REFERENCES auth.users(id),
  winning_guess DECIMAL(12,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Guess The Win guesses
CREATE TABLE public.gtw_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.gtw_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  guess_amount DECIMAL(12,2) NOT NULL,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (session_id, user_id)
);

-- Audit log for admin actions
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Site settings
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casino_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gtw_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gtw_guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is admin or moderator
CREATE OR REPLACE FUNCTION public.is_admin_or_mod(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'moderator')
  )
$$;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies (only admins can manage)
CREATE POLICY "User roles viewable by owner and admins" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Video categories policies
CREATE POLICY "Categories are viewable by everyone" ON public.video_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.video_categories FOR ALL USING (public.is_admin_or_mod(auth.uid()));

-- Videos policies
CREATE POLICY "Published videos are viewable by everyone" ON public.videos FOR SELECT USING (is_published = true OR public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can manage videos" ON public.videos FOR INSERT WITH CHECK (public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can update videos" ON public.videos FOR UPDATE USING (public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can delete videos" ON public.videos FOR DELETE USING (public.is_admin_or_mod(auth.uid()));

-- Video likes policies
CREATE POLICY "Video likes are viewable by everyone" ON public.video_likes FOR SELECT USING (true);
CREATE POLICY "Users can like videos" ON public.video_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their likes" ON public.video_likes FOR DELETE USING (auth.uid() = user_id);

-- News articles policies
CREATE POLICY "Published articles are viewable by everyone" ON public.news_articles FOR SELECT USING (is_published = true OR public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can manage articles" ON public.news_articles FOR INSERT WITH CHECK (public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can update articles" ON public.news_articles FOR UPDATE USING (public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can delete articles" ON public.news_articles FOR DELETE USING (public.is_admin_or_mod(auth.uid()));

-- News comments policies
CREATE POLICY "Approved comments are viewable by everyone" ON public.news_comments FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Users can add comments" ON public.news_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their comments" ON public.news_comments FOR UPDATE USING (auth.uid() = user_id OR public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can delete comments" ON public.news_comments FOR DELETE USING (auth.uid() = user_id OR public.is_admin_or_mod(auth.uid()));

-- Casino bonuses policies
CREATE POLICY "Published bonuses are viewable by everyone" ON public.casino_bonuses FOR SELECT USING (is_published = true OR public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can manage bonuses" ON public.casino_bonuses FOR INSERT WITH CHECK (public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can update bonuses" ON public.casino_bonuses FOR UPDATE USING (public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can delete bonuses" ON public.casino_bonuses FOR DELETE USING (public.is_admin_or_mod(auth.uid()));

-- Giveaways policies
CREATE POLICY "Giveaways are viewable by everyone" ON public.giveaways FOR SELECT USING (true);
CREATE POLICY "Admins can manage giveaways" ON public.giveaways FOR INSERT WITH CHECK (public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can update giveaways" ON public.giveaways FOR UPDATE USING (public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can delete giveaways" ON public.giveaways FOR DELETE USING (public.is_admin_or_mod(auth.uid()));

-- Giveaway entries policies
CREATE POLICY "Users can view their own entries" ON public.giveaway_entries FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Users can enter giveaways" ON public.giveaway_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users cannot delete entries" ON public.giveaway_entries FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Events policies
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.events FOR INSERT WITH CHECK (public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING (public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE USING (public.is_admin_or_mod(auth.uid()));

-- GTW sessions policies
CREATE POLICY "Sessions are viewable by everyone" ON public.gtw_sessions FOR SELECT USING (true);
CREATE POLICY "Admins can manage sessions" ON public.gtw_sessions FOR INSERT WITH CHECK (public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Admins can update sessions" ON public.gtw_sessions FOR UPDATE USING (public.is_admin_or_mod(auth.uid()));

-- GTW guesses policies
CREATE POLICY "Users can view guesses" ON public.gtw_guesses FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_mod(auth.uid()));
CREATE POLICY "Users can make guesses" ON public.gtw_guesses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their guess" ON public.gtw_guesses FOR UPDATE USING (auth.uid() = user_id);

-- Audit logs policies (only admins)
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Site settings policies
CREATE POLICY "Settings are viewable by everyone" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Only admins can manage settings" ON public.site_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_news_articles_updated_at BEFORE UPDATE ON public.news_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_casino_bonuses_updated_at BEFORE UPDATE ON public.casino_bonuses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_giveaways_updated_at BEFORE UPDATE ON public.giveaways FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default video categories
INSERT INTO public.video_categories (name, slug, sort_order) VALUES
('Max Wins', 'max-wins', 1),
('Big Wins', 'big-wins', 2),
('Highlights', 'highlights', 3),
('Bonus Hunts', 'bonus-hunts', 4),
('Live Casino', 'live-casino', 5);

-- Insert default site settings
INSERT INTO public.site_settings (key, value) VALUES
('site_name', '"StreamerX"'),
('site_description', '"Your premium destination for casino streaming"'),
('social_links', '{"twitch": "", "youtube": "", "discord": "", "twitter": "", "instagram": ""}'),
('stream_schedule', '[]');