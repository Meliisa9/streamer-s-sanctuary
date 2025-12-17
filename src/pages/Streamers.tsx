import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Twitch, Youtube, Twitter, Instagram, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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

  const SocialLinks = ({ streamer }: { streamer: Streamer }) => (
    <div className="flex gap-2 flex-wrap">
      {streamer.twitch_url && (
        <a href={streamer.twitch_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 flex items-center justify-center transition-colors">
          <Twitch className="w-4 h-4 text-purple-400" />
        </a>
      )}
      {streamer.kick_url && (
        <a href={streamer.kick_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-green-600/20 hover:bg-green-600/40 flex items-center justify-center transition-colors">
          <span className="text-green-400 font-bold text-xs">K</span>
        </a>
      )}
      {streamer.youtube_url && (
        <a href={streamer.youtube_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-red-600/20 hover:bg-red-600/40 flex items-center justify-center transition-colors">
          <Youtube className="w-4 h-4 text-red-400" />
        </a>
      )}
      {streamer.twitter_url && (
        <a href={streamer.twitter_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 flex items-center justify-center transition-colors">
          <Twitter className="w-4 h-4 text-blue-400" />
        </a>
      )}
      {streamer.instagram_url && (
        <a href={streamer.instagram_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-pink-500/20 hover:bg-pink-500/40 flex items-center justify-center transition-colors">
          <Instagram className="w-4 h-4 text-pink-400" />
        </a>
      )}
      {streamer.discord_url && (
        <a href={streamer.discord_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 flex items-center justify-center transition-colors">
          <MessageCircle className="w-4 h-4 text-indigo-400" />
        </a>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold mb-2">Our Streamers</h1>
        <p className="text-muted-foreground">Meet the team behind the streams</p>
      </motion.div>

      {isLoading ? (
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Main Streamers */}
          {mainStreamers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">Main Streamers</h2>
              <div className="grid gap-6">
                {mainStreamers.map((streamer, index) => (
                  <motion.div
                    key={streamer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass rounded-2xl p-6 flex flex-col md:flex-row gap-6 border border-primary/20"
                  >
                    <div className="w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 mx-auto md:mx-0">
                      {streamer.image_url ? (
                        <img src={streamer.image_url} alt={streamer.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                          <span className="text-4xl font-bold text-primary-foreground">{streamer.name[0]}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                        <h3 className="text-2xl font-bold">{streamer.name}</h3>
                        <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-semibold rounded-full">Main</span>
                      </div>
                      {streamer.description && (
                        <p className="text-muted-foreground mb-4">{streamer.description}</p>
                      )}
                      <SocialLinks streamer={streamer} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Other Streamers */}
          {otherStreamers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Team Members</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherStreamers.map((streamer, index) => (
                  <motion.div
                    key={streamer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass rounded-2xl p-5"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                        {streamer.image_url ? (
                          <img src={streamer.image_url} alt={streamer.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                            <span className="text-xl font-bold">{streamer.name[0]}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{streamer.name}</h3>
                      </div>
                    </div>
                    {streamer.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{streamer.description}</p>
                    )}
                    <SocialLinks streamer={streamer} />
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
    </div>
  );
}
