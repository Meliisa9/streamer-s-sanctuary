import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Upload, Heart, CheckCircle, Clock, X, Search, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MainLayout } from "@/components/layout/MainLayout";

interface BigWin {
  id: string;
  user_id: string;
  game_name: string;
  provider: string | null;
  bet_amount: number | null;
  win_amount: number;
  multiplier: number | null;
  image_url: string | null;
  video_url: string | null;
  description: string | null;
  is_verified: boolean;
  verification_badge: string | null;
  status: string;
  likes_count: number;
  created_at: string;
  profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function WinGallery() {
  const [wins, setWins] = useState<BigWin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "amount" | "multiplier" | "likes">("recent");
  const [likedWins, setLikedWins] = useState<Set<string>>(new Set());
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newWin, setNewWin] = useState({
    game_name: "",
    provider: "",
    bet_amount: "",
    win_amount: "",
    multiplier: "",
    image_url: "",
    description: "",
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchWins();
    if (user) fetchUserLikes();
  }, [user, sortBy]);

  const fetchWins = async () => {
    let query = supabase
      .from("big_wins")
      .select("*, profile:profiles!big_wins_user_id_fkey(username, display_name, avatar_url)")
      .eq("status", "approved");

    switch (sortBy) {
      case "amount":
        query = query.order("win_amount", { ascending: false });
        break;
      case "multiplier":
        query = query.order("multiplier", { ascending: false, nullsFirst: false });
        break;
      case "likes":
        query = query.order("likes_count", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query.limit(50);
    
    if (!error && data) {
      setWins(data as BigWin[]);
    }
    setIsLoading(false);
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("big_win_likes")
      .select("win_id")
      .eq("user_id", user.id);

    if (data) {
      setLikedWins(new Set(data.map((l) => l.win_id)));
    }
  };

  const handleLike = async (winId: string) => {
    if (!user) {
      toast({ title: "Please login to like wins", variant: "destructive" });
      return;
    }

    const isLiked = likedWins.has(winId);

    if (isLiked) {
      await supabase.from("big_win_likes").delete().eq("win_id", winId).eq("user_id", user.id);
      await supabase
        .from("big_wins")
        .update({ likes_count: wins.find((w) => w.id === winId)!.likes_count - 1 })
        .eq("id", winId);
      setLikedWins((prev) => {
        const next = new Set(prev);
        next.delete(winId);
        return next;
      });
    } else {
      await supabase.from("big_win_likes").insert({ win_id: winId, user_id: user.id });
      await supabase
        .from("big_wins")
        .update({ likes_count: wins.find((w) => w.id === winId)!.likes_count + 1 })
        .eq("id", winId);
      setLikedWins((prev) => new Set([...prev, winId]));
    }

    fetchWins();
  };

  const handleSubmitWin = async () => {
    if (!user) {
      toast({ title: "Please login to submit wins", variant: "destructive" });
      return;
    }

    if (!newWin.game_name || !newWin.win_amount) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("big_wins").insert({
      user_id: user.id,
      game_name: newWin.game_name,
      provider: newWin.provider || null,
      bet_amount: newWin.bet_amount ? parseFloat(newWin.bet_amount) : null,
      win_amount: parseFloat(newWin.win_amount),
      multiplier: newWin.multiplier ? parseFloat(newWin.multiplier) : null,
      image_url: newWin.image_url || null,
      description: newWin.description || null,
      status: "pending",
    });

    setIsSubmitting(false);

    if (error) {
      toast({ title: "Error submitting win", variant: "destructive" });
      return;
    }

    toast({ title: "Win submitted for review!" });
    setIsSubmitOpen(false);
    setNewWin({
      game_name: "",
      provider: "",
      bet_amount: "",
      win_amount: "",
      multiplier: "",
      image_url: "",
      description: "",
    });
  };

  const filteredWins = wins.filter(
    (win) =>
      win.game_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      win.provider?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Big Win Gallery
              </h1>
              <p className="text-muted-foreground mt-2">
                Community-submitted wins with verification badges
              </p>
            </div>
            <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
              <DialogTrigger asChild>
                <Button variant="glow" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Submit Your Win
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Submit Your Big Win</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Game Name *</Label>
                    <Input
                      value={newWin.game_name}
                      onChange={(e) => setNewWin({ ...newWin, game_name: e.target.value })}
                      placeholder="e.g., Sweet Bonanza"
                    />
                  </div>
                  <div>
                    <Label>Provider</Label>
                    <Input
                      value={newWin.provider}
                      onChange={(e) => setNewWin({ ...newWin, provider: e.target.value })}
                      placeholder="e.g., Pragmatic Play"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Bet Amount</Label>
                      <Input
                        type="number"
                        value={newWin.bet_amount}
                        onChange={(e) => setNewWin({ ...newWin, bet_amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Win Amount *</Label>
                      <Input
                        type="number"
                        value={newWin.win_amount}
                        onChange={(e) => setNewWin({ ...newWin, win_amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Multiplier</Label>
                    <Input
                      type="number"
                      value={newWin.multiplier}
                      onChange={(e) => setNewWin({ ...newWin, multiplier: e.target.value })}
                      placeholder="e.g., 5000"
                    />
                  </div>
                  <div>
                    <Label>Screenshot URL</Label>
                    <Input
                      value={newWin.image_url}
                      onChange={(e) => setNewWin({ ...newWin, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newWin.description}
                      onChange={(e) => setNewWin({ ...newWin, description: e.target.value })}
                      placeholder="Tell us about your win..."
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleSubmitWin}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Submit for Review
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by game or provider..."
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="amount">Highest Win</SelectItem>
                <SelectItem value="multiplier">Highest Multiplier</SelectItem>
                <SelectItem value="likes">Most Liked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Wins Grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="glass border-border/50 animate-pulse">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-6 bg-muted rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredWins.length === 0 ? (
            <Card className="glass border-border/50">
              <CardContent className="p-12 text-center">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Wins Yet</h3>
                <p className="text-muted-foreground mt-2">
                  Be the first to submit your big win!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredWins.map((win, index) => (
                  <motion.div
                    key={win.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="glass border-border/50 overflow-hidden group hover:border-primary/50 transition-colors">
                      <CardContent className="p-0">
                        {/* Image */}
                        <div className="aspect-video relative bg-gradient-to-br from-primary/20 to-purple-600/20">
                          {win.image_url ? (
                            <img
                              src={win.image_url}
                              alt={win.game_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Trophy className="w-16 h-16 text-yellow-500/50" />
                            </div>
                          )}
                          {/* Multiplier Badge */}
                          {win.multiplier && (
                            <Badge className="absolute top-3 right-3 bg-yellow-500 text-black font-bold">
                              {win.multiplier.toLocaleString()}x
                            </Badge>
                          )}
                          {/* Verification Badge */}
                          {win.is_verified && (
                            <Badge className="absolute top-3 left-3 bg-green-500/90 text-white gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </Badge>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg">{win.game_name}</h3>
                            {win.provider && (
                              <p className="text-sm text-muted-foreground">{win.provider}</p>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-green-400">
                                {formatCurrency(win.win_amount)}
                              </p>
                              {win.bet_amount && (
                                <p className="text-xs text-muted-foreground">
                                  Bet: {formatCurrency(win.bet_amount)}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLike(win.id)}
                              className={`gap-1 ${likedWins.has(win.id) ? "text-red-500" : ""}`}
                            >
                              <Heart
                                className={`w-4 h-4 ${likedWins.has(win.id) ? "fill-current" : ""}`}
                              />
                              {win.likes_count}
                            </Button>
                          </div>

                          {/* User Info */}
                          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                            <div className="w-6 h-6 rounded-full bg-primary/20 overflow-hidden">
                              {win.profile?.avatar_url ? (
                                <img
                                  src={win.profile.avatar_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : null}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {win.profile?.display_name || win.profile?.username || "Anonymous"}
                            </span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(win.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
}
