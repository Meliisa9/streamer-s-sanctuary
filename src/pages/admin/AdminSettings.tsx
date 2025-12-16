import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Upload, Loader2, ExternalLink, Type, Radio, Layout, BarChart3, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface SiteSettings {
  site_name: string;
  site_tagline: string;
  site_title: string;
  favicon_url: string | null;
  logo_url: string | null;
  twitch_url: string;
  twitch_follow_url: string;
  is_live: boolean;
  live_platform: "twitch" | "kick";
  nav_videos_visible: boolean;
  nav_bonuses_visible: boolean;
  nav_news_visible: boolean;
  nav_giveaways_visible: boolean;
  nav_events_visible: boolean;
  nav_gtw_visible: boolean;
  nav_leaderboard_visible: boolean;
  stat_community_value: string;
  stat_community_label: string;
  stat_wins_value: string;
  stat_wins_label: string;
  stat_giveaways_value: string;
  stat_giveaways_label: string;
}

const defaultSettings: SiteSettings = {
  site_name: "StreamerX",
  site_tagline: "Casino Streams",
  site_title: "StreamerX - Casino Streams",
  favicon_url: null,
  logo_url: null,
  twitch_url: "https://twitch.tv",
  twitch_follow_url: "https://twitch.tv",
  is_live: false,
  live_platform: "twitch",
  nav_videos_visible: true,
  nav_bonuses_visible: true,
  nav_news_visible: true,
  nav_giveaways_visible: true,
  nav_events_visible: true,
  nav_gtw_visible: true,
  nav_leaderboard_visible: true,
  stat_community_value: "150K+",
  stat_community_label: "Community Members",
  stat_wins_value: "$2.5M",
  stat_wins_label: "Total Wins Streamed",
  stat_giveaways_value: "500+",
  stat_giveaways_label: "Giveaways Hosted",
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
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
            (loadedSettings as Record<string, any>)[key] = value ?? defaultSettings[key];
          }
        }
      });

      setSettings(loadedSettings);
      if (loadedSettings.logo_url) setLogoPreview(loadedSettings.logo_url);
      if (loadedSettings.favicon_url) setFaviconPreview(loadedSettings.favicon_url);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
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
      let faviconUrl = settings.favicon_url;

      // Upload logo if changed
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(fileName, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fileName);
        logoUrl = publicUrl;
      }

      // Upload favicon if changed
      if (faviconFile) {
        const fileExt = faviconFile.name.split(".").pop();
        const fileName = `favicon-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(fileName, faviconFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fileName);
        faviconUrl = publicUrl;
      }

      // Save all settings
      const settingsToSave = { ...settings, logo_url: logoUrl, favicon_url: faviconUrl };

      for (const [key, value] of Object.entries(settingsToSave)) {
        const { error } = await supabase
          .from("site_settings")
          .upsert({ key, value: value }, { onConflict: "key" });
        if (error) throw error;
      }

      toast({ title: "Settings saved successfully" });
      setLogoFile(null);
      setFaviconFile(null);

      // Update document title immediately
      document.title = settingsToSave.site_title;
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
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
                  <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground text-xs">
                    No logo
                  </div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setLogoFile, setLogoPreview)} className="hidden" />
                  <Button variant="outline" type="button" asChild>
                    <span><Upload className="w-4 h-4 mr-2" />Upload Logo</span>
                  </Button>
                </label>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Website Title & Favicon */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Website Title & Favicon
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Browser Tab Title</label>
              <input
                type="text"
                value={settings.site_title}
                onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="StreamerX - Casino Streams"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Favicon</label>
              <div className="mt-1 flex items-center gap-4">
                {faviconPreview ? (
                  <img src={faviconPreview} alt="Favicon" className="w-10 h-10 rounded object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-muted-foreground text-xs">
                    None
                  </div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setFaviconFile, setFaviconPreview)} className="hidden" />
                  <Button variant="outline" type="button" asChild>
                    <span><Upload className="w-4 h-4 mr-2" />Upload Favicon</span>
                  </Button>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Recommended: 32x32 or 64x64 PNG/ICO</p>
            </div>
          </div>
        </motion.div>

        {/* Live Status Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-destructive" />
            Live Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Live on Twitch</p>
                <p className="text-sm text-muted-foreground">
                  Show "Live on Twitch" badge
                </p>
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
                <p className="text-sm text-muted-foreground">
                  Show "Live on Kick" badge (green)
                </p>
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

        {/* External Links Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl p-6">
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

        {/* Homepage Stats Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Homepage Stats
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Stat 1 Value</label>
                <input
                  type="text"
                  value={settings.stat_community_value}
                  onChange={(e) => setSettings({ ...settings, stat_community_value: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  placeholder="150K+"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Stat 1 Label</label>
                <input
                  type="text"
                  value={settings.stat_community_label}
                  onChange={(e) => setSettings({ ...settings, stat_community_label: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  placeholder="Community Members"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Stat 2 Value</label>
                <input
                  type="text"
                  value={settings.stat_wins_value}
                  onChange={(e) => setSettings({ ...settings, stat_wins_value: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  placeholder="$2.5M"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Stat 2 Label</label>
                <input
                  type="text"
                  value={settings.stat_wins_label}
                  onChange={(e) => setSettings({ ...settings, stat_wins_label: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  placeholder="Total Wins Streamed"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Stat 3 Value</label>
                <input
                  type="text"
                  value={settings.stat_giveaways_value}
                  onChange={(e) => setSettings({ ...settings, stat_giveaways_value: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  placeholder="500+"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Stat 3 Label</label>
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

        {/* Navigation Visibility Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
            Navigation Visibility
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: "nav_videos_visible", label: "Videos" },
              { key: "nav_bonuses_visible", label: "Bonuses" },
              { key: "nav_news_visible", label: "News" },
              { key: "nav_giveaways_visible", label: "Giveaways" },
              { key: "nav_events_visible", label: "Events" },
              { key: "nav_gtw_visible", label: "Guess The Win" },
              { key: "nav_leaderboard_visible", label: "Leaderboard" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                <span className="text-sm font-medium">{item.label}</span>
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