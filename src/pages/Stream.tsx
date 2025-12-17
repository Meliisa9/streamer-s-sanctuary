import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Tv, ExternalLink, Maximize2, Monitor, Square, Radio, Users, MessageSquare, Bell, Calendar, Clock, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type StreamSize = "compact" | "theater" | "fullscreen";
type NonFullscreenSize = "compact" | "theater";

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

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-6">
        <div className="container mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="aspect-video rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${streamSize === "fullscreen" ? "p-0" : "py-8 px-6"}`}>
      {streamSize === "fullscreen" ? (
        // Fullscreen Mode
        <div className="fixed inset-0 z-50 bg-black">
          <iframe
            src={embedUrl || ""}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen"
          />
          <Button
            variant="secondary"
            size="sm"
            className="fixed top-4 right-4 z-50 gap-2 shadow-lg bg-background/90 backdrop-blur"
            onClick={() => setStreamSize("theater")}
          >
            <Square className="w-4 h-4" />
            Exit Fullscreen
          </Button>
        </div>
      ) : (
        <div className="container mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/25">
                  <Tv className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
                    {isLive && showLiveBadge && (
                      <Badge variant="destructive" className="animate-pulse gap-1.5">
                        <Radio className="w-3 h-3" />
                        LIVE
                      </Badge>
                    )}
                  </div>
                  {description && <p className="text-muted-foreground max-w-xl">{description}</p>}
                </div>
              </div>

              {channel && isEnabled && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 ${
                    platform === "twitch" 
                      ? "bg-purple-600/20 text-purple-400 border border-purple-500/30" 
                      : "bg-green-600/20 text-green-400 border border-green-500/30"
                  }`}>
                    <span className="font-semibold">{platform === "twitch" ? "Twitch" : "Kick"}</span>
                    <span className="text-foreground/80">@{channel}</span>
                  </div>
                  <Button variant="outline" asChild className="gap-2">
                    <a href={getChannelUrl()} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                      Open Channel
                    </a>
                  </Button>
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
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center mx-auto mb-6">
                <Tv className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Stream Currently Offline</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                The stream is not available right now. Follow us to get notified when we go live!
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" className="gap-2">
                  <Bell className="w-4 h-4" />
                  Get Notified
                </Button>
                <Button variant="secondary" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  View Schedule
                </Button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* View Controls */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="glass rounded-xl p-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground mr-2">View:</span>
                    <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                      <Button
                        variant={streamSize === "compact" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setStreamSize("compact")}
                        className="gap-2"
                      >
                        <Square className="w-4 h-4" />
                        <span className="hidden sm:inline">Compact</span>
                      </Button>
                      <Button
                        variant={streamSize === "theater" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setStreamSize("theater")}
                        className="gap-2"
                      >
                        <Monitor className="w-4 h-4" />
                        <span className="hidden sm:inline">Theater</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStreamSize("fullscreen")}
                        className="gap-2"
                      >
                        <Maximize2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Fullscreen</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Stream refreshes automatically</span>
                  </div>
                </div>
              </motion.div>

              {/* Stream Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
              {streamSize === "theater" && chatUrl ? (
                  <div className="flex flex-col xl:flex-row gap-4" style={{ height: "560px" }}>
                    {/* Main Player - Much wider in theater mode */}
                    <div className="flex-[4] min-w-0">
                      <div className="glass rounded-2xl overflow-hidden h-full">
                        <iframe
                          src={embedUrl || ""}
                          className="w-full h-full"
                          allowFullScreen
                          allow="autoplay; encrypted-media; fullscreen"
                        />
                      </div>
                    </div>

                    {/* Chat Sidebar - Same height as player */}
                    <div className="hidden xl:block w-[340px] flex-shrink-0">
                      <div className="glass rounded-2xl overflow-hidden h-full flex flex-col">
                        <div className="p-3 border-b border-border bg-secondary/30">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">Live Chat</span>
                          </div>
                        </div>
                        <iframe
                          src={chatUrl}
                          className="w-full flex-1"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`glass rounded-2xl overflow-hidden ${streamSize === "compact" ? "max-w-4xl mx-auto" : ""}`}>
                    <div className="aspect-video">
                      <iframe
                        src={embedUrl || ""}
                        className="w-full h-full"
                        allowFullScreen
                        allow="autoplay; encrypted-media; fullscreen"
                      />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Info Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="glass rounded-xl p-5 hover:border-primary/30 transition-colors group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Join the Community</h3>
                      <p className="text-sm text-muted-foreground">Chat with viewers</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Follow the channel to get notified when streams go live and join the conversation!
                  </p>
                </div>

                <div className="glass rounded-xl p-5 hover:border-primary/30 transition-colors group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                      <Calendar className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Stream Schedule</h3>
                      <p className="text-sm text-muted-foreground">Never miss a stream</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Check the events page for upcoming schedules and special streaming events.
                  </p>
                </div>

                <div className="glass rounded-xl p-5 hover:border-primary/30 transition-colors group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                      <Play className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Watch Highlights</h3>
                      <p className="text-sm text-muted-foreground">Best moments</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Missed the stream? Check out the videos page for highlights and VODs.
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
