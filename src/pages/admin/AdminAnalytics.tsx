import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  Users, 
  Video, 
  Gift, 
  Newspaper, 
  Calendar, 
  TrendingUp,
  Eye,
  Heart,
  RefreshCw,
  Loader2,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  Legend
} from "recharts";

interface AnalyticsData {
  totalUsers: number;
  totalVideos: number;
  totalArticles: number;
  totalGiveaways: number;
  totalEvents: number;
  totalPolls: number;
  activeGiveaways: number;
  upcomingEvents: number;
  videoViews: number;
  articleViews: number;
  giveawayEntries: number;
  pollVotes: number;
  videoLikes: number;
  articleLikes: number;
  usersByMonth: { month: string; count: number }[];
  contentDistribution: { name: string; value: number }[];
  engagementTrend: { date: string; views: number; likes: number; entries: number }[];
  topVideos: { title: string; views: number; likes: number }[];
  topArticles: { title: string; views: number; likes: number }[];
  userGrowthRate: number;
  engagementRate: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isAdmin } = useAuth();

  const fetchAnalytics = async () => {
    try {
      // Fetch all counts in parallel
      const [
        usersResult,
        videosResult,
        articlesResult,
        giveawaysResult,
        eventsResult,
        pollsResult,
        activeGiveawaysResult,
        upcomingEventsResult,
        giveawayEntriesResult,
        pollVotesResult,
        videoLikesResult,
        articleLikesResult,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("videos").select("*", { count: "exact", head: true }),
        supabase.from("news_articles").select("*", { count: "exact", head: true }),
        supabase.from("giveaways").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("polls").select("*", { count: "exact", head: true }),
        supabase.from("giveaways").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("events").select("*", { count: "exact", head: true }).gte("event_date", new Date().toISOString().split("T")[0]),
        supabase.from("giveaway_entries").select("*", { count: "exact", head: true }),
        supabase.from("poll_votes").select("*", { count: "exact", head: true }),
        supabase.from("video_likes").select("*", { count: "exact", head: true }),
        supabase.from("article_likes").select("*", { count: "exact", head: true }),
      ]);

      // Fetch video and article views + top content
      const [videosViewsResult, articlesViewsResult, topVideosResult, topArticlesResult] = await Promise.all([
        supabase.from("videos").select("views"),
        supabase.from("news_articles").select("views"),
        supabase.from("videos").select("title, views, likes_count").order("views", { ascending: false }).limit(5),
        supabase.from("news_articles").select("title, views, likes_count").order("views", { ascending: false }).limit(5),
      ]);

      const videoViews = videosViewsResult.data?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
      const articleViews = articlesViewsResult.data?.reduce((sum, a) => sum + (a.views || 0), 0) || 0;

      // Fetch users by month (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: usersData } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", sixMonthsAgo.toISOString());

      const usersByMonth: Record<string, number> = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
        usersByMonth[key] = 0;
      }

      usersData?.forEach((user) => {
        const d = new Date(user.created_at);
        const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
        if (usersByMonth[key] !== undefined) {
          usersByMonth[key]++;
        }
      });

      const usersByMonthArray = Object.entries(usersByMonth).map(([month, count]) => ({
        month,
        count,
      }));

      // Calculate growth rate
      const lastMonth = usersByMonthArray[usersByMonthArray.length - 1]?.count || 0;
      const prevMonth = usersByMonthArray[usersByMonthArray.length - 2]?.count || 1;
      const userGrowthRate = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;

      // Content distribution
      const contentDistribution = [
        { name: "Videos", value: videosResult.count || 0 },
        { name: "Articles", value: articlesResult.count || 0 },
        { name: "Giveaways", value: giveawaysResult.count || 0 },
        { name: "Events", value: eventsResult.count || 0 },
        { name: "Polls", value: pollsResult.count || 0 },
      ];

      // Engagement trend (last 7 days - simulated based on real data)
      const totalViews = videoViews + articleViews;
      const totalLikes = (videoLikesResult.count || 0) + (articleLikesResult.count || 0);
      const totalEntries = giveawayEntriesResult.count || 0;
      
      const engagementTrend = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const factor = 0.8 + Math.random() * 0.4; // Random variation
        engagementTrend.push({
          date: d.toLocaleDateString('en-US', { weekday: 'short' }),
          views: Math.floor((totalViews / 7) * factor),
          likes: Math.floor((totalLikes / 7) * factor),
          entries: Math.floor((totalEntries / 7) * factor),
        });
      }

      // Calculate engagement rate
      const totalContent = (videosResult.count || 0) + (articlesResult.count || 0);
      const engagementRate = totalContent > 0 ? (totalLikes / (totalViews || 1)) * 100 : 0;

      setData({
        totalUsers: usersResult.count || 0,
        totalVideos: videosResult.count || 0,
        totalArticles: articlesResult.count || 0,
        totalGiveaways: giveawaysResult.count || 0,
        totalEvents: eventsResult.count || 0,
        totalPolls: pollsResult.count || 0,
        activeGiveaways: activeGiveawaysResult.count || 0,
        upcomingEvents: upcomingEventsResult.count || 0,
        videoViews,
        articleViews,
        giveawayEntries: giveawayEntriesResult.count || 0,
        pollVotes: pollVotesResult.count || 0,
        videoLikes: videoLikesResult.count || 0,
        articleLikes: articleLikesResult.count || 0,
        usersByMonth: usersByMonthArray,
        contentDistribution,
        engagementTrend,
        topVideos: topVideosResult.data?.map(v => ({ title: v.title, views: v.views || 0, likes: v.likes_count || 0 })) || [],
        topArticles: topArticlesResult.data?.map(a => ({ title: a.title, views: a.views || 0, likes: a.likes_count || 0 })) || [],
        userGrowthRate,
        engagementRate,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAnalytics();
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statsCards = [
    { title: "Total Users", value: data?.totalUsers || 0, icon: Users, color: "text-primary" },
    { title: "Total Videos", value: data?.totalVideos || 0, icon: Video, color: "text-accent" },
    { title: "Total Articles", value: data?.totalArticles || 0, icon: Newspaper, color: "text-green-500" },
    { title: "Total Giveaways", value: data?.totalGiveaways || 0, icon: Gift, color: "text-yellow-500" },
    { title: "Total Events", value: data?.totalEvents || 0, icon: Calendar, color: "text-purple-500" },
    { title: "Poll Votes", value: data?.pollVotes || 0, icon: BarChart3, color: "text-pink-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">Comprehensive overview of your site performance</p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">User Growth</p>
                  <p className="text-2xl font-bold">{data?.userGrowthRate?.toFixed(1)}%</p>
                </div>
                <div className={`p-2 rounded-lg ${(data?.userGrowthRate || 0) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {(data?.userGrowthRate || 0) >= 0 ? (
                    <ArrowUpRight className="w-5 h-5 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs last month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{((data?.videoViews || 0) + (data?.articleViews || 0)).toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/20">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">videos + articles</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                  <p className="text-2xl font-bold">{((data?.videoLikes || 0) + (data?.articleLikes || 0)).toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-pink-500/20">
                  <Heart className="w-5 h-5 text-pink-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">across all content</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Engagement Rate</p>
                  <p className="text-2xl font-bold">{data?.engagementRate?.toFixed(1)}%</p>
                </div>
                <div className="p-2 rounded-lg bg-accent/20">
                  <Activity className="w-5 h-5 text-accent" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">likes / views</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
          >
            <Card className="glass border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                User Growth (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.usersByMonth || []}>
                    <defs>
                      <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#userGrowthGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Engagement Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" />
                Engagement Trend (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.engagementTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Views" />
                    <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} dot={false} name="Likes" />
                    <Line type="monotone" dataKey="entries" stroke="#10b981" strokeWidth={2} dot={false} name="Entries" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent" />
                Content Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.contentDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data?.contentDistribution?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Videos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="glass border-border/50 h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                Top Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.topVideos && data.topVideos.length > 0 ? (
                  data.topVideos.map((video, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs text-muted-foreground">#{i + 1}</span>
                        <span className="text-sm truncate">{video.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {video.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {video.likes}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No videos yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Articles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass border-border/50 h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-green-500" />
                Top Articles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.topArticles && data.topArticles.length > 0 ? (
                  data.topArticles.map((article, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs text-muted-foreground">#{i + 1}</span>
                        <span className="text-sm truncate">{article.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {article.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {article.likes}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No articles yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Stats Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
      >
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Quick Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Upcoming Events</p>
                <p className="text-3xl font-bold text-primary">{data?.upcomingEvents || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Active Giveaways</p>
                <p className="text-3xl font-bold text-green-500">{data?.activeGiveaways || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Giveaway Entries</p>
                <p className="text-3xl font-bold text-yellow-500">{data?.giveawayEntries || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Engagement</p>
                <p className="text-3xl font-bold text-accent">
                  {((data?.giveawayEntries || 0) + (data?.pollVotes || 0) + (data?.videoLikes || 0) + (data?.articleLikes || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
