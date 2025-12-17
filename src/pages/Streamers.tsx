import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Twitch, Youtube, Twitter, Instagram, MessageCircle, Users, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    const buttonSize = size === "large" ? "w-10 h-10" : "w-8 h-8";
    
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

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Our Streamers</h1>
            <p className="text-muted-foreground">Meet the team behind the streams</p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Main Streamers */}
          {mainStreamers.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Main Streamers</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {mainStreamers.map((streamer, index) => (
                  <motion.div
                    key={streamer.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                    onClick={() => setSelectedStreamer(streamer)}
                    className="glass rounded-2xl p-4 cursor-pointer transition-all hover:border-primary/50 border border-primary/20 group"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-3">
                        <Avatar className="w-20 h-20 ring-2 ring-primary ring-offset-2 ring-offset-background">
                          <AvatarImage src={streamer.image_url || undefined} alt={streamer.name} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-xl font-bold">
                            {streamer.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Star className="w-3 h-3 text-primary-foreground fill-current" />
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{streamer.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Main Streamer</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Team Members */}
          {otherStreamers.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold">Team Members</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {otherStreamers.map((streamer, index) => (
                  <motion.div
                    key={streamer.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ y: -4 }}
                    onClick={() => setSelectedStreamer(streamer)}
                    className="glass rounded-2xl p-4 cursor-pointer transition-all hover:border-primary/40 border border-transparent group"
                  >
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="w-16 h-16 mb-3 ring-2 ring-border ring-offset-2 ring-offset-background group-hover:ring-primary/50 transition-all">
                        <AvatarImage src={streamer.image_url || undefined} alt={streamer.name} />
                        <AvatarFallback className="bg-gradient-to-br from-secondary to-muted text-lg font-bold">
                          {streamer.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-medium text-sm group-hover:text-primary transition-colors">{streamer.name}</h3>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {streamers?.length === 0 && (
            <div className="text-center py-16 text-muted-foreground glass rounded-2xl">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No streamers found</p>
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
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <Avatar className="w-28 h-28 ring-4 ring-primary/20">
                <AvatarImage src={selectedStreamer.image_url || undefined} alt={selectedStreamer.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-4xl font-bold">
                  {selectedStreamer.name[0]}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h2 className="text-2xl font-bold">{selectedStreamer.name}</h2>
                {selectedStreamer.is_main_streamer && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full mt-2">
                    <Star className="w-3 h-3 fill-current" />
                    Main Streamer
                  </span>
                )}
              </div>

              {selectedStreamer.description && (
                <p className="text-muted-foreground max-w-xs">{selectedStreamer.description}</p>
              )}

              <div className="pt-2 w-full">
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