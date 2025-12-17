import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";

interface NavSettings {
  nav_videos_visible: boolean;
  nav_bonuses_visible: boolean;
  nav_news_visible: boolean;
  nav_giveaways_visible: boolean;
  nav_events_visible: boolean;
  nav_gtw_visible: boolean;
  nav_leaderboard_visible: boolean;
  nav_polls_visible: boolean;
  nav_about_visible: boolean;
}

const defaultSettings: NavSettings = {
  nav_videos_visible: true,
  nav_bonuses_visible: true,
  nav_news_visible: true,
  nav_giveaways_visible: true,
  nav_events_visible: true,
  nav_gtw_visible: true,
  nav_leaderboard_visible: true,
  nav_polls_visible: true,
  nav_about_visible: true,
};

const navItems = [
  { key: "nav_videos_visible", label: "Videos", description: "Show videos section in navigation" },
  { key: "nav_bonuses_visible", label: "Bonuses", description: "Show bonuses section in navigation" },
  { key: "nav_news_visible", label: "News", description: "Show news section in navigation" },
  { key: "nav_giveaways_visible", label: "Giveaways", description: "Show giveaways section in navigation" },
  { key: "nav_events_visible", label: "Events", description: "Show events section in navigation" },
  { key: "nav_gtw_visible", label: "Guess The Win", description: "Show GTW section in navigation" },
  { key: "nav_leaderboard_visible", label: "Leaderboard", description: "Show leaderboard section in navigation" },
  { key: "nav_polls_visible", label: "Polls", description: "Show polls section in navigation" },
  { key: "nav_about_visible", label: "About Us", description: "Show about us section in navigation" },
];

export default function AdminNavigation() {
  const [settings, setSettings] = useState<NavSettings>(defaultSettings);
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

      const loadedSettings: NavSettings = { ...defaultSettings };
      data?.forEach((row) => {
        const key = row.key as keyof NavSettings;
        if (key in loadedSettings) {
          (loadedSettings as Record<string, any>)[key] = row.value === true || row.value === "true";
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

      toast({ title: "Navigation settings saved" });
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
          <h2 className="text-2xl font-bold">Navigation</h2>
          <p className="text-muted-foreground">Control which sections appear in the sidebar</p>
        </div>
        <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layout className="w-5 h-5 text-primary" />
          Sidebar Navigation
        </h3>
        <div className="space-y-4">
          {navItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                checked={settings[item.key as keyof NavSettings]}
                onCheckedChange={(checked) => setSettings({ ...settings, [item.key]: checked })}
              />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
