import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, Tv, Loader2, Info, Radio, ExternalLink, Eye, EyeOff, Link2, 
  RefreshCw, Clock, Zap, Activity, Settings2, Globe, Play, Pause,
  CheckCircle, XCircle, AlertCircle, TrendingUp, Users, Wifi,
  BarChart3, Signal, Volume2, VolumeX, Maximize2, MessageSquare,
  Heart, Share2, Timer, Sparkles, Monitor, Smartphone, ChevronRight,
  Youtube, Twitter, Instagram, MessageCircle, Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import { AdminPageHeader, AdminCard, AdminStatsGrid } from "@/components/admin";

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

const statsCards = [
  { label: "Total Viewers", value: "—", icon: Users, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { label: "Peak Today", value: "—", icon: TrendingUp, color: "text-green-500", bgColor: "bg-green-500/10" },
  { label: "Stream Uptime", value: "—", icon: Timer, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { label: "Engagement", value: "—", icon: Heart, color: "text-pink-500", bgColor: "bg-pink-500/10" },
];

export default function AdminStream() {
  const [settings, setSettings] = useState<StreamSettings>(defaultSettings);
  const [linkSettings, setLinkSettings] = useState<LinkSettings>(defaultLinkSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingStream, setIsCheckingStream] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
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
      const updatedSettings = { ...settings };
      const updatedLinkSettings = { ...linkSettings };
      
      if (settings.stream_channel) {
        if (settings.stream_platform === "twitch") {
          updatedSettings.twitch_channel = settings.stream_channel;
          updatedLinkSettings.twitch_url = `https://twitch.tv/${settings.stream_channel}`;
        } else if (settings.stream_platform === "kick") {
          updatedSettings.kick_channel = settings.stream_channel;
          updatedLinkSettings.kick_url = `https://kick.com/${settings.stream_channel}`;
        }
        updatedSettings.auto_detect_enabled = true;
      }
      
      for (const [key, value] of Object.entries(updatedSettings)) {
        const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }
      for (const [key, value] of Object.entries(updatedLinkSettings)) {
        const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }
      
      setSettings(updatedSettings);
      setLinkSettings(updatedLinkSettings);
      
      toast({ title: "Settings saved successfully" });
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
    <div className="space-y-8">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 p-8"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center ${
              settings.is_live 
                ? "bg-gradient-to-br from-red-500 to-pink-500" 
                : "bg-secondary border border-border"
            }`}>
              {settings.is_live && (
                <>
                  <div className="absolute inset-0 rounded-2xl bg-red-500/50 animate-ping" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-background animate-pulse" />
                </>
              )}
              <Radio className={`w-10 h-10 ${settings.is_live ? "text-white" : "text-muted-foreground"}`} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">Live Stream Control</h1>
                <AnimatePresence mode="wait">
                  {settings.is_live ? (
                    <motion.div
                      key="live"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Badge className="bg-red-500 text-white gap-1.5 px-3 py-1">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        LIVE NOW
                      </Badge>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="offline"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Badge variant="secondary" className="gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                        Offline
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-muted-foreground max-w-xl">
                Manage your stream configuration, live status, auto-detection, and social links all in one place.
              </p>
              {settings.last_check && isValid(parseISO(settings.last_check)) && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Last checked {formatDistanceToNow(parseISO(settings.last_check), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
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
                Check Status
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
            <Button onClick={saveSettings} disabled={isSaving} className="gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All Changes
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <AdminCard className="relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-20 h-20 ${stat.bgColor} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
              <div className="relative flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{settings.is_live ? stat.value : "—"}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </AdminCard>
          </motion.div>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/50 p-1.5 rounded-2xl flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <Activity className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="status" className="gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <Radio className="w-4 h-4" />
            Live Status
          </TabsTrigger>
          <TabsTrigger value="stream" className="gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <Tv className="w-4 h-4" />
            Stream Config
          </TabsTrigger>
          <TabsTrigger value="auto" className="gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <Zap className="w-4 h-4" />
            Auto Detection
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <Link2 className="w-4 h-4" />
            Social Links
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stream Preview Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2"
            >
              <AdminCard className="h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-primary" />
                    Stream Preview
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Monitor className="w-3 h-3" />
                      Desktop
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Smartphone className="w-3 h-3" />
                      Mobile
                    </Badge>
                  </div>
                </div>
                
                {settings.stream_channel && settings.stream_enabled ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-border group">
                      <iframe
                        src={getPreviewUrl() || ""}
                        className="w-full h-full"
                        allowFullScreen
                        allow="autoplay; encrypted-media; fullscreen"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2">
                          {settings.is_live && (
                            <Badge className="bg-red-500 text-white">LIVE</Badge>
                          )}
                          <span className="text-white text-sm font-medium">{settings.stream_title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                            <Volume2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                            <Maximize2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${settings.is_live ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
                        <span className="text-sm text-muted-foreground">
                          {settings.is_live ? "Stream is live and embedded" : "Stream configured but offline"}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="gap-1">
                        <a href="/stream" target="_blank">
                          View Public Page
                          <ChevronRight className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video rounded-2xl bg-gradient-to-br from-secondary/80 to-secondary/40 border-2 border-dashed border-border flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Tv className="w-8 h-8 text-primary" />
                      </div>
                      <p className="font-semibold text-lg mb-2">No Stream Configured</p>
                      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                        Enter a channel name and enable the stream page to see a live preview
                      </p>
                      <Button variant="outline" onClick={() => setActiveTab("stream")}>
                        Configure Stream
                      </Button>
                    </div>
                  </div>
                )}
              </AdminCard>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <AdminCard>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setSettings({ ...settings, is_live: !settings.is_live })}
                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                      settings.is_live
                        ? "border-red-500/50 bg-red-500/10"
                        : "border-border hover:border-green-500/50 hover:bg-green-500/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        settings.is_live ? "bg-red-500/20" : "bg-green-500/20"
                      }`}>
                        {settings.is_live ? (
                          <Pause className="w-5 h-5 text-red-500" />
                        ) : (
                          <Play className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{settings.is_live ? "Go Offline" : "Go Live"}</p>
                        <p className="text-xs text-muted-foreground">
                          {settings.is_live ? "Turn off live status" : "Enable live status badge"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>

                  <button
                    onClick={() => setSettings({ ...settings, stream_enabled: !settings.stream_enabled })}
                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                      settings.stream_enabled
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        settings.stream_enabled ? "bg-primary/20" : "bg-secondary"
                      }`}>
                        {settings.stream_enabled ? (
                          <Eye className="w-5 h-5 text-primary" />
                        ) : (
                          <EyeOff className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{settings.stream_enabled ? "Page Enabled" : "Page Disabled"}</p>
                        <p className="text-xs text-muted-foreground">
                          {settings.stream_enabled ? "/stream page is visible" : "Enable the stream page"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>

                  <button
                    onClick={() => setSettings({ ...settings, auto_detect_enabled: !settings.auto_detect_enabled })}
                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                      settings.auto_detect_enabled
                        ? "border-yellow-500/50 bg-yellow-500/10"
                        : "border-border hover:border-yellow-500/50 hover:bg-yellow-500/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        settings.auto_detect_enabled ? "bg-yellow-500/20" : "bg-secondary"
                      }`}>
                        <Zap className={`w-5 h-5 ${settings.auto_detect_enabled ? "text-yellow-500" : "text-muted-foreground"}`} />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{settings.auto_detect_enabled ? "Auto-Detect On" : "Auto-Detect Off"}</p>
                        <p className="text-xs text-muted-foreground">
                          {settings.auto_detect_enabled ? `Checking every ${settings.check_interval_minutes}m` : "Enable automatic detection"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </AdminCard>

              {/* Platform Status */}
              <AdminCard>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Signal className="w-5 h-5 text-primary" />
                  Platform Status
                </h3>
                <div className="space-y-3">
                  <div className={`p-3 rounded-xl border ${settings.stream_platform === "twitch" ? "border-purple-500/30 bg-purple-500/5" : "border-border"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                        </svg>
                        <span className="font-medium">Twitch</span>
                      </div>
                      {settings.stream_platform === "twitch" && (
                        <Badge className="bg-purple-500/20 text-purple-400">Active</Badge>
                      )}
                    </div>
                    {settings.twitch_channel && (
                      <p className="text-xs text-muted-foreground mt-2 pl-8">
                        @{settings.twitch_channel}
                      </p>
                    )}
                  </div>

                  <div className={`p-3 rounded-xl border ${settings.stream_platform === "kick" ? "border-green-500/30 bg-green-500/5" : "border-border"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-green-400 font-bold text-lg w-5 text-center">K</span>
                        <span className="font-medium">Kick</span>
                      </div>
                      {settings.stream_platform === "kick" && (
                        <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                      )}
                    </div>
                    {settings.kick_channel && (
                      <p className="text-xs text-muted-foreground mt-2 pl-8">
                        @{settings.kick_channel}
                      </p>
                    )}
                  </div>
                </div>
              </AdminCard>
            </motion.div>
          </div>
        </TabsContent>

        {/* Live Status Tab */}
        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <AdminCard>
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Manual Live Controls
                </h3>

                <div className="space-y-4">
                  {/* Twitch Live Toggle */}
                  <div 
                    className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                      settings.is_live && settings.live_platform === "twitch" 
                        ? "bg-gradient-to-r from-purple-500/10 to-purple-500/5 border-purple-500/40 shadow-lg shadow-purple-500/10" 
                        : "bg-secondary/30 border-transparent hover:border-purple-500/30"
                    }`}
                    onClick={() => setSettings({ ...settings, is_live: !(settings.is_live && settings.live_platform === "twitch"), live_platform: "twitch" })}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        settings.is_live && settings.live_platform === "twitch" 
                          ? "bg-purple-500/20" 
                          : "bg-secondary"
                      }`}>
                        <svg className="w-7 h-7 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Live on Twitch</p>
                        <p className="text-sm text-muted-foreground">Show "LIVE" badge with purple indicator</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.is_live && settings.live_platform === "twitch"}
                      onCheckedChange={(checked) => setSettings({ 
                        ...settings, 
                        is_live: checked, 
                        live_platform: "twitch",
                        show_live_badge_on_stream_page: checked
                      })}
                    />
                  </div>

                  {/* Kick Live Toggle */}
                  <div 
                    className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                      settings.is_live && settings.live_platform === "kick" 
                        ? "bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/40 shadow-lg shadow-green-500/10" 
                        : "bg-secondary/30 border-transparent hover:border-green-500/30"
                    }`}
                    onClick={() => setSettings({ ...settings, is_live: !(settings.is_live && settings.live_platform === "kick"), live_platform: "kick" })}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        settings.is_live && settings.live_platform === "kick" 
                          ? "bg-green-500/20" 
                          : "bg-secondary"
                      }`}>
                        <span className="text-green-400 font-bold text-2xl">K</span>
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Live on Kick</p>
                        <p className="text-sm text-muted-foreground">Show "LIVE" badge with green indicator</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.is_live && settings.live_platform === "kick"}
                      onCheckedChange={(checked) => setSettings({ 
                        ...settings, 
                        is_live: checked, 
                        live_platform: "kick",
                        show_live_badge_on_stream_page: checked
                      })}
                    />
                  </div>
                </div>
              </AdminCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <AdminCard>
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" />
                  Badge Display Settings
                </h3>

                <div className="space-y-6">
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
                      onCheckedChange={(checked) => setSettings({ ...settings, show_live_badge_on_stream_page: checked })}
                    />
                  </div>

                  {/* Badge Preview */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-secondary/50 to-secondary/30 border border-border">
                    <p className="text-sm font-medium text-muted-foreground mb-4">Badge Preview</p>
                    <div className="flex items-center gap-4">
                      {settings.is_live ? (
                        <>
                          <Badge className={`${settings.live_platform === "kick" ? "bg-green-500" : "bg-red-500"} text-white gap-1.5 px-4 py-1.5`}>
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            LIVE on {settings.live_platform === "kick" ? "Kick" : "Twitch"}
                          </Badge>
                          <div className="flex items-center gap-2 text-green-500">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">Active</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Badge variant="secondary" className="gap-1.5 px-4 py-1.5">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                            Offline
                          </Badge>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <XCircle className="w-5 h-5" />
                            <span className="text-sm">Not showing</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </AdminCard>
            </motion.div>
          </div>
        </TabsContent>

        {/* Stream Config Tab */}
        <TabsContent value="stream" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <AdminCard>
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Tv className="w-5 h-5 text-primary" />
                  Embedded Stream Settings
                </h3>

                <div className="space-y-5">
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
                        onValueChange={(value) => setSettings({ 
                          ...settings, 
                          stream_platform: value,
                          live_platform: value as "twitch" | "kick"
                        })}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="twitch">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-purple-500" />
                              Twitch
                            </div>
                          </SelectItem>
                          <SelectItem value="kick">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500" />
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
                        className="h-12"
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
                      className="h-12"
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
              </AdminCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <AdminCard className="h-full">
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
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-sm text-green-400 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Stream is configured and ready
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video rounded-xl bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center">
                    <div className="text-center p-6">
                      <Tv className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="font-medium mb-1">No Preview Available</p>
                      <p className="text-sm text-muted-foreground">
                        Enter a channel name and enable the stream page
                      </p>
                    </div>
                  </div>
                )}
              </AdminCard>
            </motion.div>
          </div>
        </TabsContent>

        {/* Auto Detection Tab */}
        <TabsContent value="auto" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminCard>
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
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <Wifi className="w-6 h-6 text-green-500 animate-pulse" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-400">Auto-Detection Active</p>
                        <p className="text-sm text-muted-foreground">
                          Checking every {settings.check_interval_minutes} minutes
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        {settings.stream_platform === "twitch" ? (
                          <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                          </svg>
                        ) : (
                          <span className="text-green-400 font-bold text-sm">K</span>
                        )}
                        {settings.stream_platform === "twitch" ? "Twitch" : "Kick"} Channel
                      </Label>
                      <Input
                        value={settings.stream_platform === "twitch" ? settings.twitch_channel : settings.kick_channel}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          [settings.stream_platform === "twitch" ? "twitch_channel" : "kick_channel"]: e.target.value 
                        })}
                        placeholder={`your_${settings.stream_platform}_channel`}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Check Interval</Label>
                      <Select
                        value={String(settings.check_interval_minutes)}
                        onValueChange={(value) => setSettings({ ...settings, check_interval_minutes: Number(value) })}
                      >
                        <SelectTrigger className="h-12">
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
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-200">
                      Auto-detection uses the Twitch Helix API and Kick API to check if your channels are live.
                      When detected, it will automatically update your live status badge site-wide.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center rounded-2xl bg-secondary/30 border-2 border-dashed border-border">
                  <Pause className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-semibold text-lg mb-2">Auto-Detection Disabled</p>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Enable auto-detection to automatically update your live status when you start streaming
                  </p>
                  <Button onClick={() => setSettings({ ...settings, auto_detect_enabled: true })}>
                    Enable Auto-Detection
                  </Button>
                </div>
              )}
            </AdminCard>
          </motion.div>
        </TabsContent>

        {/* Social Links Tab */}
        <TabsContent value="links" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminCard>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Social Media Links
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Configure your social media links that appear in the footer and throughout the site
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Streaming Platforms - Filter based on configured platform */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Streaming Platforms
                  </h4>
                  
                  <div className="space-y-4">
                    {(settings.stream_platform === "twitch" || !settings.stream_platform) && (
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
                          className="h-11"
                        />
                      </div>
                    )}

                    {(settings.stream_platform === "kick" || !settings.stream_platform) && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <span className="text-green-400 font-bold text-sm">K</span>
                          Kick
                        </Label>
                        <Input
                          value={linkSettings.kick_url}
                          onChange={(e) => setLinkSettings({ ...linkSettings, kick_url: e.target.value })}
                          placeholder="https://kick.com/username"
                          className="h-11"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Youtube className="w-4 h-4 text-red-500" />
                        YouTube
                      </Label>
                      <Input
                        value={linkSettings.youtube_url}
                        onChange={(e) => setLinkSettings({ ...linkSettings, youtube_url: e.target.value })}
                        placeholder="https://youtube.com/@username"
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Social Media
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Twitter className="w-4 h-4 text-sky-400" />
                        Twitter / X
                      </Label>
                      <Input
                        value={linkSettings.twitter_url}
                        onChange={(e) => setLinkSettings({ ...linkSettings, twitter_url: e.target.value })}
                        placeholder="https://twitter.com/username"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-indigo-400" />
                        Discord
                      </Label>
                      <Input
                        value={linkSettings.discord_url}
                        onChange={(e) => setLinkSettings({ ...linkSettings, discord_url: e.target.value })}
                        placeholder="https://discord.gg/invite"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-pink-500" />
                        Instagram
                      </Label>
                      <Input
                        value={linkSettings.instagram_url}
                        onChange={(e) => setLinkSettings({ ...linkSettings, instagram_url: e.target.value })}
                        placeholder="https://instagram.com/username"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        Website
                      </Label>
                      <Input
                        value={linkSettings.website_url}
                        onChange={(e) => setLinkSettings({ ...linkSettings, website_url: e.target.value })}
                        placeholder="https://yourwebsite.com"
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </AdminCard>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}