import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Target, Trophy, TrendingUp, DollarSign, 
  Clock, CheckCircle2, History, Search,
  ChevronLeft, ChevronRight, Zap, Award, Star
} from "lucide-react";
import { Link } from "react-router-dom";

interface BonusHunt {
  id: string;
  title: string;
  date: string;
  status: "ongoing" | "complete" | "to_be_played";
  starting_balance: number | null;
  target_balance: number | null;
  ending_balance: number | null;
  average_bet: number | null;
  highest_win: number | null;
  highest_multiplier: number | null;
  currency: string | null;
  winner_points: number | null;
  created_at: string;
}

interface BonusHuntSlot {
  id: string;
  hunt_id: string;
  slot_name: string;
  provider: string | null;
  bet_amount: number | null;
  win_amount: number | null;
  multiplier: number | null;
  is_played: boolean;
  sort_order: number;
}

interface UserGuess {
  id: string;
  hunt_id: string;
  user_id: string;
  guess_amount: number;
}

export default function BonusHunt() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedHunt, setSelectedHunt] = useState<BonusHunt | null>(null);
  const [slotSearch, setSlotSearch] = useState("");
  const [slotPage, setSlotPage] = useState(0);
  const [guessAmount, setGuessAmount] = useState("");
  const SLOTS_PER_PAGE = 10;

  // Fetch all bonus hunts
  const { data: hunts, isLoading } = useQuery({
    queryKey: ["bonus-hunts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bonus_hunts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BonusHunt[];
    },
  });

  const currentHunt = hunts?.find(h => h.status === "ongoing" || h.status === "to_be_played");
  const previousHunts = hunts?.filter(h => h.status === "complete") || [];

  // Fetch slots for selected or current hunt
  const activeHuntId = selectedHunt?.id || currentHunt?.id;
  const { data: slots } = useQuery({
    queryKey: ["bonus-hunt-slots", activeHuntId],
    queryFn: async () => {
      if (!activeHuntId) return [];
      const { data, error } = await supabase
        .from("bonus_hunt_slots")
        .select("*")
        .eq("hunt_id", activeHuntId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as BonusHuntSlot[];
    },
    enabled: !!activeHuntId,
  });

  // Fetch user's guess for current hunt
  const { data: userGuess } = useQuery({
    queryKey: ["bonus-hunt-guess", currentHunt?.id, user?.id],
    queryFn: async () => {
      if (!currentHunt?.id || !user?.id) return null;
      const { data, error } = await supabase
        .from("bonus_hunt_guesses")
        .select("*")
        .eq("hunt_id", currentHunt.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserGuess | null;
    },
    enabled: !!currentHunt?.id && !!user?.id,
  });

  // Fetch guess counts
  const { data: guessCount } = useQuery({
    queryKey: ["bonus-hunt-guess-count", currentHunt?.id],
    queryFn: async () => {
      if (!currentHunt?.id) return 0;
      const { count, error } = await supabase
        .from("bonus_hunt_guesses")
        .select("*", { count: "exact", head: true })
        .eq("hunt_id", currentHunt.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!currentHunt?.id,
  });

  const submitGuessMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!user || !currentHunt) throw new Error("Not authenticated or no active hunt");
      const { error } = await supabase
        .from("bonus_hunt_guesses")
        .insert({ hunt_id: currentHunt.id, user_id: user.id, guess_amount: amount });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonus-hunt-guess"] });
      queryClient.invalidateQueries({ queryKey: ["bonus-hunt-guess-count"] });
      toast({ title: "Guess submitted! Good luck!" });
      setGuessAmount("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmitGuess = () => {
    const amount = parseFloat(guessAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    submitGuessMutation.mutate(amount);
  };

  // Filter and paginate slots
  const filteredSlots = slots?.filter(s => 
    s.slot_name.toLowerCase().includes(slotSearch.toLowerCase()) ||
    s.provider?.toLowerCase().includes(slotSearch.toLowerCase())
  ) || [];
  const totalPages = Math.ceil(filteredSlots.length / SLOTS_PER_PAGE);
  const paginatedSlots = filteredSlots.slice(slotPage * SLOTS_PER_PAGE, (slotPage + 1) * SLOTS_PER_PAGE);

  const displayHunt = selectedHunt || currentHunt;

  // Calculate stats
  const totalBonuses = slots?.length || 0;
  const playedBonuses = slots?.filter(s => s.is_played).length || 0;
  const totalWinnings = slots?.reduce((sum, s) => sum + (s.win_amount || 0), 0) || 0;
  const totalBets = slots?.reduce((sum, s) => sum + (s.bet_amount || 0), 0) || 0;
  const averageX = totalBets > 0 ? (totalWinnings / totalBets).toFixed(2) : "0";
  const averageBet = totalBonuses > 0 ? (totalBets / totalBonuses).toFixed(2) : "0";
  const breakEvenX = displayHunt?.starting_balance && totalBets > 0 
    ? ((displayHunt.starting_balance) / totalBets).toFixed(2) 
    : "0";
  const currencySymbol = displayHunt?.currency === "EUR" ? "€" : displayHunt?.currency === "GBP" ? "£" : displayHunt?.currency === "SEK" ? "kr" : displayHunt?.currency === "CAD" ? "C$" : "$";

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
            <span className="gradient-text-gold">Bonus Hunt</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Track our bonus hunts, guess the final balance, and see the results!
          </p>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-20">Loading...</div>
        ) : !displayHunt ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Active Bonus Hunt</h2>
            <p className="text-muted-foreground">Check back later for the next bonus hunt!</p>
            
            {previousHunts.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Previous Hunts</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {previousHunts.slice(0, 5).map(hunt => (
                    <Button 
                      key={hunt.id} 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedHunt(hunt)}
                    >
                      {hunt.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hunt Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold">{displayHunt.title}</h2>
                      <Badge variant={displayHunt.status === "ongoing" ? "default" : displayHunt.status === "to_be_played" ? "outline" : "secondary"}>
                        {displayHunt.status === "ongoing" ? (
                          <><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />Ongoing</>
                        ) : displayHunt.status === "to_be_played" ? (
                          <><Clock className="w-3 h-3 mr-1" />To Be Played</>
                        ) : "Complete"}
                      </Badge>
                    </div>
                  <p className="text-muted-foreground">
                    {new Date(displayHunt.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>
                {selectedHunt && (
                  <Button variant="outline" onClick={() => setSelectedHunt(null)}>
                    Back to Current Hunt
                  </Button>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                <div className="p-3 bg-secondary/30 rounded-xl text-center">
                  <Target className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{totalBonuses}</p>
                  <p className="text-xs text-muted-foreground">Total Bonuses</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl text-center">
                  <DollarSign className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                  <p className="text-lg font-bold">{currencySymbol}{displayHunt.starting_balance?.toLocaleString() || "TBD"}</p>
                  <p className="text-xs text-muted-foreground">Starting Balance</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl text-center">
                  <Target className="w-4 h-4 mx-auto mb-1 text-green-500" />
                  <p className="text-lg font-bold">{currencySymbol}{displayHunt.target_balance?.toLocaleString() || "TBD"}</p>
                  <p className="text-xs text-muted-foreground">Target Balance</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl text-center">
                  <Trophy className="w-4 h-4 mx-auto mb-1 text-accent" />
                  <p className="text-lg font-bold">
                    {currencySymbol}{displayHunt.ending_balance?.toLocaleString() || totalWinnings.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {displayHunt.status === "complete" ? "Final Balance" : "Current Balance"}
                  </p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl text-center">
                  <DollarSign className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                  <p className="text-lg font-bold">{currencySymbol}{displayHunt.average_bet?.toLocaleString() || averageBet}</p>
                  <p className="text-xs text-muted-foreground">Average Bet</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl text-center">
                  <TrendingUp className="w-4 h-4 mx-auto mb-1 text-cyan-500" />
                  <p className="text-lg font-bold">{averageX}x</p>
                  <p className="text-xs text-muted-foreground">Average X</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl text-center">
                  <TrendingUp className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                  <p className="text-lg font-bold">{breakEvenX}x</p>
                  <p className="text-xs text-muted-foreground">Break-Even X</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl text-center">
                  <Zap className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
                  <p className="text-lg font-bold">{currencySymbol}{displayHunt.highest_win?.toLocaleString() || "0"}</p>
                  <p className="text-xs text-muted-foreground">Highest Win</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl text-center">
                  <Star className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                  <p className="text-lg font-bold">{displayHunt.highest_multiplier?.toLocaleString() || "0"}x</p>
                  <p className="text-xs text-muted-foreground">Highest X</p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Slot List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-2 glass rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Slot List ({playedBonuses}/{totalBonuses})
                  </h3>
                  <div className="relative w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search slots..."
                      value={slotSearch}
                      onChange={(e) => { setSlotSearch(e.target.value); setSlotPage(0); }}
                      className="pl-9"
                    />
                  </div>
                </div>

                {paginatedSlots.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {paginatedSlots.map((slot, index) => (
                        <div
                          key={slot.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            slot.is_played ? "bg-green-500/10 border border-green-500/20" : "bg-secondary/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground w-6 text-sm">
                              #{slotPage * SLOTS_PER_PAGE + index + 1}
                            </span>
                            <div>
                              <p className="font-medium">{slot.slot_name}</p>
                              {slot.provider && (
                                <p className="text-xs text-muted-foreground">{slot.provider}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            {slot.bet_amount && (
                              <span className="text-muted-foreground">
                                ${slot.bet_amount}
                              </span>
                            )}
                            {slot.is_played && slot.win_amount !== null && (
                              <span className={slot.win_amount > 0 ? "text-green-500 font-medium" : "text-red-500"}>
                                ${slot.win_amount.toLocaleString()}
                              </span>
                            )}
                            {slot.is_played && slot.multiplier !== null && (
                              <Badge variant="outline" className={slot.multiplier >= 100 ? "text-yellow-500" : ""}>
                                {slot.multiplier}x
                              </Badge>
                            )}
                            {slot.is_played && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSlotPage(p => Math.max(0, p - 1))}
                          disabled={slotPage === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {slotPage + 1} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSlotPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={slotPage >= totalPages - 1}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {slotSearch ? "No slots match your search" : "No slots added yet"}
                  </div>
                )}
              </motion.div>

              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                {/* Guess Section - Only for ongoing hunts */}
                {currentHunt && displayHunt.id === currentHunt.id && (
                  <div className="glass rounded-2xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Guess Final Balance
                    </h3>
                    
                    {userGuess ? (
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span className="font-medium text-green-500">Guess Submitted!</span>
                        </div>
                        <p className="text-2xl font-bold">${Number(userGuess.guess_amount).toLocaleString()}</p>
                      </div>
                    ) : user ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            type="number"
                            placeholder="Enter your guess..."
                            value={guessAmount}
                            onChange={(e) => setGuessAmount(e.target.value)}
                            className="pl-7"
                          />
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={handleSubmitGuess}
                          disabled={submitGuessMutation.isPending}
                        >
                          Submit Guess
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          {guessCount} guesses so far
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        <Link to="/auth" className="text-primary hover:underline">Login</Link> to submit your guess
                      </p>
                    )}
                  </div>
                )}

                {/* Previous Hunts */}
                {previousHunts.length > 0 && (
                  <div className="glass rounded-2xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <History className="w-5 h-5 text-muted-foreground" />
                      Previous Hunts
                    </h3>
                    <div className="space-y-2">
                      {previousHunts.slice(0, 5).map(hunt => (
                        <button
                          key={hunt.id}
                          onClick={() => setSelectedHunt(hunt)}
                          className={`w-full p-3 rounded-lg text-left transition-colors ${
                            selectedHunt?.id === hunt.id
                              ? "bg-primary/20 border border-primary/30"
                              : "bg-secondary/30 hover:bg-secondary/50"
                          }`}
                        >
                          <p className="font-medium text-sm">{hunt.title}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(hunt.date).toLocaleDateString()}
                            </span>
                            {hunt.ending_balance && (
                              <span className="text-xs text-green-500 font-medium">
                                ${hunt.ending_balance.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
