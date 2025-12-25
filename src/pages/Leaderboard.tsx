import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Trophy, Medal, TrendingUp, Target, Gift, Star, Crown, Zap, 
  Search, Filter, ChevronUp, ChevronDown, Clock, Calendar,
  Award, Flame, Users, ArrowUp, ArrowDown, Minus, Sparkles
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserImageLink } from "@/components/UserAvatarLink";
import { SocialBadges } from "@/components/SocialBadges";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type LeaderboardPeriod = Tables<"leaderboard_periods">;

interface HowToEarnConfig {
  box1_icon: string;
  box1_title: string;
  box1_text: string;
  box2_icon: string;
  box2_title: string;
  box2_text: string;
  box3_icon: string;
  box3_title: string;
  box3_text: string;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [category, setCategory] = useState<"overall" | "bonushunt" | "giveaways">("overall");
  const [timePeriod, setTimePeriod] = useState<"all_time" | "monthly" | "weekly">("all_time");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  // Fetch active leaderboard period
  const { data: activePeriod } = useQuery({
    queryKey: ["active-leaderboard-period", timePeriod],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard_periods")
        .select("*")
        .eq("period_type", timePeriod)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as LeaderboardPeriod | null;
    },
  });

  // Fetch configurable "How to Earn Points" boxes
  const { data: howToEarnConfig } = useQuery({
    queryKey: ["leaderboard-how-to-earn-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "leaderboard_how_to_earn_boxes")
        .maybeSingle();
      if (error) throw error;
      return data?.value as unknown as HowToEarnConfig | null;
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

  // Fetch bonus hunt guess stats
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

  // Fetch avgx bonus hunt stats
  const { data: avgxStats } = useQuery({
    queryKey: ["leaderboard-avgx-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bonus_hunt_avgx_guesses")
        .select("user_id, points_earned");
      if (error) throw error;
      const stats: Record<string, { guesses: number; totalPoints: number }> = {};
      data.forEach((g) => {
        if (!stats[g.user_id]) stats[g.user_id] = { guesses: 0, totalPoints: 0 };
        stats[g.user_id].guesses += 1;
        stats[g.user_id].totalPoints += g.points_earned || 0;
      });
      return stats;
    },
  });

  const leaderboardData = useMemo(() => {
    return profiles?.map((profile) => ({
      ...profile,
      userId: profile.user_id,
      username: profile.username || "Anonymous",
      profileUsername: profile.username,
      avatar: profile.avatar_url,
      points: profile.points || 0,
      giveawayEntries: giveawayStats?.[profile.user_id] || 0,
      bonusHuntGuesses: bonusHuntStats?.[profile.user_id]?.guesses || 0,
      bonusHuntWins: bonusHuntStats?.[profile.user_id]?.wins || 0,
      bonusHuntPoints: bonusHuntStats?.[profile.user_id]?.totalPoints || 0,
      avgxGuesses: avgxStats?.[profile.user_id]?.guesses || 0,
      avgxPoints: avgxStats?.[profile.user_id]?.totalPoints || 0,
      totalBonusPoints: (bonusHuntStats?.[profile.user_id]?.totalPoints || 0) + (avgxStats?.[profile.user_id]?.totalPoints || 0),
    }));
  }, [profiles, giveawayStats, bonusHuntStats, avgxStats]);

  const sortedData = useMemo(() => {
    let data = [...(leaderboardData || [])];
    
    // Filter by search
    if (searchQuery) {
      data = data.filter(p => 
        p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort by category
    data.sort((a, b) => {
      let comparison = 0;
      if (category === "bonushunt") {
        comparison = b.totalBonusPoints - a.totalBonusPoints || b.bonusHuntWins - a.bonusHuntWins;
      } else if (category === "giveaways") {
        comparison = b.giveawayEntries - a.giveawayEntries;
      } else {
        comparison = b.points - a.points;
      }
      return sortDirection === "desc" ? comparison : -comparison;
    });
    
    return data.map((player, index) => ({ ...player, rank: index + 1 }));
  }, [leaderboardData, category, searchQuery, sortDirection]);

  const top3 = sortedData.slice(0, 3);
  const restOfList = sortedData.slice(3);

  // Find current user's rank
  const currentUserRank = useMemo(() => {
    if (!user) return null;
    return sortedData.find(p => p.userId === user.id);
  }, [sortedData, user]);

  // Stats
  const totalPlayers = sortedData.length;
  const totalPoints = sortedData.reduce((a, b) => a + b.points, 0);
  const totalBonusHuntWins = sortedData.reduce((a, b) => a + b.bonusHuntWins, 0);
  const totalGiveawayEntries = sortedData.reduce((a, b) => a + b.giveawayEntries, 0);

  const getValue = (player: typeof sortedData[0]) => {
    if (category === "bonushunt") return player.totalBonusPoints.toLocaleString();
    if (category === "giveaways") return player.giveawayEntries.toLocaleString();
    return player.points.toLocaleString();
  };

  const getValueLabel = () => {
    if (category === "bonushunt") return "pts";
    if (category === "giveaways") return "entries";
    return "pts";
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Target": return Target;
      case "Gift": return Gift;
      case "Trophy": return Trophy;
      case "Star": return Star;
      case "Zap": return Zap;
      case "Crown": return Crown;
      case "Flame": return Flame;
      default: return Target;
    }
  };

  const defaultConfig: HowToEarnConfig = {
    box1_icon: "Target",
    box1_title: "Bonus Hunt GTW",
    box1_text: "Win up to 300 points by guessing the closest to the final bonus hunt balance!",
    box2_icon: "Gift",
    box2_title: "Giveaways",
    box2_text: "Enter giveaways for a chance to win prizes and earn participation points!",
    box3_icon: "Zap",
    box3_title: "Daily Activity",
    box3_text: "Sign in daily to maintain your streak and earn bonus points each day!",
  };

  const config = howToEarnConfig || defaultConfig;

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    if (rank <= 10) return <Award className="w-4 h-4 text-primary/70" />;
    return null;
  };

  const getPodiumGradient = (place: number) => {
    if (place === 1) return "from-yellow-400 via-amber-500 to-orange-500";
    if (place === 2) return "from-gray-300 via-gray-400 to-gray-500";
    if (place === 3) return "from-amber-600 via-amber-700 to-amber-800";
    return "";
  };

  const getPodiumGlow = (place: number) => {
    if (place === 1) return "shadow-[0_0_60px_rgba(234,179,8,0.4)]";
    if (place === 2) return "shadow-[0_0_40px_rgba(156,163,175,0.3)]";
    if (place === 3) return "shadow-[0_0_40px_rgba(180,83,9,0.3)]";
    return "";
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Community Rankings</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              Leaderboard
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Compete with the community and climb the ranks to earn exclusive rewards
          </p>
        </motion.div>

        {/* Time Period Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-6"
        >
          {[
            { value: "all_time", label: "All Time", icon: Trophy },
            { value: "monthly", label: "Monthly", icon: Calendar },
            { value: "weekly", label: "Weekly", icon: Clock },
          ].map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={timePeriod === value ? "default" : "outline"}
              size="sm"
              onClick={() => setTimePeriod(value as typeof timePeriod)}
              className={cn(
                "gap-2 transition-all",
                timePeriod === value && "shadow-lg shadow-primary/25"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </motion.div>

        {/* Active Period Info */}
        {activePeriod && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-6"
          >
            <Badge variant="outline" className="gap-2 px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Active: {new Date(activePeriod.start_date).toLocaleDateString()} - {new Date(activePeriod.end_date).toLocaleDateString()}
            </Badge>
          </motion.div>
        )}

        {/* Category Tabs + Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <Tabs value={category} onValueChange={(v) => setCategory(v as typeof category)} className="mb-4">
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 h-12">
              <TabsTrigger value="overall" className="gap-2 text-sm font-semibold">
                <Trophy className="w-4 h-4" />
                <span>Overall</span>
              </TabsTrigger>
              <TabsTrigger value="bonushunt" className="gap-2 text-sm font-semibold">
                <Target className="w-4 h-4" />
                <span>Bonus Hunt</span>
              </TabsTrigger>
              <TabsTrigger value="giveaways" className="gap-2 text-sm font-semibold">
                <Gift className="w-4 h-4" />
                <span>Giveaways</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-border/50"
              />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortDirection(d => d === "desc" ? "asc" : "desc")}
                    className="shrink-0"
                  >
                    {sortDirection === "desc" ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {sortDirection === "desc" ? "Highest first" : "Lowest first"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </motion.div>

        {/* Current User Rank Card */}
        {currentUserRank && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="max-w-lg mx-auto bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-primary/20 ring-2 ring-primary/30">
                    {currentUserRank.avatar ? (
                      <img src={currentUserRank.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">⭐</div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {currentUserRank.rank}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Your Rank</p>
                  <p className="font-bold text-lg">{currentUserRank.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-primary">{getValue(currentUserRank)}</p>
                  <p className="text-xs text-muted-foreground">{getValueLabel()}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="text-center py-20">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        ) : sortedData.length > 0 ? (
          <>
            {/* Premium Podium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="grid grid-cols-3 gap-3 md:gap-6 mb-12 max-w-3xl mx-auto"
            >
              {/* 2nd Place */}
              {top3[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="order-1"
                >
                  <UserImageLink 
                    userId={top3[1].userId} 
                    username={top3[1].profileUsername}
                    className="group flex flex-col items-center pt-8"
                  >
                    <div className={cn(
                      "relative w-18 md:w-24 h-18 md:h-24 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                      getPodiumGlow(2)
                    )}>
                      <div className={cn(
                        "w-full h-full rounded-full bg-gradient-to-br p-1",
                        getPodiumGradient(2)
                      )}>
                        <div className="w-full h-full rounded-full overflow-hidden bg-background">
                          {top3[1].avatar ? (
                            <img src={top3[1].avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">🥈</div>
                          )}
                        </div>
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-sm font-bold text-gray-900 shadow-lg">
                        2
                      </div>
                    </div>
                    <h3 className="font-bold text-center text-sm md:text-base truncate max-w-full px-2">{top3[1].username}</h3>
                    <SocialBadges 
                      kickUsername={top3[1].kick_username}
                      twitchUsername={top3[1].twitch_username}
                      discordTag={top3[1].discord_tag}
                      size="sm"
                      className="my-2"
                    />
                    <p className="text-xl md:text-2xl font-black text-gray-400">{getValue(top3[1])}</p>
                    <p className="text-xs text-muted-foreground">{getValueLabel()}</p>
                    <div className="mt-4 w-full h-24 bg-gradient-to-t from-gray-500/20 to-transparent rounded-t-2xl" />
                  </UserImageLink>
                </motion.div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="order-2"
                >
                  <UserImageLink 
                    userId={top3[0].userId} 
                    username={top3[0].profileUsername}
                    className="group flex flex-col items-center"
                  >
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                      <Crown className="w-8 md:w-10 h-8 md:h-10 text-yellow-500 mb-2" />
                    </motion.div>
                    <div className={cn(
                      "relative w-24 md:w-32 h-24 md:h-32 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                      getPodiumGlow(1)
                    )}>
                      <div className={cn(
                        "w-full h-full rounded-full bg-gradient-to-br p-1.5 animate-pulse",
                        getPodiumGradient(1)
                      )}>
                        <div className="w-full h-full rounded-full overflow-hidden bg-background">
                          {top3[0].avatar ? (
                            <img src={top3[0].avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">🏆</div>
                          )}
                        </div>
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-lg font-bold text-yellow-900 shadow-lg">
                        1
                      </div>
                    </div>
                    <h3 className="font-bold text-center text-base md:text-lg truncate max-w-full px-2">{top3[0].username}</h3>
                    <SocialBadges 
                      kickUsername={top3[0].kick_username}
                      twitchUsername={top3[0].twitch_username}
                      discordTag={top3[0].discord_tag}
                      size="sm"
                      className="my-2"
                    />
                    <p className="text-2xl md:text-3xl font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                      {getValue(top3[0])}
                    </p>
                    <p className="text-xs text-muted-foreground">{getValueLabel()}</p>
                    <div className="mt-4 w-full h-32 bg-gradient-to-t from-yellow-500/20 to-transparent rounded-t-2xl" />
                  </UserImageLink>
                </motion.div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="order-3"
                >
                  <UserImageLink 
                    userId={top3[2].userId} 
                    username={top3[2].profileUsername}
                    className="group flex flex-col items-center pt-12"
                  >
                    <div className={cn(
                      "relative w-16 md:w-20 h-16 md:h-20 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                      getPodiumGlow(3)
                    )}>
                      <div className={cn(
                        "w-full h-full rounded-full bg-gradient-to-br p-1",
                        getPodiumGradient(3)
                      )}>
                        <div className="w-full h-full rounded-full overflow-hidden bg-background">
                          {top3[2].avatar ? (
                            <img src={top3[2].avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🥉</div>
                          )}
                        </div>
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-sm font-bold text-amber-100 shadow-lg">
                        3
                      </div>
                    </div>
                    <h3 className="font-bold text-center text-xs md:text-sm truncate max-w-full px-2">{top3[2].username}</h3>
                    <SocialBadges 
                      kickUsername={top3[2].kick_username}
                      twitchUsername={top3[2].twitch_username}
                      discordTag={top3[2].discord_tag}
                      size="sm"
                      className="my-2"
                    />
                    <p className="text-lg md:text-xl font-black text-amber-600">{getValue(top3[2])}</p>
                    <p className="text-xs text-muted-foreground">{getValueLabel()}</p>
                    <div className="mt-4 w-full h-16 bg-gradient-to-t from-amber-600/20 to-transparent rounded-t-2xl" />
                  </UserImageLink>
                </motion.div>
              )}
            </motion.div>

            {/* Stats Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
            >
              {[
                { icon: Users, value: totalPlayers, label: "Players", color: "text-accent" },
                { icon: Star, value: totalPoints, label: "Total Points", color: "text-yellow-500" },
                { icon: Target, value: totalBonusHuntWins, label: "GTW Wins", color: "text-green-500" },
                { icon: Gift, value: totalGiveawayEntries, label: "Giveaway Entries", color: "text-primary" },
              ].map(({ icon: Icon, value, label, color }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 text-center hover:bg-card/70 transition-colors"
                >
                  <Icon className={cn("w-6 h-6 mx-auto mb-2", color)} />
                  <p className="text-xl md:text-2xl font-bold">{value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Leaderboard Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/20">
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rank</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Player</th>
                      <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {category === "bonushunt" ? "Bonus Pts" : category === "giveaways" ? "Entries" : "Points"}
                      </th>
                      <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                        GTW Wins
                      </th>
                      <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                        Giveaways
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {restOfList.map((player, index) => (
                        <motion.tr
                          key={player.userId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: index * 0.02 }}
                          className={cn(
                            "border-b border-border/30 hover:bg-muted/20 transition-colors",
                            user?.id === player.userId && "bg-primary/5 hover:bg-primary/10"
                          )}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-muted-foreground">#{player.rank}</span>
                              {getRankBadge(player.rank)}
                            </div>
                          </td>
                          <td className="p-4">
                            <UserImageLink 
                              userId={player.userId} 
                              username={player.profileUsername}
                              className="flex items-center gap-3 hover:text-primary transition-colors"
                            >
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
                                  {player.avatar ? (
                                    <img src={player.avatar} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-sm">⭐</span>
                                  )}
                                </div>
                                {user?.id === player.userId && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                    <span className="text-[10px] text-primary-foreground">You</span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{player.username}</span>
                                  <SocialBadges 
                                    kickUsername={player.kick_username}
                                    twitchUsername={player.twitch_username}
                                    discordTag={player.discord_tag}
                                    size="sm"
                                  />
                                </div>
                                {player.display_name && player.display_name !== player.username && (
                                  <p className="text-xs text-muted-foreground">{player.display_name}</p>
                                )}
                              </div>
                            </UserImageLink>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-bold text-primary text-lg">{getValue(player)}</span>
                          </td>
                          <td className="p-4 text-center hidden md:table-cell">
                            <span className="text-muted-foreground">{player.bonusHuntWins}</span>
                          </td>
                          <td className="p-4 text-center hidden lg:table-cell">
                            <span className="text-muted-foreground">{player.giveawayEntries}</span>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              
              {restOfList.length === 0 && searchQuery && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No players found matching "{searchQuery}"</p>
                </div>
              )}
            </motion.div>

            {/* How to Earn Points */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-10 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">How to Earn Points</h2>
                  <p className="text-sm text-muted-foreground">Climb the leaderboard by participating in community activities</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: config.box1_icon, title: config.box1_title, text: config.box1_text, color: "text-green-500", bg: "bg-green-500/10" },
                  { icon: config.box2_icon, title: config.box2_title, text: config.box2_text, color: "text-primary", bg: "bg-primary/10" },
                  { icon: config.box3_icon, title: config.box3_title, text: config.box3_text, color: "text-yellow-500", bg: "bg-yellow-500/10" },
                ].map(({ icon, title, text, color, bg }, i) => {
                  const IconComponent = getIconComponent(icon);
                  return (
                    <motion.div
                      key={title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.65 + i * 0.05 }}
                      className="p-5 bg-background/50 rounded-xl border border-border/30 hover:border-border/50 transition-colors"
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", bg)}>
                        <IconComponent className={cn("w-5 h-5", color)} />
                      </div>
                      <h3 className="font-semibold mb-2">{title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-card/30 backdrop-blur-sm rounded-2xl border border-border/50"
          >
            <Trophy className="w-20 h-20 mx-auto mb-6 text-muted-foreground/20" />
            <h2 className="text-2xl font-bold mb-3">No Players Yet</h2>
            <p className="text-muted-foreground mb-6">Be the first to earn points and claim the top spot!</p>
            <Button>Start Earning Points</Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
