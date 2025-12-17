import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Tv, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Stream() {
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
      // Twitch requires the parent parameter to match the embedding domain
      return `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${hostname}&muted=false`;
    } else if (platform === "kick") {
      // Kick uses a different embed format
      return `https://kick.com/${encodeURIComponent(channel)}/embed`;
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
          <div className="glass rounded-2xl overflow-hidden">
            <div className="aspect-video w-full">
              <iframe
                src={embedUrl || ""}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${platform === "twitch" ? "bg-purple-600/20 text-purple-400" : "bg-green-600/20 text-green-400"}`}>
                {platform === "twitch" ? "Twitch" : "Kick"}
              </span>
              <span className="text-muted-foreground">@{channel}</span>
            </div>
            <Button variant="outline" asChild>
              <a href={getChannelUrl()} target="_blank" rel="noopener noreferrer" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Open in {platform === "twitch" ? "Twitch" : "Kick"}
              </a>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
