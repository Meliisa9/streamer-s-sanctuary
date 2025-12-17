import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Radio, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";

interface LiveSettings {
  is_live: boolean;
  live_platform: "twitch" | "kick";
  twitch_url: string;
  twitch_follow_url: string;
  social_twitter: string;
  social_youtube: string;
  social_instagram: string;
  social_discord: string;
  social_twitter_icon: string;
  social_youtube_icon: string;
  social_instagram_icon: string;
  social_discord_icon: string;
}

const defaultSettings: LiveSettings = {
  is_live: false,
  live_platform: "twitch",
  twitch_url: "https://twitch.tv",
  twitch_follow_url: "https://twitch.tv",
  social_twitter: "#",
  social_youtube: "#",
  social_instagram: "#",
  social_discord: "#",
  social_twitter_icon: "twitter",
  social_youtube_icon: "youtube",
  social_instagram_icon: "instagram",
  social_discord_icon: "discord",
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<LiveSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { isAdmin, isModerator } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;

      const loadedSettings: LiveSettings = { ...defaultSettings };
      data?.forEach((row) => {
        const key = row.key as keyof LiveSettings;
        if (key in loadedSettings) {
          const value = row.value;
          if (typeof defaultSettings[key] === "boolean") {
            (loadedSettings as Record<string, any>)[key] = value === true || value === "true";
          } else {
            (loadedSettings as Record<string, any>)[key] = value ?? defaultSettings[key];
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
    setIsSaving(true);
    try {
      // Moderators can only save live status
      const keysToSave = isModerator && !isAdmin 
        ? ["is_live", "live_platform"] 
        : Object.keys(settings);

      for (const key of keysToSave) {
        const { error } = await supabase
          .from("site_settings")
          .upsert({ key, value: settings[key as keyof LiveSettings] }, { onConflict: "key" });
        if (error) throw error;
      }

      toast({ title: "Settings saved" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Manage site settings and configuration</p>
        </div>
        <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </Button>
      </div>

      {/* Settings Categories Navigation */}
      <AdminSettingsNav />

      {/* Live Status - Available to Moderators */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Radio className="w-5 h-5 text-destructive" />
          Live Status
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Live on Twitch</p>
              <p className="text-sm text-muted-foreground">Show "Live on Twitch" badge (red)</p>
            </div>
            <Switch
              checked={settings.is_live && settings.live_platform === "twitch"}
              onCheckedChange={(checked) => setSettings({ 
                ...settings, 
                is_live: checked, 
                live_platform: checked ? "twitch" : settings.live_platform 
              })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Live on Kick</p>
              <p className="text-sm text-muted-foreground">Show "Live on Kick" badge (green)</p>
            </div>
            <Switch
              checked={settings.is_live && settings.live_platform === "kick"}
              onCheckedChange={(checked) => setSettings({ 
                ...settings, 
                is_live: checked, 
                live_platform: checked ? "kick" : settings.live_platform 
              })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {settings.is_live 
              ? `Currently showing: Live on ${settings.live_platform === "kick" ? "Kick" : "Twitch"}` 
              : "Currently showing: Offline"}
          </p>
        </div>
      </motion.div>

      {/* External Links - Admin only */}
      {isAdmin && (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Stream Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Stream URL</label>
                <input
                  type="url"
                  value={settings.twitch_url}
                  onChange={(e) => setSettings({ ...settings, twitch_url: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  placeholder="https://twitch.tv/username"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Follow URL</label>
                <input
                  type="url"
                  value={settings.twitch_follow_url}
                  onChange={(e) => setSettings({ ...settings, twitch_follow_url: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  placeholder="https://twitch.tv/username"
                />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Footer Social Links
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Twitter/X URL</label>
                <input
                  type="url"
                  value={settings.social_twitter}
                  onChange={(e) => setSettings({ ...settings, social_twitter: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  placeholder="https://twitter.com/username"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Twitter/X Icon</label>
                <select
                  value={settings.social_twitter_icon}
                  onChange={(e) => setSettings({ ...settings, social_twitter_icon: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                >
                  <option value="twitter">Twitter</option>
                  <option value="youtube">YouTube</option>
                  <option value="instagram">Instagram</option>
                  <option value="discord">Discord</option>
                  <option value="twitch">Twitch</option>
                  <option value="default">Globe (Default)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">YouTube URL</label>
                <input
                  type="url"
                  value={settings.social_youtube}
                  onChange={(e) => setSettings({ ...settings, social_youtube: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  placeholder="https://youtube.com/@channel"
                />
              </div>
              <div>
                <label className="text-sm font-medium">YouTube Icon</label>
                <select
                  value={settings.social_youtube_icon}
                  onChange={(e) => setSettings({ ...settings, social_youtube_icon: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                >
                  <option value="youtube">YouTube</option>
                  <option value="twitter">Twitter</option>
                  <option value="instagram">Instagram</option>
                  <option value="discord">Discord</option>
                  <option value="twitch">Twitch</option>
                  <option value="default">Globe (Default)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Instagram URL</label>
                <input
                  type="url"
                  value={settings.social_instagram}
                  onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  placeholder="https://instagram.com/username"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Instagram Icon</label>
                <select
                  value={settings.social_instagram_icon}
                  onChange={(e) => setSettings({ ...settings, social_instagram_icon: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                >
                  <option value="instagram">Instagram</option>
                  <option value="twitter">Twitter</option>
                  <option value="youtube">YouTube</option>
                  <option value="discord">Discord</option>
                  <option value="twitch">Twitch</option>
                  <option value="default">Globe (Default)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Discord URL</label>
                <input
                  type="url"
                  value={settings.social_discord}
                  onChange={(e) => setSettings({ ...settings, social_discord: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  placeholder="https://discord.gg/invite"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Discord Icon</label>
                <select
                  value={settings.social_discord_icon}
                  onChange={(e) => setSettings({ ...settings, social_discord_icon: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                >
                  <option value="discord">Discord</option>
                  <option value="twitter">Twitter</option>
                  <option value="youtube">YouTube</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitch">Twitch</option>
                  <option value="default">Globe (Default)</option>
                </select>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
