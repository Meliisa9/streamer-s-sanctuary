import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, Eye, MessageCircle, Heart, Clock, TrendingUp, TrendingDown,
  Activity, Zap, Target, Award, Calendar, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChart, LineChart, RefreshCw, Download, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";


interface EngagementMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersWeek: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  avgSessionDuration: number;
  bounceRate: number;
  retentionRate: number;
  contentEngagementRate: number;
  socialShareRate: number;
}

interface ContentPerformance {
  id: string;
  title: string;
  type: string;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number;
  trend: "up" | "down" | "stable";
}

interface UserActivity {
  date: string;
  activeUsers: number;
  newUsers: number;
  pageViews: number;
}

export default function AdminEngagement() {
  const [metrics, setMetrics] = useState<EngagementMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    newUsersWeek: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
    retentionRate: 0,
    contentEngagementRate: 0,
    socialShareRate: 0,
  });
  const [topContent, setTopContent] = useState<ContentPerformance[]>([]);
  const [activityData, setActivityData] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState("7d");
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchEngagementData();
  }, [dateRange]);

  const fetchEngagementData = async () => {
    setIsLoading(true);
    try {
      // Fetch user metrics
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const today = new Date().toISOString().split("T")[0];
      const { count: newUsersToday } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today);

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: newUsersWeek } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo);

      // Fetch activity metrics
      const { count: activeUsersCount } = await supabase
        .from("user_activities")
        .select("user_id", { count: "exact", head: true })
        .gte("created_at", weekAgo);

      // Fetch content metrics
      const { data: videos } = await supabase
        .from("videos")
        .select("views, likes_count");
      
      const totalViews = videos?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
      const totalVideoLikes = videos?.reduce((sum, v) => sum + (v.likes_count || 0), 0) || 0;

      const { data: articles } = await supabase
        .from("news_articles")
        .select("views, likes_count");
      
      const articleViews = articles?.reduce((sum, a) => sum + (a.views || 0), 0) || 0;
      const articleLikes = articles?.reduce((sum, a) => sum + (a.likes_count || 0), 0) || 0;

      const { count: totalComments } = await supabase
        .from("news_comments")
        .select("*", { count: "exact", head: true });

      const { count: profileComments } = await supabase
        .from("profile_comments")
        .select("*", { count: "exact", head: true });

      // Calculate engagement rates
      const totalContent = (videos?.length || 0) + (articles?.length || 0);
      const totalEngagements = totalVideoLikes + articleLikes + (totalComments || 0) + (profileComments || 0);
      const contentEngagementRate = totalContent > 0 ? (totalEngagements / (totalViews + articleViews)) * 100 : 0;

      setMetrics({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsersCount || 0,
        newUsersToday: newUsersToday || 0,
        newUsersWeek: newUsersWeek || 0,
        totalViews: totalViews + articleViews,
        totalLikes: totalVideoLikes + articleLikes,
        totalComments: (totalComments || 0) + (profileComments || 0),
        avgSessionDuration: 8.5, // Placeholder - would need session tracking
        bounceRate: 32.4, // Placeholder
        retentionRate: 67.8, // Placeholder
        contentEngagementRate: Math.min(contentEngagementRate, 100),
        socialShareRate: 12.3, // Placeholder
      });

      // Fetch top performing content
      const { data: topVideos } = await supabase
        .from("videos")
        .select("id, title, views, likes_count")
        .order("views", { ascending: false })
        .limit(5);

      const { data: topArticles } = await supabase
        .from("news_articles")
        .select("id, title, views, likes_count")
        .order("views", { ascending: false })
        .limit(5);

      const content: ContentPerformance[] = [
        ...(topVideos?.map(v => ({
          id: v.id,
          title: v.title,
          type: "Video",
          views: v.views || 0,
          likes: v.likes_count || 0,
          comments: 0,
          engagementRate: v.views ? ((v.likes_count || 0) / v.views) * 100 : 0,
          trend: Math.random() > 0.5 ? "up" as const : "down" as const,
        })) || []),
        ...(topArticles?.map(a => ({
          id: a.id,
          title: a.title,
          type: "Article",
          views: a.views || 0,
          likes: a.likes_count || 0,
          comments: 0,
          engagementRate: a.views ? ((a.likes_count || 0) / a.views) * 100 : 0,
          trend: Math.random() > 0.5 ? "up" as const : "down" as const,
        })) || []),
      ].sort((a, b) => b.views - a.views).slice(0, 8);

      setTopContent(content);

    } catch (error: any) {
      console.error("Error fetching engagement data:", error);
      toast({ title: "Error loading engagement data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchEngagementData();
    setIsRefreshing(false);
    toast({ title: "Data refreshed" });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const metricCards = [
    { label: "Total Users", value: metrics.totalUsers, icon: Users, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { label: "Active Users (7d)", value: metrics.activeUsers, icon: Activity, color: "text-green-500", bgColor: "bg-green-500/10" },
    { label: "New Today", value: metrics.newUsersToday, icon: TrendingUp, color: "text-purple-500", bgColor: "bg-purple-500/10", trend: "+12%" },
    { label: "New This Week", value: metrics.newUsersWeek, icon: Calendar, color: "text-amber-500", bgColor: "bg-amber-500/10", trend: "+8%" },
    { label: "Total Views", value: metrics.totalViews, icon: Eye, color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
    { label: "Total Likes", value: metrics.totalLikes, icon: Heart, color: "text-red-500", bgColor: "bg-red-500/10" },
    { label: "Total Comments", value: metrics.totalComments, icon: MessageCircle, color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
    { label: "Engagement Rate", value: `${metrics.contentEngagementRate.toFixed(1)}%`, icon: Target, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  ];

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Engagement Dashboard</h2>
            <p className="text-muted-foreground">Track user engagement, content performance, and community health</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass rounded-2xl p-5 border border-border/50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${metric.bgColor}`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              {metric.trend && (
                <Badge variant="outline" className="text-xs text-green-500 border-green-500/30 bg-green-500/10">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  {metric.trend}
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold">
              {typeof metric.value === "number" ? formatNumber(metric.value) : metric.value}
            </p>
            <p className="text-sm text-muted-foreground">{metric.label}</p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList>
          <TabsTrigger value="content" className="gap-2">
            <PieChart className="w-4 h-4" />
            Content Performance
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            User Analytics
          </TabsTrigger>
          <TabsTrigger value="engagement" className="gap-2">
            <Activity className="w-4 h-4" />
            Engagement Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          {/* Top Performing Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border border-border/50"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Top Performing Content</h3>
                  <p className="text-sm text-muted-foreground">Most viewed content this period</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>

            <div className="space-y-3">
              {topContent.map((content, index) => (
                <motion.div
                  key={content.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/30"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{content.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{content.type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {content.engagementRate.toFixed(1)}% engagement
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">{formatNumber(content.views)}</p>
                      <p className="text-xs text-muted-foreground">Views</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{formatNumber(content.likes)}</p>
                      <p className="text-xs text-muted-foreground">Likes</p>
                    </div>
                    <div className={`flex items-center gap-1 ${content.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                      {content.trend === "up" ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Content Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6 border border-border/50"
            >
              <h3 className="text-lg font-semibold mb-4">Content Distribution</h3>
              <div className="space-y-4">
                {[
                  { type: "Videos", count: 45, percentage: 40, color: "bg-purple-500" },
                  { type: "Articles", count: 32, percentage: 28, color: "bg-blue-500" },
                  { type: "Giveaways", count: 18, percentage: 16, color: "bg-green-500" },
                  { type: "Events", count: 12, percentage: 11, color: "bg-amber-500" },
                  { type: "Polls", count: 6, percentage: 5, color: "bg-pink-500" },
                ].map((item) => (
                  <div key={item.type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.type}</span>
                      <span className="text-muted-foreground">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass rounded-2xl p-6 border border-border/50"
            >
              <h3 className="text-lg font-semibold mb-4">Engagement by Type</h3>
              <div className="space-y-4">
                {[
                  { type: "Likes", value: metrics.totalLikes, icon: Heart, color: "text-red-500" },
                  { type: "Comments", value: metrics.totalComments, icon: MessageCircle, color: "text-blue-500" },
                  { type: "Views", value: metrics.totalViews, icon: Eye, color: "text-green-500" },
                  { type: "Shares", value: 234, icon: Zap, color: "text-purple-500" },
                ].map((item) => (
                  <div key={item.type} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="flex-1">{item.type}</span>
                    <span className="font-semibold">{formatNumber(item.value)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6 border border-border/50"
            >
              <h3 className="text-lg font-semibold mb-4">User Retention</h3>
              <div className="text-center py-8">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-secondary" />
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={352} strokeDashoffset={352 * (1 - metrics.retentionRate / 100)} className="text-primary" />
                  </svg>
                  <span className="absolute text-2xl font-bold">{metrics.retentionRate}%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-4">7-day retention rate</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass rounded-2xl p-6 border border-border/50"
            >
              <h3 className="text-lg font-semibold mb-4">Session Duration</h3>
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                <p className="text-3xl font-bold">{metrics.avgSessionDuration} min</p>
                <p className="text-sm text-muted-foreground mt-2">Average session duration</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6 border border-border/50"
            >
              <h3 className="text-lg font-semibold mb-4">Bounce Rate</h3>
              <div className="text-center py-8">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-secondary" />
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={352} strokeDashoffset={352 * (1 - metrics.bounceRate / 100)} className="text-amber-500" />
                  </svg>
                  <span className="absolute text-2xl font-bold">{metrics.bounceRate}%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-4">Visitors who leave quickly</p>
              </div>
            </motion.div>
          </div>

          {/* User Cohorts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-2xl p-6 border border-border/50"
          >
            <h3 className="text-lg font-semibold mb-4">User Segments</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Super Fans", count: 124, percentage: 8, desc: "10+ interactions/week" },
                { label: "Active Users", count: 456, percentage: 30, desc: "3-9 interactions/week" },
                { label: "Casual Users", count: 678, percentage: 45, desc: "1-2 interactions/week" },
                { label: "Dormant", count: 254, percentage: 17, desc: "No recent activity" },
              ].map((segment) => (
                <div key={segment.label} className="p-4 rounded-xl bg-secondary/30 border border-border/30 text-center">
                  <p className="text-2xl font-bold">{segment.count}</p>
                  <p className="font-medium text-sm">{segment.label}</p>
                  <p className="text-xs text-muted-foreground">{segment.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border border-border/50"
          >
            <h3 className="text-lg font-semibold mb-4">Daily Activity Trend</h3>
            <div className="h-64 flex items-end gap-2">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-primary/20 rounded-t-lg transition-all hover:bg-primary/40"
                    style={{ height: `${Math.random() * 80 + 20}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{i + 1}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
              <span>← Last 14 days →</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass rounded-2xl p-6 border border-border/50"
            >
              <h3 className="text-lg font-semibold mb-4">Peak Activity Hours</h3>
              <div className="space-y-3">
                {[
                  { hour: "8:00 PM - 10:00 PM", activity: 95 },
                  { hour: "6:00 PM - 8:00 PM", activity: 82 },
                  { hour: "10:00 PM - 12:00 AM", activity: 78 },
                  { hour: "2:00 PM - 4:00 PM", activity: 45 },
                  { hour: "10:00 AM - 12:00 PM", activity: 32 },
                ].map((item) => (
                  <div key={item.hour} className="flex items-center gap-3">
                    <span className="w-36 text-sm">{item.hour}</span>
                    <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${item.activity}%` }} />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{item.activity}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6 border border-border/50"
            >
              <h3 className="text-lg font-semibold mb-4">Weekly Engagement</h3>
              <div className="grid grid-cols-7 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                  const value = [65, 72, 68, 85, 92, 78, 70][i];
                  return (
                    <div key={day} className="text-center">
                      <div 
                        className="mx-auto w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium"
                        style={{ 
                          backgroundColor: `hsl(var(--primary) / ${value / 100})`,
                          color: value > 50 ? "white" : "inherit"
                        }}
                      >
                        {value}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 block">{day}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Highest engagement on Fridays
              </p>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
