import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Tv, ExternalLink, Maximize2, Monitor, Square } from "lucide-react";
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
        .in("key", ["stream_platform", "stream_channel", "stream_enabled", "stream_title", "stream_description"]);
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

  const getEmbedUrl = () => {
    if (!channel) return null;
    const hostname = window.location.hostname;
    
    if (platform === "twitch") {
      return `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${hostname}&muted=false`;
    } else if (platform === "kick") {
      // Kick embed URL - must use player subdomain
      return `https://player.kick.com/${encodeURIComponent(channel)}`;
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

  const getSizeClasses = () => {
    switch (streamSize) {
      case "small":
        // Medium size - larger than before, but still clearly smaller than theater mode
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Tv className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
        </div>
      </motion.div>

      {!isEnabled || !channel ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <Tv className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Stream Not Available</h2>
          <p className="text-muted-foreground">Check back later for live content!</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Size Controls */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${platform === "twitch" ? "bg-purple-600/20 text-purple-400" : "bg-green-600/20 text-green-400"}`}>
                {platform === "twitch" ? "Twitch" : "Kick"}
              </span>
              <span className="text-muted-foreground">@{channel}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <ToggleGroup type="single" value={streamSize} onValueChange={(value) => value && setStreamSize(value as StreamSize)}>
                <ToggleGroupItem value="small" aria-label="Small view" className="gap-2">
                  <Square className="w-4 h-4" />
                  <span className="hidden sm:inline">Small</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="theater" aria-label="Theater mode" className="gap-2">
                  <Monitor className="w-4 h-4" />
                  <span className="hidden sm:inline">Theater</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="fullscreen" aria-label="Fullscreen" className="gap-2">
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </ToggleGroupItem>
              </ToggleGroup>
              
              <Button variant="outline" asChild>
                <a href={getChannelUrl()} target="_blank" rel="noopener noreferrer" className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Open in {platform === "twitch" ? "Twitch" : "Kick"}</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Stream Player */}
          <div className={`${getSizeClasses()} transition-all duration-300`}>
            <div className={`glass rounded-2xl overflow-hidden ${streamSize === "fullscreen" ? "rounded-none h-full" : ""}`}>
              <div className={getAspectClasses()}>
                <iframe
                  src={embedUrl || ""}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media; fullscreen"
                />
              </div>
            </div>
            
            {/* Exit fullscreen button */}
            {streamSize === "fullscreen" && (
              <Button
                variant="secondary"
                size="sm"
                className="fixed top-4 right-4 z-50 gap-2"
                onClick={() => setStreamSize("theater")}
              >
                <Square className="w-4 h-4" />
                Exit Fullscreen
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}