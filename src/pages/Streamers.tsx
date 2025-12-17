import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Twitch, Youtube, Twitter, Instagram, MessageCircle, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Streamer {
  id: string;
  name: string;
  image_url: string | null;
  description: string | null;
  twitch_url: string | null;
  kick_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  discord_url: string | null;
  instagram_url: string | null;
  is_main_streamer: boolean;
}

export default function Streamers() {
  const [selectedStreamer, setSelectedStreamer] = useState<Streamer | null>(null);

  const { data: streamers, isLoading } = useQuery({
    queryKey: ["streamers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("streamers")
        .select("*")
        .eq("is_active", true)
        .order("is_main_streamer", { ascending: false })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Streamer[];
    },
  });

  const mainStreamers = streamers?.filter((s) => s.is_main_streamer) || [];
  const otherStreamers = streamers?.filter((s) => !s.is_main_streamer) || [];

  const SocialLinks = ({ streamer, size = "default" }: { streamer: Streamer; size?: "default" | "large" }) => {
    const iconSize = size === "large" ? "w-5 h-5" : "w-4 h-4";
    const buttonSize = size === "large" ? "w-11 h-11" : "w-9 h-9";
    
    return (
      <div className="flex gap-2 flex-wrap justify-center">
        {streamer.twitch_url && (
          <a href={streamer.twitch_url} target="_blank" rel="noopener noreferrer" className={`${buttonSize} rounded-lg bg-purple-600/20 hover:bg-purple-600/40 flex items-center justify-center transition-colors`}>
            <Twitch className={`${iconSize} text-purple-400`} />
          </a>
        )}
        {streamer.kick_url && (
          <a href={streamer.kick_url} target="_blank" rel="noopener noreferrer" className={`${buttonSize} rounded-lg bg-green-600/20 hover:bg-green-600/40 flex items-center justify-center transition-colors`}>
            <span className="text-green-400 font-bold text-xs">K</span>
          </a>
        )}
        {streamer.youtube_url && (
          <a href={streamer.youtube_url} target="_blank" rel="noopener noreferrer" className={`${buttonSize} rounded-lg bg-red-600/20 hover:bg-red-600/40 flex items-center justify-center transition-colors`}>
            <Youtube className={`${iconSize} text-red-400`} />
          </a>
        )}
        {streamer.twitter_url && (
          <a href={streamer.twitter_url} target="_blank" rel="noopener noreferrer" className={`${buttonSize} rounded-lg bg-blue-500/20 hover:bg-blue-500/40 flex items-center justify-center transition-colors`}>
            <Twitter className={`${iconSize} text-blue-400`} />
          </a>
        )}
        {streamer.instagram_url && (
          <a href={streamer.instagram_url} target="_blank" rel="noopener noreferrer" className={`${buttonSize} rounded-lg bg-pink-500/20 hover:bg-pink-500/40 flex items-center justify-center transition-colors`}>
            <Instagram className={`${iconSize} text-pink-400`} />
          </a>
        )}
        {streamer.discord_url && (
          <a href={streamer.discord_url} target="_blank" rel="noopener noreferrer" className={`${buttonSize} rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 flex items-center justify-center transition-colors`}>
            <MessageCircle className={`${iconSize} text-indigo-400`} />
          </a>
        )}
      </div>
    );
  };

  const StreamerCard = ({ streamer, isMain = false }: { streamer: Streamer; isMain?: boolean }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setSelectedStreamer(streamer)}
      className={`glass rounded-2xl p-4 cursor-pointer transition-all hover:border-primary/40 ${isMain ? "border border-primary/20" : ""}`}
    >
      <div className="flex flex-col items-center text-center">
        <div className={`${isMain ? "w-24 h-24" : "w-20 h-20"} rounded-full overflow-hidden mb-3 ring-2 ${isMain ? "ring-primary" : "ring-border"}`}>
          {streamer.image_url ? (
            <img src={streamer.image_url} alt={streamer.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <span className={`${isMain ? "text-3xl" : "text-2xl"} font-bold text-primary-foreground`}>{streamer.name[0]}</span>
            </div>
          )}
        </div>
        <h3 className={`font-semibold ${isMain ? "text-lg" : "text-base"}`}>{streamer.name}</h3>
        {isMain && (
          <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full mt-1">
            Main Streamer
          </span>
        )}
        <p className="text-xs text-muted-foreground mt-2">Click to view profile</p>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold mb-2">Our Streamers</h1>
        <p className="text-muted-foreground">Meet the team behind the streams</p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Main Streamers */}
          {mainStreamers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">Main Streamers</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {mainStreamers.map((streamer, index) => (
                  <motion.div
                    key={streamer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <StreamerCard streamer={streamer} isMain />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Team Members */}
          {otherStreamers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Team Members</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {otherStreamers.map((streamer, index) => (
                  <motion.div
                    key={streamer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <StreamerCard streamer={streamer} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {streamers?.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              No streamers found
            </div>
          )}
        </>
      )}

      {/* Streamer Detail Modal */}
      <Dialog open={!!selectedStreamer} onOpenChange={() => setSelectedStreamer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Streamer Profile</DialogTitle>
          </DialogHeader>
          {selectedStreamer && (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-primary/20">
                {selectedStreamer.image_url ? (
                  <img src={selectedStreamer.image_url} alt={selectedStreamer.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary-foreground">{selectedStreamer.name[0]}</span>
                  </div>
                )}
              </div>
              
              <div>
                <h2 className="text-2xl font-bold">{selectedStreamer.name}</h2>
                {selectedStreamer.is_main_streamer && (
                  <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full mt-2">
                    Main Streamer
                  </span>
                )}
              </div>

              {selectedStreamer.description && (
                <p className="text-muted-foreground">{selectedStreamer.description}</p>
              )}

              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-3">Follow on social media</p>
                <SocialLinks streamer={selectedStreamer} size="large" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
