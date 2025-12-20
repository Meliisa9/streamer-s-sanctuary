import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Tv, Target, Globe, Bell, Zap, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";

interface SettingsData {
  twitch_url: string;
  twitch_follow_url: string;
  avgx_prize_pool: number;
}

const defaultSettings: SettingsData = {
  twitch_url: "https://twitch.tv",
  twitch_follow_url: "https://twitch.tv",
  avgx_prize_pool: 0,
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
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

      const loadedSettings: SettingsData = { ...defaultSettings };
      
      data?.forEach((row) => {
        const key = row.key as keyof SettingsData;
        if (key in loadedSettings) {
          const val = row.value;
          if (typeof val === 'string') {
            (loadedSettings as Record<string, any>)[key] = val.replace(/^"|"$/g, '');
          } else {
            (loadedSettings as Record<string, any>)[key] = val ?? defaultSettings[key];
          }
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
      toast({ title: "Only admins can change these settings", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const jsonValue = typeof value === 'string' ? value : value;
        const { error } = await supabase
          .from("site_settings")
          .upsert({ key, value: jsonValue }, { onConflict: "key" });
        if (error) throw error;
      }

      toast({ title: "Settings saved successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
            <Settings2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Settings</h2>
            <p className="text-muted-foreground">Manage site settings and configuration</p>
          </div>
        </div>
        <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save All Changes
        </Button>
      </div>

      <AdminSettingsNav />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 border border-border/50"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Tv className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stream Links</p>
              <p className="text-lg font-semibold">2</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-xl p-4 border border-border/50"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Target className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prize Pool</p>
              <p className="text-lg font-semibold">${settings.avgx_prize_pool.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-4 border border-border/50"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Globe className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-lg font-semibold text-green-500">Live</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-xl p-4 border border-border/50"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Settings</p>
              <p className="text-lg font-semibold">3</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stream Links */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 border border-border/50"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20">
              <Tv className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Stream Links</h3>
              <p className="text-xs text-muted-foreground">Configure your streaming platform URLs</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Stream URL
                <span className="text-xs text-muted-foreground font-normal">(Embedded player)</span>
              </label>
              <Input
                type="url"
                value={settings.twitch_url}
                onChange={(e) => setSettings({ ...settings, twitch_url: e.target.value })}
                placeholder="https://twitch.tv/username"
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Follow URL
                <span className="text-xs text-muted-foreground font-normal">(Channel link)</span>
              </label>
              <Input
                type="url"
                value={settings.twitch_follow_url}
                onChange={(e) => setSettings({ ...settings, twitch_follow_url: e.target.value })}
                placeholder="https://twitch.tv/username"
                className="bg-secondary/50"
              />
            </div>
          </div>
        </motion.div>

        {/* Average X Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-6 border border-border/50"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20">
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Average X Settings</h3>
              <p className="text-xs text-muted-foreground">Configure bonus hunt prize settings</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Prize Pool Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                value={settings.avgx_prize_pool}
                onChange={(e) => setSettings({ ...settings, avgx_prize_pool: Number(e.target.value) })}
                placeholder="0"
                min={0}
                className="pl-7 bg-secondary/50"
              />
            </div>
            <p className="text-xs text-muted-foreground">Displayed on the Average X tab for bonus hunts.</p>
          </div>
        </motion.div>
      </div>

      {/* Additional Settings Hint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6 border border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-accent/5"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">Need More Settings?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Use the navigation above to access branding, legal pages, stream settings, and more advanced configurations.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-secondary/50 text-xs font-medium">Branding</span>
              <span className="px-3 py-1 rounded-full bg-secondary/50 text-xs font-medium">Legal Pages</span>
              <span className="px-3 py-1 rounded-full bg-secondary/50 text-xs font-medium">Stream Config</span>
              <span className="px-3 py-1 rounded-full bg-secondary/50 text-xs font-medium">Notifications</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}