import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Twitch, Youtube, Twitter, Instagram, MessageCircle, Users, Star, ExternalLink, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const getPlatforms = (streamer: Streamer) => {
    const platforms = [];
    if (streamer.twitch_url) platforms.push({ name: "Twitch", url: streamer.twitch_url, color: "bg-purple-600", icon: Twitch });
    if (streamer.kick_url) platforms.push({ name: "Kick", url: streamer.kick_url, color: "bg-green-500", icon: null });
    if (streamer.youtube_url) platforms.push({ name: "YouTube", url: streamer.youtube_url, color: "bg-red-600", icon: Youtube });
    return platforms;
  };

  const SocialLinks = ({ streamer, size = "default" }: { streamer: Streamer; size?: "default" | "large" }) => {
    const iconSize = size === "large" ? "w-5 h-5" : "w-4 h-4";
    const buttonSize = size === "large" ? "w-11 h-11" : "w-9 h-9";
    
    return (
      <div className="flex gap-3 flex-wrap justify-center">
        {streamer.twitch_url && (
          <a href={streamer.twitch_url} target="_blank" rel="noopener noreferrer" 
            className={`${buttonSize} rounded-xl bg-purple-600/20 hover:bg-purple-600 hover:scale-110 flex items-center justify-center transition-all duration-300 group`}>
            <Twitch className={`${iconSize} text-purple-400 group-hover:text-white`} />
          </a>
        )}
        {streamer.kick_url && (
          <a href={streamer.kick_url} target="_blank" rel="noopener noreferrer" 
            className={`${buttonSize} rounded-xl bg-green-600/20 hover:bg-green-500 hover:scale-110 flex items-center justify-center transition-all duration-300 group`}>
            <span className="text-green-400 group-hover:text-white font-bold text-sm">K</span>
          </a>
        )}
        {streamer.youtube_url && (
          <a href={streamer.youtube_url} target="_blank" rel="noopener noreferrer" 
            className={`${buttonSize} rounded-xl bg-red-600/20 hover:bg-red-600 hover:scale-110 flex items-center justify-center transition-all duration-300 group`}>
            <Youtube className={`${iconSize} text-red-400 group-hover:text-white`} />
          </a>
        )}
        {streamer.twitter_url && (
          <a href={streamer.twitter_url} target="_blank" rel="noopener noreferrer" 
            className={`${buttonSize} rounded-xl bg-blue-500/20 hover:bg-blue-500 hover:scale-110 flex items-center justify-center transition-all duration-300 group`}>
            <Twitter className={`${iconSize} text-blue-400 group-hover:text-white`} />
          </a>
        )}
        {streamer.instagram_url && (
          <a href={streamer.instagram_url} target="_blank" rel="noopener noreferrer" 
            className={`${buttonSize} rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500 hover:to-pink-500 hover:scale-110 flex items-center justify-center transition-all duration-300 group`}>
            <Instagram className={`${iconSize} text-pink-400 group-hover:text-white`} />
          </a>
        )}
        {streamer.discord_url && (
          <a href={streamer.discord_url} target="_blank" rel="noopener noreferrer" 
            className={`${buttonSize} rounded-xl bg-indigo-500/20 hover:bg-indigo-500 hover:scale-110 flex items-center justify-center transition-all duration-300 group`}>
            <MessageCircle className={`${iconSize} text-indigo-400 group-hover:text-white`} />
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-purple-600/10 to-background p-8 md:p-12"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Our Streamers
              </h1>
              <p className="text-muted-foreground text-lg">Meet the talented creators behind the streams</p>
            </div>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-80 rounded-3xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Main Streamers - Featured Cards */}
          {mainStreamers.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                  <Star className="w-5 h-5 text-primary fill-primary" />
                  <h2 className="text-lg font-bold">Featured Streamers</h2>
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-primary/50 to-transparent" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {mainStreamers.map((streamer, index) => {
                  const platforms = getPlatforms(streamer);
                  return (
                    <motion.div
                      key={streamer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div 
                        onClick={() => setSelectedStreamer(streamer)}
                        className="relative glass rounded-3xl p-6 cursor-pointer border-2 border-primary/20 hover:border-primary/50 transition-all duration-500 overflow-hidden"
                      >
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="relative z-10">
                          {/* Avatar & Badge */}
                          <div className="flex justify-center mb-6">
                            <div className="relative">
                              <Avatar className="w-28 h-28 ring-4 ring-primary/30 ring-offset-4 ring-offset-background shadow-2xl shadow-primary/20">
                                <AvatarImage src={streamer.image_url || undefined} alt={streamer.name} className="object-cover" />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-3xl font-bold">
                                  {streamer.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform">
                                <Star className="w-5 h-5 text-primary-foreground fill-current" />
                              </div>
                            </div>
                          </div>

                          {/* Name & Title */}
                          <div className="text-center mb-4">
                            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{streamer.name}</h3>
                            <p className="text-sm text-primary font-medium">Featured Streamer</p>
                          </div>

                          {/* Description */}
                          {streamer.description && (
                            <p className="text-sm text-muted-foreground text-center mb-6 line-clamp-2">
                              {streamer.description}
                            </p>
                          )}

                          {/* Platform Buttons */}
                          {platforms.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2 mb-4">
                              {platforms.map((platform) => (
                                <a
                                  key={platform.name}
                                  href={platform.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className={`flex items-center gap-2 px-4 py-2 ${platform.color} text-white rounded-xl text-sm font-medium hover:scale-105 transition-transform shadow-lg`}
                                >
                                  {platform.icon ? <platform.icon className="w-4 h-4" /> : <span className="font-bold">K</span>}
                                  {platform.name}
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Social Links */}
                          <SocialLinks streamer={streamer} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Team Members */}
          {otherStreamers.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                <h2 className="text-lg font-bold px-4">Team Members</h2>
                <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {otherStreamers.map((streamer, index) => {
                  const platforms = getPlatforms(streamer);
                  return (
                    <motion.div
                      key={streamer.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ y: -6 }}
                      onClick={() => setSelectedStreamer(streamer)}
                      className="glass rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:border-primary/40 border border-transparent group text-center"
                    >
                      <Avatar className="w-20 h-20 mx-auto mb-4 ring-2 ring-border ring-offset-2 ring-offset-background group-hover:ring-primary/50 transition-all shadow-lg">
                        <AvatarImage src={streamer.image_url || undefined} alt={streamer.name} />
                        <AvatarFallback className="bg-gradient-to-br from-secondary to-muted text-xl font-bold">
                          {streamer.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors mb-2">{streamer.name}</h3>
                      
                      {/* Mini Platform Indicators */}
                      {platforms.length > 0 && (
                        <div className="flex justify-center gap-1.5">
                          {platforms.slice(0, 3).map((platform) => (
                            <div 
                              key={platform.name} 
                              className={`w-6 h-6 ${platform.color} rounded-md flex items-center justify-center`}
                            >
                              {platform.icon ? (
                                <platform.icon className="w-3 h-3 text-white" />
                              ) : (
                                <span className="text-white text-xs font-bold">K</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {streamers?.length === 0 && (
            <div className="text-center py-20 glass rounded-3xl">
              <Users className="w-16 h-16 mx-auto mb-6 text-muted-foreground/30" />
              <h2 className="text-2xl font-bold mb-2">No Streamers Yet</h2>
              <p className="text-muted-foreground">Check back soon for our amazing team!</p>
            </div>
          )}
        </>
      )}

      {/* Streamer Detail Modal */}
      <Dialog open={!!selectedStreamer} onOpenChange={() => setSelectedStreamer(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="sr-only">Streamer Profile</DialogTitle>
          </DialogHeader>
          {selectedStreamer && (
            <div className="flex flex-col items-center text-center space-y-6 py-6">
              {/* Large Avatar */}
              <div className="relative">
                <Avatar className="w-36 h-36 ring-4 ring-primary/20 shadow-2xl">
                  <AvatarImage src={selectedStreamer.image_url || undefined} alt={selectedStreamer.name} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-5xl font-bold">
                    {selectedStreamer.name[0]}
                  </AvatarFallback>
                </Avatar>
                {selectedStreamer.is_main_streamer && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-purple-600 rounded-full">
                    <span className="text-xs font-bold text-primary-foreground flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Featured
                    </span>
                  </div>
                )}
              </div>
              
              {/* Name */}
              <div>
                <h2 className="text-3xl font-bold">{selectedStreamer.name}</h2>
              </div>

              {/* Description */}
              {selectedStreamer.description && (
                <p className="text-muted-foreground max-w-sm leading-relaxed">{selectedStreamer.description}</p>
              )}

              {/* Stream Platforms */}
              {getPlatforms(selectedStreamer).length > 0 && (
                <div className="w-full space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Watch Live On</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {getPlatforms(selectedStreamer).map((platform) => (
                      <a
                        key={platform.name}
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-6 py-3 ${platform.color} text-white rounded-xl font-medium hover:scale-105 transition-transform shadow-lg`}
                      >
                        {platform.icon ? <platform.icon className="w-5 h-5" /> : <span className="font-bold">K</span>}
                        {platform.name}
                        <ExternalLink className="w-4 h-4 opacity-70" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              <div className="w-full space-y-3 pt-4 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground">Follow on Social Media</p>
                <SocialLinks streamer={selectedStreamer} size="large" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
