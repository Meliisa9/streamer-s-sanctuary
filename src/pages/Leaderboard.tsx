import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, TrendingUp, Target, Gift, Star, Crown, Zap, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserImageLink } from "@/components/UserAvatarLink";
import { SocialBadges } from "@/components/SocialBadges";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export default function Leaderboard() {
  const [category, setCategory] = useState<"overall" | "bonushunt" | "giveaways">("overall");

  // Fetch leaderboard how to earn text from settings
  const { data: howToEarnText } = useQuery({
    queryKey: ["leaderboard-how-to-earn"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "leaderboard_how_to_earn")
        .maybeSingle();
      if (error) throw error;
      return typeof data?.value === 'string' ? data.value : null;
    },
  });

  // Fetch profiles
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["leaderboard-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("points", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch giveaway entries
  const { data: giveawayStats } = useQuery({
    queryKey: ["leaderboard-giveaway-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("giveaway_entries")
        .select("user_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((e) => {
        counts[e.user_id] = (counts[e.user_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Fetch bonus hunt guess stats (combined GTW + Bonus Hunt guesses)
  const { data: bonusHuntStats } = useQuery({
    queryKey: ["leaderboard-bonushunt-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bonus_hunt_guesses")
        .select("user_id, points_earned");
      if (error) throw error;
      const stats: Record<string, { guesses: number; wins: number; totalPoints: number }> = {};
      data.forEach((g) => {
        if (!stats[g.user_id]) stats[g.user_id] = { guesses: 0, wins: 0, totalPoints: 0 };
        stats[g.user_id].guesses += 1;
        if (g.points_earned && g.points_earned > 0) {
          stats[g.user_id].wins += 1;
          stats[g.user_id].totalPoints += g.points_earned;
        }
      });
      return stats;
    },
  });

  // Build leaderboard based on category
  const leaderboardData = profiles?.map((profile) => ({
    ...profile,
    userId: profile.user_id,
    username: profile.display_name || profile.username || "Anonymous",
    profileUsername: profile.username,
    avatar: profile.avatar_url,
    points: profile.points || 0,
    giveawayEntries: giveawayStats?.[profile.user_id] || 0,
    bonusHuntGuesses: bonusHuntStats?.[profile.user_id]?.guesses || 0,
    bonusHuntWins: bonusHuntStats?.[profile.user_id]?.wins || 0,
    bonusHuntPoints: bonusHuntStats?.[profile.user_id]?.totalPoints || 0,
  }));

  // Sort based on category
  const sortedData = [...(leaderboardData || [])].sort((a, b) => {
    if (category === "bonushunt") {
      return b.bonusHuntPoints - a.bonusHuntPoints || b.bonusHuntWins - a.bonusHuntWins;
    }
    if (category === "giveaways") {
      return b.giveawayEntries - a.giveawayEntries;
    }
    return b.points - a.points;
  }).map((player, index) => ({ ...player, rank: index + 1 }));

  const top3 = sortedData.slice(0, 3);
  const restOfList = sortedData.slice(3);

  const totalPlayers = sortedData.length;
  const totalPoints = sortedData.reduce((a, b) => a + b.points, 0);
  const totalBonusHuntWins = sortedData.reduce((a, b) => a + b.bonusHuntWins, 0);
  const totalGiveawayEntries = sortedData.reduce((a, b) => a + b.giveawayEntries, 0);

  const getValue = (player: typeof sortedData[0]) => {
    if (category === "bonushunt") return `${player.bonusHuntPoints.toLocaleString()} pts`;
    if (category === "giveaways") return `${player.giveawayEntries} entries`;
    return `${player.points.toLocaleString()} pts`;
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-6">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text-gold">Leaderboard</span>
          </h1>
          <p className="text-muted-foreground">
            Top community members ranked by points and achievements
          </p>
        </motion.div>

        {/* Category Tabs */}
        <Tabs value={category} onValueChange={(v) => setCategory(v as any)} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="overall" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Overall</span>
            </TabsTrigger>
            <TabsTrigger value="bonushunt" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Bonus Hunt</span>
            </TabsTrigger>
            <TabsTrigger value="giveaways" className="gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Giveaways</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading leaderboard...</p>
          </div>
        ) : sortedData.length > 0 ? (
          <>
            {/* Top 3 Podium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-2 md:gap-4 mb-10 max-w-2xl mx-auto"
            >
              {/* 2nd Place */}
              {top3[1] && (
                <UserImageLink 
                  userId={top3[1].userId} 
                  username={top3[1].profileUsername}
                  className="order-1 flex flex-col items-center pt-8 hover:scale-105 transition-transform"
                >
                  <div className="w-16 md:w-20 h-16 md:h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-3xl md:text-4xl mb-3 shadow-xl overflow-hidden">
                    {top3[1].avatar ? (
                      <img src={top3[1].avatar} alt="" className="w-full h-full object-cover" />
                    ) : "🥈"}
                  </div>
                  <h3 className="font-bold text-center text-xs md:text-sm truncate max-w-full px-1">{top3[1].username}</h3>
                  <SocialBadges 
                    kickUsername={top3[1].kick_username}
                    twitchUsername={top3[1].twitch_username}
                    discordTag={top3[1].discord_tag}
                    size="sm"
                    className="my-1"
                  />
                  <p className="text-xl md:text-2xl font-bold text-gray-400">2nd</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{getValue(top3[1])}</p>
                  <div className="mt-3 w-full h-20 bg-gradient-to-t from-gray-500/30 to-transparent rounded-t-xl" />
                </UserImageLink>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <UserImageLink 
                  userId={top3[0].userId} 
                  username={top3[0].profileUsername}
                  className="order-2 flex flex-col items-center hover:scale-105 transition-transform"
                >
                  <Crown className="w-6 md:w-8 h-6 md:h-8 text-yellow-500 mb-2 animate-pulse" />
                  <div className="w-20 md:w-24 h-20 md:h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-4xl md:text-5xl mb-3 shadow-xl overflow-hidden glow-gold">
                    {top3[0].avatar ? (
                      <img src={top3[0].avatar} alt="" className="w-full h-full object-cover" />
                    ) : "🏆"}
                  </div>
                  <h3 className="font-bold text-center text-sm md:text-lg truncate max-w-full px-1">{top3[0].username}</h3>
                  <SocialBadges 
                    kickUsername={top3[0].kick_username}
                    twitchUsername={top3[0].twitch_username}
                    discordTag={top3[0].discord_tag}
                    size="sm"
                    className="my-1"
                  />
                  <p className="text-2xl md:text-3xl font-bold gradient-text-gold">1st</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{getValue(top3[0])}</p>
                  <div className="mt-3 w-full h-28 bg-gradient-to-t from-yellow-500/30 to-transparent rounded-t-xl" />
                </UserImageLink>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <UserImageLink 
                  userId={top3[2].userId} 
                  username={top3[2].profileUsername}
                  className="order-3 flex flex-col items-center pt-12 hover:scale-105 transition-transform"
                >
                  <div className="w-14 md:w-16 h-14 md:h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-2xl md:text-3xl mb-3 shadow-xl overflow-hidden">
                    {top3[2].avatar ? (
                      <img src={top3[2].avatar} alt="" className="w-full h-full object-cover" />
                    ) : "🥉"}
                  </div>
                  <h3 className="font-bold text-center text-xs md:text-sm truncate max-w-full px-1">{top3[2].username}</h3>
                  <SocialBadges 
                    kickUsername={top3[2].kick_username}
                    twitchUsername={top3[2].twitch_username}
                    discordTag={top3[2].discord_tag}
                    size="sm"
                    className="my-1"
                  />
                  <p className="text-lg md:text-xl font-bold text-amber-600">3rd</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{getValue(top3[2])}</p>
                  <div className="mt-3 w-full h-14 bg-gradient-to-t from-amber-600/30 to-transparent rounded-t-xl" />
                </UserImageLink>
              )}
            </motion.div>

            {/* Stats Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
            >
              <div className="bg-card/30 border border-border/50 rounded-xl p-4 text-center">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-accent" />
                <p className="text-xl font-bold">{totalPlayers}</p>
                <p className="text-xs text-muted-foreground">Players</p>
              </div>
              <div className="bg-card/30 border border-border/50 rounded-xl p-4 text-center">
                <Star className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                <p className="text-xl font-bold">{totalPoints.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
              <div className="bg-card/30 border border-border/50 rounded-xl p-4 text-center">
                <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p className="text-xl font-bold">{totalBonusHuntWins}</p>
                <p className="text-xs text-muted-foreground">GTW Wins</p>
              </div>
              <div className="bg-card/30 border border-border/50 rounded-xl p-4 text-center">
                <Gift className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xl font-bold">{totalGiveawayEntries}</p>
                <p className="text-xs text-muted-foreground">Giveaway Entries</p>
              </div>
            </motion.div>

            {/* Leaderboard Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card/30 border border-border/50 rounded-xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/10">
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground">Rank</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground">Player</th>
                      <th className="text-center p-4 text-xs font-semibold text-muted-foreground">Points</th>
                      <th className="text-center p-4 text-xs font-semibold text-muted-foreground hidden md:table-cell">
                        {category === "bonushunt" ? "GTW Wins" : category === "giveaways" ? "Entries" : "GTW Wins"}
                      </th>
                      <th className="text-center p-4 text-xs font-semibold text-muted-foreground hidden lg:table-cell">
                        Giveaways
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {restOfList.map((player) => (
                      <tr
                        key={player.userId}
                        className="border-b border-border/30 hover:bg-muted/10 transition-colors"
                      >
                        <td className="p-4">
                          <span className="text-lg font-bold text-muted-foreground">#{player.rank}</span>
                        </td>
                        <td className="p-4">
                          <UserImageLink 
                            userId={player.userId} 
                            username={player.profileUsername}
                            className="flex items-center gap-3 hover:text-primary transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
                              {player.avatar ? (
                                <img src={player.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm">⭐</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{player.username}</span>
                              <SocialBadges 
                                kickUsername={player.kick_username}
                                twitchUsername={player.twitch_username}
                                discordTag={player.discord_tag}
                                size="sm"
                              />
                            </div>
                          </UserImageLink>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-primary">{player.points.toLocaleString()}</span>
                        </td>
                        <td className="p-4 text-center hidden md:table-cell">
                          <span className="text-muted-foreground">
                            {category === "giveaways" ? player.giveawayEntries : player.bonusHuntWins}
                          </span>
                        </td>
                        <td className="p-4 text-center hidden lg:table-cell">
                          <span className="text-muted-foreground">{player.giveawayEntries}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* How Points Work - Configurable */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 bg-card/30 border border-border/50 rounded-xl p-6"
            >
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                How to Earn Points
              </h2>
              {howToEarnText ? (
                <div className="p-4 bg-muted/20 rounded-xl">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{howToEarnText}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-green-500" />
                      <span className="font-semibold">Bonus Hunt GTW</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Win up to 300 points by guessing the closest to the final bonus hunt balance!
                    </p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Giveaway Entries</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      100 points per giveaway entry. Winners get 5,000 bonus points!
                    </p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold">Daily Activity</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Daily login: 50 pts. Stream watching: 10 pts/hour. Comments: 25 pts.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            No players found. Be the first to join!
          </div>
        )}
      </div>
    </div>
  );
}