import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Video, Newspaper, Gift, Users, TrendingUp, Calendar, Trophy, Activity, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Stats {
  totalVideos: number;
  totalArticles: number;
  totalGiveaways: number;
  totalUsers: number;
  activeGiveaways: number;
  totalEntries: number;
}

interface RecentActivity {
  id: string;
  action: string;
  created_at: string;
  details: any;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalVideos: 0,
    totalArticles: 0,
    totalGiveaways: 0,
    totalUsers: 0,
    activeGiveaways: 0,
    totalEntries: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentActivities();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        { count: videosCount },
        { count: articlesCount },
        { count: giveawaysCount },
        { count: usersCount },
        { count: activeGiveawaysCount },
        { count: entriesCount },
      ] = await Promise.all([
        supabase.from("videos").select("*", { count: "exact", head: true }),
        supabase.from("news_articles").select("*", { count: "exact", head: true }),
        supabase.from("giveaways").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("giveaways").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("giveaway_entries").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalVideos: videosCount || 0,
        totalArticles: articlesCount || 0,
        totalGiveaways: giveawaysCount || 0,
        totalUsers: usersCount || 0,
        activeGiveaways: activeGiveawaysCount || 0,
        totalEntries: entriesCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("user_activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const getActivityIcon = (action: string) => {
    if (action.includes("login")) return "🔐";
    if (action.includes("signup") || action.includes("register")) return "👤";
    if (action.includes("video")) return "📹";
    if (action.includes("article") || action.includes("news")) return "📰";
    if (action.includes("giveaway")) return "🎁";
    if (action.includes("vote") || action.includes("poll")) return "📊";
    return "📌";
  };

  const statCards = [
    {
      icon: Video,
      label: "Total Videos",
      value: stats.totalVideos,
      color: "text-blue-500",
      bgColor: "bg-blue-500/20",
    },
    {
      icon: Newspaper,
      label: "News Articles",
      value: stats.totalArticles,
      color: "text-green-500",
      bgColor: "bg-green-500/20",
    },
    {
      icon: Gift,
      label: "Total Giveaways",
      value: stats.totalGiveaways,
      color: "text-purple-500",
      bgColor: "bg-purple-500/20",
    },
    {
      icon: Users,
      label: "Total Users",
      value: stats.totalUsers,
      color: "text-orange-500",
      bgColor: "bg-orange-500/20",
    },
    {
      icon: TrendingUp,
      label: "Active Giveaways",
      value: stats.activeGiveaways,
      color: "text-primary",
      bgColor: "bg-primary/20",
    },
    {
      icon: Trophy,
      label: "Giveaway Entries",
      value: stats.totalEntries,
      color: "text-accent",
      bgColor: "bg-accent/20",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/admin/videos"
              className="p-4 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors text-center"
            >
              <Video className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="font-medium">Add Video</p>
            </a>
            <a
              href="/admin/news"
              className="p-4 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors text-center"
            >
              <Newspaper className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="font-medium">Write Article</p>
            </a>
            <a
              href="/admin/giveaways"
              className="p-4 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors text-center"
            >
              <Gift className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="font-medium">Create Giveaway</p>
            </a>
            <a
              href="/admin/events"
              className="p-4 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors text-center"
            >
              <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="font-medium">Add Event</p>
            </a>
          </div>
        </motion.div>

        {/* Recent Activity Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </h2>
            <a href="/admin/activity" className="text-sm text-primary hover:underline">View All</a>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <span className="text-xl">{getActivityIcon(activity.action)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{activity.action}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No recent activity</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-6 border border-primary/20"
      >
        <h2 className="text-xl font-bold mb-2">Welcome to Admin Panel</h2>
        <p className="text-muted-foreground">
          Use the navigation on the left to manage your site content. You can add videos, write news
          articles, create giveaways, manage casino bonuses, and moderate users. All changes are
          logged in the audit log for security.
        </p>
      </motion.div>
    </div>
  );
}