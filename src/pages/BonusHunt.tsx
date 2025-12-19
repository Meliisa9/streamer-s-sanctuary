import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useBonusHuntRealtime } from "@/hooks/useBonusHuntRealtime";
import { calculateMultiplier, updateBonusHuntStats } from "@/hooks/useBonusHuntCalculations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { BonusHuntProgress } from "@/components/bonus-hunt/BonusHuntProgress";
import { InlineWinEditor } from "@/components/bonus-hunt/InlineWinEditor";
import { 
  Target, Trophy, TrendingUp, DollarSign, 
  Clock, CheckCircle2, History, Search,
  ChevronLeft, ChevronRight, Zap, Star,
  Play, Pause, Hash, Coins, BarChart3,
  Calendar, Timer, ArrowUpRight, Radio, Users, Lock
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
  const { user, isAdmin, isModerator } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedHunt, setSelectedHunt] = useState<BonusHunt | null>(null);
  const [slotSearch, setSlotSearch] = useState("");
  const [slotPage, setSlotPage] = useState(0);
  const [guessAmount, setGuessAmount] = useState("");
  const [showWin, setShowWin] = useState(true);
  const [showMultiplier, setShowMultiplier] = useState(true);
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);
  const SLOTS_PER_PAGE = 15;
  
  const canEditSlots = isAdmin || isModerator;

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

  // Enable real-time updates
  useBonusHuntRealtime(activeHuntId);

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

  // Inline win update function for admins/mods
  const handleInlineWinUpdate = async (slotId: string, winAmount: number) => {
    setSavingSlotId(slotId);
    try {
      // Get the slot to calculate multiplier
      const slot = slots?.find(s => s.id === slotId);
      if (!slot) throw new Error("Slot not found");
      
      const multiplier = calculateMultiplier(slot.bet_amount, winAmount);
      
      const { error } = await supabase
        .from("bonus_hunt_slots")
        .update({ 
          win_amount: winAmount, 
          multiplier: multiplier,
          is_played: true 
        })
        .eq("id", slotId);
      
      if (error) throw error;
      
      // Update hunt stats
      if (activeHuntId) {
        await updateBonusHuntStats(activeHuntId);
      }
      
      queryClient.invalidateQueries({ queryKey: ["bonus-hunt-slots"] });
      queryClient.invalidateQueries({ queryKey: ["bonus-hunts"] });
      toast({ title: "Win updated & stats recalculated!" });
    } catch (error: any) {
      toast({ title: "Error updating win", description: error.message, variant: "destructive" });
    } finally {
      setSavingSlotId(null);
    }
  };

  // Filter and paginate slots
  const filteredSlots = slots?.filter(s => 
    s.slot_name.toLowerCase().includes(slotSearch.toLowerCase()) ||
    s.provider?.toLowerCase().includes(slotSearch.toLowerCase())
  ) || [];
  const totalPages = Math.ceil(filteredSlots.length / SLOTS_PER_PAGE);
  const paginatedSlots = filteredSlots.slice(slotPage * SLOTS_PER_PAGE, (slotPage + 1) * SLOTS_PER_PAGE);

  const displayHunt = selectedHunt || currentHunt;

  // Calculate stats using proper formulas
  const totalBonuses = slots?.length || 0;
  const playedBonuses = slots?.filter(s => s.is_played).length || 0;
  const remainingBonuses = totalBonuses - playedBonuses;
  
  // Sum of all wins from played slots
  const totalWinnings = slots?.filter(s => s.is_played).reduce((sum, s) => sum + (s.win_amount || 0), 0) || 0;
  
  // Sum of all bets
  const totalBets = slots?.reduce((sum, s) => sum + (s.bet_amount || 0), 0) || 0;
  
  // Average bet = total bets / number of slots
  const averageBet = totalBonuses > 0 ? (totalBets / totalBonuses) : 0;
  
  // Average X = sum of multipliers / number of played slots with multipliers
  const playedSlotsWithMultipliers = slots?.filter(s => s.is_played && s.multiplier !== null) || [];
  const totalMultiplier = playedSlotsWithMultipliers.reduce((sum, s) => sum + (s.multiplier || 0), 0);
  const averageX = playedSlotsWithMultipliers.length > 0 
    ? (totalMultiplier / playedSlotsWithMultipliers.length).toFixed(2) 
    : "0.00";
  
  // Break-even X = (Starting Balance - Current Wins) / (Remaining Slots Total Bets)
  // What multiplier is needed on remaining slots to match starting balance
  const remainingBets = slots?.filter(s => !s.is_played).reduce((sum, s) => sum + (s.bet_amount || 0), 0) || 0;
  let breakEvenX = "0.00";
  if (displayHunt?.starting_balance && remainingBets > 0) {
    const neededWins = displayHunt.starting_balance - totalWinnings;
    breakEvenX = (neededWins / remainingBets).toFixed(2);
  } else if (displayHunt?.starting_balance && totalBets > 0) {
    // If all slots played, show what was needed
    breakEvenX = (displayHunt.starting_balance / totalBets).toFixed(2);
  }
  
  const currencySymbol = displayHunt?.currency === "EUR" ? "€" : displayHunt?.currency === "GBP" ? "£" : displayHunt?.currency === "SEK" ? "kr" : displayHunt?.currency === "CAD" ? "C$" : "$";

  // Find top performers
  const topWinSlot = slots?.reduce((max, s) => (s.win_amount || 0) > (max?.win_amount || 0) ? s : max, slots[0]);
  const topMultiplierSlot = slots?.reduce((max, s) => (s.multiplier || 0) > (max?.multiplier || 0) ? s : max, slots[0]);

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === "ongoing") {
      return (
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-green-500 font-semibold">LIVE</span>
        </div>
      );
    }
    if (status === "to_be_played") {
      return (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-500" />
          <span className="text-yellow-500 font-semibold">UPCOMING</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground font-semibold">ENDED</span>
      </div>
    );
  };

  // Stat Box Component
  const StatBox = ({ icon: Icon, label, value, subValue, highlight, iconColor }: {
    icon: any;
    label: string;
    value: string | number;
    subValue?: string;
    highlight?: boolean;
    iconColor?: string;
  }) => (
    <div className={`bg-card/50 border border-border/50 rounded-lg p-4 ${highlight ? 'ring-1 ring-primary/50' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconColor || 'text-muted-foreground'}`} />
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
      {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4 md:px-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="gradient-text-gold">Bonus Hunt</span>
          </h1>
          <p className="text-muted-foreground">
            Track live bonus hunts, view results, and guess the final balance!
          </p>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading bonus hunt...</p>
          </div>
        ) : !displayHunt ? (
          <div className="bg-card/30 border border-border/50 rounded-2xl p-12 text-center">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Slots Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 space-y-4"
            >
              {/* Hunt Title Bar */}
              <div className="bg-card/30 border border-border/50 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">{displayHunt.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {new Date(displayHunt.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                  {selectedHunt && (
                    <Button variant="outline" size="sm" onClick={() => setSelectedHunt(null)}>
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Current Hunt
                    </Button>
                  )}
                </div>
              </div>

              {/* Slots Table */}
              <div className="bg-card/30 border border-border/50 rounded-xl overflow-hidden">
                {/* Table Header with Search & Toggles */}
                <div className="p-4 border-b border-border/50">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Bonuses ({playedBonuses}/{totalBonuses})
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Show Win</span>
                        <Switch checked={showWin} onCheckedChange={setShowWin} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Show X</span>
                        <Switch checked={showMultiplier} onCheckedChange={setShowMultiplier} />
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search..."
                          value={slotSearch}
                          onChange={(e) => { setSlotSearch(e.target.value); setSlotPage(0); }}
                          className="pl-9 h-9 w-40 bg-background/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/20">
                        <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">#</th>
                        <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Slot</th>
                        <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">Bet</th>
                        {showMultiplier && (
                          <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">X</th>
                        )}
                        {showWin && (
                          <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">Win</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSlots.length > 0 ? (
                        paginatedSlots.map((slot, index) => {
                          const rowNum = slotPage * SLOTS_PER_PAGE + index + 1;
                          const isHighMultiplier = (slot.multiplier || 0) >= 100;
                          const isBigWin = (slot.win_amount || 0) >= (slot.bet_amount || 1) * 50;
                          
                          return (
                            <tr 
                              key={slot.id}
                              className={`border-b border-border/30 transition-colors hover:bg-muted/10 ${
                                slot.is_played ? '' : 'opacity-60'
                              } ${isHighMultiplier ? 'bg-yellow-500/5' : ''}`}
                            >
                              <td className="p-3 text-sm text-muted-foreground font-mono">{rowNum}</td>
                              <td className="p-3">
                                <div>
                                  <span className="font-medium text-sm">{slot.slot_name}</span>
                                  {slot.provider && (
                                    <span className="text-xs text-muted-foreground ml-2">({slot.provider})</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-right text-sm font-mono">
                                {slot.bet_amount ? `${currencySymbol}${slot.bet_amount.toFixed(2)}` : '-'}
                              </td>
                              {showMultiplier && (
                                <td className="p-3 text-right">
                                  {slot.is_played && slot.multiplier !== null ? (
                                    <span className={`text-sm font-bold ${
                                      isHighMultiplier ? 'text-yellow-500' : 
                                      (slot.multiplier || 0) >= 20 ? 'text-green-500' : 
                                      'text-foreground'
                                    }`}>
                                      {slot.multiplier.toFixed(2)}x
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                              )}
                              {showWin && (
                                <td className="p-3 text-right">
                                  {canEditSlots ? (
                                    <InlineWinEditor
                                      slotId={slot.id}
                                      currentWin={slot.win_amount}
                                      betAmount={slot.bet_amount}
                                      currencySymbol={currencySymbol}
                                      isPlayed={slot.is_played}
                                      onSave={handleInlineWinUpdate}
                                      isSaving={savingSlotId === slot.id}
                                    />
                                  ) : (
                                    slot.is_played && slot.win_amount !== null ? (
                                      <span className={`text-sm font-bold font-mono ${
                                        isBigWin ? 'text-yellow-500' :
                                        slot.win_amount > 0 ? 'text-green-500' : 'text-red-500'
                                      }`}>
                                        {currencySymbol}{slot.win_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            {slotSearch ? "No slots match your search" : "No slots added yet"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-border/50 flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSlotPage(0)}
                      disabled={slotPage === 0}
                    >
                      First
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSlotPage(p => Math.max(0, p - 1))}
                      disabled={slotPage === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i;
                        } else if (slotPage < 3) {
                          pageNum = i;
                        } else if (slotPage > totalPages - 4) {
                          pageNum = totalPages - 5 + i;
                        } else {
                          pageNum = slotPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={slotPage === pageNum ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setSlotPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum + 1}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSlotPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={slotPage >= totalPages - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSlotPage(totalPages - 1)}
                      disabled={slotPage >= totalPages - 1}
                    >
                      Last
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Sidebar - Summary Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              {/* Progress Indicator */}
              {displayHunt.starting_balance && displayHunt.starting_balance > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Radio className="w-3 h-3 text-green-500 animate-pulse" />
                    <span>Live Updates Enabled</span>
                  </div>
                  <BonusHuntProgress
                    startingBalance={displayHunt.starting_balance}
                    currentBalance={totalWinnings}
                    targetBalance={displayHunt.target_balance || undefined}
                    currency={displayHunt.currency || "USD"}
                  />
                </div>
              )}

              {/* Summary Box */}
              <div className="bg-card/30 border border-border/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Summary</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Status */}
                  <div className="col-span-2 bg-card/50 border border-border/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {displayHunt.status === "ongoing" ? (
                        <Play className="w-4 h-4 text-green-500" />
                      ) : displayHunt.status === "to_be_played" ? (
                        <Pause className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Status</span>
                    </div>
                    <StatusBadge status={displayHunt.status} />
                  </div>

                  <StatBox 
                    icon={Hash} 
                    label="Bonuses" 
                    value={totalBonuses}
                    subValue={`${playedBonuses} opened`}
                    iconColor="text-blue-500"
                  />
                  
                  <StatBox 
                    icon={DollarSign} 
                    label="Start" 
                    value={`${currencySymbol}${displayHunt.starting_balance?.toLocaleString() || '0'}`}
                    iconColor="text-emerald-500"
                  />
                  
                  <StatBox 
                    icon={Target} 
                    label="Target" 
                    value={`${currencySymbol}${displayHunt.target_balance?.toLocaleString() || '0'}`}
                    iconColor="text-blue-500"
                  />
                  
                  <StatBox 
                    icon={Trophy} 
                    label={displayHunt.status === "complete" ? "End Balance" : "Current"}
                    value={`${currencySymbol}${(displayHunt.ending_balance || totalWinnings).toLocaleString()}`}
                    highlight={displayHunt.status === "complete"}
                    iconColor="text-yellow-500"
                  />

                  <StatBox 
                    icon={Coins} 
                    label="Avg Bet" 
                    value={`${currencySymbol}${averageBet.toFixed(2)}`}
                    iconColor="text-cyan-500"
                  />
                  
                  <StatBox 
                    icon={TrendingUp} 
                    label="Break-even" 
                    value={`${breakEvenX}x`}
                    subValue={remainingBonuses > 0 ? `${remainingBonuses} slots remaining` : "All played"}
                    iconColor="text-orange-500"
                  />

                  <StatBox 
                    icon={Zap} 
                    label="Highest Win" 
                    value={`${currencySymbol}${displayHunt.highest_win?.toLocaleString() || topWinSlot?.win_amount?.toLocaleString() || '0'}`}
                    subValue={topWinSlot?.slot_name}
                    iconColor="text-yellow-500"
                  />
                  
                  <StatBox 
                    icon={Star} 
                    label="Highest X" 
                    value={`${displayHunt.highest_multiplier || topMultiplierSlot?.multiplier || 0}x`}
                    subValue={topMultiplierSlot?.slot_name}
                    iconColor="text-purple-500"
                  />

                  <StatBox 
                    icon={BarChart3} 
                    label="Avg X" 
                    value={`${averageX}x`}
                    iconColor="text-cyan-500"
                  />
                  
                  <StatBox 
                    icon={Calendar} 
                    label="Date" 
                    value={new Date(displayHunt.date).toLocaleDateString()}
                    iconColor="text-muted-foreground"
                  />
                </div>
              </div>

              {/* Guess Section - For ongoing hunts OR show results for complete hunts */}
              {displayHunt && (displayHunt.status === "ongoing" || displayHunt.status === "to_be_played") && (
                <div className="bg-card/30 border border-border/50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Guess Final Balance
                  </h3>
                  
                  {/* Participant count */}
                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{guessCount} {guessCount === 1 ? 'guess' : 'guesses'} so far</span>
                  </div>
                  
                  {userGuess ? (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-green-500">Your Guess is Locked!</span>
                      </div>
                      <p className="text-2xl font-bold">{currencySymbol}{Number(userGuess.guess_amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Winner will be determined when the hunt ends
                      </p>
                    </div>
                  ) : user ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground mb-2">
                        Predict what the final balance will be at the end of this bonus hunt!
                      </p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                        <Input
                          type="number"
                          placeholder="Enter your guess..."
                          value={guessAmount}
                          onChange={(e) => setGuessAmount(e.target.value)}
                          className="pl-7 bg-background/50"
                        />
                      </div>
                      <Button 
                        className="w-full gap-2" 
                        onClick={handleSubmitGuess}
                        disabled={submitGuessMutation.isPending}
                      >
                        <Lock className="w-4 h-4" />
                        Lock In Guess
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        +10 XP for participating • Closest guess wins {displayHunt.winner_points || 1000} points!
                      </p>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-muted/20 rounded-lg">
                      <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        <Link to="/auth" className="text-primary hover:underline">Login</Link> to submit your guess and win points!
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Winner display for completed hunts */}
              {displayHunt && displayHunt.status === "complete" && userGuess && (
                <div className="bg-card/30 border border-border/50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    Your Guess Result
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Your guess:</span>
                      <span className="font-bold">{currencySymbol}{Number(userGuess.guess_amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Final balance:</span>
                      <span className="font-bold text-primary">{currencySymbol}{(displayHunt.ending_balance || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-border/50 pt-2">
                      <span className="text-muted-foreground">Difference:</span>
                      <span className="font-bold">
                        {currencySymbol}{Math.abs(Number(userGuess.guess_amount) - (displayHunt.ending_balance || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Previous Hunts */}
              {previousHunts.length > 0 && (
                <div className="bg-card/30 border border-border/50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Previous Hunts
                  </h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {previousHunts.map(hunt => (
                      <button
                        key={hunt.id}
                        onClick={() => setSelectedHunt(hunt)}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          selectedHunt?.id === hunt.id
                            ? "bg-primary/20 border border-primary/30"
                            : "bg-card/50 border border-border/50 hover:bg-muted/30"
                        }`}
                      >
                        <p className="font-medium text-sm truncate">{hunt.title}</p>
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
        )}
      </div>
    </div>
  );
}
