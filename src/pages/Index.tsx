import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Users, Trophy, Gift, ArrowRight, Twitch, Clock, Star, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface Bonus {
  id: string;
  name: string;
  bonus_text: string;
  logo_url: string | null;
  affiliate_url: string | null;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  event_type: string | null;
  expected_viewers: string | null;
}

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: string | null;
  multiplier: string | null;
  views: number | null;
}

interface Giveaway {
  id: string;
  title: string;
  prize: string;
  end_date: string;
}

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  category: string | null;
  created_at: string;
}

export default function Index() {
  const { settings } = useSiteSettings();
  const [featuredBonuses, setFeaturedBonuses] = useState<Bonus[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [latestVideos, setLatestVideos] = useState<Video[]>([]);
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([]);
  const [activeGiveaway, setActiveGiveaway] = useState<Giveaway | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

  const stats = [
    { icon: Users, value: settings.stat_community_value, label: settings.stat_community_label },
    { icon: Trophy, value: settings.stat_wins_value, label: settings.stat_wins_label },
    { icon: Gift, value: settings.stat_giveaways_value, label: settings.stat_giveaways_label },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!activeGiveaway) return;
    
    const updateCountdown = () => {
      const end = new Date(activeGiveaway.end_date).getTime();
      const now = Date.now();
      const diff = end - now;
      
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0 });
        return;
      }
      
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      });
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [activeGiveaway]);

  const fetchData = async () => {
    // Fetch featured bonuses
    const { data: bonuses } = await supabase
      .from("casino_bonuses")
      .select("id, name, bonus_text, logo_url, affiliate_url")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("sort_order")
      .limit(3);
    
    if (bonuses) setFeaturedBonuses(bonuses);

    // Fetch upcoming events
    const { data: events } = await supabase
      .from("events")
      .select("id, title, event_date, event_time, event_type, expected_viewers")
      .gte("event_date", new Date().toISOString().split("T")[0])
      .order("event_date")
      .limit(3);
    
    if (events) setUpcomingEvents(events);

    // Fetch latest videos
    const { data: videos } = await supabase
      .from("videos")
      .select("id, title, thumbnail_url, duration, multiplier, views")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(4);
    
    if (videos) setLatestVideos(videos);

    // Fetch latest news
    const { data: news } = await supabase
      .from("news_articles")
      .select("id, title, slug, excerpt, image_url, category, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(3);
    
    if (news) setLatestNews(news);

    // Fetch active giveaway
    const { data: giveaway } = await supabase
      .from("giveaways")
      .select("id, title, prize, end_date")
      .eq("status", "active")
      .gte("end_date", new Date().toISOString())
      .order("end_date")
      .limit(1)
      .maybeSingle();
    
    if (giveaway) setActiveGiveaway(giveaway);
  };

  const formatEventDate = (date: string, time: string | null) => {
    const d = new Date(date);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    return time ? `${dayName}, ${time}` : dayName;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-neon/15 rounded-full blur-[100px] animate-pulse-slow" />
        
        <div className="container mx-auto px-6 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Live Status Badge */}
            {settings.is_live ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/20 border border-destructive/50 rounded-full mb-8"
              >
                <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                <span className="text-sm font-medium text-destructive">Live on Twitch</span>
                {settings.live_viewer_count && settings.live_viewer_count !== "0" && (
                  <span className="text-xs text-muted-foreground">• {settings.live_viewer_count} viewers</span>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-muted/20 border border-muted/50 rounded-full mb-8"
              >
                <span className="w-2 h-2 bg-muted-foreground rounded-full" />
                <span className="text-sm font-medium text-muted-foreground">Offline</span>
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            >
              Welcome to{" "}
              <span className="gradient-text">{settings.site_name}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            >
              Your premium destination for casino streaming, exclusive bonuses,
              and thrilling giveaways.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button variant="glow" size="xl" className="group" asChild>
                <a href={settings.twitch_url} target="_blank" rel="noopener noreferrer">
                  <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Watch Live Stream
                </a>
              </Button>
              <Button variant="glass" size="xl" className="group" asChild>
                <a href={settings.twitch_follow_url} target="_blank" rel="noopener noreferrer">
                  <Twitch className="w-5 h-5" />
                  Follow on Twitch
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
                className="glass rounded-2xl p-6 text-center card-hover"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                <p className="text-3xl font-bold gradient-text mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Casinos */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Featured <span className="gradient-text">Bonuses</span>
              </h2>
              <p className="text-muted-foreground">Exclusive deals for our community</p>
            </div>
            <Link to="/bonuses">
              <Button variant="outline" className="group">
                View All
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredBonuses.length > 0 ? featuredBonuses.map((bonus, index) => (
              <motion.div
                key={bonus.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl overflow-hidden card-hover neon-border group"
              >
                <div className="relative h-40 overflow-hidden bg-secondary">
                  {bonus.logo_url ? (
                    <img
                      src={bonus.logo_url}
                      alt={bonus.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Trophy className="w-16 h-16 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{bonus.name}</h3>
                  <p className="text-accent font-semibold mb-4">{bonus.bonus_text}</p>
                  <Button variant="gold" className="w-full" asChild>
                    <a href={bonus.affiliate_url || "#"} target="_blank" rel="noopener noreferrer">
                      Claim Bonus
                    </a>
                  </Button>
                </div>
              </motion.div>
            )) : (
              [1, 2, 3].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-2xl overflow-hidden card-hover neon-border"
                >
                  <div className="h-40 bg-secondary animate-pulse" />
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-secondary rounded animate-pulse" />
                    <div className="h-4 bg-secondary rounded w-2/3 animate-pulse" />
                    <div className="h-10 bg-secondary rounded animate-pulse" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Latest News - Only show if news is visible */}
      {settings.nav_news_visible && latestNews.length > 0 && (
        <section className="py-20 px-6 bg-card/30">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-10"
            >
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">
                  Latest <span className="gradient-text">News</span>
                </h2>
                <p className="text-muted-foreground">Stay updated with the latest</p>
              </div>
              <Link to="/news">
                <Button variant="outline" className="group">
                  All News
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestNews.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/news/${article.slug}`} className="block glass rounded-2xl overflow-hidden card-hover group">
                    <div className="relative h-48 bg-secondary overflow-hidden">
                      {article.image_url ? (
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      )}
                      {article.category && (
                        <span className="absolute top-3 left-3 px-2 py-1 bg-primary/80 text-primary-foreground text-xs font-medium rounded">
                          {article.category}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-3">
                        {new Date(article.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Streams */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Upcoming <span className="gradient-text">Events</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Don't miss out on our scheduled streams and special events
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {upcomingEvents.length > 0 ? upcomingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-6 card-hover"
              >
                <div className="flex items-center gap-2 text-sm text-primary mb-3">
                  <Clock className="w-4 h-4" />
                  {formatEventDate(event.event_date, event.event_time)}
                </div>
                <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{event.event_type || "Stream"}</span>
                  {event.expected_viewers && (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      ~{event.expected_viewers}
                    </span>
                  )}
                </div>
              </motion.div>
            )) : (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                No upcoming events scheduled
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Latest Wins */}
      <section className="py-20 px-6 bg-card/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Latest <span className="gradient-text-gold">Wins</span>
              </h2>
              <p className="text-muted-foreground">Watch our biggest hits</p>
            </div>
            <Link to="/videos">
              <Button variant="outline" className="group">
                All Videos
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestVideos.length > 0 ? latestVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl overflow-hidden card-hover group cursor-pointer"
              >
                <Link to="/videos">
                  <div className="relative aspect-video bg-secondary">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/40 transition-colors">
                          <Play className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    )}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/80 rounded text-xs">
                        {video.duration}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-2">{video.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {video.multiplier && (
                        <>
                          <Star className="w-4 h-4 text-accent" />
                          <span>{video.multiplier}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{(video.views || 0).toLocaleString()} views</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )) : (
              [1, 2, 3, 4].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-2xl overflow-hidden"
                >
                  <div className="aspect-video bg-secondary animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-secondary rounded animate-pulse" />
                    <div className="h-3 bg-secondary rounded w-2/3 animate-pulse" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Active Giveaway */}
      {activeGiveaway && (
        <section className="py-20 px-6">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-3xl p-8 md:p-12 neon-border max-w-4xl mx-auto text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
              
              <span className="inline-block px-4 py-1 bg-accent/20 text-accent text-sm font-medium rounded-full mb-6">
                🎉 Active Giveaway
              </span>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{activeGiveaway.title}</h2>
              <p className="text-2xl gradient-text-gold font-bold mb-8">{activeGiveaway.prize}</p>
              
              <div className="flex justify-center gap-4 md:gap-8 mb-8">
                {[
                  { value: countdown.days, label: "Days" },
                  { value: countdown.hours, label: "Hours" },
                  { value: countdown.minutes, label: "Minutes" },
                ].map((item) => (
                  <div key={item.label} className="glass rounded-xl p-4 min-w-[80px]">
                    <p className="text-3xl font-bold text-primary">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
              
              <Link to="/giveaways">
                <Button variant="glow" size="xl" className="group">
                  <Gift className="w-5 h-5" />
                  Enter Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
}