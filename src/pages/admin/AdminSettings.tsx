import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Upload, Eye, EyeOff, Loader2, Globe, Twitch, Image as ImageIcon, Type, Radio, Layout, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface SiteSettings {
  site_name: string;
  site_tagline: string;
  logo_url: string | null;
  twitch_url: string;
  twitch_follow_url: string;
  is_live: boolean;
  live_viewer_count: string;
  nav_videos_visible: boolean;
  nav_bonuses_visible: boolean;
  nav_news_visible: boolean;
  nav_giveaways_visible: boolean;
  nav_events_visible: boolean;
  nav_gtw_visible: boolean;
  nav_leaderboard_visible: boolean;
}

const defaultSettings: SiteSettings = {
  site_name: "StreamerX",
  site_tagline: "Casino Streams",
  logo_url: null,
  twitch_url: "https://twitch.tv",
  twitch_follow_url: "https://twitch.tv",
  is_live: false,
  live_viewer_count: "0",
  nav_videos_visible: true,
  nav_bonuses_visible: true,
  nav_news_visible: true,
  nav_giveaways_visible: true,
  nav_events_visible: true,
  nav_gtw_visible: true,
  nav_leaderboard_visible: true,
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      if (error) throw error;

      const loadedSettings: SiteSettings = { ...defaultSettings };
      data?.forEach((row) => {
        const key = row.key as keyof SiteSettings;
        if (key in loadedSettings) {
          const value = row.value;
          if (typeof defaultSettings[key] === "boolean") {
            (loadedSettings as Record<string, any>)[key] = value === true || value === "true";
          } else {
            (loadedSettings as Record<string, any>)[key] = value;
          }
        }
      });

      setSettings(loadedSettings);
      if (loadedSettings.logo_url) {
        setLogoPreview(loadedSettings.logo_url);
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    if (!isAdmin) {
      toast({ title: "Only admins can change settings", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      let logoUrl = settings.logo_url;

      // Upload logo if changed
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from("media")
          .upload(fileName, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("media")
          .getPublicUrl(fileName);

        logoUrl = publicUrl;
      }

      // Save all settings
      const settingsToSave = { ...settings, logo_url: logoUrl };

      for (const [key, value] of Object.entries(settingsToSave)) {
        const { error } = await supabase
          .from("site_settings")
          .upsert(
            { key, value: value },
            { onConflict: "key" }
          );

        if (error) throw error;
      }

      toast({ title: "Settings saved successfully" });
      setLogoFile(null);
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
        <h2 className="text-2xl font-bold">Site Settings</h2>
        <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Type className="w-5 h-5 text-primary" />
            Branding
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Site Name</label>
              <input
                type="text"
                value={settings.site_name}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tagline</label>
              <input
                type="text"
                value={settings.site_tagline}
                onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Logo</label>
              <div className="mt-1 flex items-center gap-4">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <Button variant="outline" type="button" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Live Status Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-destructive" />
            Live Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Live on Twitch</p>
                <p className="text-sm text-muted-foreground">Show "Live on Twitch" banner</p>
              </div>
              <Switch
                checked={settings.is_live}
                onCheckedChange={(checked) => setSettings({ ...settings, is_live: checked })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Viewer Count</label>
              <input
                type="text"
                value={settings.live_viewer_count}
                onChange={(e) => setSettings({ ...settings, live_viewer_count: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="e.g. 12.5K"
              />
            </div>
          </div>
        </motion.div>

        {/* External Links Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            External Links
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Watch Live Stream URL</label>
              <input
                type="url"
                value={settings.twitch_url}
                onChange={(e) => setSettings({ ...settings, twitch_url: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="https://twitch.tv/yourname"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Follow on Twitch URL</label>
              <input
                type="url"
                value={settings.twitch_follow_url}
                onChange={(e) => setSettings({ ...settings, twitch_follow_url: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="https://twitch.tv/yourname"
              />
            </div>
          </div>
        </motion.div>

        {/* Navigation Visibility Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
            Navigation Visibility
          </h3>
          <div className="space-y-3">
            {[
              { key: "nav_videos_visible", label: "Videos" },
              { key: "nav_bonuses_visible", label: "Bonuses" },
              { key: "nav_news_visible", label: "News" },
              { key: "nav_giveaways_visible", label: "Giveaways" },
              { key: "nav_events_visible", label: "Events" },
              { key: "nav_gtw_visible", label: "Guess The Win" },
              { key: "nav_leaderboard_visible", label: "Leaderboard" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="font-medium">{item.label}</span>
                <Switch
                  checked={settings[item.key as keyof SiteSettings] as boolean}
                  onCheckedChange={(checked) => setSettings({ ...settings, [item.key]: checked })}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
