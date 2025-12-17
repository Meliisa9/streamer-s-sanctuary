import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Share2, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";

interface SettingsData {
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
  admin_access_code: string;
}

const defaultSettings: SettingsData = {
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
  admin_access_code: "",
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
      toast({ title: "Only admins can change these settings", variant: "destructive" });
      return;
    }

    // Validate admin access code
    if (settings.admin_access_code && settings.admin_access_code.length < 6) {
      toast({ 
        title: "Invalid access code", 
        description: "Admin access code must be at least 6 characters", 
        variant: "destructive" 
      });
      return;
    }

    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from("site_settings")
          .upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }

      toast({ title: "Settings saved" });
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
          Save
        </Button>
      </div>

      <AdminSettingsNav />

      {/* Admin Access Code */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          Admin Panel Access Code
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Set a code that writers, moderators, and admins must enter to access the admin panel.
          Leave empty to disable this requirement.
        </p>
        <div className="space-y-2">
          <Label>Access Code (minimum 6 characters)</Label>
          <Input
            type="text"
            value={settings.admin_access_code}
            onChange={(e) => setSettings({ ...settings, admin_access_code: e.target.value })}
            placeholder="Enter a secure code..."
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground">
            {settings.admin_access_code 
              ? `Current code: ${settings.admin_access_code.length} characters` 
              : "No access code set - admin panel is accessible without code"}
          </p>
        </div>
      </motion.div>

      {/* Stream Links */}
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

      {/* Social Links */}
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
    </div>
  );
}
