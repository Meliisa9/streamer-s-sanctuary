import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Twitch, Youtube, Twitter, Instagram, MessageCircle, Users, Star, ExternalLink, Play, Sparkles, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  linked_user_id: string | null;
  streamer_type: string | null;
}

export default function Streamers() {
  const [selectedStreamer, setSelectedStreamer] = useState<Streamer | null>(null);
  const [filter, setFilter] = useState<"featured" | "team">("featured");

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

  // Filter by streamer_type if available, otherwise fallback to is_main_streamer
  const mainStreamers = streamers?.filter((s) => 
    s.streamer_type === 'streamer' || (s.streamer_type === null && s.is_main_streamer)
  ) || [];
  const otherStreamers = streamers?.filter((s) => 
    s.streamer_type === 'team_member' || (s.streamer_type === null && !s.is_main_streamer)
  ) || [];

  const filteredStreamers = filter === "featured" 
    ? mainStreamers 
    : otherStreamers;

  const getPlatforms = (streamer: Streamer) => {
    const platforms = [];
    if (streamer.twitch_url) platforms.push({ name: "Twitch", url: streamer.twitch_url, color: "bg-purple-600", hoverColor: "hover:bg-purple-500", icon: Twitch });
    if (streamer.kick_url) platforms.push({ name: "Kick", url: streamer.kick_url, color: "bg-[#53FC18]", hoverColor: "hover:bg-[#45d115]", icon: null, textColor: "text-black" });
    if (streamer.youtube_url) platforms.push({ name: "YouTube", url: streamer.youtube_url, color: "bg-red-600", hoverColor: "hover:bg-red-500", icon: Youtube });
    return platforms;
  };

  const SocialLinks = ({ streamer, size = "default" }: { streamer: Streamer; size?: "default" | "large" }) => {
    const iconSize = size === "large" ? "w-5 h-5" : "w-4 h-4";
    const buttonSize = size === "large" ? "w-12 h-12" : "w-10 h-10";
    
    return (
      <div className="flex gap-2 flex-wrap justify-center">
        {streamer.twitch_url && (
          <a href={streamer.twitch_url} target="_blank" rel="noopener noreferrer" 
            className={`${buttonSize} rounded-xl bg-purple-600/20 hover:bg-purple-600 hover:scale-110 flex items-center justify-center transition-all duration-300 group border border-purple-600/30`}>
            <Twitch className={`${iconSize} text-purple-400 group-hover:text-white`} />
          </a>
        )}
        {streamer.kick_url && (
          <a href={streamer.kick_url} target="_blank" rel="noopener noreferrer" 
            className={`${buttonSize} rounded-xl bg-[#53FC18]/20 hover:bg-[#53FC18] hover:scale-110 flex items-center justify-center transition-all duration-300 group border border-[#53FC18]/30`}>
            <span className="text-[#53FC18] group-hover:text-black font-bold text-sm">K</span>
          </a>
        )}
        {streamer.youtube_url && (
          <a href={streamer.youtube_url} target="_blank" rel="noopener noreferrer" 
            className={`${buttonSize} rounded-xl bg-red-600/20 hover:bg-red-600 hover:scale-110 flex items-center justify-center transition-all duration-300 group border border-red-600/30`}>
            <Youtube className={`${iconSize} text-red-400 group-hover:text-white`} />
          </a>
        )}
        {streamer.twitter_url && (
          <a href={streamer.twitter_url} target="_blank" rel="noopener noreferrer" 
            className={`${buttonSize} rounded-xl bg-sky-500/20 hover:bg-sky-500 hover:scale-110 flex items-center justify-center transition-all duration-300 group border border-sky-500/30`}>
            <Twitter className={`${iconSize} text-sky-400 group-hover:text-white`} />
          </a>
        )}
        {streamer.instagram_url && (
          <a href={streamer.instagram_url} target="_blank" rel="noopener noreferrer" 
            className={`${buttonSize} rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500 hover:to-pink-500 hover:scale-110 flex items-center justify-center transition-all duration-300 group border border-pink-500/30`}>
            <Instagram className={`${iconSize} text-pink-400 group-hover:text-white`} />
          </a>
        )}
        {streamer.discord_url && (
          <a href={streamer.discord_url} target="_blank" rel="noopener noreferrer" 
            className={`${buttonSize} rounded-xl bg-indigo-500/20 hover:bg-indigo-500 hover:scale-110 flex items-center justify-center transition-all duration-300 group border border-indigo-500/30`}>
            <MessageCircle className={`${iconSize} text-indigo-400 group-hover:text-white`} />
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto max-w-7xl space-y-10">
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-purple-600/10 to-background p-8 md:p-12"
        >
          <div className="absolute inset-0 bg-hero-pattern opacity-10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px]" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
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
            
            {/* Stats */}
            <div className="flex items-center gap-6">
              <div className="text-center px-6 py-3 bg-background/50 backdrop-blur-sm rounded-2xl border border-border/50">
                <p className="text-3xl font-bold text-primary">{mainStreamers.length}</p>
                <p className="text-xs text-muted-foreground">{mainStreamers.length === 1 ? 'Streamer' : 'Streamers'}</p>
              </div>
              <div className="text-center px-6 py-3 bg-background/50 backdrop-blur-sm rounded-2xl border border-border/50">
                <p className="text-3xl font-bold">{otherStreamers.length}</p>
                <p className="text-xs text-muted-foreground">{otherStreamers.length === 1 ? 'Team Member' : 'Team Members'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center"
        >
          <div className="inline-flex p-1 bg-secondary/50 rounded-xl">
            {[
              { value: "featured", label: "Streamers", icon: Star },
              { value: "team", label: "Team Members", icon: Sparkles },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                  filter === tab.value
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded bg-background/20">
                  {tab.value === "featured" ? mainStreamers.length : otherStreamers.length}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-80 rounded-3xl" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {filteredStreamers.length > 0 ? (
                <div className={`grid gap-6 ${
                  filteredStreamers.length === 1 
                    ? "grid-cols-1 max-w-md mx-auto" 
                    : filteredStreamers.length === 2 
                    ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                }`}>
                  {filteredStreamers.map((streamer, index) => {
                    const platforms = getPlatforms(streamer);
                    return (
                      <motion.div
                        key={streamer.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div 
                          onClick={() => setSelectedStreamer(streamer)}
                          className={`relative glass rounded-3xl p-6 cursor-pointer transition-all duration-500 overflow-hidden ${
                            streamer.is_main_streamer 
                              ? "border-2 border-primary/30 hover:border-primary/60" 
                              : "border border-border/50 hover:border-primary/40"
                          }`}
                        >
                          {/* Remove Featured Badge - no longer showing */}
                          
                          {/* Background Glow */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                          
                          <div className="relative z-10">
                            {/* Avatar */}
                            <div className="flex justify-center mb-6">
                              <div className="relative">
                                {streamer.linked_user_id ? (
                                  <Link to={`/user/${streamer.linked_user_id}`} onClick={(e) => e.stopPropagation()}>
                                    <Avatar className={`${streamer.is_main_streamer ? "w-28 h-28 ring-4 ring-primary/30" : "w-24 h-24 ring-2 ring-border"} ring-offset-4 ring-offset-background shadow-2xl hover:ring-primary/60 transition-all cursor-pointer`}>
                                      <AvatarImage src={streamer.image_url || undefined} alt={streamer.name} className="object-cover" />
                                      <AvatarFallback className={`${streamer.is_main_streamer ? "bg-gradient-to-br from-primary to-purple-600" : "bg-gradient-to-br from-secondary to-muted"} text-2xl font-bold`}>
                                        {streamer.name[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                  </Link>
                                ) : (
                                  <Avatar className={`${streamer.is_main_streamer ? "w-28 h-28 ring-4 ring-primary/30" : "w-24 h-24 ring-2 ring-border"} ring-offset-4 ring-offset-background shadow-2xl`}>
                                    <AvatarImage src={streamer.image_url || undefined} alt={streamer.name} className="object-cover" />
                                    <AvatarFallback className={`${streamer.is_main_streamer ? "bg-gradient-to-br from-primary to-purple-600" : "bg-gradient-to-br from-secondary to-muted"} text-2xl font-bold`}>
                                      {streamer.name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                {/* Live indicator (placeholder) */}
                                {streamer.is_main_streamer && (
                                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-background flex items-center justify-center">
                                    <Radio className="w-3 h-3 text-white animate-pulse" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Name */}
                            <div className="text-center mb-4">
                              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{streamer.name}</h3>
                            </div>

                            {/* Description */}
                            {streamer.description && (
                              <p className="text-sm text-muted-foreground text-center mb-6 line-clamp-2">
                                {streamer.description}
                              </p>
                            )}

                            {/* Social Links - Only small icons */}
                            <SocialLinks streamer={streamer} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 glass rounded-3xl">
                  <Users className="w-16 h-16 mx-auto mb-6 text-muted-foreground/30" />
                  <h2 className="text-2xl font-bold mb-2">No Streamers Found</h2>
                  <p className="text-muted-foreground">Try a different filter</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
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
                          className={`flex items-center gap-2 px-6 py-3 ${platform.color} ${platform.textColor || "text-white"} rounded-xl font-medium hover:scale-105 transition-transform shadow-lg`}
                        >
                          {platform.icon ? <platform.icon className="w-5 h-5" /> : <span className="font-bold">K</span>}
                          {platform.name}
                          <ExternalLink className="w-4 h-4 opacity-70" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Social Links */}
                <div className="pt-4 border-t border-border/50 w-full">
                  <p className="text-sm font-medium text-muted-foreground mb-4">Connect</p>
                  <SocialLinks streamer={selectedStreamer} size="large" />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}