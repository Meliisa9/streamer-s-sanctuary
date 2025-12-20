import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Save, Loader2, BarChart3, Trophy, TrendingUp, Target, Gift, Zap, Star, 
  Users, Clock, Award, Sparkles, RefreshCw, Eye, Calculator, Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";

interface StatSettings {
  stat_community_value: string;
  stat_community_label: string;
  stat_community_icon: string;
  stat_wins_value: string;
  stat_wins_label: string;
  stat_wins_icon: string;
  stat_giveaways_value: string;
  stat_giveaways_label: string;
  stat_giveaways_icon: string;
}

interface GTWPointsSettings {
  gtw_points_1st: number;
  gtw_points_2nd: number;
  gtw_points_3rd: number;
  gtw_points_4th_10th: number;
}

interface BonusHuntPointsSettings {
  bh_points_1st: number;
  bh_points_2nd: number;
  bh_points_3rd: number;
  bh_points_4th_10th: number;
}

interface DailyRewardSettings {
  daily_base_points: number;
  daily_streak_bonus: number;
  daily_max_streak: number;
}

interface HowToEarnBoxConfig {
  box1_icon: string;
  box1_title: string;
  box1_text: string;
  box2_icon: string;
  box2_title: string;
  box2_text: string;
  box3_icon: string;
  box3_title: string;
  box3_text: string;
}

const defaultStatSettings: StatSettings = {
  stat_community_value: "150K+",
  stat_community_label: "Community Members",
  stat_community_icon: "Users",
  stat_wins_value: "$2.5M",
  stat_wins_label: "Total Wins Streamed",
  stat_wins_icon: "Trophy",
  stat_giveaways_value: "500+",
  stat_giveaways_label: "Giveaways Hosted",
  stat_giveaways_icon: "Gift",
};

const defaultGTWSettings: GTWPointsSettings = {
  gtw_points_1st: 300,
  gtw_points_2nd: 200,
  gtw_points_3rd: 100,
  gtw_points_4th_10th: 25,
};

const defaultBHSettings: BonusHuntPointsSettings = {
  bh_points_1st: 1000,
  bh_points_2nd: 500,
  bh_points_3rd: 250,
  bh_points_4th_10th: 100,
};

const defaultDailyRewardSettings: DailyRewardSettings = {
  daily_base_points: 10,
  daily_streak_bonus: 5,
  daily_max_streak: 7,
};

const defaultHowToEarnConfig: HowToEarnBoxConfig = {
  box1_icon: "Target",
  box1_title: "Bonus Hunts",
  box1_text: "Participate in bonus hunts and guess the total payout to earn points!",
  box2_icon: "Gift",
  box2_title: "Giveaways",
  box2_text: "Enter giveaways for a chance to win prizes and earn participation points!",
  box3_icon: "Zap",
  box3_title: "Daily Activity",
  box3_text: "Sign in daily to maintain your streak and earn bonus points each day!",
};

const iconOptions = [
  { value: "Target", label: "Target", icon: Target },
  { value: "Gift", label: "Gift", icon: Gift },
  { value: "Zap", label: "Zap", icon: Zap },
  { value: "Trophy", label: "Trophy", icon: Trophy },
  { value: "Star", label: "Star", icon: Star },
  { value: "TrendingUp", label: "Trending Up", icon: TrendingUp },
  { value: "MessageSquare", label: "Message", icon: null },
  { value: "BarChart3", label: "Chart", icon: BarChart3 },
  { value: "Users", label: "Users", icon: Users },
  { value: "Clock", label: "Clock", icon: Clock },
  { value: "Award", label: "Award", icon: Award },
  { value: "Sparkles", label: "Sparkles", icon: Sparkles },
];

export default function AdminStatistics() {
  const [statSettings, setStatSettings] = useState<StatSettings>(defaultStatSettings);
  const [gtwSettings, setGtwSettings] = useState<GTWPointsSettings>(defaultGTWSettings);
  const [bhSettings, setBhSettings] = useState<BonusHuntPointsSettings>(defaultBHSettings);
  const [dailyRewardSettings, setDailyRewardSettings] = useState<DailyRewardSettings>(defaultDailyRewardSettings);
  const [howToEarnConfig, setHowToEarnConfig] = useState<HowToEarnBoxConfig>(defaultHowToEarnConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("homepage");
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  // Fetch live stats
  const { data: liveStats } = useQuery({
    queryKey: ["admin-live-stats"],
    queryFn: async () => {
      const [users, giveaways, videos, articles] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("giveaways").select("*", { count: "exact", head: true }),
        supabase.from("videos").select("*", { count: "exact", head: true }),
        supabase.from("news_articles").select("*", { count: "exact", head: true }),
      ]);
      return {
        users: users.count || 0,
        giveaways: giveaways.count || 0,
        videos: videos.count || 0,
        articles: articles.count || 0,
      };
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;

      const loadedStatSettings: StatSettings = { ...defaultStatSettings };
      const loadedGTWSettings: GTWPointsSettings = { ...defaultGTWSettings };
      const loadedBHSettings: BonusHuntPointsSettings = { ...defaultBHSettings };
      const loadedDailyRewardSettings: DailyRewardSettings = { ...defaultDailyRewardSettings };
      let loadedHowToEarn: HowToEarnBoxConfig = { ...defaultHowToEarnConfig };
      
      data?.forEach((row) => {
        if (row.key === "leaderboard_how_to_earn_boxes") {
          if (row.value && typeof row.value === 'object' && !Array.isArray(row.value)) {
            loadedHowToEarn = { ...defaultHowToEarnConfig, ...(row.value as unknown as HowToEarnBoxConfig) };
          }
          return;
        }

        // Stat settings
        const statKey = row.key as keyof StatSettings;
        if (statKey in loadedStatSettings) {
          (loadedStatSettings as Record<string, any>)[statKey] = row.value ?? defaultStatSettings[statKey];
        }

        // GTW settings
        const gtwKey = row.key as keyof GTWPointsSettings;
        if (gtwKey in loadedGTWSettings) {
          (loadedGTWSettings as Record<string, any>)[gtwKey] = row.value ?? defaultGTWSettings[gtwKey];
        }

        // BH settings
        const bhKey = row.key as keyof BonusHuntPointsSettings;
        if (bhKey in loadedBHSettings) {
          (loadedBHSettings as Record<string, any>)[bhKey] = row.value ?? defaultBHSettings[bhKey];
        }

        // Daily reward settings
        const dailyKey = row.key as keyof DailyRewardSettings;
        if (dailyKey in loadedDailyRewardSettings) {
          (loadedDailyRewardSettings as Record<string, any>)[dailyKey] = row.value ?? defaultDailyRewardSettings[dailyKey];
        }
      });

      setStatSettings(loadedStatSettings);
      setGtwSettings(loadedGTWSettings);
      setBhSettings(loadedBHSettings);
      setDailyRewardSettings(loadedDailyRewardSettings);
      setHowToEarnConfig(loadedHowToEarn);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!isAdmin) {
      toast({ title: "Only admins can change settings", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      // Save all settings
      const allSettings = {
        ...statSettings,
        ...gtwSettings,
        ...bhSettings,
        ...dailyRewardSettings,
      };

      for (const [key, value] of Object.entries(allSettings)) {
        const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }

      // Save How to Earn boxes config
      const { error: howToEarnError } = await supabase
        .from("site_settings")
        .upsert({ key: "leaderboard_how_to_earn_boxes", value: howToEarnConfig as any }, { onConflict: "key" });
      if (howToEarnError) throw howToEarnError;

      toast({ title: "Statistics settings saved" });
    } catch (error: any) {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setStatSettings(defaultStatSettings);
    setGtwSettings(defaultGTWSettings);
    setBhSettings(defaultBHSettings);
    setDailyRewardSettings(defaultDailyRewardSettings);
    setHowToEarnConfig(defaultHowToEarnConfig);
    toast({ title: "Reset to defaults", description: "Click Save to apply changes" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminSettingsNav />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Statistics & Points</h2>
          <p className="text-muted-foreground">Configure homepage stats, points system, and leaderboard</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
          <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Live Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{liveStats?.users.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Registered Users</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Gift className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{liveStats?.giveaways}</p>
              <p className="text-xs text-muted-foreground">Total Giveaways</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Eye className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{liveStats?.videos}</p>
              <p className="text-xs text-muted-foreground">Videos</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <BarChart3 className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{liveStats?.articles}</p>
              <p className="text-xs text-muted-foreground">Articles</p>
            </div>
          </div>
        </motion.div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="homepage" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Homepage
          </TabsTrigger>
          <TabsTrigger value="points" className="gap-2">
            <Trophy className="w-4 h-4" />
            Points
          </TabsTrigger>
          <TabsTrigger value="daily" className="gap-2">
            <Zap className="w-4 h-4" />
            Daily Rewards
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* Homepage Statistics Tab */}
        <TabsContent value="homepage" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-primary/10">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Homepage Statistics</h3>
                <p className="text-sm text-muted-foreground">Configure the 3 stat boxes shown on your homepage</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Community Stat */}
              <div className="space-y-4 p-5 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-blue-400">Stat 1</h4>
                  <Badge variant="outline" className="border-blue-500/30">Community</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Icon</Label>
                  <Select
                    value={statSettings.stat_community_icon}
                    onValueChange={(v) => setStatSettings({ ...statSettings, stat_community_icon: v })}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Value</Label>
                  <Input
                    value={statSettings.stat_community_value}
                    onChange={(e) => setStatSettings({ ...statSettings, stat_community_value: e.target.value })}
                    placeholder="150K+"
                    className="mt-1 text-xl font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Label</Label>
                  <Input
                    value={statSettings.stat_community_label}
                    onChange={(e) => setStatSettings({ ...statSettings, stat_community_label: e.target.value })}
                    placeholder="Community Members"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Wins Stat */}
              <div className="space-y-4 p-5 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-xl border border-yellow-500/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-yellow-400">Stat 2</h4>
                  <Badge variant="outline" className="border-yellow-500/30">Wins</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Icon</Label>
                  <Select
                    value={statSettings.stat_wins_icon}
                    onValueChange={(v) => setStatSettings({ ...statSettings, stat_wins_icon: v })}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Value</Label>
                  <Input
                    value={statSettings.stat_wins_value}
                    onChange={(e) => setStatSettings({ ...statSettings, stat_wins_value: e.target.value })}
                    placeholder="$2.5M"
                    className="mt-1 text-xl font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Label</Label>
                  <Input
                    value={statSettings.stat_wins_label}
                    onChange={(e) => setStatSettings({ ...statSettings, stat_wins_label: e.target.value })}
                    placeholder="Total Wins Streamed"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Giveaways Stat */}
              <div className="space-y-4 p-5 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-purple-400">Stat 3</h4>
                  <Badge variant="outline" className="border-purple-500/30">Giveaways</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Icon</Label>
                  <Select
                    value={statSettings.stat_giveaways_icon}
                    onValueChange={(v) => setStatSettings({ ...statSettings, stat_giveaways_icon: v })}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Value</Label>
                  <Input
                    value={statSettings.stat_giveaways_value}
                    onChange={(e) => setStatSettings({ ...statSettings, stat_giveaways_value: e.target.value })}
                    placeholder="500+"
                    className="mt-1 text-xl font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Label</Label>
                  <Input
                    value={statSettings.stat_giveaways_label}
                    onChange={(e) => setStatSettings({ ...statSettings, stat_giveaways_label: e.target.value })}
                    placeholder="Giveaways Hosted"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Points Configuration Tab */}
        <TabsContent value="points" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GTW Points */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-green-500/10">
                  <Target className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">GTW Points</h3>
                  <p className="text-xs text-muted-foreground">Guess The Winner rewards</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-xl border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <Label className="text-sm font-medium">1st Place</Label>
                  </div>
                  <Input
                    type="number"
                    value={gtwSettings.gtw_points_1st}
                    onChange={(e) => setGtwSettings({ ...gtwSettings, gtw_points_1st: Number(e.target.value) })}
                    min={0}
                    className="text-xl font-bold"
                  />
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-400/20 to-gray-400/5 rounded-xl border border-gray-400/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-gray-400" />
                    <Label className="text-sm font-medium">2nd Place</Label>
                  </div>
                  <Input
                    type="number"
                    value={gtwSettings.gtw_points_2nd}
                    onChange={(e) => setGtwSettings({ ...gtwSettings, gtw_points_2nd: Number(e.target.value) })}
                    min={0}
                    className="text-xl font-bold"
                  />
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-600/20 to-amber-600/5 rounded-xl border border-amber-600/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    <Label className="text-sm font-medium">3rd Place</Label>
                  </div>
                  <Input
                    type="number"
                    value={gtwSettings.gtw_points_3rd}
                    onChange={(e) => setGtwSettings({ ...gtwSettings, gtw_points_3rd: Number(e.target.value) })}
                    min={0}
                    className="text-xl font-bold"
                  />
                </div>
                <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">4th-10th</Label>
                  </div>
                  <Input
                    type="number"
                    value={gtwSettings.gtw_points_4th_10th}
                    onChange={(e) => setGtwSettings({ ...gtwSettings, gtw_points_4th_10th: Number(e.target.value) })}
                    min={0}
                    className="text-xl font-bold"
                  />
                </div>
              </div>
            </motion.div>

            {/* Bonus Hunt Points */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-purple-500/10">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Bonus Hunt Points</h3>
                  <p className="text-xs text-muted-foreground">Bonus Hunt guess rewards</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-xl border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <Label className="text-sm font-medium">1st Place</Label>
                  </div>
                  <Input
                    type="number"
                    value={bhSettings.bh_points_1st}
                    onChange={(e) => setBhSettings({ ...bhSettings, bh_points_1st: Number(e.target.value) })}
                    min={0}
                    className="text-xl font-bold"
                  />
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-400/20 to-gray-400/5 rounded-xl border border-gray-400/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-gray-400" />
                    <Label className="text-sm font-medium">2nd Place</Label>
                  </div>
                  <Input
                    type="number"
                    value={bhSettings.bh_points_2nd}
                    onChange={(e) => setBhSettings({ ...bhSettings, bh_points_2nd: Number(e.target.value) })}
                    min={0}
                    className="text-xl font-bold"
                  />
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-600/20 to-amber-600/5 rounded-xl border border-amber-600/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    <Label className="text-sm font-medium">3rd Place</Label>
                  </div>
                  <Input
                    type="number"
                    value={bhSettings.bh_points_3rd}
                    onChange={(e) => setBhSettings({ ...bhSettings, bh_points_3rd: Number(e.target.value) })}
                    min={0}
                    className="text-xl font-bold"
                  />
                </div>
                <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">4th-10th</Label>
                  </div>
                  <Input
                    type="number"
                    value={bhSettings.bh_points_4th_10th}
                    onChange={(e) => setBhSettings({ ...bhSettings, bh_points_4th_10th: Number(e.target.value) })}
                    min={0}
                    className="text-xl font-bold"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </TabsContent>

        {/* Daily Rewards Tab */}
        <TabsContent value="daily" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Daily Sign-in Rewards</h3>
                <p className="text-sm text-muted-foreground">Configure points earned from daily check-ins</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-5 h-5 text-green-500" />
                  <Label className="font-medium">Base Points</Label>
                </div>
                <Input
                  type="number"
                  value={dailyRewardSettings.daily_base_points}
                  onChange={(e) => setDailyRewardSettings({ ...dailyRewardSettings, daily_base_points: Number(e.target.value) })}
                  min={0}
                  className="text-2xl font-bold mb-2"
                />
                <p className="text-xs text-muted-foreground">Points for each daily sign-in</p>
              </div>
              <div className="p-5 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl border border-orange-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Percent className="w-5 h-5 text-orange-500" />
                  <Label className="font-medium">Streak Bonus</Label>
                </div>
                <Input
                  type="number"
                  value={dailyRewardSettings.daily_streak_bonus}
                  onChange={(e) => setDailyRewardSettings({ ...dailyRewardSettings, daily_streak_bonus: Number(e.target.value) })}
                  min={0}
                  className="text-2xl font-bold mb-2"
                />
                <p className="text-xs text-muted-foreground">Extra points per streak day</p>
              </div>
              <div className="p-5 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <Label className="font-medium">Max Streak</Label>
                </div>
                <Input
                  type="number"
                  value={dailyRewardSettings.daily_max_streak}
                  onChange={(e) => setDailyRewardSettings({ ...dailyRewardSettings, daily_max_streak: Number(e.target.value) })}
                  min={1}
                  className="text-2xl font-bold mb-2"
                />
                <p className="text-xs text-muted-foreground">Maximum streak multiplier</p>
              </div>
            </div>
            
            {/* Preview */}
            <div className="mt-6 p-4 bg-secondary/30 rounded-xl">
              <h4 className="text-sm font-medium mb-3">Preview: Daily Reward Progression</h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {Array.from({ length: dailyRewardSettings.daily_max_streak }, (_, i) => {
                  const day = i + 1;
                  const points = dailyRewardSettings.daily_base_points + (day * dailyRewardSettings.daily_streak_bonus);
                  return (
                    <div key={day} className="flex-shrink-0 p-3 bg-background rounded-lg text-center min-w-[80px]">
                      <p className="text-xs text-muted-foreground">Day {day}</p>
                      <p className="text-lg font-bold text-primary">{points}</p>
                      <p className="text-[10px] text-muted-foreground">pts</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold">How to Earn Points Boxes</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Configure the 3 boxes displayed in the "How to Earn Points" section on the Leaderboard page.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Box 1 */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">1</span>
                  Box 1
                </h4>
                <div>
                  <Label className="text-xs text-muted-foreground">Icon</Label>
                  <Select 
                    value={howToEarnConfig.box1_icon} 
                    onValueChange={(v) => setHowToEarnConfig({ ...howToEarnConfig, box1_icon: v })}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input
                    value={howToEarnConfig.box1_title}
                    onChange={(e) => setHowToEarnConfig({ ...howToEarnConfig, box1_title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea
                    value={howToEarnConfig.box1_text}
                    onChange={(e) => setHowToEarnConfig({ ...howToEarnConfig, box1_text: e.target.value })}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Box 2 */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">2</span>
                  Box 2
                </h4>
                <div>
                  <Label className="text-xs text-muted-foreground">Icon</Label>
                  <Select 
                    value={howToEarnConfig.box2_icon} 
                    onValueChange={(v) => setHowToEarnConfig({ ...howToEarnConfig, box2_icon: v })}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input
                    value={howToEarnConfig.box2_title}
                    onChange={(e) => setHowToEarnConfig({ ...howToEarnConfig, box2_title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea
                    value={howToEarnConfig.box2_text}
                    onChange={(e) => setHowToEarnConfig({ ...howToEarnConfig, box2_text: e.target.value })}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Box 3 */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl border border-amber-500/20">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">3</span>
                  Box 3
                </h4>
                <div>
                  <Label className="text-xs text-muted-foreground">Icon</Label>
                  <Select 
                    value={howToEarnConfig.box3_icon} 
                    onValueChange={(v) => setHowToEarnConfig({ ...howToEarnConfig, box3_icon: v })}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input
                    value={howToEarnConfig.box3_title}
                    onChange={(e) => setHowToEarnConfig({ ...howToEarnConfig, box3_title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea
                    value={howToEarnConfig.box3_text}
                    onChange={(e) => setHowToEarnConfig({ ...howToEarnConfig, box3_text: e.target.value })}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
