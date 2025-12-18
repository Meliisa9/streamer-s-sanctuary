import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Trophy, Users, Clock, Target, Loader2, Award, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type GTWSession = Tables<"gtw_sessions"> & { currency?: string };
type GTWGuess = Tables<"gtw_guesses">;

interface Profile {
  username: string | null;
  display_name: string | null;
}

const CURRENCIES = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "SEK", label: "SEK (kr)", symbol: "kr" },
  { value: "NOK", label: "NOK (kr)", symbol: "kr" },
  { value: "DKK", label: "DKK (kr)", symbol: "kr" },
  { value: "CAD", label: "CAD (C$)", symbol: "C$" },
  { value: "AUD", label: "AUD (A$)", symbol: "A$" },
  { value: "JPY", label: "JPY (¥)", symbol: "¥" },
];

export default function AdminGTW() {
  const [sessions, setSessions] = useState<GTWSession[]>([]);
  const [sessionGuesses, setSessionGuesses] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingGuesses, setViewingGuesses] = useState<{ session: GTWSession; guesses: (GTWGuess & { profile?: Profile })[] } | null>(null);
  const [editingSession, setEditingSession] = useState<GTWSession | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    pot_amount: "",
    lock_time: "",
    reveal_time: "",
    status: "upcoming" as string,
    actual_total: "",
    currency: "USD",
    winner_points: "1000",
  });
  const { toast } = useToast();
  const { isAdmin, isModerator } = useAuth();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from("gtw_sessions")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast({ title: "Error fetching sessions", description: error.message, variant: "destructive" });
    } else {
      setSessions(data || []);
      
      const counts: Record<string, number> = {};
      for (const session of data || []) {
        const { count } = await supabase
          .from("gtw_guesses")
          .select("*", { count: "exact", head: true })
          .eq("session_id", session.id);
        counts[session.id] = count || 0;
      }
      setSessionGuesses(counts);
    }
    setIsLoading(false);
  };

  const fetchGuessesForSession = async (session: GTWSession) => {
    const { data: guesses, error } = await supabase
      .from("gtw_guesses")
      .select("*")
      .eq("session_id", session.id)
      .order("guess_amount", { ascending: true });
    
    if (error) {
      toast({ title: "Error fetching guesses", description: error.message, variant: "destructive" });
      return;
    }

    const guessesWithProfiles: (GTWGuess & { profile?: Profile })[] = [];
    for (const guess of guesses || []) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("user_id", guess.user_id)
        .maybeSingle();
      guessesWithProfiles.push({ ...guess, profile: profile || undefined });
    }
    
    setViewingGuesses({ session, guesses: guessesWithProfiles });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      pot_amount: "",
      lock_time: "",
      reveal_time: "",
      status: "upcoming",
      actual_total: "",
      currency: "USD",
      winner_points: "1000",
    });
    setEditingSession(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (session: GTWSession) => {
    setEditingSession(session);
    setFormData({
      title: session.title,
      pot_amount: session.pot_amount || "",
      lock_time: session.lock_time ? new Date(session.lock_time).toISOString().slice(0, 16) : "",
      reveal_time: session.reveal_time ? new Date(session.reveal_time).toISOString().slice(0, 16) : "",
      status: session.status || "upcoming",
      actual_total: session.actual_total?.toString() || "",
      currency: (session as any).currency || "USD",
      winner_points: "1000",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    const sessionData = {
      title: formData.title,
      pot_amount: formData.pot_amount || null,
      lock_time: formData.lock_time ? new Date(formData.lock_time).toISOString() : null,
      reveal_time: formData.reveal_time ? new Date(formData.reveal_time).toISOString() : null,
      status: formData.status,
      actual_total: formData.actual_total ? parseFloat(formData.actual_total) : null,
      currency: formData.currency,
    };

    if (editingSession) {
      const { error } = await supabase
        .from("gtw_sessions")
        .update(sessionData)
        .eq("id", editingSession.id);

      if (error) {
        toast({ title: "Error updating session", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Session updated" });
        resetForm();
        fetchSessions();
      }
    } else {
      const { error } = await supabase.from("gtw_sessions").insert(sessionData);

      if (error) {
        toast({ title: "Error creating session", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Session created" });
        resetForm();
        fetchSessions();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session? All guesses will also be deleted.")) return;

    await supabase.from("gtw_guesses").delete().eq("session_id", id);
    
    const { error } = await supabase.from("gtw_sessions").delete().eq("id", id);

    if (error) {
      toast({ title: "Error deleting session", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Session deleted" });
      fetchSessions();
    }
  };

  const determineWinner = async (session: GTWSession) => {
    if (!session.actual_total) {
      toast({ title: "Set actual total first", variant: "destructive" });
      return;
    }

    const { data: guesses, error } = await supabase
      .from("gtw_guesses")
      .select("*")
      .eq("session_id", session.id);

    if (error || !guesses || guesses.length === 0) {
      toast({ title: "No guesses found", variant: "destructive" });
      return;
    }

    let winner = guesses[0];
    let minDiff = Math.abs(Number(guesses[0].guess_amount) - Number(session.actual_total));

    guesses.forEach((guess) => {
      const diff = Math.abs(Number(guess.guess_amount) - Number(session.actual_total));
      if (diff < minDiff) {
        minDiff = diff;
        winner = guess;
      }
    });

    const { error: updateError } = await supabase
      .from("gtw_sessions")
      .update({
        winner_id: winner.user_id,
        winning_guess: winner.guess_amount,
        status: "completed",
      })
      .eq("id", session.id);

    if (updateError) {
      toast({ title: "Error determining winner", description: updateError.message, variant: "destructive" });
    } else {
      const pointsToAward = parseInt(formData.winner_points) || 1000;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("user_id", winner.user_id)
        .maybeSingle();
      
      if (profile) {
        await supabase
          .from("profiles")
          .update({ points: (profile.points || 0) + pointsToAward })
          .eq("user_id", winner.user_id);
      }

      toast({ title: "Winner determined!", description: `Closest guess: $${Number(winner.guess_amount).toLocaleString()} - Awarded ${pointsToAward} points!` });
      fetchSessions();
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-500";
      case "locked": return "bg-yellow-500/20 text-yellow-500";
      case "completed": return "bg-primary/20 text-primary";
      case "ended": return "bg-muted text-muted-foreground";
      default: return "bg-secondary text-muted-foreground";
    }
  };

  const getCurrencySymbol = (currency: string | undefined) => {
    return CURRENCIES.find(c => c.value === currency)?.symbol || "$";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Guess The Win Sessions</h2>
          <p className="text-muted-foreground">Create and manage GTW sessions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="glow" className="gap-2" onClick={() => { setEditingSession(null); resetForm(); setIsDialogOpen(true); }}>
              <Plus className="w-4 h-4" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingSession ? "Edit Session" : "Create New Session"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  placeholder="Session title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Pot Amount / Prize</label>
                  <input
                    type="text"
                    value={formData.pot_amount}
                    onChange={(e) => setFormData({ ...formData, pot_amount: e.target.value })}
                    className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                    placeholder="e.g. $10,000"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Lock Time</label>
                  <input
                    type="datetime-local"
                    value={formData.lock_time}
                    onChange={(e) => setFormData({ ...formData, lock_time: e.target.value })}
                    className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Reveal Time</label>
                  <input
                    type="datetime-local"
                    value={formData.reveal_time}
                    onChange={(e) => setFormData({ ...formData, reveal_time: e.target.value })}
                    className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="locked">Locked</option>
                  <option value="completed">Completed</option>
                  <option value="ended">Ended</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Actual Total (for determining winner)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.actual_total}
                  onChange={(e) => setFormData({ ...formData, actual_total: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  placeholder="Enter actual total to determine winner"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Winner Points Award</label>
                <input
                  type="number"
                  value={formData.winner_points}
                  onChange={(e) => setFormData({ ...formData, winner_points: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  placeholder="Points to award winner (default: 1000)"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="ghost" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button variant="glow" onClick={handleSubmit} className="flex-1">
                  {editingSession ? "Update" : "Create"} Session
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Guesses Modal */}
      <Dialog open={!!viewingGuesses} onOpenChange={() => setViewingGuesses(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Guesses for: {viewingGuesses?.session.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {viewingGuesses?.session.actual_total && (
              <div className="mb-4 p-3 bg-accent/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Actual Total</p>
                <p className="text-2xl font-bold text-accent">
                  {getCurrencySymbol((viewingGuesses.session as any).currency)}{Number(viewingGuesses.session.actual_total).toLocaleString()}
                </p>
              </div>
            )}
            <div className="space-y-2">
              {viewingGuesses?.guesses.map((guess, index) => {
                const diff = viewingGuesses.session.actual_total
                  ? Math.abs(Number(guess.guess_amount) - Number(viewingGuesses.session.actual_total))
                  : null;
                const isWinner = guess.user_id === viewingGuesses.session.winner_id;
                const symbol = getCurrencySymbol((viewingGuesses.session as any).currency);
                
                return (
                  <div
                    key={guess.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isWinner ? "bg-green-500/20 border border-green-500/30" : "bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground w-6">#{index + 1}</span>
                      <span className="font-medium">
                        {guess.profile?.display_name || guess.profile?.username || "Anonymous"}
                      </span>
                      {isWinner && <Trophy className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{symbol}{Number(guess.guess_amount).toLocaleString()}</p>
                      {diff !== null && (
                        <p className="text-xs text-muted-foreground">
                          {diff === 0 ? "Exact!" : `Off by ${symbol}${diff.toLocaleString()}`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {viewingGuesses?.guesses.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No guesses yet</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {sessions.map((session) => {
          const symbol = getCurrencySymbol((session as any).currency);
          
          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{session.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                    {(session as any).currency && (session as any).currency !== "USD" && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-muted-foreground">
                        {(session as any).currency}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-muted-foreground">
                    {session.pot_amount && (
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span>Pot: {session.pot_amount}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent" />
                      <span>{sessionGuesses[session.id] || 0} guesses</span>
                    </div>
                    {session.lock_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Lock: {new Date(session.lock_time).toLocaleString()}</span>
                      </div>
                    )}
                    {session.actual_total && (
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-accent" />
                        <span>Total: {symbol}{Number(session.actual_total).toLocaleString()}</span>
                      </div>
                    )}
                    {session.winning_guess && (
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-green-500" />
                        <span>Winner: {symbol}{Number(session.winning_guess).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="icon" onClick={() => fetchGuessesForSession(session)} title="View Guesses">
                    <Eye className="w-4 h-4" />
                  </Button>
                  {session.actual_total && !session.winner_id && (
                    <Button variant="outline" size="sm" onClick={() => determineWinner(session)} className="gap-1">
                      <Trophy className="w-4 h-4" />
                      Pick Winner
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(session)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(session.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {sessions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No sessions created yet. Create your first GTW session!
          </div>
        )}
      </div>
    </div>
  );
}