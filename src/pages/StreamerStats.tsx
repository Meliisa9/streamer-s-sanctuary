import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, DollarSign, Trophy, Clock, Gamepad2, 
  Calendar, BarChart3, Target, Flame
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface StreamerStat {
  id: string;
  streamer_id: string;
  date: string;
  starting_balance: number | null;
  ending_balance: number | null;
  profit_loss: number | null;
  total_wagered: number | null;
  biggest_win: number | null;
  biggest_win_game: string | null;
  biggest_multiplier: number | null;
  games_played: string[] | null;
  session_duration_minutes: number | null;
  notes: string | null;
}

interface Streamer {
  id: string;
  name: string;
  image_url: string | null;
  is_main_streamer: boolean;
}

export default function StreamerStats() {
  const [stats, setStats] = useState<StreamerStat[]>([]);
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [selectedStreamer, setSelectedStreamer] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStreamers();
  }, []);

  useEffect(() => {
    if (selectedStreamer) {
      fetchStats();
    }
  }, [selectedStreamer, timeRange]);

  const fetchStreamers = async () => {
    const { data } = await supabase
      .from("streamers")
      .select("id, name, image_url, is_main_streamer")
      .eq("is_active", true)
      .order("is_main_streamer", { ascending: false });

    if (data) {
      setStreamers(data);
      // Auto-select main streamer
      const mainStreamer = data.find((s) => s.is_main_streamer);
      if (mainStreamer) {
        setSelectedStreamer(mainStreamer.id);
      } else if (data.length > 0) {
        setSelectedStreamer(data[0].id);
      }
    }
    setIsLoading(false);
  };

  const fetchStats = async () => {
    if (!selectedStreamer) return;

    let query = supabase
      .from("streamer_stats")
      .select("*")
      .eq("streamer_id", selectedStreamer)
      .order("date", { ascending: false });

    // Apply time range filter
    if (timeRange !== "all") {
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      query = query.gte("date", startDate.toISOString().split("T")[0]);
    }

    const { data } = await query;

    if (data) {
      setStats(data);
    }
  };

  const calculateTotals = () => {
    const totalProfit = stats.reduce((sum, s) => sum + (s.profit_loss || 0), 0);
    const totalWagered = stats.reduce((sum, s) => sum + (s.total_wagered || 0), 0);
    const biggestWin = Math.max(...stats.map((s) => s.biggest_win || 0));
    const biggestMultiplier = Math.max(...stats.map((s) => s.biggest_multiplier || 0));
    const totalSessions = stats.length;
    const totalHours = Math.round(stats.reduce((sum, s) => sum + (s.session_duration_minutes || 0), 0) / 60);
    const winningDays = stats.filter((s) => (s.profit_loss || 0) > 0).length;
    const winRate = totalSessions > 0 ? Math.round((winningDays / totalSessions) * 100) : 0;

    // Get favorite games
    const gameCount: Record<string, number> = {};
    stats.forEach((s) => {
      s.games_played?.forEach((game) => {
        gameCount[game] = (gameCount[game] || 0) + 1;
      });
    });
    const favoriteGames = Object.entries(gameCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([game]) => game);

    return {
      totalProfit,
      totalWagered,
      biggestWin,
      biggestMultiplier,
      totalSessions,
      totalHours,
      winRate,
      favoriteGames,
    };
  };

  const totals = calculateTotals();
  const selectedStreamerData = streamers.find((s) => s.id === selectedStreamer);

  const chartData = [...stats]
    .reverse()
    .map((s) => ({
      date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      profit: s.profit_loss || 0,
      wagered: s.total_wagered || 0,
    }));

  const formatCurrency = (amount: number) => {
    const prefix = amount >= 0 ? "+" : "";
    return prefix + new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              {selectedStreamerData?.image_url && (
                <img
                  src={selectedStreamerData.image_url}
                  alt={selectedStreamerData.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                />
              )}
              <div>
                <h1 className="text-4xl font-bold">Casino Stats</h1>
                <p className="text-muted-foreground mt-1">
                  Track win/loss and performance over time
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={selectedStreamer || ""} onValueChange={setSelectedStreamer}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select streamer" />
                </SelectTrigger>
                <SelectContent>
                  {streamers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.is_main_streamer && "(Main)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="90d">90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="glass border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Profit/Loss</p>
                    <p className={`text-3xl font-bold ${totals.totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {formatCurrency(totals.totalProfit)}
                    </p>
                  </div>
                  {totals.totalProfit >= 0 ? (
                    <TrendingUp className="w-10 h-10 text-green-400/50" />
                  ) : (
                    <TrendingDown className="w-10 h-10 text-red-400/50" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Wagered</p>
                    <p className="text-3xl font-bold">{formatCurrency(totals.totalWagered).replace("+", "")}</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-primary/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Biggest Win</p>
                    <p className="text-3xl font-bold text-yellow-400">{formatCurrency(totals.biggestWin).replace("+", "")}</p>
                  </div>
                  <Trophy className="w-10 h-10 text-yellow-400/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="text-3xl font-bold">{totals.winRate}%</p>
                  </div>
                  <Target className="w-10 h-10 text-blue-400/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Profit/Loss Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [formatCurrency(value), "Profit/Loss"]}
                      />
                      <Bar
                        dataKey="profit"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Wagered Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [formatCurrency(value).replace("+", ""), "Wagered"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="wagered"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gamepad2 className="w-5 h-5" />
                  Favorite Games
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {totals.favoriteGames.length > 0 ? (
                    totals.favoriteGames.map((game, i) => (
                      <div key={game} className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {i + 1}
                        </Badge>
                        <span>{game}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5" />
                  Session Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Sessions</span>
                  <span className="font-bold">{totals.totalSessions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Hours</span>
                  <span className="font-bold">{totals.totalHours}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Avg Session</span>
                  <span className="font-bold">
                    {totals.totalSessions > 0
                      ? Math.round(totals.totalHours / totals.totalSessions)
                      : 0}h
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Flame className="w-5 h-5" />
                  Records
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Biggest Multiplier</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400">
                    {totals.biggestMultiplier > 0 ? `${totals.biggestMultiplier.toLocaleString()}x` : "N/A"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Biggest Win</span>
                  <span className="font-bold text-green-400">
                    {formatCurrency(totals.biggestWin).replace("+", "")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
    </div>
  );
}
