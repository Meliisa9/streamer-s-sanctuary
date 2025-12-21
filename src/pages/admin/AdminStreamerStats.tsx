import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, Plus, Edit2, Trash2, Loader2, Calendar, 
  DollarSign, Trophy, Clock, Save, TrendingUp, TrendingDown,
  Target, Zap, ChevronDown, ChevronUp, RefreshCw,
  Gamepad2, Award, RotateCcw, Sparkles, Timer, Coins,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
}

interface YearlySummary {
  totalProfit: number;
  totalWagered: number;
  totalSessions: number;
  totalHours: number;
  biggestWin: number;
  biggestWinGame: string;
  biggestMultiplier: number;
  avgSessionProfit: number;
  winRate: number;
  profitableDays: number;
  losingDays: number;
}

export default function AdminStreamerStats() {
  const [stats, setStats] = useState<StreamerStat[]>([]);
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [selectedStreamer, setSelectedStreamer] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStat, setEditingStat] = useState<StreamerStat | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isResetting, setIsResetting] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    starting_balance: "",
    ending_balance: "",
    total_wagered: "",
    biggest_win: "",
    biggest_win_game: "",
    biggest_multiplier: "",
    games_played: "",
    session_duration_hours: "",
    session_duration_minutes: "",
    notes: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStreamers();
  }, []);

  useEffect(() => {
    if (selectedStreamer) {
      fetchStats();
    }
  }, [selectedStreamer]);

  const fetchStreamers = async () => {
    const { data } = await supabase
      .from("streamers")
      .select("id, name, image_url")
      .eq("is_active", true)
      .order("is_main_streamer", { ascending: false });

    if (data) {
      setStreamers(data);
      if (data.length > 0) {
        setSelectedStreamer(data[0].id);
      }
    }
    setIsLoading(false);
  };

  const fetchStats = async () => {
    const { data } = await supabase
      .from("streamer_stats")
      .select("*")
      .eq("streamer_id", selectedStreamer)
      .order("date", { ascending: false });

    if (data) {
      setStats(data);
    }
  };

  const resetAllStats = async () => {
    if (!selectedStreamer) return;
    setIsResetting(true);

    const { error } = await supabase
      .from("streamer_stats")
      .delete()
      .eq("streamer_id", selectedStreamer);

    setIsResetting(false);

    if (error) {
      toast({ title: "Error resetting stats", variant: "destructive" });
      return;
    }

    toast({ title: "All stats have been reset" });
    fetchStats();
  };

  const yearlySummary = useMemo((): YearlySummary => {
    if (stats.length === 0) {
      return {
        totalProfit: 0,
        totalWagered: 0,
        totalSessions: 0,
        totalHours: 0,
        biggestWin: 0,
        biggestWinGame: "",
        biggestMultiplier: 0,
        avgSessionProfit: 0,
        winRate: 0,
        profitableDays: 0,
        losingDays: 0,
      };
    }

    const profitableDays = stats.filter(s => (s.profit_loss || 0) > 0).length;
    const losingDays = stats.filter(s => (s.profit_loss || 0) < 0).length;
    const totalProfit = stats.reduce((sum, s) => sum + (s.profit_loss || 0), 0);
    const totalWagered = stats.reduce((sum, s) => sum + (s.total_wagered || 0), 0);
    const totalMinutes = stats.reduce((sum, s) => sum + (s.session_duration_minutes || 0), 0);
    
    const biggestWinStat = stats.reduce((max, s) => 
      (s.biggest_win || 0) > (max.biggest_win || 0) ? s : max, 
      stats[0]
    );

    const biggestMultiplierStat = stats.reduce((max, s) => 
      (s.biggest_multiplier || 0) > (max.biggest_multiplier || 0) ? s : max, 
      stats[0]
    );

    return {
      totalProfit,
      totalWagered,
      totalSessions: stats.length,
      totalHours: Math.round(totalMinutes / 60),
      biggestWin: biggestWinStat.biggest_win || 0,
      biggestWinGame: biggestWinStat.biggest_win_game || "",
      biggestMultiplier: biggestMultiplierStat.biggest_multiplier || 0,
      avgSessionProfit: stats.length > 0 ? totalProfit / stats.length : 0,
      winRate: stats.length > 0 ? (profitableDays / stats.length) * 100 : 0,
      profitableDays,
      losingDays,
    };
  }, [stats]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { profit: number; sessions: number; wagered: number }> = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    monthNames.forEach((name) => {
      months[name] = { profit: 0, sessions: 0, wagered: 0 };
    });

    stats.forEach(stat => {
      const month = new Date(stat.date).getMonth();
      const monthName = monthNames[month];
      months[monthName].profit += stat.profit_loss || 0;
      months[monthName].sessions += 1;
      months[monthName].wagered += stat.total_wagered || 0;
    });

    return Object.entries(months).map(([month, data]) => ({
      month,
      ...data,
    }));
  }, [stats]);

  const handleSubmit = async () => {
    if (!selectedStreamer) {
      toast({ title: "Please select a streamer", variant: "destructive" });
      return;
    }

    const startingBalance = formData.starting_balance ? parseFloat(formData.starting_balance) : null;
    const endingBalance = formData.ending_balance ? parseFloat(formData.ending_balance) : null;
    const profitLoss = startingBalance !== null && endingBalance !== null 
      ? endingBalance - startingBalance 
      : null;

    const hours = parseInt(formData.session_duration_hours) || 0;
    const minutes = parseInt(formData.session_duration_minutes) || 0;
    const totalMinutes = (hours * 60) + minutes;

    const statData = {
      streamer_id: selectedStreamer,
      date: formData.date,
      starting_balance: startingBalance,
      ending_balance: endingBalance,
      profit_loss: profitLoss,
      total_wagered: formData.total_wagered ? parseFloat(formData.total_wagered) : null,
      biggest_win: formData.biggest_win ? parseFloat(formData.biggest_win) : null,
      biggest_win_game: formData.biggest_win_game || null,
      biggest_multiplier: formData.biggest_multiplier ? parseFloat(formData.biggest_multiplier) : null,
      games_played: formData.games_played ? formData.games_played.split(",").map((g) => g.trim()) : null,
      session_duration_minutes: totalMinutes > 0 ? totalMinutes : null,
      notes: formData.notes || null,
    };

    if (editingStat) {
      const { error } = await supabase
        .from("streamer_stats")
        .update(statData)
        .eq("id", editingStat.id);

      if (error) {
        toast({ title: "Error updating stats", variant: "destructive" });
        return;
      }
      toast({ title: "Stats updated" });
    } else {
      const { error } = await supabase.from("streamer_stats").insert(statData);

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Stats for this date already exist", variant: "destructive" });
        } else {
          toast({ title: "Error saving stats", variant: "destructive" });
        }
        return;
      }
      toast({ title: "Stats saved" });
    }

    resetForm();
    fetchStats();
  };

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingStat(null);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      starting_balance: "",
      ending_balance: "",
      total_wagered: "",
      biggest_win: "",
      biggest_win_game: "",
      biggest_multiplier: "",
      games_played: "",
      session_duration_hours: "",
      session_duration_minutes: "",
      notes: "",
    });
  };

  const openEditDialog = (stat: StreamerStat) => {
    const hours = stat.session_duration_minutes ? Math.floor(stat.session_duration_minutes / 60) : 0;
    const mins = stat.session_duration_minutes ? stat.session_duration_minutes % 60 : 0;
    
    setEditingStat(stat);
    setFormData({
      date: stat.date,
      starting_balance: stat.starting_balance?.toString() || "",
      ending_balance: stat.ending_balance?.toString() || "",
      total_wagered: stat.total_wagered?.toString() || "",
      biggest_win: stat.biggest_win?.toString() || "",
      biggest_win_game: stat.biggest_win_game || "",
      biggest_multiplier: stat.biggest_multiplier?.toString() || "",
      games_played: stat.games_played?.join(", ") || "",
      session_duration_hours: hours.toString(),
      session_duration_minutes: mins.toString(),
      notes: stat.notes || "",
    });
    setIsDialogOpen(true);
  };

  const deleteStat = async (id: string) => {
    const { error } = await supabase.from("streamer_stats").delete().eq("id", id);
    if (!error) {
      toast({ title: "Stats deleted" });
      fetchStats();
    }
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatProfitLoss = (amount: number | null) => {
    if (amount === null) return "-";
    const prefix = amount >= 0 ? "+" : "";
    return prefix + formatCurrency(amount);
  };

  const calculatedProfit = useMemo(() => {
    const start = parseFloat(formData.starting_balance);
    const end = parseFloat(formData.ending_balance);
    if (!isNaN(start) && !isNaN(end)) {
      return end - start;
    }
    return null;
  }, [formData.starting_balance, formData.ending_balance]);

  const selectedStreamerData = streamers.find(s => s.id === selectedStreamer);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <AdminPageHeader
          title="Streamer Statistics"
          description="Track performance and session data"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedStreamer} onValueChange={setSelectedStreamer}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select streamer" />
            </SelectTrigger>
            <SelectContent>
              {streamers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    {s.image_url && (
                      <img src={s.image_url} alt={s.name} className="w-5 h-5 rounded-full" />
                    )}
                    {s.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchStats}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          {/* Reset Stats Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                <RotateCcw className="w-4 h-4" />
                Reset Stats
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Reset All Statistics?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all recorded statistics for {selectedStreamerData?.name}. 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={resetAllStats}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isResetting}
                >
                  {isResetting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Reset All Stats
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="glow"
                className="gap-2"
                onClick={() => {
                  setEditingStat(null);
                  setFormData({
                    ...formData,
                    date: new Date().toISOString().split("T")[0],
                  });
                }}
              >
                <Plus className="w-4 h-4" />
                Add Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
              <div className="relative bg-gradient-to-br from-primary/10 via-background to-purple-500/10">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-border/50">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30">
                        {editingStat ? <Edit2 className="w-5 h-5 text-primary" /> : <Sparkles className="w-5 h-5 text-primary" />}
                      </div>
                      {editingStat ? "Edit Session" : "New Session"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingStat ? "Update the session statistics" : "Record a new streaming session with all the details"}
                    </DialogDescription>
                  </DialogHeader>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-6 py-6 space-y-6">
                  {/* Date & Duration Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider">
                      <Calendar className="w-4 h-4" />
                      Session Info
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Date</Label>
                        <Input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="h-12 text-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground flex items-center gap-2">
                          <Timer className="w-4 h-4" />
                          Duration
                        </Label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              min="0"
                              max="24"
                              value={formData.session_duration_hours}
                              onChange={(e) => setFormData({ ...formData, session_duration_hours: e.target.value })}
                              placeholder="0"
                              className="h-12 text-lg pr-10"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">hrs</span>
                          </div>
                          <span className="text-muted-foreground">:</span>
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              min="0"
                              max="59"
                              value={formData.session_duration_minutes}
                              onChange={(e) => setFormData({ ...formData, session_duration_minutes: e.target.value })}
                              placeholder="0"
                              className="h-12 text-lg pr-12"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Balance Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-500 uppercase tracking-wider">
                      <Coins className="w-4 h-4" />
                      Balance
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Starting Balance</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="number"
                            value={formData.starting_balance}
                            onChange={(e) => setFormData({ ...formData, starting_balance: e.target.value })}
                            placeholder="10,000"
                            className="h-12 text-lg pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Ending Balance</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="number"
                            value={formData.ending_balance}
                            onChange={(e) => setFormData({ ...formData, ending_balance: e.target.value })}
                            placeholder="12,000"
                            className="h-12 text-lg pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Total Wagered</Label>
                        <div className="relative">
                          <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="number"
                            value={formData.total_wagered}
                            onChange={(e) => setFormData({ ...formData, total_wagered: e.target.value })}
                            placeholder="50,000"
                            className="h-12 text-lg pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Auto-calculated Profit/Loss */}
                    {calculatedProfit !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl border-2 ${
                          calculatedProfit >= 0
                            ? "bg-green-500/10 border-green-500/30"
                            : "bg-red-500/10 border-red-500/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {calculatedProfit >= 0 ? (
                              <TrendingUp className="w-5 h-5 text-green-500" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-red-500" />
                            )}
                            <span className="text-sm font-medium">Session Result</span>
                          </div>
                          <span className={`text-2xl font-bold ${
                            calculatedProfit >= 0 ? "text-green-500" : "text-red-500"
                          }`}>
                            {formatProfitLoss(calculatedProfit)}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Biggest Win Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-yellow-500 uppercase tracking-wider">
                      <Trophy className="w-4 h-4" />
                      Highlights
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Biggest Win</Label>
                        <div className="relative">
                          <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500" />
                          <Input
                            type="number"
                            value={formData.biggest_win}
                            onChange={(e) => setFormData({ ...formData, biggest_win: e.target.value })}
                            placeholder="5,000"
                            className="h-12 text-lg pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Game Name</Label>
                        <div className="relative">
                          <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            value={formData.biggest_win_game}
                            onChange={(e) => setFormData({ ...formData, biggest_win_game: e.target.value })}
                            placeholder="Sweet Bonanza"
                            className="h-12 text-lg pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Multiplier</Label>
                        <div className="relative">
                          <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                          <Input
                            type="number"
                            value={formData.biggest_multiplier}
                            onChange={(e) => setFormData({ ...formData, biggest_multiplier: e.target.value })}
                            placeholder="500"
                            className="h-12 text-lg pl-10"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">x</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Games & Notes Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-500 uppercase tracking-wider">
                      <Gamepad2 className="w-4 h-4" />
                      Details
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Games Played</Label>
                        <Input
                          value={formData.games_played}
                          onChange={(e) => setFormData({ ...formData, games_played: e.target.value })}
                          placeholder="Sweet Bonanza, Gates of Olympus, Big Bass Bonanza..."
                          className="h-12"
                        />
                        <p className="text-xs text-muted-foreground">Separate games with commas</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Session Notes</Label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Notable moments, jackpots, memorable wins, viewer highlights..."
                          rows={3}
                          className="resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border/50 bg-background/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="flex-1 gap-2"
                      variant="glow"
                    >
                      <Save className="w-4 h-4" />
                      {editingStat ? "Update Session" : "Save Session"}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {selectedStreamerData && (
              <Card className="glass border-border/50 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    {selectedStreamerData.image_url ? (
                      <img 
                        src={selectedStreamerData.image_url} 
                        alt={selectedStreamerData.name}
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/50"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center">
                        <BarChart3 className="w-10 h-10 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold">{selectedStreamerData.name}</h2>
                      <p className="text-muted-foreground">All-Time Statistics</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="w-3 h-3" />
                          {yearlySummary.totalSessions} Sessions
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Clock className="w-3 h-3" />
                          {yearlySummary.totalHours}h Streamed
                        </Badge>
                      </div>
                    </div>
                    <div className={`text-right p-4 rounded-xl ${
                      yearlySummary.totalProfit >= 0 
                        ? "bg-green-500/10 border border-green-500/30" 
                        : "bg-red-500/10 border border-red-500/30"
                    }`}>
                      <p className="text-sm text-muted-foreground">Total Result</p>
                      <p className={`text-3xl font-bold ${
                        yearlySummary.totalProfit >= 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        {formatProfitLoss(yearlySummary.totalProfit)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="glass border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                      </div>
                      <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">Best Win</Badge>
                    </div>
                    <div className="mt-4">
                      <p className="text-3xl font-bold text-yellow-500">{formatCurrency(yearlySummary.biggestWin)}</p>
                      {yearlySummary.biggestWinGame && <p className="text-sm text-muted-foreground mt-1">{yearlySummary.biggestWinGame}</p>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="glass border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-purple-500" />
                      </div>
                      <Badge variant="outline" className="text-purple-500 border-purple-500/30">Multiplier</Badge>
                    </div>
                    <div className="mt-4">
                      <p className="text-3xl font-bold text-purple-500">{yearlySummary.biggestMultiplier.toLocaleString()}x</p>
                      <p className="text-sm text-muted-foreground mt-1">Highest multiplier hit</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="glass border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Target className="w-6 h-6 text-blue-500" />
                      </div>
                      <Badge variant="outline" className="text-blue-500 border-blue-500/30">Wagered</Badge>
                    </div>
                    <div className="mt-4">
                      <p className="text-3xl font-bold text-blue-500">{formatCurrency(yearlySummary.totalWagered)}</p>
                      <p className="text-sm text-muted-foreground mt-1">Total amount wagered</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="glass border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <Award className="w-6 h-6 text-green-500" />
                      </div>
                      <Badge variant="outline" className="text-green-500 border-green-500/30">Win Rate</Badge>
                    </div>
                    <div className="mt-4">
                      <p className="text-3xl font-bold text-green-500">{yearlySummary.winRate.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground mt-1">{yearlySummary.profitableDays}W / {yearlySummary.losingDays}L</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Win Rate Progress */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Win/Loss Distribution</CardTitle>
                <CardDescription>Profitable vs losing sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      Profitable Days: {yearlySummary.profitableDays}
                    </span>
                    <span className="flex items-center gap-2">
                      Losing Days: {yearlySummary.losingDays}
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    </span>
                  </div>
                  <div className="h-4 rounded-full bg-muted overflow-hidden flex">
                    <div className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500" style={{ width: `${yearlySummary.winRate}%` }} />
                    <div className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500" style={{ width: `${100 - yearlySummary.winRate}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            {stats.length === 0 ? (
              <Card className="glass border-border/50">
                <CardContent className="p-12 text-center">
                  <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold">No Stats Recorded</h3>
                  <p className="text-muted-foreground mt-2">Start tracking session data by adding your first session</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass border-border/50">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Profit/Loss</TableHead>
                        <TableHead>Biggest Win</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.map((stat) => (
                        <>
                          <TableRow key={stat.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRowExpand(stat.id)}>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                {expandedRows.has(stat.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">
                              {new Date(stat.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            </TableCell>
                            <TableCell>{stat.starting_balance ? formatCurrency(stat.starting_balance) : "-"}</TableCell>
                            <TableCell>{stat.ending_balance ? formatCurrency(stat.ending_balance) : "-"}</TableCell>
                            <TableCell>
                              <span className={`font-semibold ${stat.profit_loss !== null ? stat.profit_loss >= 0 ? "text-green-400" : "text-red-400" : ""}`}>
                                {formatProfitLoss(stat.profit_loss)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {stat.biggest_win ? (
                                <div>
                                  <span className="text-yellow-400 font-medium">{formatCurrency(stat.biggest_win)}</span>
                                  {stat.biggest_multiplier && <Badge variant="outline" className="ml-2 text-xs">{stat.biggest_multiplier}x</Badge>}
                                </div>
                              ) : "-"}
                            </TableCell>
                            <TableCell>
                              {stat.session_duration_minutes ? `${Math.floor(stat.session_duration_minutes / 60)}h ${stat.session_duration_minutes % 60}m` : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditDialog(stat)}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteStat(stat.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <AnimatePresence>
                            {expandedRows.has(stat.id) && (
                              <TableRow key={`${stat.id}-expanded`}>
                                <TableCell colSpan={8} className="p-0">
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-4 bg-muted/30 space-y-3">
                                      {stat.biggest_win_game && (
                                        <div>
                                          <span className="text-xs text-muted-foreground">Biggest Win Game:</span>
                                          <p className="font-medium">{stat.biggest_win_game}</p>
                                        </div>
                                      )}
                                      {stat.total_wagered && (
                                        <div>
                                          <span className="text-xs text-muted-foreground">Total Wagered:</span>
                                          <p className="font-medium">{formatCurrency(stat.total_wagered)}</p>
                                        </div>
                                      )}
                                      {stat.games_played && stat.games_played.length > 0 && (
                                        <div>
                                          <span className="text-xs text-muted-foreground">Games Played:</span>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {stat.games_played.map((game, i) => (
                                              <Badge key={i} variant="secondary" className="text-xs">{game}</Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {stat.notes && (
                                        <div>
                                          <span className="text-xs text-muted-foreground">Notes:</span>
                                          <p className="text-sm mt-1">{stat.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                </TableCell>
                              </TableRow>
                            )}
                          </AnimatePresence>
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Monthly Tab */}
          <TabsContent value="monthly">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {monthlyData.map((month, index) => (
                <motion.div
                  key={month.month}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`glass border-border/50 ${month.sessions === 0 ? "opacity-50" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{month.month}</h3>
                        <Badge variant="outline">{month.sessions} sessions</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Profit/Loss</span>
                          <span className={`font-bold ${month.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {formatProfitLoss(month.profit)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Wagered</span>
                          <span className="font-medium">{formatCurrency(month.wagered)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
