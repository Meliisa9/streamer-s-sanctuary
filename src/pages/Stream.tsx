import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Tv, ExternalLink, Maximize2, Monitor, Square, Radio, Users, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type StreamSize = "small" | "theater" | "fullscreen";

export default function Stream() {
  const [streamSize, setStreamSize] = useState<StreamSize>("theater");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["stream-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["stream_platform", "stream_channel", "stream_enabled", "stream_title", "stream_description", "is_live", "live_platform", "show_live_badge_on_stream_page"]);
      if (error) throw error;
      const settingsMap: Record<string, any> = {};
      data?.forEach((row) => {
        settingsMap[row.key] = row.value;
      });
      return settingsMap;
    },
  });

  const platform = settings?.stream_platform || "twitch";
  const channel = settings?.stream_channel || "";
  const isEnabled = settings?.stream_enabled !== false;
  const title = settings?.stream_title || "Live Stream";
  const description = settings?.stream_description || "";
  const isLive = settings?.is_live === true;
  const showLiveBadge = settings?.show_live_badge_on_stream_page !== false;

  const getEmbedUrl = () => {
    if (!channel) return null;
    const hostname = window.location.hostname;
    
    if (platform === "twitch") {
      return `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${hostname}&muted=false`;
    } else if (platform === "kick") {
      return `https://player.kick.com/${encodeURIComponent(channel)}`;
    }
    return null;
  };

  const getChatUrl = () => {
    if (!channel) return null;
    const hostname = window.location.hostname;
    
    if (platform === "twitch") {
      return `https://www.twitch.tv/embed/${encodeURIComponent(channel)}/chat?parent=${hostname}&darkpopout`;
    }
    return null;
  };

  const getChannelUrl = () => {
    if (!channel) return "#";
    if (platform === "twitch") {
      return `https://twitch.tv/${channel}`;
    } else if (platform === "kick") {
      return `https://kick.com/${channel}`;
    }
    return "#";
  };

  const embedUrl = getEmbedUrl();
  const chatUrl = getChatUrl();

  const getSizeClasses = () => {
    switch (streamSize) {
      case "small":
        return "max-w-7xl mx-auto";
      case "fullscreen":
        return "fixed inset-0 z-50 bg-black";
      case "theater":
      default:
        return "w-full";
    }
  };

  const getAspectClasses = () => {
    if (streamSize === "fullscreen") {
      return "w-full h-full";
    }
    return "aspect-video w-full";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="aspect-video rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
              <Tv className="w-7 h-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
                {isLive && showLiveBadge && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium animate-pulse">
                    <Radio className="w-3.5 h-3.5" />
                    LIVE
                  </span>
                )}
              </div>
              {description && <p className="text-muted-foreground mt-1">{description}</p>}
            </div>
          </div>

          {channel && isEnabled && (
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${
                platform === "twitch" 
                  ? "bg-purple-600/20 text-purple-400 border border-purple-500/20" 
                  : "bg-green-600/20 text-green-400 border border-green-500/20"
              }`}>
                {platform === "twitch" ? "Twitch" : "Kick"}
                <span className="text-muted-foreground">@{channel}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {!isEnabled || !channel ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-16 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-6">
            <Tv className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Stream Not Available</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The stream is currently offline. Check back later for live content!
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Controls Bar */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <ToggleGroup 
                  type="single" 
                  value={streamSize} 
                  onValueChange={(value) => value && setStreamSize(value as StreamSize)}
                  className="bg-secondary/50 rounded-lg p-1"
                >
                  <ToggleGroupItem value="small" aria-label="Small view" className="gap-2 data-[state=on]:bg-primary/20">
                    <Square className="w-4 h-4" />
                    <span className="hidden sm:inline">Compact</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="theater" aria-label="Theater mode" className="gap-2 data-[state=on]:bg-primary/20">
                    <Monitor className="w-4 h-4" />
                    <span className="hidden sm:inline">Theater</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="fullscreen" aria-label="Fullscreen" className="gap-2 data-[state=on]:bg-primary/20">
                    <Maximize2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Fullscreen</span>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              
              <Button variant="outline" asChild className="gap-2">
                <a href={getChannelUrl()} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Open in {platform === "twitch" ? "Twitch" : "Kick"}</span>
                  <span className="sm:hidden">Open</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Stream Player */}
          <div className={`${getSizeClasses()} transition-all duration-300`}>
            <div className={`${streamSize === "fullscreen" ? "h-full" : ""}`}>
              {streamSize === "theater" && chatUrl ? (
                // Theater mode with chat
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-3">
                    <div className="glass rounded-2xl overflow-hidden">
                      <div className="aspect-video">
                        <iframe
                          src={embedUrl || ""}
                          className="w-full h-full"
                          allowFullScreen
                          allow="autoplay; encrypted-media; fullscreen"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <div className="glass rounded-2xl overflow-hidden h-full min-h-[400px]">
                      <div className="p-3 border-b border-border flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">Live Chat</span>
                      </div>
                      <iframe
                        src={chatUrl}
                        className="w-full h-[calc(100%-48px)]"
                        style={{ minHeight: "350px" }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Small or fullscreen mode
                <div className={`glass overflow-hidden ${streamSize === "fullscreen" ? "rounded-none h-full" : "rounded-2xl"}`}>
                  <div className={getAspectClasses()}>
                    <iframe
                      src={embedUrl || ""}
                      className="w-full h-full"
                      allowFullScreen
                      allow="autoplay; encrypted-media; fullscreen"
                    />
                  </div>
                </div>
              )}
              
              {/* Exit fullscreen button */}
              {streamSize === "fullscreen" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="fixed top-4 right-4 z-50 gap-2 shadow-lg"
                  onClick={() => setStreamSize("theater")}
                >
                  <Square className="w-4 h-4" />
                  Exit Fullscreen
                </Button>
              )}
            </div>
          </div>

          {/* Stream Info Cards */}
          {streamSize !== "fullscreen" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-xl p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Join the Community</h3>
                    <p className="text-sm text-muted-foreground">Chat with other viewers live</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Follow the channel to get notified when streams go live and join the conversation in chat!
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass rounded-xl p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Stream Schedule</h3>
                    <p className="text-sm text-muted-foreground">Never miss a stream</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Check out our events page for upcoming stream schedules and special events.
                </p>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}