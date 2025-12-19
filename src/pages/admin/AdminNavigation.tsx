import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Layout, Eye, EyeOff, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  { key: "nav_videos_visible", label: "Videos", description: "Video gallery and highlights", icon: "🎬" },
  { key: "nav_bonuses_visible", label: "Bonuses", description: "Casino bonus offers", icon: "🎁" },
  { key: "nav_news_visible", label: "News", description: "News and updates", icon: "📰" },
  { key: "nav_giveaways_visible", label: "Giveaways", description: "Active giveaways", icon: "🎉" },
  { key: "nav_events_visible", label: "Events", description: "Stream schedule and events", icon: "📅" },
  { key: "nav_gtw_visible", label: "Guess The Win", description: "GTW game sessions", icon: "🎯" },
  { key: "nav_leaderboard_visible", label: "Leaderboard", description: "Points rankings", icon: "🏆" },
  { key: "nav_polls_visible", label: "Polls", description: "Community polls", icon: "📊" },
  { key: "nav_about_visible", label: "About Us", description: "About the streamer", icon: "ℹ️" },
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

  const toggleAll = (enabled: boolean) => {
    const newSettings = { ...settings };
    Object.keys(newSettings).forEach((key) => {
      (newSettings as Record<string, boolean>)[key] = enabled;
    });
    setSettings(newSettings);
  };

  const enabledCount = Object.values(settings).filter(Boolean).length;

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
          <h2 className="text-2xl font-bold">Navigation Settings</h2>
          <p className="text-muted-foreground">Control which sections appear in the sidebar navigation</p>
        </div>
        <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => toggleAll(true)} className="gap-2">
          <Eye className="w-4 h-4" />
          Show All
        </Button>
        <Button variant="outline" size="sm" onClick={() => toggleAll(false)} className="gap-2">
          <EyeOff className="w-4 h-4" />
          Hide All
        </Button>
        <Badge variant="outline" className="ml-auto">
          {enabledCount}/{navItems.length} visible
        </Badge>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-primary/10">
            <Layout className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Sidebar Navigation</h3>
            <p className="text-sm text-muted-foreground">Toggle visibility of navigation items</p>
          </div>
        </div>
        
        <div className="space-y-2">
          {navItems.map((item, index) => {
            const isEnabled = settings[item.key as keyof NavSettings];
            return (
              <motion.div 
                key={item.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isEnabled 
                    ? "bg-primary/5 border-primary/20" 
                    : "bg-secondary/30 border-border/50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={isEnabled ? "default" : "secondary"} className="text-xs">
                    {isEnabled ? "Visible" : "Hidden"}
                  </Badge>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, [item.key]: checked })}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Preview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Preview</h3>
        <p className="text-sm text-muted-foreground mb-4">This is how the navigation will appear to users:</p>
        <div className="flex flex-wrap gap-2">
          {navItems
            .filter(item => settings[item.key as keyof NavSettings])
            .map((item) => (
              <Badge key={item.key} variant="outline" className="gap-2 py-1.5 px-3">
                <span>{item.icon}</span>
                {item.label}
              </Badge>
            ))}
        </div>
        {enabledCount === 0 && (
          <p className="text-muted-foreground text-sm">No navigation items visible</p>
        )}
      </motion.div>
    </div>
  );
}
