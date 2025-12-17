import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Tv, Loader2, Info, Radio, ExternalLink, Eye, EyeOff, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  show_live_badge_on_stream_page: boolean;
}

const defaultSettings: StreamSettings = {
  stream_platform: "twitch",
  stream_channel: "",
  stream_enabled: false,
  stream_title: "Live Stream",
  stream_description: "",
  is_live: false,
  live_platform: "twitch",
  show_live_badge_on_stream_page: true,
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

  const getChannelUrl = () => {
    if (!settings.stream_channel) return "#";
    if (settings.stream_platform === "twitch") {
      return `https://twitch.tv/${settings.stream_channel}`;
    } else if (settings.stream_platform === "kick") {
      return `https://kick.com/${settings.stream_channel}`;
    }
    return "#";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Stream Settings</h1>
          <p className="text-muted-foreground">Configure your embedded live stream and live status</p>
        </div>
        <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Quick Status */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="glass rounded-2xl p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              settings.is_live 
                ? "bg-red-500/20 border border-red-500/30" 
                : "bg-secondary"
            }`}>
              <Radio className={`w-7 h-7 ${settings.is_live ? "text-red-500" : "text-muted-foreground"}`} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Stream Status</h2>
                {settings.is_live ? (
                  <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                ) : (
                  <Badge variant="secondary">Offline</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {settings.is_live 
                  ? `Currently live on ${settings.live_platform === "kick" ? "Kick" : "Twitch"}`
                  : "Not currently streaming"}
              </p>
            </div>
          </div>
          {settings.stream_channel && (
            <Button variant="outline" asChild className="gap-2">
              <a href={getChannelUrl()} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Visit Channel
              </a>
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Live Status Controls */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.05 }}
            className="glass rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500" />
              Live Status Badge
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Show a live badge on your site when you're streaming
            </p>

            <div className="space-y-3">
              <div 
                className={`flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer ${
                  settings.is_live && settings.live_platform === "twitch" 
                    ? "bg-purple-500/10 border-purple-500/30" 
                    : "bg-secondary/50 border-transparent hover:border-border"
                }`}
                onClick={() => setSettings({ ...settings, is_live: !(settings.is_live && settings.live_platform === "twitch"), live_platform: "twitch" })}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
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

              <div 
                className={`flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer ${
                  settings.is_live && settings.live_platform === "kick" 
                    ? "bg-green-500/10 border-green-500/30" 
                    : "bg-secondary/50 border-transparent hover:border-border"
                }`}
                onClick={() => setSettings({ ...settings, is_live: !(settings.is_live && settings.live_platform === "kick"), live_platform: "kick" })}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
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

              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div>
                  <p className="font-medium">Show Badge on Stream Page</p>
                  <p className="text-sm text-muted-foreground">Display LIVE badge next to stream title</p>
                </div>
                <Switch
                  checked={settings.show_live_badge_on_stream_page}
                  onCheckedChange={(checked) => setSettings({ 
                    ...settings, 
                    show_live_badge_on_stream_page: checked
                  })}
                />
              </div>
            </div>
          </motion.div>

          {/* Stream Configuration */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Tv className="w-5 h-5 text-primary" />
              Stream Configuration
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  {settings.stream_enabled ? (
                    <Eye className="w-5 h-5 text-green-500" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Enable Stream Page</p>
                    <p className="text-sm text-muted-foreground">Show or hide the stream page</p>
                  </div>
                </div>
                <Switch
                  checked={settings.stream_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, stream_enabled: checked })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="twitch">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          Twitch
                        </div>
                      </SelectItem>
                      <SelectItem value="kick">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Kick
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Channel Name</Label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={settings.stream_channel}
                      onChange={(e) => setSettings({ ...settings, stream_channel: e.target.value })}
                      placeholder={settings.stream_platform === "twitch" ? "your_channel" : "your_channel"}
                      className="pl-9"
                    />
                  </div>
                </div>
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
            </div>
          </motion.div>
        </div>

        {/* Right Column - Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-6 h-fit"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Live Preview
          </h3>
          
          {settings.stream_channel && settings.stream_enabled ? (
            <div className="space-y-4">
              <div className="aspect-video rounded-xl overflow-hidden bg-black border border-border">
                <iframe
                  src={getPreviewUrl() || ""}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media; fullscreen"
                />
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Stream is configured and ready
                </p>
              </div>
            </div>
          ) : (
            <div className="aspect-video rounded-xl bg-secondary/50 border border-dashed border-border flex items-center justify-center">
              <div className="text-center p-6">
                <Tv className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium mb-1">No Preview Available</p>
                <p className="text-sm text-muted-foreground">
                  Enter a channel name and enable the stream page to see a preview
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
