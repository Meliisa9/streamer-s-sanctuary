import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Tv, Loader2, Info, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface StreamSettings {
  stream_platform: string;
  stream_channel: string;
  stream_enabled: boolean;
  stream_title: string;
  stream_description: string;
  is_live: boolean;
  live_platform: "twitch" | "kick";
}

const defaultSettings: StreamSettings = {
  stream_platform: "twitch",
  stream_channel: "",
  stream_enabled: false,
  stream_title: "Live Stream",
  stream_description: "",
  is_live: false,
  live_platform: "twitch",
};

export default function AdminStream() {
  const [settings, setSettings] = useState<StreamSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { isAdmin, isModerator } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", Object.keys(defaultSettings));
      if (error) throw error;

      const loadedSettings: StreamSettings = { ...defaultSettings };
      data?.forEach((row) => {
        const key = row.key as keyof StreamSettings;
        if (key in loadedSettings) {
          if (typeof defaultSettings[key] === "boolean") {
            (loadedSettings as Record<string, any>)[key] = row.value === true || row.value === "true";
          } else {
            (loadedSettings as Record<string, any>)[key] = row.value ?? defaultSettings[key];
          }
        }
      });
      setSettings(loadedSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!isAdmin && !isModerator) {
      toast({ title: "Only admins and moderators can change settings", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }
      toast({ title: "Stream settings saved" });
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

  const getPreviewUrl = () => {
    if (!settings.stream_channel) return null;
    const hostname = window.location.hostname;
    
    if (settings.stream_platform === "twitch") {
      return `https://player.twitch.tv/?channel=${encodeURIComponent(settings.stream_channel)}&parent=${hostname}&muted=false`;
    } else if (settings.stream_platform === "kick") {
      return `https://player.kick.com/${encodeURIComponent(settings.stream_channel)}`;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stream Settings</h1>
          <p className="text-muted-foreground">Configure your embedded live stream and live status</p>
        </div>
        <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Live Status Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Radio className="w-5 h-5 text-destructive" />
          Live Status Badge
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Show a live badge on your site to let visitors know you're streaming
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <div>
                <p className="font-medium">Live on Twitch</p>
                <p className="text-sm text-muted-foreground">Show red "Live on Twitch" badge</p>
              </div>
            </div>
            <Switch
              checked={settings.is_live && settings.live_platform === "twitch"}
              onCheckedChange={(checked) => setSettings({ 
                ...settings, 
                is_live: checked, 
                live_platform: "twitch"
              })}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="font-medium">Live on Kick</p>
                <p className="text-sm text-muted-foreground">Show green "Live on Kick" badge</p>
              </div>
            </div>
            <Switch
              checked={settings.is_live && settings.live_platform === "kick"}
              onCheckedChange={(checked) => setSettings({ 
                ...settings, 
                is_live: checked, 
                live_platform: "kick"
              })}
            />
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm">
              <strong>Current Status:</strong>{" "}
              {settings.is_live 
                ? <span className="text-green-400">Live on {settings.live_platform === "kick" ? "Kick" : "Twitch"}</span>
                : <span className="text-muted-foreground">Offline</span>}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Tv className="w-5 h-5 text-primary" />
            Stream Configuration
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Stream Page</Label>
              <p className="text-sm text-muted-foreground">Show or hide the stream page</p>
            </div>
            <Switch
              checked={settings.stream_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, stream_enabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>Platform</Label>
            <Select
              value={settings.stream_platform}
              onValueChange={(value) => setSettings({ ...settings, stream_platform: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twitch">Twitch</SelectItem>
                <SelectItem value="kick">Kick</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Channel Name</Label>
            <Input
              value={settings.stream_channel}
              onChange={(e) => setSettings({ ...settings, stream_channel: e.target.value })}
              placeholder={settings.stream_platform === "twitch" ? "your_twitch_channel" : "your_kick_channel"}
            />
            <p className="text-xs text-muted-foreground">
              Just the channel name, not the full URL (e.g., "ninja" not "twitch.tv/ninja")
            </p>
          </div>

          {settings.stream_platform === "kick" && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-200">
                Kick embeds use player.kick.com. Enter just the channel name (e.g., "xqc").
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Page Title</Label>
            <Input
              value={settings.stream_title}
              onChange={(e) => setSettings({ ...settings, stream_title: e.target.value })}
              placeholder="Live Stream"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={settings.stream_description}
              onChange={(e) => setSettings({ ...settings, stream_description: e.target.value })}
              rows={3}
              placeholder="Watch our live streams here!"
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Preview</h3>
          {settings.stream_channel && settings.stream_enabled ? (
            <div className="aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                src={getPreviewUrl() || ""}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; fullscreen"
              />
            </div>
          ) : (
            <div className="aspect-video rounded-xl bg-secondary flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Tv className="w-12 h-12 mx-auto mb-2" />
                <p>Enter a channel name and enable to preview</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
