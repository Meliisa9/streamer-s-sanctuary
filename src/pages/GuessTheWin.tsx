import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Target, Trophy, Users, Clock, Lock, CheckCircle2, History, Medal, Star, Sparkles, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type GTWSession = Tables<"gtw_sessions"> & { currency?: string };
type GTWGuess = Tables<"gtw_guesses">;

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
};

function GuessTheWin() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [guessAmounts, setGuessAmounts] = useState<Record<string, string>>({});
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["gtw-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gtw_sessions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GTWSession[];
    },
  });

  const activeSessions = sessions?.filter((s) => s.status === "active" || s.status === "upcoming") || [];
  const pastSessions = sessions?.filter((s) => s.status === "ended" || s.status === "completed").slice(0, 5) || [];

  const { data: userGuesses } = useQuery({
    queryKey: ["user-gtw-guesses", user?.id],
    queryFn: async () => {
      if (!user) return {};
      const activeSessionIds = activeSessions.map(s => s.id);
      if (activeSessionIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from("gtw_guesses")
        .select("*")
        .eq("user_id", user.id)
        .in("session_id", activeSessionIds);
      if (error) throw error;
      
      const guessMap: Record<string, GTWGuess> = {};
      data.forEach(guess => {
        guessMap[guess.session_id] = guess;
      });
      return guessMap;
    },
    enabled: !!user && activeSessions.length > 0,
  });

  const { data: sessionEntryCounts } = useQuery({
    queryKey: ["gtw-entry-counts"],
    queryFn: async () => {
      if (activeSessions.length === 0) return {};
      
      const counts: Record<string, number> = {};
      for (const session of activeSessions) {
        const { count, error } = await supabase
          .from("gtw_guesses")
          .select("*", { count: "exact", head: true })
          .eq("session_id", session.id);
        if (!error) counts[session.id] = count || 0;
      }
      return counts;
    },
    enabled: activeSessions.length > 0,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["gtw-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, display_name, points, avatar_url")
        .order("points", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const { data: recentWinners } = useQuery({
    queryKey: ["gtw-recent-winners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gtw_sessions")
        .select("*, profiles:winner_id(username, display_name, avatar_url)")
        .not("winner_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const submitGuessMutation = useMutation({
    mutationFn: async ({ sessionId, amount }: { sessionId: string; amount: number }) => {
      if (!user) throw new Error("Not authenticated");
      
      const existingGuess = userGuesses?.[sessionId];
      if (existingGuess) {
        throw new Error("You have already submitted a guess. Guesses cannot be changed.");
      }
      
      const { error } = await supabase
        .from("gtw_guesses")
        .insert([{ session_id: sessionId, user_id: user.id, guess_amount: amount }]);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-gtw-guesses"] });
      queryClient.invalidateQueries({ queryKey: ["gtw-entry-counts"] });
      toast({ title: "Guess submitted! Good luck! (+10 XP)" });
      setGuessAmounts(prev => ({ ...prev, [variables.sessionId]: "" }));
      
      // Award XP for submitting a guess
      if (user) {
        supabase
          .from("profiles")
          .select("points")
          .eq("user_id", user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              supabase
                .from("profiles")
                .update({ points: (data.points || 0) + 10 })
                .eq("user_id", user.id);
            }
          });
      }
    },
    onError: (error) => {
      toast({ title: "Error submitting guess", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmitGuess = (session: GTWSession) => {
    if (!user) {
      toast({ title: "Please login to participate", variant: "destructive" });
      return;
    }
    const amount = parseFloat(guessAmounts[session.id] || "");
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    submitGuessMutation.mutate({ sessionId: session.id, amount });
  };

  const getCurrencySymbol = (currency: string | null | undefined) => {
    return CURRENCY_SYMBOLS[currency || "USD"] || "$";
  };

  const toggleSessionExpand = (sessionId: string) => {
    setExpandedSessions(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
  };

  const totalActiveSessions = activeSessions.length;
  const totalEntries = Object.values(sessionEntryCounts || {}).reduce((a, b) => a + b, 0);
  const completedCount = pastSessions.length;

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Guess <span className="gradient-text">The Win</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Predict the total winnings and climb the leaderboard!
          </p>
        </motion.div>

        {/* Stats Overview - Only show when logged in */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="glass rounded-xl p-4 text-center">
              <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-xl font-bold">{totalActiveSessions}</p>
              <p className="text-xs text-muted-foreground">Active Sessions</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-accent" />
              <p className="text-xl font-bold">{totalEntries}</p>
              <p className="text-xs text-muted-foreground">Current Entries</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-xl font-bold">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Star className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-xl font-bold">{profile?.points || 0}</p>
              <p className="text-xs text-muted-foreground">Your Points</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Active Sessions - Compact Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Active Sessions
            </h2>

            {activeSessions.length > 0 ? (
              <div className="space-y-3">
                {activeSessions.map((session, index) => {
                  const userGuess = userGuesses?.[session.id];
                  const entryCount = sessionEntryCounts?.[session.id] || 0;
                  const isLocked = session.status === "locked";
                  const hasSubmittedGuess = !!userGuess;
                  const currencySymbol = getCurrencySymbol(session.currency);
                  const isExpanded = expandedSessions[session.id] || (activeSessions.length === 1);

                  return (
                    <div 
                      key={session.id} 
                      className={`glass rounded-xl overflow-hidden transition-all ${
                        hasSubmittedGuess ? "border border-green-500/30" : "border border-border"
                      }`}
                    >
                      {/* Header - Always visible */}
                      <div 
                        className="p-4 cursor-pointer hover:bg-secondary/20 transition-colors"
                        onClick={() => activeSessions.length > 1 && toggleSessionExpand(session.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              session.status === "active" ? "bg-green-500 animate-pulse" : "bg-amber-500"
                            }`} />
                            <h3 className="font-semibold">{session.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              session.status === "active"
                                ? "bg-green-500/20 text-green-500"
                                : "bg-amber-500/20 text-amber-500"
                            }`}>
                              {session.status === "active" ? "Open" : session.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {entryCount}
                            </span>
                            {hasSubmittedGuess && (
                              <span className="text-xs text-green-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {currencySymbol}{Number(userGuess.guess_amount).toLocaleString()}
                              </span>
                            )}
                            {activeSessions.length > 1 && (
                              isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                        
                        {/* Prize Pool Preview */}
                        {session.pot_amount && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            Prize Pool: <span className="text-primary font-medium">{session.pot_amount}</span>
                          </div>
                        )}
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-border/50">
                          {/* Guess Input */}
                          <div className="mt-4">
                            {hasSubmittedGuess ? (
                              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="text-green-400 font-medium flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Your guess is locked
                                  </span>
                                  <span className="text-xl font-bold">
                                    {currencySymbol}{Number(userGuess.guess_amount).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <label className="text-sm font-medium">
                                  Your Guess (Total Winnings in {currencySymbol})
                                </label>
                                <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                                    <input
                                      type="number"
                                      value={guessAmounts[session.id] || ""}
                                      onChange={(e) => setGuessAmounts(prev => ({ ...prev, [session.id]: e.target.value }))}
                                      disabled={isLocked || session.status === "upcoming" || !user}
                                      placeholder="Enter your guess..."
                                      className="w-full pl-7 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                                    />
                                  </div>
                                  <Button
                                    variant="gold"
                                    disabled={isLocked || session.status === "upcoming" || !guessAmounts[session.id] || submitGuessMutation.isPending || !user}
                                    onClick={() => handleSubmitGuess(session)}
                                    className="gap-2"
                                  >
                                    {isLocked ? <Lock className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                                    {isLocked ? "Locked" : "Submit"}
                                  </Button>
                                </div>
                                {!user && (
                                  <p className="text-xs text-muted-foreground">
                                    <Link to="/auth" className="text-primary hover:underline">Login</Link> to submit your guess
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* How It Works - only show on first expanded session */}
                          {index === 0 && isExpanded && !hasSubmittedGuess && (
                            <div className="grid grid-cols-3 gap-3 mt-4">
                              <div className="p-3 bg-secondary/30 rounded-lg text-center">
                                <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
                                <p className="text-xs">Make Guess</p>
                              </div>
                              <div className="p-3 bg-secondary/30 rounded-lg text-center">
                                <Lock className="w-5 h-5 mx-auto mb-1 text-accent" />
                                <p className="text-xs">Guesses Lock</p>
                              </div>
                              <div className="p-3 bg-secondary/30 rounded-lg text-center">
                                <Trophy className="w-5 h-5 mx-auto mb-1 text-green-500" />
                                <p className="text-xs">Win Points</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass rounded-xl p-8 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-bold mb-2">No Active Session</h2>
                <p className="text-muted-foreground">
                  Check back later for the next Guess The Win session!
                </p>
              </div>
            )}

            {/* Recent Winners */}
            {recentWinners && recentWinners.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Recent Winners
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {recentWinners.map((session: any) => (
                    <div key={session.id} className="glass rounded-lg p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
                        {session.profiles?.avatar_url ? (
                          <img src={session.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Trophy className="w-5 h-5 text-accent" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{session.profiles?.display_name || session.profiles?.username || "Winner"}</p>
                        <p className="text-xs text-muted-foreground truncate">{session.title}</p>
                      </div>
                      <span className="text-accent font-bold text-sm">
                        {getCurrencySymbol(session.currency)}{Number(session.winning_guess).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Sidebar - Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            <div className="glass rounded-xl p-5">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Medal className="w-5 h-5 text-yellow-500" />
                Leaderboard
              </h2>
              {leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-2">
                  {leaderboard.map((player, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        index < 3 ? "bg-secondary/50" : ""
                      }`}
                    >
                      <span className={`w-6 text-center font-bold text-sm ${
                        index === 0 ? "text-yellow-500" :
                        index === 1 ? "text-gray-400" :
                        index === 2 ? "text-amber-600" : "text-muted-foreground"
                      }`}>
                        {index + 1}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                        {player.avatar_url ? (
                          <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold">
                            {(player.display_name || player.username || "?")[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{player.display_name || player.username}</p>
                      </div>
                      <span className="font-bold text-primary text-sm">{player.points?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No players yet</p>
              )}
              <Link to="/leaderboard">
                <Button variant="outline" size="sm" className="w-full mt-4">
                  View Full Leaderboard
                </Button>
              </Link>
            </div>

            {/* Past Sessions */}
            {pastSessions.length > 0 && (
              <div className="glass rounded-xl p-5">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-muted-foreground" />
                  Past Sessions
                </h2>
                <div className="space-y-2">
                  {pastSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg">
                      <span className="text-sm truncate flex-1">{session.title}</span>
                      {session.actual_total && (
                        <span className="text-sm font-medium text-primary">
                          {getCurrencySymbol(session.currency)}{Number(session.actual_total).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default GuessTheWin;
