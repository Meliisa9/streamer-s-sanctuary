import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Save, Tv, Loader2, Info, Radio, ExternalLink, Eye, EyeOff, Link2, 
  RefreshCw, Clock, Zap, Activity, Settings2, Globe, Play, Pause,
  CheckCircle, XCircle, AlertCircle, TrendingUp, Users, Wifi
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, isValid, parseISO } from "date-fns";

interface StreamSettings {
  stream_platform: string;
  stream_channel: string;
  stream_enabled: boolean;
  stream_title: string;
  stream_description: string;
  is_live: boolean;
  live_platform: "twitch" | "kick";
  show_live_badge_on_stream_page: boolean;
  auto_detect_enabled: boolean;
  twitch_channel: string;
  kick_channel: string;
  last_check: string | null;
  check_interval_minutes: number;
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
  auto_detect_enabled: false,
  twitch_channel: "",
  kick_channel: "",
  last_check: null,
  check_interval_minutes: 5,
};

interface LinkSettings {
  twitch_url: string;
  kick_url: string;
  youtube_url: string;
  twitter_url: string;
  discord_url: string;
  instagram_url: string;
  tiktok_url: string;
  website_url: string;
}

const defaultLinkSettings: LinkSettings = {
  twitch_url: "",
  kick_url: "",
  youtube_url: "",
  twitter_url: "",
  discord_url: "",
  instagram_url: "",
  tiktok_url: "",
  website_url: "",
};

export default function AdminStream() {
  const [settings, setSettings] = useState<StreamSettings>(defaultSettings);
  const [linkSettings, setLinkSettings] = useState<LinkSettings>(defaultLinkSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingStream, setIsCheckingStream] = useState(false);
  const [activeTab, setActiveTab] = useState("status");
  const { toast } = useToast();
  const { isAdmin, isModerator } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");
      if (error) throw error;

      const loadedSettings: StreamSettings = { ...defaultSettings };
      const loadedLinkSettings: LinkSettings = { ...defaultLinkSettings };
      
      data?.forEach((row) => {
        // Stream settings
        if (row.key in loadedSettings) {
          const key = row.key as keyof StreamSettings;
          if (typeof defaultSettings[key] === "boolean") {
            (loadedSettings as Record<string, any>)[key] = row.value === true || row.value === "true";
          } else if (typeof defaultSettings[key] === "number") {
            (loadedSettings as Record<string, any>)[key] = Number(row.value) || defaultSettings[key];
          } else {
            (loadedSettings as Record<string, any>)[key] = row.value ?? defaultSettings[key];
          }
        }
        // Link settings
        if (row.key in loadedLinkSettings) {
          const key = row.key as keyof LinkSettings;
          (loadedLinkSettings as Record<string, any>)[key] = row.value ?? defaultLinkSettings[key];
        }
      });
      
      setSettings(loadedSettings);
      setLinkSettings(loadedLinkSettings);
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
      // Auto-sync channel names and social links based on stream config
      const updatedSettings = { ...settings };
      const updatedLinkSettings = { ...linkSettings };
      
      // If stream channel is set, auto-configure detection channels and social links
      if (settings.stream_channel) {
        if (settings.stream_platform === "twitch") {
          updatedSettings.twitch_channel = settings.stream_channel;
          updatedLinkSettings.twitch_url = `https://twitch.tv/${settings.stream_channel}`;
        } else if (settings.stream_platform === "kick") {
          updatedSettings.kick_channel = settings.stream_channel;
          updatedLinkSettings.kick_url = `https://kick.com/${settings.stream_channel}`;
        }
        // Auto-enable detection if a channel is configured
        updatedSettings.auto_detect_enabled = true;
      }
      
      // Save stream settings
      for (const [key, value] of Object.entries(updatedSettings)) {
        const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }
      // Save link settings
      for (const [key, value] of Object.entries(updatedLinkSettings)) {
        const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }
      
      // Update local state to reflect auto-synced values
      setSettings(updatedSettings);
      setLinkSettings(updatedLinkSettings);
      
      toast({ title: "Settings saved successfully", description: "Auto Detection and Social Links have been synced." });
    } catch (error: any) {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const checkStreamStatus = async () => {
    setIsCheckingStream(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-stream-status");
      if (error) throw error;
      
      toast({ 
        title: "Stream status checked", 
        description: data?.is_live ? `Live on ${data.platform}!` : "Currently offline" 
      });
      
      // Refresh settings to get updated status
      await fetchSettings();
    } catch (error: any) {
      toast({ title: "Error checking stream", description: error.message, variant: "destructive" });
    } finally {
      setIsCheckingStream(false);
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
          <h1 className="text-3xl font-bold">Live Stream & Social Links</h1>
          <p className="text-muted-foreground">Configure your embedded stream, live status, and social media links</p>
        </div>
        <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Quick Status Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="glass rounded-2xl p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center relative ${
              settings.is_live 
                ? "bg-red-500/20 border-2 border-red-500/50" 
                : "bg-secondary border border-border"
            }`}>
              {settings.is_live && (
                <div className="absolute inset-0 rounded-2xl bg-red-500/20 animate-ping" />
              )}
              <Radio className={`w-8 h-8 ${settings.is_live ? "text-red-500" : "text-muted-foreground"}`} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">Stream Status</h2>
                {settings.is_live ? (
                  <Badge className="bg-red-500 text-white animate-pulse gap-1">
                    <div className="w-2 h-2 rounded-full bg-white" />
                    LIVE
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    Offline
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {settings.is_live 
                  ? `Currently live on ${settings.live_platform === "kick" ? "Kick" : "Twitch"}`
                  : "Not currently streaming"}
              </p>
              {(() => {
                if (!settings.last_check) return null;
                const parsed = parseISO(settings.last_check);
                if (!isValid(parsed)) return null;
                return (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last checked {formatDistanceToNow(parsed, { addSuffix: true })}
                  </p>
                );
              })()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {settings.auto_detect_enabled && (
              <Button 
                variant="outline" 
                onClick={checkStreamStatus} 
                disabled={isCheckingStream}
                className="gap-2"
              >
                {isCheckingStream ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Check Now
              </Button>
            )}
            {settings.stream_channel && (
              <Button variant="outline" asChild className="gap-2">
                <a href={getChannelUrl()} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Visit Channel
                </a>
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start bg-secondary/30 p-1 rounded-xl flex-wrap">
          <TabsTrigger value="status" className="gap-2">
            <Radio className="w-4 h-4" />
            Live Status
          </TabsTrigger>
          <TabsTrigger value="stream" className="gap-2">
            <Tv className="w-4 h-4" />
            Stream Config
          </TabsTrigger>
          <TabsTrigger value="auto" className="gap-2">
            <Zap className="w-4 h-4" />
            Auto Detection
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-2">
            <Link2 className="w-4 h-4" />
            Social Links
          </TabsTrigger>
        </TabsList>

        {/* Live Status Tab */}
        <TabsContent value="status" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Manual Live Toggle */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="glass rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Manual Live Controls
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manually toggle your live status when automatic detection is off
              </p>

              <div className="space-y-3">
                <div 
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    settings.is_live && settings.live_platform === "twitch" 
                      ? "bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/10" 
                      : "bg-secondary/50 border-transparent hover:border-border"
                  }`}
                  onClick={() => setSettings({ ...settings, is_live: !(settings.is_live && settings.live_platform === "twitch"), live_platform: "twitch" })}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      settings.is_live && settings.live_platform === "twitch" 
                        ? "bg-purple-500/20" 
                        : "bg-secondary"
                    }`}>
                      <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Live on Twitch</p>
                      <p className="text-sm text-muted-foreground">Show "LIVE" badge with purple indicator</p>
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
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    settings.is_live && settings.live_platform === "kick" 
                      ? "bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/10" 
                      : "bg-secondary/50 border-transparent hover:border-border"
                  }`}
                  onClick={() => setSettings({ ...settings, is_live: !(settings.is_live && settings.live_platform === "kick"), live_platform: "kick" })}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      settings.is_live && settings.live_platform === "kick" 
                        ? "bg-green-500/20" 
                        : "bg-secondary"
                    }`}>
                      <span className="text-green-400 font-bold text-lg">K</span>
                    </div>
                    <div>
                      <p className="font-medium">Live on Kick</p>
                      <p className="text-sm text-muted-foreground">Show "LIVE" badge with green indicator</p>
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
              </div>
            </motion.div>

            {/* Badge Settings */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.05 }}
              className="glass rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                Badge Display Settings
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Show Badge on Stream Page</p>
                      <p className="text-sm text-muted-foreground">Display LIVE indicator on embedded stream</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.show_live_badge_on_stream_page}
                    onCheckedChange={(checked) => setSettings({ 
                      ...settings, 
                      show_live_badge_on_stream_page: checked
                    })}
                  />
                </div>

                {/* Preview */}
                <div className="p-4 rounded-xl bg-secondary/30 border border-dashed border-border">
                  <p className="text-sm text-muted-foreground mb-3">Badge Preview:</p>
                  <div className="flex items-center gap-4">
                    {settings.is_live ? (
                      <>
                        <Badge className={`${settings.live_platform === "kick" ? "bg-green-500" : "bg-red-500"} text-white gap-1`}>
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          LIVE on {settings.live_platform === "kick" ? "Kick" : "Twitch"}
                        </Badge>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-500">Active</span>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary" className="gap-1">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                          Offline
                        </Badge>
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Not showing</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </TabsContent>

        {/* Stream Config Tab */}
        <TabsContent value="stream" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stream Configuration */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="glass rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Tv className="w-5 h-5 text-primary" />
                Embedded Stream Settings
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
                      <p className="text-sm text-muted-foreground">Show or hide /stream page</p>
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
                    <Input
                      value={settings.stream_channel}
                      onChange={(e) => setSettings({ ...settings, stream_channel: e.target.value })}
                      placeholder="your_channel"
                    />
                  </div>
                </div>

                {settings.stream_platform === "kick" && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-200">
                      Kick embeds use player.kick.com. Enter just the channel name.
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

            {/* Preview */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.05 }}
              className="glass rounded-2xl p-6 h-fit"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
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
                      <CheckCircle className="w-4 h-4" />
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
        </TabsContent>

        {/* Auto Detection Tab */}
        <TabsContent value="auto" className="space-y-6 mt-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Automatic Stream Detection
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically detect when you go live on Twitch or Kick
                </p>
              </div>
              <Switch
                checked={settings.auto_detect_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_detect_enabled: checked })}
              />
            </div>

            {settings.auto_detect_enabled ? (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <Wifi className="w-5 h-5 text-green-500 animate-pulse" />
                    <div>
                      <p className="font-medium text-green-400">Auto-Detection Active</p>
                      <p className="text-sm text-muted-foreground">
                        Your stream status will be checked every {settings.check_interval_minutes} minutes
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                      </svg>
                      Twitch Channel
                    </Label>
                    <Input
                      value={settings.twitch_channel}
                      onChange={(e) => setSettings({ ...settings, twitch_channel: e.target.value })}
                      placeholder="your_twitch_channel"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span className="text-green-400 font-bold text-sm">K</span>
                      Kick Channel
                    </Label>
                    <Input
                      value={settings.kick_channel}
                      onChange={(e) => setSettings({ ...settings, kick_channel: e.target.value })}
                      placeholder="your_kick_channel"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Check Interval (minutes)</Label>
                  <Select
                    value={String(settings.check_interval_minutes)}
                    onValueChange={(value) => setSettings({ ...settings, check_interval_minutes: Number(value) })}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Every 1 minute</SelectItem>
                      <SelectItem value="2">Every 2 minutes</SelectItem>
                      <SelectItem value="5">Every 5 minutes</SelectItem>
                      <SelectItem value="10">Every 10 minutes</SelectItem>
                      <SelectItem value="15">Every 15 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-200">
                    Auto-detection uses the Twitch Helix API and Kick API to check if your channels are live.
                    When detected, it will automatically update your live status badge site-wide.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-secondary/30 border border-dashed border-border">
                <Pause className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium mb-2">Auto-Detection Disabled</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Enable auto-detection to automatically update your live status
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSettings({ ...settings, auto_detect_enabled: true })}
                >
                  Enable Auto-Detection
                </Button>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Social Links Tab */}
        <TabsContent value="links" className="space-y-6 mt-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="glass rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Social Media Links
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Configure your social media links that appear in the footer and throughout the site
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Streaming Platforms */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Streaming Platforms</h4>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                    </svg>
                    Twitch
                  </Label>
                  <Input
                    value={linkSettings.twitch_url}
                    onChange={(e) => setLinkSettings({ ...linkSettings, twitch_url: e.target.value })}
                    placeholder="https://twitch.tv/username"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="text-green-400 font-bold text-sm">K</span>
                    Kick
                  </Label>
                  <Input
                    value={linkSettings.kick_url}
                    onChange={(e) => setLinkSettings({ ...linkSettings, kick_url: e.target.value })}
                    placeholder="https://kick.com/username"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    YouTube
                  </Label>
                  <Input
                    value={linkSettings.youtube_url}
                    onChange={(e) => setLinkSettings({ ...linkSettings, youtube_url: e.target.value })}
                    placeholder="https://youtube.com/@username"
                  />
                </div>
              </div>

              {/* Social Media */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Social Media</h4>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    X (Twitter)
                  </Label>
                  <Input
                    value={linkSettings.twitter_url}
                    onChange={(e) => setLinkSettings({ ...linkSettings, twitter_url: e.target.value })}
                    placeholder="https://x.com/username"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"/>
                    </svg>
                    Discord
                  </Label>
                  <Input
                    value={linkSettings.discord_url}
                    onChange={(e) => setLinkSettings({ ...linkSettings, discord_url: e.target.value })}
                    placeholder="https://discord.gg/invite"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                    </svg>
                    Instagram
                  </Label>
                  <Input
                    value={linkSettings.instagram_url}
                    onChange={(e) => setLinkSettings({ ...linkSettings, instagram_url: e.target.value })}
                    placeholder="https://instagram.com/username"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                    TikTok
                  </Label>
                  <Input
                    value={linkSettings.tiktok_url}
                    onChange={(e) => setLinkSettings({ ...linkSettings, tiktok_url: e.target.value })}
                    placeholder="https://tiktok.com/@username"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Website
                </Label>
                <Input
                  value={linkSettings.website_url}
                  onChange={(e) => setLinkSettings({ ...linkSettings, website_url: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}