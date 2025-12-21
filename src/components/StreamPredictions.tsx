import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Users, Trophy, Coins, Lock, CheckCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Prediction {
  id: string;
  title: string;
  description: string | null;
  status: string;
  outcome: string | null;
  profit_pool: number;
  loss_pool: number;
  min_bet: number;
  max_bet: number;
  option_a_label: string;
  option_b_label: string;
  option_a_pool: number;
  option_b_pool: number;
  created_at: string;
  locked_at: string | null;
  resolved_at: string | null;
}

interface UserBet {
  id: string;
  prediction_id: string;
  bet_amount: number;
  predicted_outcome: string;
  payout: number | null;
}

export function StreamPredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [userBets, setUserBets] = useState<Record<string, UserBet>>({});
  const [betAmounts, setBetAmounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [isAdminOrMod, setIsAdminOrMod] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPredictions();
    if (user) {
      fetchUserBets();
      fetchUserPoints();
      checkAdminOrMod();
    }

    const channel = supabase
      .channel("predictions_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "stream_predictions" }, () => {
        fetchPredictions();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "prediction_bets" }, () => {
        fetchPredictions();
        if (user) fetchUserBets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchPredictions = async () => {
    const { data, error } = await supabase
      .from("stream_predictions")
      .select("*")
      .in("status", ["open", "locked"])
      .order("created_at", { ascending: false })
      .limit(4);

    if (!error && data) {
      setPredictions(data);
    }
    setIsLoading(false);
  };

  const fetchUserBets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("prediction_bets")
      .select("*")
      .eq("user_id", user.id);

    if (data) {
      const betsMap: Record<string, UserBet> = {};
      data.forEach((bet) => {
        betsMap[bet.prediction_id] = bet;
      });
      setUserBets(betsMap);
    }
  };

  const fetchUserPoints = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("points")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setUserPoints(data.points || 0);
    }
  };

  const checkAdminOrMod = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "moderator"]);

    setIsAdminOrMod(data && data.length > 0);
  };

  const lockPrediction = async (predictionId: string) => {
    const { error } = await supabase
      .from("stream_predictions")
      .update({ status: "locked", locked_at: new Date().toISOString() })
      .eq("id", predictionId);

    if (error) {
      toast({ title: "Error locking prediction", variant: "destructive" });
      return;
    }
    toast({ title: "Prediction locked" });
    fetchPredictions();
  };

  const resolvePrediction = async (predictionId: string, outcome: "option_a" | "option_b") => {
    const prediction = predictions.find((p) => p.id === predictionId);
    if (!prediction) return;

    const winningPool = outcome === "option_a" ? (prediction.option_a_pool || 0) : (prediction.option_b_pool || 0);
    const losingPool = outcome === "option_a" ? (prediction.option_b_pool || 0) : (prediction.option_a_pool || 0);
    const totalPool = winningPool + losingPool;

    // Update the prediction status
    const { error: predictionError } = await supabase
      .from("stream_predictions")
      .update({
        status: "resolved",
        outcome: outcome,
        resolved_at: new Date().toISOString(),
        profit_pool: winningPool,
        loss_pool: losingPool,
      })
      .eq("id", predictionId);

    if (predictionError) {
      toast({ title: "Error resolving prediction", variant: "destructive" });
      return;
    }

    // Get all bets for this prediction
    const { data: bets } = await supabase
      .from("prediction_bets")
      .select("*")
      .eq("prediction_id", predictionId);

    if (bets) {
      // Calculate and distribute payouts to winners
      for (const bet of bets) {
        if (bet.predicted_outcome === outcome && winningPool > 0) {
          const payout = Math.floor((bet.bet_amount / winningPool) * totalPool);
          
          // Update bet with payout
          await supabase
            .from("prediction_bets")
            .update({ payout })
            .eq("id", bet.id);

          // Add points to winner's profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("points")
            .eq("user_id", bet.user_id)
            .single();

          if (profile) {
            await supabase
              .from("profiles")
              .update({ points: (profile.points || 0) + payout })
              .eq("user_id", bet.user_id);
          }

          // Notify winner
          await supabase.from("user_notifications").insert({
            user_id: bet.user_id,
            title: "You won a prediction!",
            message: `You won ${payout} points on "${prediction.title}"`,
            type: "achievement",
            link: "/stream",
          });
        }
      }
    }

    const outcomeLabel = outcome === "option_a" ? (prediction.option_a_label || "Option A") : (prediction.option_b_label || "Option B");
    toast({ title: `Prediction resolved: ${outcomeLabel} wins!` });
    fetchPredictions();
  };

  const placeBet = async (predictionId: string, outcome: "option_a" | "option_b") => {
    if (!user) {
      toast({ title: "Please login to place bets", variant: "destructive" });
      return;
    }

    const prediction = predictions.find((p) => p.id === predictionId);
    if (!prediction || prediction.status !== "open") {
      toast({ title: "This prediction is not open for betting", variant: "destructive" });
      return;
    }

    const amount = betAmounts[predictionId] || prediction.min_bet;

    if (amount < prediction.min_bet || amount > prediction.max_bet) {
      toast({
        title: `Bet must be between ${prediction.min_bet} and ${prediction.max_bet} points`,
        variant: "destructive",
      });
      return;
    }

    if (amount > userPoints) {
      toast({ title: "Insufficient points", variant: "destructive" });
      return;
    }

    const { error: pointsError } = await supabase
      .from("profiles")
      .update({ points: userPoints - amount })
      .eq("user_id", user.id);

    if (pointsError) {
      toast({ title: "Error placing bet", variant: "destructive" });
      return;
    }

    const { error: betError } = await supabase.from("prediction_bets").insert({
      prediction_id: predictionId,
      user_id: user.id,
      bet_amount: amount,
      predicted_outcome: outcome,
    });

    if (betError) {
      await supabase
        .from("profiles")
        .update({ points: userPoints })
        .eq("user_id", user.id);
      toast({ title: "Error placing bet", variant: "destructive" });
      return;
    }

    const poolField = outcome === "option_a" ? "option_a_pool" : "option_b_pool";
    const currentPool = outcome === "option_a" ? (prediction.option_a_pool || 0) : (prediction.option_b_pool || 0);
    await supabase
      .from("stream_predictions")
      .update({ [poolField]: currentPool + amount })
      .eq("id", predictionId);

    const outcomeLabel = outcome === "option_a" ? (prediction.option_a_label || "Option A") : (prediction.option_b_label || "Option B");
    toast({ title: `Bet placed: ${amount} points on ${outcomeLabel}` });
    setUserPoints(userPoints - amount);
    fetchUserBets();
    fetchPredictions();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Open</Badge>;
      case "locked":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Lock className="w-3 h-3 mr-1" />Locked</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const calculateOdds = (prediction: Prediction) => {
    const poolA = prediction.option_a_pool || 0;
    const poolB = prediction.option_b_pool || 0;
    const total = poolA + poolB;
    if (total === 0) return { optionA: 50, optionB: 50 };
    return {
      optionA: Math.round((poolA / total) * 100),
      optionB: Math.round((poolB / total) * 100),
    };
  };

  if (isLoading) {
    return (
      <Card className="glass border-border/50 animate-pulse">
        <CardContent className="p-6 h-48" />
      </Card>
    );
  }

  if (predictions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Stream Predictions</h2>
            <p className="text-sm text-muted-foreground">Bet on stream outcomes</p>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="font-bold">{userPoints.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">pts</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence>
          {predictions.map((prediction, index) => {
            const odds = calculateOdds(prediction);
            const userBet = userBets[prediction.id];
            const totalPool = (prediction.option_a_pool || 0) + (prediction.option_b_pool || 0);
            const optionALabel = prediction.option_a_label || "Option A";
            const optionBLabel = prediction.option_b_label || "Option B";

            return (
              <motion.div
                key={prediction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass border-border/50 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{prediction.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(prediction.status)}
                        {isAdminOrMod && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Settings className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {prediction.status === "open" && (
                                <DropdownMenuItem onClick={() => lockPrediction(prediction.id)}>
                                  <Lock className="w-4 h-4 mr-2" />
                                  Lock Betting
                                </DropdownMenuItem>
                              )}
                              {prediction.status === "locked" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => resolvePrediction(prediction.id, "option_a")}
                                    className="text-green-400"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {optionALabel} Wins
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => resolvePrediction(prediction.id, "option_b")}
                                    className="text-red-400"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {optionBLabel} Wins
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Pool Stats */}
                    <div className="flex items-center gap-2 text-xs">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Pool:</span>
                      <span className="font-bold">{totalPool.toLocaleString()}</span>
                    </div>

                    {/* Odds Visualization */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-green-400">
                          <TrendingUp className="w-3 h-3" />
                          <span>{optionALabel} {odds.optionA}%</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-400">
                          <span>{optionBLabel} {odds.optionB}%</span>
                          <TrendingDown className="w-3 h-3" />
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-green-400" 
                          style={{ width: `${odds.optionA}%` }} 
                        />
                        <div 
                          className="h-full bg-gradient-to-r from-red-400 to-red-500" 
                          style={{ width: `${odds.optionB}%` }} 
                        />
                      </div>
                    </div>

                    {/* User's Bet */}
                    {userBet && (
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Your bet:</span>
                          <span className="font-bold">
                            {userBet.bet_amount} pts on{" "}
                            <span className={userBet.predicted_outcome === "option_a" ? "text-green-400" : "text-red-400"}>
                              {userBet.predicted_outcome === "option_a" ? optionALabel : optionBLabel}
                            </span>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Betting Interface */}
                    {prediction.status === "open" && !userBet && user && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={prediction.min_bet}
                            max={Math.min(prediction.max_bet, userPoints)}
                            value={betAmounts[prediction.id] || prediction.min_bet}
                            onChange={(e) =>
                              setBetAmounts({
                                ...betAmounts,
                                [prediction.id]: parseInt(e.target.value) || prediction.min_bet,
                              })
                            }
                            className="h-8 text-sm"
                            placeholder="Amount"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-400"
                            onClick={() => placeBet(prediction.id, "option_a")}
                          >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {optionALabel}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400"
                            onClick={() => placeBet(prediction.id, "option_b")}
                          >
                            <TrendingDown className="w-3 h-3 mr-1" />
                            {optionBLabel}
                          </Button>
                        </div>
                      </div>
                    )}

                    {prediction.status === "open" && !user && (
                      <p className="text-center text-xs text-muted-foreground">
                        Login to place bets
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
