import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, BarChart3, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";

interface StatSettings {
  stat_community_value: string;
  stat_community_label: string;
  stat_wins_value: string;
  stat_wins_label: string;
  stat_giveaways_value: string;
  stat_giveaways_label: string;
}

interface GTWPointsSettings {
  gtw_points_1st: number;
  gtw_points_2nd: number;
  gtw_points_3rd: number;
  gtw_points_4th_10th: number;
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
  stat_wins_value: "$2.5M",
  stat_wins_label: "Total Wins Streamed",
  stat_giveaways_value: "500+",
  stat_giveaways_label: "Giveaways Hosted",
};

const defaultGTWSettings: GTWPointsSettings = {
  gtw_points_1st: 300,
  gtw_points_2nd: 200,
  gtw_points_3rd: 100,
  gtw_points_4th_10th: 25,
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
  { value: "Target", label: "Target" },
  { value: "Gift", label: "Gift" },
  { value: "Zap", label: "Zap" },
  { value: "Trophy", label: "Trophy" },
  { value: "Star", label: "Star" },
  { value: "TrendingUp", label: "Trending Up" },
  { value: "MessageSquare", label: "Message" },
  { value: "BarChart3", label: "Chart" },
  { value: "Info", label: "Info" },
];

export default function AdminStatistics() {
  const [statSettings, setStatSettings] = useState<StatSettings>(defaultStatSettings);
  const [gtwSettings, setGtwSettings] = useState<GTWPointsSettings>(defaultGTWSettings);
  const [howToEarnConfig, setHowToEarnConfig] = useState<HowToEarnBoxConfig>(defaultHowToEarnConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;

      const loadedStatSettings: StatSettings = { ...defaultStatSettings };
      const loadedGTWSettings: GTWPointsSettings = { ...defaultGTWSettings };
      let loadedHowToEarn: HowToEarnBoxConfig = { ...defaultHowToEarnConfig };
      
      data?.forEach((row) => {
        // How to earn boxes
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
      });

      setStatSettings(loadedStatSettings);
      setGtwSettings(loadedGTWSettings);
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
      // Save stat settings
      for (const [key, value] of Object.entries(statSettings)) {
        const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }

      // Save GTW settings
      for (const [key, value] of Object.entries(gtwSettings)) {
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
          <p className="text-muted-foreground">Configure homepage stats, GTW points, and leaderboard settings</p>
        </div>
        <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Homepage Statistics */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-primary/10">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Homepage Statistics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4 p-4 bg-secondary/30 rounded-xl">
            <h4 className="font-medium text-primary">Community Stat</h4>
            <div>
              <label className="text-sm font-medium">Value</label>
              <Input
                value={statSettings.stat_community_value}
                onChange={(e) => setStatSettings({ ...statSettings, stat_community_value: e.target.value })}
                placeholder="150K+"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Label</label>
              <Input
                value={statSettings.stat_community_label}
                onChange={(e) => setStatSettings({ ...statSettings, stat_community_label: e.target.value })}
                placeholder="Community Members"
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-4 p-4 bg-secondary/30 rounded-xl">
            <h4 className="font-medium text-primary">Wins Stat</h4>
            <div>
              <label className="text-sm font-medium">Value</label>
              <Input
                value={statSettings.stat_wins_value}
                onChange={(e) => setStatSettings({ ...statSettings, stat_wins_value: e.target.value })}
                placeholder="$2.5M"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Label</label>
              <Input
                value={statSettings.stat_wins_label}
                onChange={(e) => setStatSettings({ ...statSettings, stat_wins_label: e.target.value })}
                placeholder="Total Wins Streamed"
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-4 p-4 bg-secondary/30 rounded-xl">
            <h4 className="font-medium text-primary">Giveaways Stat</h4>
            <div>
              <label className="text-sm font-medium">Value</label>
              <Input
                value={statSettings.stat_giveaways_value}
                onChange={(e) => setStatSettings({ ...statSettings, stat_giveaways_value: e.target.value })}
                placeholder="500+"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Label</label>
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

      {/* GTW Points Configuration */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-yellow-500/10">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold">GTW Points Configuration</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">1st Place Points</label>
            <Input
              type="number"
              value={gtwSettings.gtw_points_1st}
              onChange={(e) => setGtwSettings({ ...gtwSettings, gtw_points_1st: Number(e.target.value) })}
              min={0}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">2nd Place Points</label>
            <Input
              type="number"
              value={gtwSettings.gtw_points_2nd}
              onChange={(e) => setGtwSettings({ ...gtwSettings, gtw_points_2nd: Number(e.target.value) })}
              min={0}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">3rd Place Points</label>
            <Input
              type="number"
              value={gtwSettings.gtw_points_3rd}
              onChange={(e) => setGtwSettings({ ...gtwSettings, gtw_points_3rd: Number(e.target.value) })}
              min={0}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">4th-10th Place Points</label>
            <Input
              type="number"
              value={gtwSettings.gtw_points_4th_10th}
              onChange={(e) => setGtwSettings({ ...gtwSettings, gtw_points_4th_10th: Number(e.target.value) })}
              min={0}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Points awarded to GTW winners. The winner is determined by who is closest to the final balance.
        </p>
      </motion.div>

      {/* Leaderboard How to Earn Points Configuration */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6"
      >
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
          <div className="space-y-3 p-4 bg-muted/20 rounded-xl">
            <h4 className="font-medium text-sm">Box 1</h4>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Icon</label>
              <Select 
                value={howToEarnConfig.box1_icon} 
                onValueChange={(v) => setHowToEarnConfig({ ...howToEarnConfig, box1_icon: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {iconOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title</label>
              <Input
                value={howToEarnConfig.box1_title}
                onChange={(e) => setHowToEarnConfig({ ...howToEarnConfig, box1_title: e.target.value })}
                placeholder="Title..."
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <Textarea
                value={howToEarnConfig.box1_text}
                onChange={(e) => setHowToEarnConfig({ ...howToEarnConfig, box1_text: e.target.value })}
                placeholder="Description..."
                rows={3}
              />
            </div>
          </div>

          {/* Box 2 */}
          <div className="space-y-3 p-4 bg-muted/20 rounded-xl">
            <h4 className="font-medium text-sm">Box 2</h4>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Icon</label>
              <Select 
                value={howToEarnConfig.box2_icon} 
                onValueChange={(v) => setHowToEarnConfig({ ...howToEarnConfig, box2_icon: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {iconOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title</label>
              <Input
                value={howToEarnConfig.box2_title}
                onChange={(e) => setHowToEarnConfig({ ...howToEarnConfig, box2_title: e.target.value })}
                placeholder="Title..."
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <Textarea
                value={howToEarnConfig.box2_text}
                onChange={(e) => setHowToEarnConfig({ ...howToEarnConfig, box2_text: e.target.value })}
                placeholder="Description..."
                rows={3}
              />
            </div>
          </div>

          {/* Box 3 */}
          <div className="space-y-3 p-4 bg-muted/20 rounded-xl">
            <h4 className="font-medium text-sm">Box 3</h4>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Icon</label>
              <Select 
                value={howToEarnConfig.box3_icon} 
                onValueChange={(v) => setHowToEarnConfig({ ...howToEarnConfig, box3_icon: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {iconOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title</label>
              <Input
                value={howToEarnConfig.box3_title}
                onChange={(e) => setHowToEarnConfig({ ...howToEarnConfig, box3_title: e.target.value })}
                placeholder="Title..."
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <Textarea
                value={howToEarnConfig.box3_text}
                onChange={(e) => setHowToEarnConfig({ ...howToEarnConfig, box3_text: e.target.value })}
                placeholder="Description..."
                rows={3}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
