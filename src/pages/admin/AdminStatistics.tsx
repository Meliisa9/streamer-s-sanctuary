import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface StatSettings {
  stat_community_value: string;
  stat_community_label: string;
  stat_wins_value: string;
  stat_wins_label: string;
  stat_giveaways_value: string;
  stat_giveaways_label: string;
}

const defaultSettings: StatSettings = {
  stat_community_value: "150K+",
  stat_community_label: "Community Members",
  stat_wins_value: "$2.5M",
  stat_wins_label: "Total Wins Streamed",
  stat_giveaways_value: "500+",
  stat_giveaways_label: "Giveaways Hosted",
};

export default function AdminStatistics() {
  const [settings, setSettings] = useState<StatSettings>(defaultSettings);
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

      const loadedSettings: StatSettings = { ...defaultSettings };
      data?.forEach((row) => {
        const key = row.key as keyof StatSettings;
        if (key in loadedSettings) {
          (loadedSettings as Record<string, any>)[key] = row.value ?? defaultSettings[key];
        }
      });

      setSettings(loadedSettings);
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
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Homepage Statistics</h2>
          <p className="text-muted-foreground">Customize the stats displayed on the homepage</p>
        </div>
        <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Statistics Display
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 p-4 bg-secondary/30 rounded-xl">
            <h4 className="font-medium text-primary">Community Stat</h4>
            <div>
              <label className="text-sm font-medium">Value</label>
              <input
                type="text"
                value={settings.stat_community_value}
                onChange={(e) => setSettings({ ...settings, stat_community_value: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="150K+"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Label</label>
              <input
                type="text"
                value={settings.stat_community_label}
                onChange={(e) => setSettings({ ...settings, stat_community_label: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="Community Members"
              />
            </div>
          </div>

          <div className="space-y-4 p-4 bg-secondary/30 rounded-xl">
            <h4 className="font-medium text-primary">Wins Stat</h4>
            <div>
              <label className="text-sm font-medium">Value</label>
              <input
                type="text"
                value={settings.stat_wins_value}
                onChange={(e) => setSettings({ ...settings, stat_wins_value: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="$2.5M"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Label</label>
              <input
                type="text"
                value={settings.stat_wins_label}
                onChange={(e) => setSettings({ ...settings, stat_wins_label: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="Total Wins Streamed"
              />
            </div>
          </div>

          <div className="space-y-4 p-4 bg-secondary/30 rounded-xl">
            <h4 className="font-medium text-primary">Giveaways Stat</h4>
            <div>
              <label className="text-sm font-medium">Value</label>
              <input
                type="text"
                value={settings.stat_giveaways_value}
                onChange={(e) => setSettings({ ...settings, stat_giveaways_value: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="500+"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Label</label>
              <input
                type="text"
                value={settings.stat_giveaways_label}
                onChange={(e) => setSettings({ ...settings, stat_giveaways_label: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="Giveaways Hosted"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
