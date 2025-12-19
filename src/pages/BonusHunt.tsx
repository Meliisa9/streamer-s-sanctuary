import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useBonusHuntRealtime } from "@/hooks/useBonusHuntRealtime";
import { calculateMultiplier, updateBonusHuntStats, calculateBonusHuntStats } from "@/hooks/useBonusHuntCalculations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InlineWinEditor } from "@/components/bonus-hunt/InlineWinEditor";
import { 
  Target, Trophy, TrendingUp, DollarSign, 
  CheckCircle2, Search, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Zap, Star,
  Lock, Users, ArrowUpDown, LayoutList
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
  winner_user_id: string | null;
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
  points_earned: number | null;
}

interface WinnerInfo {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  guess_amount: number;
  points_earned: number | null;
}

export default function BonusHunt() {
  const { user, isAdmin, isModerator } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentHuntIndex, setCurrentHuntIndex] = useState(0);
  const [slotSearch, setSlotSearch] = useState("");
  const [slotPage, setSlotPage] = useState(0);
  const [guessAmount, setGuessAmount] = useState("");
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"sort_order" | "bet_amount" | "multiplier" | "win_amount">("sort_order");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [activeTab, setActiveTab] = useState("stats");
  const SLOTS_PER_PAGE = 10;
  
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

  const displayHunt = hunts?.[currentHuntIndex];
  const totalHunts = hunts?.length || 0;

  // Fetch slots for displayed hunt
  const { data: slots } = useQuery({
    queryKey: ["bonus-hunt-slots", displayHunt?.id],
    queryFn: async () => {
      if (!displayHunt?.id) return [];
      const { data, error } = await supabase
        .from("bonus_hunt_slots")
        .select("*")
        .eq("hunt_id", displayHunt.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as BonusHuntSlot[];
    },
    enabled: !!displayHunt?.id,
  });

  // Enable real-time updates
  useBonusHuntRealtime(displayHunt?.id);

  // Fetch user's guess for current hunt
  const { data: userGuess } = useQuery({
    queryKey: ["bonus-hunt-guess", displayHunt?.id, user?.id],
    queryFn: async () => {
      if (!displayHunt?.id || !user?.id) return null;
      const { data, error } = await supabase
        .from("bonus_hunt_guesses")
        .select("*")
        .eq("hunt_id", displayHunt.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserGuess | null;
    },
    enabled: !!displayHunt?.id && !!user?.id,
  });

  // Fetch all guesses for current hunt
  const { data: allGuesses } = useQuery({
    queryKey: ["bonus-hunt-all-guesses", displayHunt?.id],
    queryFn: async () => {
      if (!displayHunt?.id) return [];
      const { data, error } = await supabase
        .from("bonus_hunt_guesses")
        .select("*")
        .eq("hunt_id", displayHunt.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!displayHunt?.id,
  });

  // Fetch winner info for completed hunts
  const { data: winnerInfo } = useQuery({
    queryKey: ["bonus-hunt-winner", displayHunt?.id],
    queryFn: async () => {
      if (!displayHunt?.winner_user_id) return null;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("user_id", displayHunt.winner_user_id)
        .single();
      
      const { data: guess } = await supabase
        .from("bonus_hunt_guesses")
        .select("guess_amount, points_earned")
        .eq("hunt_id", displayHunt.id)
        .eq("user_id", displayHunt.winner_user_id)
        .single();
      
      if (!profile || !guess) return null;
      
      return {
        ...profile,
        guess_amount: guess.guess_amount,
        points_earned: guess.points_earned,
      } as WinnerInfo;
    },
    enabled: !!displayHunt?.winner_user_id,
  });

  const guessCount = allGuesses?.length || 0;

  const submitGuessMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!user || !displayHunt) throw new Error("Not authenticated or no active hunt");
      const { error } = await supabase
        .from("bonus_hunt_guesses")
        .insert({ hunt_id: displayHunt.id, user_id: user.id, guess_amount: amount });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonus-hunt-guess"] });
      queryClient.invalidateQueries({ queryKey: ["bonus-hunt-all-guesses"] });
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
      
      if (displayHunt?.id) {
        await updateBonusHuntStats(displayHunt.id);
        
        // Check if all slots are now played - auto-complete
        const updatedSlots = slots?.map(s => s.id === slotId ? { ...s, is_played: true } : s);
        const allPlayed = updatedSlots?.every(s => s.is_played);
        
        if (allPlayed && displayHunt.status !== "complete") {
          const endingBalance = updatedSlots?.reduce((sum, s) => sum + (s.id === slotId ? winAmount : (s.win_amount || 0)), 0) || 0;
          
          // Update hunt to complete
          await supabase
            .from("bonus_hunts")
            .update({ status: "complete", ending_balance: endingBalance })
            .eq("id", displayHunt.id);
          
          toast({ 
            title: "Hunt Completed!", 
            description: `All ${updatedSlots?.length} slots played. Final balance: ${currencySymbol}${endingBalance.toLocaleString()}` 
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["bonus-hunt-slots"] });
      queryClient.invalidateQueries({ queryKey: ["bonus-hunts"] });
      toast({ title: "Win updated!" });
    } catch (error: any) {
      toast({ title: "Error updating win", description: error.message, variant: "destructive" });
    } finally {
      setSavingSlotId(null);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    return calculateBonusHuntStats(slots || [], displayHunt?.starting_balance || null);
  }, [slots, displayHunt?.starting_balance]);

  // Sort and filter slots
  const sortedSlots = useMemo(() => {
    let filtered = slots?.filter(s => 
      s.slot_name.toLowerCase().includes(slotSearch.toLowerCase()) ||
      s.provider?.toLowerCase().includes(slotSearch.toLowerCase())
    ) || [];
    
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      return sortDir === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }, [slots, slotSearch, sortField, sortDir]);

  const totalPages = Math.ceil(sortedSlots.length / SLOTS_PER_PAGE);
  const paginatedSlots = sortedSlots.slice(slotPage * SLOTS_PER_PAGE, (slotPage + 1) * SLOTS_PER_PAGE);

  const currencySymbol = displayHunt?.currency === "EUR" ? "€" : displayHunt?.currency === "GBP" ? "£" : displayHunt?.currency === "SEK" ? "kr" : displayHunt?.currency === "CAD" ? "C$" : "$";

  // Top performers
  const topWinSlot = slots?.reduce((max, s) => (s.win_amount || 0) > (max?.win_amount || 0) ? s : max, slots[0]);
  const topMultiplierSlot = slots?.reduce((max, s) => (s.multiplier || 0) > (max?.multiplier || 0) ? s : max, slots[0]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setSlotPage(0);
  };

  const navigateHunt = (direction: "prev" | "next" | "first" | "last") => {
    if (direction === "first") setCurrentHuntIndex(totalHunts - 1);
    else if (direction === "last") setCurrentHuntIndex(0);
    else if (direction === "prev") setCurrentHuntIndex(i => Math.min(totalHunts - 1, i + 1));
    else setCurrentHuntIndex(i => Math.max(0, i - 1));
    setSlotPage(0);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
  };

  // Calculate hunt number
  const huntNumber = totalHunts > 0 ? totalHunts - currentHuntIndex : 0;

  return (
    <div className="min-h-screen py-6 px-4 md:px-6 bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container mx-auto max-w-7xl">
        {/* Header with unique gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 blur-3xl -z-10" />
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
              BONUS HUNT
            </h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            Live GTW predictions, multiplier tracking, and real-time bonus collection stats
          </p>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
              <Target className="absolute inset-0 m-auto w-6 h-6 text-primary/50" />
            </div>
            <p className="text-muted-foreground mt-6 animate-pulse">Loading bonus hunt...</p>
          </div>
        ) : !displayHunt ? (
          <div className="bg-gradient-to-br from-card/50 to-card/30 border border-border/50 rounded-2xl p-12 text-center backdrop-blur-sm">
            <div className="p-4 rounded-full bg-muted/30 w-fit mx-auto mb-4">
              <Target className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Bonus Hunts Yet</h2>
            <p className="text-muted-foreground">Check back later for bonus hunts!</p>
          </div>
        ) : (
          <>
            {/* Navigation Bar - Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-6"
            >
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateHunt("first")}
                  disabled={currentHuntIndex >= totalHunts - 1}
                  className="h-11 w-11 rounded-xl border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateHunt("prev")}
                  disabled={currentHuntIndex >= totalHunts - 1}
                  className="h-11 w-11 rounded-xl border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-1 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 border border-primary/30 rounded-xl py-3 px-5 flex items-center justify-center gap-3 backdrop-blur-sm">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  displayHunt.status === "ongoing" ? "bg-green-500 animate-pulse" : 
                  displayHunt.status === "complete" ? "bg-primary" : "bg-yellow-500"
                }`} />
                <span className="font-black text-lg tracking-wide">HUNT #{huntNumber}</span>
                <span className="text-muted-foreground text-sm hidden sm:inline">•</span>
                <span className="text-muted-foreground text-sm hidden sm:inline">{formatDate(displayHunt.date)}</span>
                {displayHunt.status === "complete" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">COMPLETED</span>
                )}
              </div>
              
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateHunt("next")}
                  disabled={currentHuntIndex <= 0}
                  className="h-11 w-11 rounded-xl border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-xl border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all"
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Column - Slots Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2"
              >
                <div className="bg-gradient-to-br from-card/60 to-card/40 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl shadow-black/5">
                  {/* Search Header */}
                  <div className="p-3 border-b border-border/50">
                    <div className="relative">
                      <Input
                        placeholder="Find Slot or Provider"
                        value={slotSearch}
                        onChange={(e) => { setSlotSearch(e.target.value); setSlotPage(0); }}
                        className="bg-background/50 pr-10"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/10">
                          <th className="text-left p-3 text-xs font-semibold text-muted-foreground w-12">#</th>
                          <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Slot</th>
                          <th 
                            className="text-right p-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                            onClick={() => handleSort("bet_amount")}
                          >
                            <span className="inline-flex items-center gap-1">
                              <ArrowUpDown className="w-3 h-3" />
                              Bet
                            </span>
                          </th>
                          <th 
                            className="text-right p-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                            onClick={() => handleSort("multiplier")}
                          >
                            <span className="inline-flex items-center gap-1">
                              <ArrowUpDown className="w-3 h-3" />
                              X
                            </span>
                          </th>
                          <th 
                            className="text-right p-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                            onClick={() => handleSort("win_amount")}
                          >
                            <span className="inline-flex items-center gap-1">
                              <ArrowUpDown className="w-3 h-3" />
                              Win
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSlots.length > 0 ? (
                          paginatedSlots.map((slot, index) => {
                            const rowNum = slotPage * SLOTS_PER_PAGE + index + 1;
                            const isHighMultiplier = (slot.multiplier || 0) >= 100;
                            
                            return (
                              <tr 
                                key={slot.id}
                                className={`border-b border-border/30 transition-colors hover:bg-muted/10 ${
                                  !slot.is_played ? 'opacity-60' : ''
                                } ${isHighMultiplier ? 'bg-yellow-500/5' : ''}`}
                              >
                                <td className="p-3 text-sm text-muted-foreground">{rowNum}</td>
                                <td className="p-3">
                                  <span className="font-medium text-sm text-primary">{slot.slot_name}</span>
                                </td>
                                <td className="p-3 text-right text-sm">
                                  {slot.bet_amount ? `${currencySymbol}${slot.bet_amount.toLocaleString()}` : '-'}
                                </td>
                                <td className="p-3 text-right">
                                  {slot.is_played && slot.multiplier !== null ? (
                                    <span className={`text-sm font-medium ${
                                      isHighMultiplier ? 'text-yellow-500' : 
                                      (slot.multiplier || 0) >= 20 ? 'text-green-500' : ''
                                    }`}>
                                      {slot.multiplier.toFixed(2)}x
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
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
                                      <span className="text-sm font-medium">
                                        {currencySymbol}{slot.win_amount.toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )
                                  )}
                                </td>
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
                    <div className="p-3 border-t border-border/50 flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSlotPage(0)}
                        disabled={slotPage === 0}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i;
                        else if (slotPage < 3) pageNum = i;
                        else if (slotPage > totalPages - 4) pageNum = totalPages - 5 + i;
                        else pageNum = slotPage - 2 + i;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={slotPage === pageNum ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setSlotPage(pageNum)}
                            className="h-8 w-8 p-0"
                          >
                            {pageNum + 1}
                          </Button>
                        );
                      })}
                      
                      {totalPages > 5 && slotPage < totalPages - 3 && (
                        <>
                          <span className="px-2 text-muted-foreground">...</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSlotPage(totalPages - 1)}
                            className="h-8 w-8 p-0"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSlotPage(totalPages - 1)}
                        disabled={slotPage >= totalPages - 1}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Right Column - Stats Sidebar with Tabs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="bg-card/30 border border-border/50 rounded-xl overflow-hidden">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full rounded-none bg-muted/20 border-b border-border/50">
                      <TabsTrigger value="stats" className="flex-1">STATS</TabsTrigger>
                      <TabsTrigger value="gtw" className="flex-1">GTW</TabsTrigger>
                      <TabsTrigger value="avgx" className="flex-1">AVG X</TabsTrigger>
                    </TabsList>

                    {/* STATS Tab */}
                    <TabsContent value="stats" className="p-4 space-y-3 mt-0">
                      <div className="border-b border-border/50 pb-3">
                        <h3 className="font-bold text-lg">BONUS HUNT #{huntNumber}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(displayHunt.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      
                      <StatRow 
                        icon="📊" 
                        label="STATUS" 
                        value={displayHunt.status === "ongoing" ? "LIVE" : displayHunt.status === "to_be_played" ? "UPCOMING" : "ENDED"}
                        valueColor={displayHunt.status === "ongoing" ? "text-green-500" : displayHunt.status === "to_be_played" ? "text-yellow-500" : ""}
                      />
                      <StatRow icon="🎁" label="BONUS" value={slots?.length || 0} />
                      <StatRow icon="🎯" label="TARGET BALANCE" value={`${currencySymbol}${displayHunt.target_balance?.toLocaleString() || '0'}`} />
                      <StatRow 
                        icon="💰" 
                        label="END BALANCE" 
                        value={`${currencySymbol}${(displayHunt.ending_balance || stats.ending_balance).toLocaleString()}`}
                        valueColor="text-primary"
                        highlight
                      />
                      <StatRow icon="💵" label="AVG. BET" value={`${currencySymbol}${stats.average_bet.toFixed(0)}`} />
                      <StatRow icon="📈" label="AVERAGE X (GROUP)" value={`${stats.average_x.toFixed(0)} (${stats.played_count})`} />
                      <StatRow icon="📉" label="BREAK-EVEN X" value={stats.break_even_x.toFixed(0)} />
                      <StatRow 
                        icon="🔥" 
                        label="HIGHEST WIN" 
                        value={`${currencySymbol}${(displayHunt.highest_win || stats.highest_win).toLocaleString()}`}
                        valueColor="text-yellow-500"
                      />
                      <StatRow 
                        icon="⚡" 
                        label="HIGHEST MULTIPLIER" 
                        value={`${(displayHunt.highest_multiplier || stats.highest_multiplier).toLocaleString()}X`}
                        valueColor="text-purple-500"
                      />
                      
                      <Link to="/leaderboard" className="block mt-4">
                        <Button variant="outline" className="w-full">
                          READ ABOUT BONUS HUNT
                        </Button>
                      </Link>
                    </TabsContent>

                    {/* GTW Tab */}
                    <TabsContent value="gtw" className="p-4 space-y-4 mt-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground border-b border-border/50 pb-3">
                        <Users className="w-4 h-4" />
                        <span>{guessCount} {guessCount === 1 ? 'guess' : 'guesses'} submitted</span>
                      </div>

                      {displayHunt.status === "complete" && winnerInfo && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            <span className="font-bold text-yellow-500">Winner</span>
                          </div>
                          <p className="font-medium">{winnerInfo.display_name || winnerInfo.username}</p>
                          <p className="text-sm text-muted-foreground">
                            Guessed: {currencySymbol}{winnerInfo.guess_amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-green-500">+{winnerInfo.points_earned?.toLocaleString()} points</p>
                        </div>
                      )}

                      {displayHunt.status === "complete" && userGuess && (
                        <div className="bg-muted/20 border border-border/50 rounded-lg p-4">
                          <h4 className="font-medium mb-2">Your Result</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Your Guess</p>
                              <p className="font-bold">{currencySymbol}{userGuess.guess_amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Final Balance</p>
                              <p className="font-bold">{currencySymbol}{displayHunt.ending_balance?.toLocaleString()}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-muted-foreground">Difference</p>
                              <p className={`font-bold ${Math.abs(userGuess.guess_amount - (displayHunt.ending_balance || 0)) < 1000 ? 'text-green-500' : ''}`}>
                                {currencySymbol}{Math.abs(userGuess.guess_amount - (displayHunt.ending_balance || 0)).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {(displayHunt.status === "ongoing" || displayHunt.status === "to_be_played") && (
                        <>
                          {userGuess ? (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <span className="font-medium text-green-500">Your Guess is Locked!</span>
                              </div>
                              <p className="text-2xl font-bold">{currencySymbol}{Number(userGuess.guess_amount).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Winner determined when hunt ends
                              </p>
                            </div>
                          ) : user ? (
                            <div className="space-y-3">
                              <p className="text-sm text-muted-foreground">
                                Predict the final balance of this bonus hunt!
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
                                Closest guess wins {displayHunt.winner_points || 1000} points!
                              </p>
                            </div>
                          ) : (
                            <div className="text-center p-4 bg-muted/20 rounded-lg">
                              <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                <Link to="/auth" className="text-primary hover:underline">Login</Link> to submit your guess!
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </TabsContent>

                    {/* AVG X Tab */}
                    <TabsContent value="avgx" className="p-4 space-y-4 mt-0">
                      <div className="space-y-3">
                        <div className="bg-muted/20 rounded-lg p-4 text-center">
                          <p className="text-xs text-muted-foreground mb-1">CURRENT AVG X</p>
                          <p className="text-4xl font-bold text-primary">{stats.average_x.toFixed(2)}x</p>
                          <p className="text-xs text-muted-foreground mt-1">from {stats.played_count} bonuses</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-muted/10 rounded-lg p-3 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Break-Even X</p>
                            <p className="text-xl font-bold">{stats.break_even_x.toFixed(2)}x</p>
                          </div>
                          <div className="bg-muted/10 rounded-lg p-3 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                            <p className="text-xl font-bold">{stats.remaining_count}</p>
                          </div>
                        </div>
                        
                        {topMultiplierSlot && topMultiplierSlot.multiplier && (
                          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">TOP MULTIPLIER</p>
                            <p className="font-bold text-purple-500">{topMultiplierSlot.multiplier.toFixed(2)}x</p>
                            <p className="text-xs text-muted-foreground">{topMultiplierSlot.slot_name}</p>
                          </div>
                        )}
                        
                        {topWinSlot && topWinSlot.win_amount && (
                          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">TOP WIN</p>
                            <p className="font-bold text-yellow-500">{currencySymbol}{topWinSlot.win_amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{topWinSlot.slot_name}</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </motion.div>
            </div>

            {/* Bottom Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 bg-card/30 border border-border/50 rounded-xl p-4"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
                <BottomStat label="START BALANCE" value={`${currencySymbol}${displayHunt.starting_balance?.toLocaleString() || '0'}`} />
                <BottomStat label="TARGET" value={`${currencySymbol}${displayHunt.target_balance?.toLocaleString() || '0'}`} />
                <BottomStat label="TOTAL BETS" value={`${currencySymbol}${stats.total_bets.toLocaleString()}`} />
                <BottomStat label="BONUSES" value={`${stats.played_count}/${slots?.length || 0}`} />
                <BottomStat label="AVG X" value={`${stats.average_x.toFixed(2)}x`} />
                <BottomStat label="BREAK-EVEN X" value={`${stats.break_even_x.toFixed(2)}x`} />
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

// Helper Components
function StatRow({ icon, label, value, valueColor, highlight }: { 
  icon: string; 
  label: string; 
  value: string | number; 
  valueColor?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-2 ${highlight ? 'bg-primary/5 -mx-4 px-4 rounded' : ''}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <span className={`font-bold ${valueColor || ''}`}>{value}</span>
    </div>
  );
}

function BottomStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-sm">{value}</p>
    </div>
  );
}