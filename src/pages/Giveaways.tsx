import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Gift, Users, Clock, Trophy, CheckCircle2, Lock, Sparkles, ArrowRight, Crown, Infinity, X, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "@/components/BookmarkButton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserImageLink } from "@/components/UserAvatarLink";
import type { Tables } from "@/integrations/supabase/types";

type Giveaway = Tables<"giveaways">;
type Profile = Tables<"profiles">;

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className="flex gap-3">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-1">
            <span className="text-2xl font-bold text-accent">{value}</span>
          </div>
          <span className="text-xs text-muted-foreground capitalize">{unit}</span>
        </div>
      ))}
    </div>
  );
}

// Past Giveaway Winner Modal
function WinnerModal({ 
  giveaway, 
  isOpen, 
  onClose 
}: { 
  giveaway: Giveaway | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { data: winners } = useQuery({
    queryKey: ["giveaway-winners", giveaway?.id],
    queryFn: async () => {
      if (!giveaway?.winner_ids || giveaway.winner_ids.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", giveaway.winner_ids);
      if (error) throw error;
      return data as Profile[];
    },
    enabled: isOpen && !!giveaway?.winner_ids?.length,
  });

  if (!giveaway) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {giveaway.title} - Winners
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Giveaway Info */}
          <div className="p-4 bg-secondary/30 rounded-xl text-center">
            <p className="text-2xl font-bold gradient-text-gold mb-2">{giveaway.prize}</p>
            <p className="text-sm text-muted-foreground">
              Ended {new Date(giveaway.end_date).toLocaleDateString()}
            </p>
          </div>

          {/* Winners List */}
          {winners && winners.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                {winners.length} Winner{winners.length > 1 ? "s" : ""}
              </h4>
              <div className="space-y-2">
                {winners.map((winner, index) => (
                  <UserImageLink
                    key={winner.user_id}
                    userId={winner.user_id}
                    username={winner.username}
                    className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl hover:bg-secondary/70 transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12 ring-2 ring-yellow-500/50">
                        <AvatarImage src={winner.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-amber-600 text-white font-bold">
                          {(winner.username || "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-black">
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">{winner.username || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">@{winner.username}</p>
                    </div>
                    <Crown className="w-5 h-5 text-yellow-500 ml-auto" />
                  </UserImageLink>
                ))}
              </div>
            </div>
          ) : giveaway.winner_ids && giveaway.winner_ids.length > 0 ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-muted-foreground">Loading winners...</p>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No winners announced yet</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Giveaways() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGiveaway, setSelectedGiveaway] = useState<Giveaway | null>(null);

  const { data: giveaways, isLoading } = useQuery({
    queryKey: ["giveaways"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("giveaways")
        .select("*")
        .order("end_date", { ascending: true });
      if (error) throw error;
      return data as Giveaway[];
    },
  });

  const { data: userEntries } = useQuery({
    queryKey: ["user-giveaway-entries", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("giveaway_entries")
        .select("giveaway_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((e) => e.giveaway_id);
    },
    enabled: !!user,
  });

  const { data: entryCounts } = useQuery({
    queryKey: ["giveaway-entry-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("giveaway_entries")
        .select("giveaway_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((e) => {
        counts[e.giveaway_id] = (counts[e.giveaway_id] || 0) + 1;
      });
      return counts;
    },
  });

  const enterMutation = useMutation({
    mutationFn: async (giveawayId: string) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("giveaway_entries")
        .insert([{ giveaway_id: giveawayId, user_id: user.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-giveaway-entries"] });
      queryClient.invalidateQueries({ queryKey: ["giveaway-entry-counts"] });
      toast({ title: "Successfully entered giveaway!" });
    },
    onError: (error) => {
      toast({ title: "Error entering giveaway", description: error.message, variant: "destructive" });
    },
  });

  const activeGiveaways = giveaways?.filter((g) => g.status === "active" && new Date(g.end_date) > new Date());
  const endedGiveaways = giveaways?.filter((g) => g.status === "ended" || new Date(g.end_date) <= new Date());

  const totalPrizeValue = giveaways?.reduce((acc, g) => {
    const match = g.prize.match(/\$?([\d,]+)/);
    return acc + (match ? parseInt(match[1].replace(/,/g, "")) : 0);
  }, 0) || 0;

  const isEntryLimitReached = (giveaway: Giveaway) => {
    if (!giveaway.max_entries || giveaway.max_entries === 0) return false;
    const currentEntries = entryCounts?.[giveaway.id] || 0;
    return currentEntries >= giveaway.max_entries;
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
            <span className="gradient-text-gold">Giveaways</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Enter for a chance to win amazing prizes from our community
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          <div className="glass rounded-2xl p-4 text-center">
            <Gift className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{activeGiveaways?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Active Giveaways</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">${totalPrizeValue.toLocaleString()}+</p>
            <p className="text-sm text-muted-foreground">Total Prizes</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{Object.values(entryCounts || {}).reduce((a, b) => a + b, 0)}</p>
            <p className="text-sm text-muted-foreground">Total Entries</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Crown className="w-8 h-8 mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">{endedGiveaways?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-20">Loading giveaways...</div>
        ) : (
          <>
            {/* Active Giveaways */}
            {activeGiveaways && activeGiveaways.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-accent" />
                  Active Giveaways
                </h2>

                <div className="space-y-6">
                  {activeGiveaways.map((giveaway, index) => {
                    const hasEntered = userEntries?.includes(giveaway.id);
                    const entries = entryCounts?.[giveaway.id] || 0;
                    const limitReached = isEntryLimitReached(giveaway);

                    return (
                      <motion.div
                        key={giveaway.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="glass rounded-2xl overflow-hidden neon-border"
                      >
                        <div className="flex flex-col lg:flex-row">
                          <div className="lg:w-80 h-48 lg:h-auto relative overflow-hidden">
                            {giveaway.image_url ? (
                              <img src={giveaway.image_url} alt={giveaway.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-secondary flex items-center justify-center">
                                <Gift className="w-16 h-16 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card lg:bg-gradient-to-t" />
                            {giveaway.is_exclusive && (
                              <span className="absolute top-4 left-4 px-3 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full">
                                EXCLUSIVE
                              </span>
                            )}
                          </div>

                          <div className="flex-1 p-6">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                              <div className="flex-1">
                                <h3 className="text-2xl font-bold mb-2">{giveaway.title}</h3>
                                {giveaway.description && (
                                  <p className="text-muted-foreground mb-4">{giveaway.description}</p>
                                )}
                                <div className="flex items-center gap-4 mb-4">
                                  <span className="text-3xl font-bold gradient-text-gold">{giveaway.prize}</span>
                                  <span className="px-3 py-1 bg-secondary text-sm rounded-full">{giveaway.prize_type}</span>
                                </div>
                                {giveaway.requirements && giveaway.requirements.length > 0 && (
                                  <div className="space-y-2 mb-4">
                                    {giveaway.requirements.map((req, i) => (
                                      <div key={i} className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        <span className="text-muted-foreground">{req}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {entries.toLocaleString()} entries
                                    {giveaway.max_entries && giveaway.max_entries > 0 ? (
                                      <span>/ {giveaway.max_entries.toLocaleString()}</span>
                                    ) : (
                                      <span className="flex items-center gap-1"><Infinity className="w-3 h-3" /> unlimited</span>
                                    )}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Trophy className="w-4 h-4" />
                                    {giveaway.winners_count} {giveaway.winners_count === 1 ? "winner" : "winners"}
                                  </span>
                                  <BookmarkButton contentType="giveaway" contentId={giveaway.id} />
                                </div>
                              </div>

                              <div className="flex flex-col items-center lg:items-end gap-4">
                                <div className="text-center lg:text-right">
                                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1 justify-center lg:justify-end">
                                    <Clock className="w-3 h-3" />Ends in
                                  </p>
                                  <CountdownTimer endDate={giveaway.end_date} />
                                </div>
                                {hasEntered ? (
                                  <Button variant="outline" size="lg" disabled className="w-full lg:w-auto gap-2">
                                    <CheckCircle2 className="w-4 h-4" />Entered
                                  </Button>
                                ) : limitReached ? (
                                  <Button variant="outline" size="lg" disabled className="w-full lg:w-auto gap-2">
                                    <Lock className="w-4 h-4" />Entry Limit Reached
                                  </Button>
                                ) : (
                                  <Button
                                    variant="gold"
                                    size="lg"
                                    className="w-full lg:w-auto gap-2"
                                    onClick={() => {
                                      if (!user) {
                                        toast({ title: "Please login to enter", variant: "destructive" });
                                        return;
                                      }
                                      enterMutation.mutate(giveaway.id);
                                    }}
                                    disabled={enterMutation.isPending}
                                  >
                                    Enter Giveaway<ArrowRight className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Past Giveaways - Clickable */}
            {endedGiveaways && endedGiveaways.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Lock className="w-6 h-6 text-muted-foreground" />
                  Past Giveaways
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {endedGiveaways.slice(0, 6).map((giveaway, index) => (
                    <motion.div
                      key={giveaway.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      onClick={() => setSelectedGiveaway(giveaway)}
                      className="glass rounded-2xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                    >
                      <div className="relative h-32 overflow-hidden">
                        {giveaway.image_url ? (
                          <img src={giveaway.image_url} alt={giveaway.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-secondary" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                        <span className="absolute top-4 right-4 px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                          ENDED
                        </span>
                        {giveaway.winner_ids && giveaway.winner_ids.length > 0 && (
                          <span className="absolute top-4 left-4 px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            {giveaway.winner_ids.length} Winner{giveaway.winner_ids.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold mb-2">{giveaway.title}</h3>
                        {giveaway.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{giveaway.description}</p>
                        )}
                        <p className="text-xl font-bold text-muted-foreground mb-3">{giveaway.prize}</p>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{entryCounts?.[giveaway.id] || 0} entries</span>
                          <span className="text-primary text-xs">Click to view winners →</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {(!giveaways || giveaways.length === 0) && (
              <div className="text-center py-20 text-muted-foreground">
                No giveaways available. Check back later!
              </div>
            )}
          </>
        )}

        {/* Winner Modal */}
        <WinnerModal
          giveaway={selectedGiveaway}
          isOpen={!!selectedGiveaway}
          onClose={() => setSelectedGiveaway(null)}
        />
      </div>
    </div>
  );
}
