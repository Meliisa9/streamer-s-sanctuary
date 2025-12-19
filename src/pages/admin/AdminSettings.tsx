import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Tv, Target } from "lucide-react";
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Manage site settings and configuration</p>
        </div>
        <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save All Changes
        </Button>
      </div>

      <AdminSettingsNav />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stream Links */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-purple-500/10">
              <Tv className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold">Stream Links</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Stream URL</label>
              <Input
                type="url"
                value={settings.twitch_url}
                onChange={(e) => setSettings({ ...settings, twitch_url: e.target.value })}
                placeholder="https://twitch.tv/username"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Follow URL</label>
              <Input
                type="url"
                value={settings.twitch_follow_url}
                onChange={(e) => setSettings({ ...settings, twitch_follow_url: e.target.value })}
                placeholder="https://twitch.tv/username"
              />
            </div>
          </div>
        </motion.div>

        {/* Average X Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-green-500/10">
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold">Average X Settings</h3>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Prize Pool</label>
            <Input
              type="number"
              value={settings.avgx_prize_pool}
              onChange={(e) => setSettings({ ...settings, avgx_prize_pool: Number(e.target.value) })}
              placeholder="0"
              min={0}
            />
            <p className="text-xs text-muted-foreground mt-1.5">Displayed on the Average X tab.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
