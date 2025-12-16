import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, TrendingUp, Target, Gift, Star, Crown, ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export default function Leaderboard() {
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["leaderboard-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("points", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Profile[];
    },
  });

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

  const { data: gtwStats } = useQuery({
    queryKey: ["leaderboard-gtw-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gtw_guesses")
        .select("user_id, points_earned");
      if (error) throw error;
      const counts: Record<string, { guesses: number; wins: number }> = {};
      data.forEach((g) => {
        if (!counts[g.user_id]) counts[g.user_id] = { guesses: 0, wins: 0 };
        counts[g.user_id].guesses += 1;
        if (g.points_earned && g.points_earned > 0) counts[g.user_id].wins += 1;
      });
      return counts;
    },
  });

  const leaderboardData = profiles?.map((profile, index) => ({
    rank: index + 1,
    username: profile.display_name || profile.username || "Anonymous",
    points: profile.points || 0,
    avatar: profile.avatar_url,
    userId: profile.user_id,
    giveawayEntries: giveawayStats?.[profile.user_id] || 0,
    gtwGuesses: gtwStats?.[profile.user_id]?.guesses || 0,
    gtwWins: gtwStats?.[profile.user_id]?.wins || 0,
  }));

  const totalPoints = leaderboardData?.reduce((a, b) => a + b.points, 0) || 0;
  const totalGiveawayEntries = leaderboardData?.reduce((a, b) => a + b.giveawayEntries, 0) || 0;
  const totalGTWWins = leaderboardData?.reduce((a, b) => a + b.gtwWins, 0) || 0;

  const getAvatar = (rank: number) => {
    if (rank === 1) return "🏆";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "⭐";
  };

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text-gold">Leaderboard</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Top community members ranked by points and achievements
          </p>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-20">Loading leaderboard...</div>
        ) : leaderboardData && leaderboardData.length > 0 ? (
          <>
            {/* Top 3 Podium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto"
            >
              {/* 2nd Place */}
              {leaderboardData[1] && (
                <div className="order-1 flex flex-col items-center pt-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-4xl mb-4 shadow-xl overflow-hidden">
                    {leaderboardData[1].avatar ? (
                      <img src={leaderboardData[1].avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getAvatar(2)
                    )}
                  </div>
                  <h3 className="font-bold text-center text-sm truncate max-w-full">{leaderboardData[1].username}</h3>
                  <p className="text-2xl font-bold text-gray-400 mb-1">2nd</p>
                  <p className="text-sm text-muted-foreground">{leaderboardData[1].points.toLocaleString()} pts</p>
                  <div className="mt-4 w-full h-24 bg-gradient-to-t from-gray-500/30 to-transparent rounded-t-xl" />
                </div>
              )}

              {/* 1st Place */}
              {leaderboardData[0] && (
                <div className="order-2 flex flex-col items-center">
                  <Crown className="w-8 h-8 text-yellow-500 mb-2 animate-pulse" />
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-5xl mb-4 shadow-xl glow-gold overflow-hidden">
                    {leaderboardData[0].avatar ? (
                      <img src={leaderboardData[0].avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getAvatar(1)
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-center truncate max-w-full">{leaderboardData[0].username}</h3>
                  <p className="text-3xl font-bold gradient-text-gold mb-1">1st</p>
                  <p className="text-sm text-muted-foreground">{leaderboardData[0].points.toLocaleString()} pts</p>
                  <div className="mt-4 w-full h-32 bg-gradient-to-t from-yellow-500/30 to-transparent rounded-t-xl" />
                </div>
              )}

              {/* 3rd Place */}
              {leaderboardData[2] && (
                <div className="order-3 flex flex-col items-center pt-12">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-3xl mb-4 shadow-xl overflow-hidden">
                    {leaderboardData[2].avatar ? (
                      <img src={leaderboardData[2].avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getAvatar(3)
                    )}
                  </div>
                  <h3 className="font-bold text-center text-sm truncate max-w-full">{leaderboardData[2].username}</h3>
                  <p className="text-xl font-bold text-amber-600 mb-1">3rd</p>
                  <p className="text-sm text-muted-foreground">{leaderboardData[2].points.toLocaleString()} pts</p>
                  <div className="mt-4 w-full h-16 bg-gradient-to-t from-amber-600/30 to-transparent rounded-t-xl" />
                </div>
              )}
            </motion.div>

            {/* Stats Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
            >
              <div className="glass rounded-2xl p-4 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-accent" />
                <p className="text-2xl font-bold">{leaderboardData.length}</p>
                <p className="text-sm text-muted-foreground">Total Players</p>
              </div>
              <div className="glass rounded-2xl p-4 text-center">
                <Gift className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{totalGiveawayEntries}</p>
                <p className="text-sm text-muted-foreground">Giveaway Entries</p>
              </div>
              <div className="glass rounded-2xl p-4 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{totalGTWWins}</p>
                <p className="text-sm text-muted-foreground">GTW Victories</p>
              </div>
              <div className="glass rounded-2xl p-4 text-center">
                <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">{totalPoints.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
            </motion.div>

            {/* Full Leaderboard Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Rank</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Player</th>
                      <th className="text-center p-4 text-sm font-semibold text-muted-foreground">Points</th>
                      <th className="text-center p-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">Giveaways</th>
                      <th className="text-center p-4 text-sm font-semibold text-muted-foreground hidden lg:table-cell">GTW Guesses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((player, index) => (
                      <motion.tr
                        key={player.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className={`border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors ${
                          player.rank <= 3 ? "bg-accent/5" : ""
                        }`}
                      >
                        <td className="p-4">
                          <span className={`text-lg font-bold ${
                            player.rank === 1
                              ? "text-yellow-500"
                              : player.rank === 2
                              ? "text-gray-400"
                              : player.rank === 3
                              ? "text-amber-600"
                              : "text-muted-foreground"
                          }`}>
                            #{player.rank}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
                              {player.avatar ? (
                                <img src={player.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-lg">{getAvatar(player.rank)}</span>
                              )}
                            </div>
                            <span className="font-medium">{player.username}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-primary">{player.points.toLocaleString()}</span>
                        </td>
                        <td className="p-4 text-center hidden md:table-cell">
                          <span className="text-muted-foreground">{player.giveawayEntries}</span>
                        </td>
                        <td className="p-4 text-center hidden lg:table-cell">
                          <span className="text-muted-foreground">{player.gtwGuesses}</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* How Points Work */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10 glass rounded-2xl p-6"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                How to Earn Points
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-green-500" />
                    <span className="font-semibold">Guess The Win</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Earn up to 1,000 points per session. Closer guesses = more points!
                  </p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Giveaway Entries</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    100 points per giveaway entry. Winners get 5,000 bonus points!
                  </p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-accent" />
                    <span className="font-semibold">Activity Bonus</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Daily login: 50 pts. Watch streams: 10 pts/hour. Comments: 25 pts.
                  </p>
                </div>
              </div>
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
