import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  Video, 
  Newspaper, 
  Gift, 
  Users, 
  TrendingUp, 
  Calendar, 
  Trophy, 
  Activity, 
  Clock,
  Eye,
  Heart,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Zap,
  Target,
  Bell,
  FileText,
  RefreshCw,
  Radio
} from "lucide-react";
import { LiveStreamStatus } from "@/components/admin/LiveStreamStatus";
import { SystemMonitor } from "@/components/admin/SystemMonitor";
import { AdminDiagnosticsPanel } from "@/components/admin/AdminDiagnosticsPanel";
import { QuickActionsWidget } from "@/components/admin/QuickActionsWidget";
import { formatDistanceToNow, format } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  AdminPageHeader, 
  AdminStatsGrid, 
  AdminCard, 
  AdminEmptyState,
  AdminLoadingState,
  AdminQuickAction 
} from "@/components/admin";
import { useAuth } from "@/contexts/AuthContext";

interface Stats {
  totalVideos: number;
  totalArticles: number;
  totalGiveaways: number;
  totalUsers: number;
  activeGiveaways: number;
  totalEntries: number;
  totalEvents: number;
  upcomingEvents: number;
  totalPolls: number;
  pendingFlags: number;
  totalViews: number;
  totalLikes: number;
}

interface RecentActivity {
  id: string;
  action: string;
  created_at: string;
  details: any;
  profile?: {
    username: string | null;
    display_name: string | null;
  };
}

interface RecentContent {
  id: string;
  title: string;
  type: "video" | "article" | "giveaway";
  created_at: string;
  views?: number;
}

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalVideos: 0,
    totalArticles: 0,
    totalGiveaways: 0,
    totalUsers: 0,
    activeGiveaways: 0,
    totalEntries: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    totalPolls: 0,
    pendingFlags: 0,
    totalViews: 0,
    totalLikes: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [recentContent, setRecentContent] = useState<RecentContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchStats(),
        fetchRecentActivities(),
        fetchRecentContent(),
      ]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [
        { count: videosCount },
        { count: articlesCount },
        { count: giveawaysCount },
        { count: usersCount },
        { count: activeGiveawaysCount },
        { count: entriesCount },
        { count: eventsCount },
        { count: upcomingEventsCount },
        { count: pollsCount },
        { count: pendingFlagsCount },
        { data: videosViewsData },
        { data: articlesViewsData },
        { count: videoLikesCount },
        { count: articleLikesCount },
      ] = await Promise.all([
        supabase.from("videos").select("*", { count: "exact", head: true }),
        supabase.from("news_articles").select("*", { count: "exact", head: true }),
        supabase.from("giveaways").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("giveaways").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("giveaway_entries").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }).gte("event_date", new Date().toISOString().split("T")[0]),
        supabase.from("polls").select("*", { count: "exact", head: true }),
        supabase.from("content_flags").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("videos").select("views"),
        supabase.from("news_articles").select("views"),
        supabase.from("video_likes").select("*", { count: "exact", head: true }),
        supabase.from("article_likes").select("*", { count: "exact", head: true }),
      ]);

      const totalVideoViews = videosViewsData?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
      const totalArticleViews = articlesViewsData?.reduce((sum, a) => sum + (a.views || 0), 0) || 0;

      setStats({
        totalVideos: videosCount || 0,
        totalArticles: articlesCount || 0,
        totalGiveaways: giveawaysCount || 0,
        totalUsers: usersCount || 0,
        activeGiveaways: activeGiveawaysCount || 0,
        totalEntries: entriesCount || 0,
        totalEvents: eventsCount || 0,
        upcomingEvents: upcomingEventsCount || 0,
        totalPolls: pollsCount || 0,
        pendingFlags: pendingFlagsCount || 0,
        totalViews: totalVideoViews + totalArticleViews,
        totalLikes: (videoLikesCount || 0) + (articleLikesCount || 0),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("user_activities")
        .select("*")
        .not("action", "ilike", "%login%")
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;

      // Fetch profiles
      const userIds = [...new Set(data?.map(a => a.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, display_name")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
        const activitiesWithProfiles = data?.map(activity => ({
          ...activity,
          profile: activity.user_id ? profileMap.get(activity.user_id) : undefined,
        }));
        setRecentActivities(activitiesWithProfiles || []);
      } else {
        setRecentActivities(data || []);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const fetchRecentContent = async () => {
    try {
      const [{ data: videos }, { data: articles }, { data: giveaways }] = await Promise.all([
        supabase.from("videos").select("id, title, created_at, views").order("created_at", { ascending: false }).limit(3),
        supabase.from("news_articles").select("id, title, created_at, views").order("created_at", { ascending: false }).limit(3),
        supabase.from("giveaways").select("id, title, created_at").order("created_at", { ascending: false }).limit(2),
      ]);

      const content: RecentContent[] = [
        ...(videos || []).map(v => ({ ...v, type: "video" as const })),
        ...(articles || []).map(a => ({ ...a, type: "article" as const })),
        ...(giveaways || []).map(g => ({ ...g, type: "giveaway" as const })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);

      setRecentContent(content);
    } catch (error) {
      console.error("Error fetching recent content:", error);
    }
  };

  const getActivityIcon = (action: string) => {
    if (action.includes("login")) return "🔐";
    if (action.includes("signup") || action.includes("register")) return "👤";
    if (action.includes("video")) return "📹";
    if (action.includes("article") || action.includes("news")) return "📰";
    if (action.includes("giveaway")) return "🎁";
    if (action.includes("vote") || action.includes("poll")) return "📊";
    if (action.includes("comment")) return "💬";
    return "📌";
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4 text-blue-500" />;
      case "article": return <Newspaper className="w-4 h-4 text-green-500" />;
      case "giveaway": return <Gift className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAllData();
  };

  const statItems = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-blue-500/10 text-blue-500" },
    { label: "Total Videos", value: stats.totalVideos, icon: Video, color: "bg-purple-500/10 text-purple-500" },
    { label: "News Articles", value: stats.totalArticles, icon: Newspaper, color: "bg-green-500/10 text-green-500" },
    { label: "Total Views", value: stats.totalViews, icon: Eye, color: "bg-amber-500/10 text-amber-500" },
    { label: "Total Likes", value: stats.totalLikes, icon: Heart, color: "bg-pink-500/10 text-pink-500" },
    { label: "Active Giveaways", value: stats.activeGiveaways, icon: Gift, color: "bg-cyan-500/10 text-cyan-500" },
  ];

  if (isLoading) {
    return <AdminLoadingState message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your site."
        icon={Activity}
        actions={
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {/* Alert Banner */}
      {stats.pendingFlags > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <p className="font-medium text-amber-500">
                {stats.pendingFlags} content flag{stats.pendingFlags > 1 ? "s" : ""} pending review
              </p>
              <p className="text-sm text-muted-foreground">Review flagged content in the moderation queue</p>
            </div>
          </div>
          <Link to="/admin/settings/moderation">
            <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
              Review Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Stats Grid */}
      <AdminStatsGrid stats={statItems} columns={6} />

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50"
        >
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Trophy className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.totalEntries}</p>
            <p className="text-xs text-muted-foreground">Giveaway Entries</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50"
        >
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <Calendar className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.upcomingEvents}</p>
            <p className="text-xs text-muted-foreground">Upcoming Events</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50"
        >
          <div className="p-2 rounded-lg bg-rose-500/10">
            <BarChart3 className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.totalPolls}</p>
            <p className="text-xs text-muted-foreground">Active Polls</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50"
        >
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.totalGiveaways}</p>
            <p className="text-xs text-muted-foreground">Total Giveaways</p>
          </div>
        </motion.div>
      </div>

      {/* Stream Status & System Monitor Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LiveStreamStatus />
        <SystemMonitor />
      </div>

      {/* Diagnostics Panel */}
      <AdminDiagnosticsPanel />

      {/* Quick Actions Widget */}
      <QuickActionsWidget />

      {/* Activity & Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Activity */}
        <AdminCard 
          title="Recent Activity" 
          icon={Activity}
          delay={0.55}
          className="lg:col-span-1"
          headerActions={
            <Link to="/admin/activity" className="text-sm text-primary hover:underline">
              View All
            </Link>
          }
        >
          {recentActivities.length > 0 ? (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                  <span className="text-lg flex-shrink-0">{getActivityIcon(activity.action)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {activity.profile?.display_name || activity.profile?.username || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{activity.action.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              icon={Activity}
              title="No recent activity"
              description="User activities will appear here"
            />
          )}
        </AdminCard>

        {/* Recent Content */}
        <AdminCard 
          title="Recent Content" 
          icon={FileText}
          delay={0.6}
          className="lg:col-span-1"
        >
          {recentContent.length > 0 ? (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {recentContent.map((content) => (
                <div key={`${content.type}-${content.id}`} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className="p-2 rounded-lg bg-secondary/50">
                    {getContentIcon(content.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium line-clamp-1">{content.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                        content.type === "video" ? "bg-blue-500/10 text-blue-500" :
                        content.type === "article" ? "bg-green-500/10 text-green-500" :
                        "bg-purple-500/10 text-purple-500"
                      }`}>
                        {content.type}
                      </span>
                      {content.views !== undefined && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {content.views}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {format(new Date(content.created_at), "MMM d, HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              icon={FileText}
              title="No recent content"
              description="New content will appear here"
            />
          )}
        </AdminCard>
      </div>

      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-6"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">Welcome to the Admin Panel</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Manage your site content, users, and settings from this central dashboard. 
              Use the navigation on the left to access different sections. All changes are 
              logged in the audit log for security and transparency.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
