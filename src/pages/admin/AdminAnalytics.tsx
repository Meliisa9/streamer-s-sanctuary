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
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

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
  usersByMonth: { month: string; count: number }[];
  contentDistribution: { name: string; value: number }[];
  recentActivity: { date: string; users: number; views: number }[];
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
      ]);

      // Fetch video and article views
      const [videosViewsResult, articlesViewsResult] = await Promise.all([
        supabase.from("videos").select("views"),
        supabase.from("news_articles").select("views"),
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

      // Content distribution
      const contentDistribution = [
        { name: "Videos", value: videosResult.count || 0 },
        { name: "Articles", value: articlesResult.count || 0 },
        { name: "Giveaways", value: giveawaysResult.count || 0 },
        { name: "Events", value: eventsResult.count || 0 },
        { name: "Polls", value: pollsResult.count || 0 },
      ];

      // Recent activity (last 7 days - simplified)
      const recentActivity = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        recentActivity.push({
          date: d.toLocaleDateString('en-US', { weekday: 'short' }),
          users: Math.floor(Math.random() * 10) + (usersResult.count || 0) / 7,
          views: Math.floor(Math.random() * 100) + (videoViews + articleViews) / 7,
        });
      }

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
        usersByMonth: usersByMonthArray,
        contentDistribution,
        recentActivity,
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

  const engagementStats = [
    { title: "Video Views", value: data?.videoViews || 0, icon: Eye },
    { title: "Article Views", value: data?.articleViews || 0, icon: Eye },
    { title: "Giveaway Entries", value: data?.giveawayEntries || 0, icon: Heart },
    { title: "Active Giveaways", value: data?.activeGiveaways || 0, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">Overview of your site performance</p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
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

      {/* Engagement Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {engagementStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
          >
            <Card className="glass border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-xl font-bold">{stat.value.toLocaleString()}</p>
                  </div>
                  <stat.icon className="w-8 h-8 text-muted-foreground/50" />
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
                  <BarChart data={data?.usersByMonth || []}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {data?.contentDistribution?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Stats Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
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
                <p className="text-sm text-muted-foreground">Total Polls</p>
                <p className="text-3xl font-bold text-purple-500">{data?.totalPolls || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Engagement</p>
                <p className="text-3xl font-bold text-accent">
                  {((data?.giveawayEntries || 0) + (data?.pollVotes || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
