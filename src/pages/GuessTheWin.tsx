import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Target, Trophy, Users, Clock, Lock, CheckCircle2, ArrowRight, History, Medal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type GTWSession = Tables<"gtw_sessions">;
type GTWGuess = Tables<"gtw_guesses">;

function GuessTheWin() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [guessAmount, setGuessAmount] = useState("");

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

  const currentSession = sessions?.find((s) => s.status === "active" || s.status === "upcoming");
  const pastSessions = sessions?.filter((s) => s.status === "ended").slice(0, 5);

  const { data: userGuess } = useQuery({
    queryKey: ["user-gtw-guess", currentSession?.id, user?.id],
    queryFn: async () => {
      if (!currentSession || !user) return null;
      const { data, error } = await supabase
        .from("gtw_guesses")
        .select("*")
        .eq("session_id", currentSession.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as GTWGuess | null;
    },
    enabled: !!currentSession && !!user,
  });

  const { data: sessionEntryCount } = useQuery({
    queryKey: ["gtw-entry-count", currentSession?.id],
    queryFn: async () => {
      if (!currentSession) return 0;
      const { count, error } = await supabase
        .from("gtw_guesses")
        .select("*", { count: "exact", head: true })
        .eq("session_id", currentSession.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!currentSession,
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

  const submitGuessMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!user || !currentSession) throw new Error("Not authenticated or no active session");
      
      // Users cannot update their guess once submitted
      if (userGuess) {
        throw new Error("You have already submitted a guess. Guesses cannot be changed.");
      }
      
      // Insert new guess
      const { error } = await supabase
        .from("gtw_guesses")
        .insert([{ session_id: currentSession.id, user_id: user.id, guess_amount: amount }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-gtw-guess"] });
      queryClient.invalidateQueries({ queryKey: ["gtw-entry-count"] });
      toast({ title: "Guess submitted! Good luck!" });
      setGuessAmount("");
    },
    onError: (error) => {
      toast({ title: "Error submitting guess", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmitGuess = () => {
    if (!user) {
      toast({ title: "Please login to participate", variant: "destructive" });
      return;
    }
    const amount = parseFloat(guessAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    submitGuessMutation.mutate(amount);
  };

  const isLocked = currentSession?.status === "locked" || currentSession?.status === "ended";
  const hasSubmittedGuess = !!userGuess;

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
            Guess <span className="gradient-text">The Win</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Predict the total winnings and climb the leaderboard!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Session */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            {currentSession ? (
              <div className="glass rounded-2xl p-6 neon-border">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      currentSession.status === "active"
                        ? "bg-green-500/20 text-green-500"
                        : currentSession.status === "locked"
                        ? "bg-amber-500/20 text-amber-500"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {currentSession.status === "active" && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                      {currentSession.status === "active" ? "Accepting Guesses" : 
                       currentSession.status === "locked" ? "Locked - Results Soon" : 
                       currentSession.status === "upcoming" ? "Coming Soon" : "Ended"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {sessionEntryCount?.toLocaleString() || 0} entries
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-2">{currentSession.title}</h2>
                <p className="text-muted-foreground mb-6">
                  Guess the total winnings from today's bonus hunt session!
                </p>

                {currentSession.pot_amount && (
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-1">Prize Pool</p>
                    <p className="text-4xl font-bold gradient-text-gold">{currentSession.pot_amount}</p>
                  </div>
                )}

                {/* Guess Input */}
                <div className="bg-secondary/50 rounded-xl p-6 mb-6">
                  <label className="text-sm font-medium mb-2 block">
                    Your Guess (Total Winnings in $)
                  </label>
                  {hasSubmittedGuess ? (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                      <div className="flex items-center gap-2 text-green-500 mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-semibold">Guess Submitted!</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        ${Number(userGuess.guess_amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Your guess is locked and cannot be changed. Good luck!
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <input
                          type="number"
                          value={guessAmount}
                          onChange={(e) => setGuessAmount(e.target.value)}
                          disabled={isLocked || currentSession.status === "upcoming"}
                          placeholder="Enter your guess..."
                          className="w-full pl-8 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <Button
                        variant="gold"
                        size="lg"
                        disabled={isLocked || currentSession.status === "upcoming" || !guessAmount || submitGuessMutation.isPending}
                        onClick={handleSubmitGuess}
                        className="gap-2"
                      >
                        {isLocked ? (
                          <>
                            <Lock className="w-4 h-4" />
                            Locked
                          </>
                        ) : (
                          <>
                            <Target className="w-4 h-4" />
                            Submit Guess
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* How It Works */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-secondary/30 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">1. Make Your Guess</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter your prediction for the total winnings
                    </p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mb-3">
                      <Lock className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="font-semibold mb-1">2. Guesses Lock</h3>
                    <p className="text-sm text-muted-foreground">
                      Guesses are locked 30 minutes into the stream
                    </p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
                      <Trophy className="w-5 h-5 text-green-500" />
                    </div>
                    <h3 className="font-semibold mb-1">3. Win Points</h3>
                    <p className="text-sm text-muted-foreground">
                      Closest guess wins! Earn points for accuracy
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass rounded-2xl p-6 text-center">
                <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-2">No Active Session</h2>
                <p className="text-muted-foreground">
                  Check back later for the next Guess The Win session!
                </p>
              </div>
            )}

            {/* Past Sessions */}
            {pastSessions && pastSessions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
              >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-muted-foreground" />
                  Recent Results
                </h2>
                <div className="glass rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Title</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Winning Guess</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastSessions.map((session) => (
                        <tr key={session.id} className="border-b border-border/50 last:border-0">
                          <td className="p-4 text-sm">{new Date(session.created_at).toLocaleDateString()}</td>
                          <td className="p-4 text-sm">{session.title}</td>
                          <td className="p-4 text-sm font-semibold text-accent">
                            {session.actual_total ? `$${Number(session.actual_total).toLocaleString()}` : "-"}
                          </td>
                          <td className="p-4 text-sm text-primary">
                            {session.winning_guess ? `$${Number(session.winning_guess).toLocaleString()}` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Medal className="w-5 h-5 text-accent" />
                Leaderboard
              </h2>

              <div className="space-y-3">
                {leaderboard?.map((player, index) => (
                  <div
                    key={player.username || index}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      index < 3
                        ? "bg-accent/10 border border-accent/20"
                        : "bg-secondary/50 hover:bg-secondary"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                      index === 0
                        ? "bg-yellow-500/20"
                        : index === 1
                        ? "bg-gray-400/20"
                        : index === 2
                        ? "bg-amber-600/20"
                        : "bg-secondary"
                    }`}>
                      {index === 0 ? "🏆" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{player.display_name || player.username || "Anonymous"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{(player.points || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <Link to="/leaderboard">
                  <Button variant="outline" className="w-full gap-2">
                    View Full Leaderboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Your Stats */}
            <div className="glass rounded-2xl p-6 mt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-accent" />
                Your Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-secondary/50 rounded-xl">
                  <p className="text-2xl font-bold text-primary">
                    {profile ? (leaderboard?.findIndex(p => p.username === profile.username) ?? -1) + 1 || "--" : "--"}
                  </p>
                  <p className="text-xs text-muted-foreground">Your Rank</p>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-xl">
                  <p className="text-2xl font-bold text-accent">{profile?.points || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Points</p>
                </div>
              </div>
              {!user && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  <Link to="/auth" className="text-primary hover:underline">Login</Link> to track your progress!
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default GuessTheWin;
