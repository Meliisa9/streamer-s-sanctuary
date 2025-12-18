import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart, Check, Clock, Users, Trophy, TrendingUp, History, PieChart, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

interface Poll {
  id: string;
  title: string;
  description: string | null;
  options: string[];
  is_active: boolean;
  is_multiple_choice: boolean;
  ends_at: string | null;
  created_at: string;
  total_votes: number;
  is_community?: boolean;
  is_approved?: boolean;
  created_by?: string;
}

interface PollVote {
  poll_id: string;
  option_index: number;
}

export default function Polls() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPollData, setNewPollData] = useState({
    title: "",
    description: "",
    options: ["", ""],
  });

  // Fetch active official polls (approved or non-community, not expired)
  const { data: polls = [], isLoading } = useQuery({
    queryKey: ["polls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("is_active", true)
        .or("is_community.eq.false,is_approved.eq.true,is_community.is.null")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Filter out expired polls client-side
      return (data as Poll[]).filter(poll => !poll.ends_at || new Date(poll.ends_at) > new Date());
    },
  });

  // Fetch community polls separately (not expired)
  const { data: communityPolls = [] } = useQuery({
    queryKey: ["community-polls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("is_active", true)
        .eq("is_community", true)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Filter out expired polls client-side
      return (data as Poll[]).filter(poll => !poll.ends_at || new Date(poll.ends_at) > new Date());
    },
  });

  // Fetch user's pending community polls
  const { data: pendingPolls = [] } = useQuery({
    queryKey: ["pending-polls", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("is_community", true)
        .eq("is_approved", false)
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Poll[];
    },
    enabled: !!user,
  });

  // Fetch ended/expired polls for recent results
  const { data: recentPolls = [] } = useQuery({
    queryKey: ["recent-polls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      // Filter to show only inactive OR expired polls
      return (data as Poll[]).filter(poll => 
        !poll.is_active || (poll.ends_at && new Date(poll.ends_at) <= new Date())
      ).slice(0, 5);
    },
  });

  const { data: userVotes = [] } = useQuery({
    queryKey: ["user-poll-votes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("poll_votes")
        .select("poll_id, option_index")
        .eq("user_id", user.id);
      if (error) throw error;
      return data as PollVote[];
    },
    enabled: !!user,
  });

  const { data: voteCountsData = {} } = useQuery({
    queryKey: ["poll-vote-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poll_votes")
        .select("poll_id, option_index");
      if (error) throw error;
      
      const counts: Record<string, Record<number, number>> = {};
      data.forEach((vote) => {
        if (!counts[vote.poll_id]) counts[vote.poll_id] = {};
        counts[vote.poll_id][vote.option_index] = (counts[vote.poll_id][vote.option_index] || 0) + 1;
      });
      return counts;
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ pollId, optionIndex }: { pollId: string; optionIndex: number }) => {
      if (!user) throw new Error("Must be logged in to vote");

      const { error } = await supabase.from("poll_votes").insert({
        poll_id: pollId,
        user_id: user.id,
        option_index: optionIndex,
      });
      if (error) throw error;

      const poll = [...polls, ...communityPolls].find((p) => p.id === pollId);
      if (poll) {
        await supabase
          .from("polls")
          .update({ total_votes: (poll.total_votes || 0) + 1 })
          .eq("id", pollId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls"] });
      queryClient.invalidateQueries({ queryKey: ["community-polls"] });
      queryClient.invalidateQueries({ queryKey: ["user-poll-votes"] });
      queryClient.invalidateQueries({ queryKey: ["poll-vote-counts"] });
      toast({ title: "Vote submitted! (+5 XP)" });
      
      // Award XP for voting - will trigger achievement check via useAchievements
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
                .update({ points: (data.points || 0) + 5 })
                .eq("user_id", user.id);
            }
          });
      }
    },
    onError: (error: any) => {
      if (error.message.includes("duplicate")) {
        toast({ title: "Already voted", description: "You have already voted on this option", variant: "destructive" });
      } else {
        toast({ title: "Error voting", description: error.message, variant: "destructive" });
      }
    },
  });

  const createCommunityPollMutation = useMutation({
    mutationFn: async (data: typeof newPollData) => {
      if (!user) throw new Error("Must be logged in");
      const filteredOptions = data.options.filter((o) => o.trim() !== "");
      if (filteredOptions.length < 2) throw new Error("At least 2 options required");
      if (!data.title.trim()) throw new Error("Title is required");

      const { error } = await supabase.from("polls").insert({
        title: data.title,
        description: data.description || null,
        options: filteredOptions,
        is_active: true,
        is_multiple_choice: false,
        is_community: true,
        is_approved: false,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-polls"] });
      toast({ title: "Poll submitted!", description: "Your poll is pending moderator approval." });
      setIsCreateDialogOpen(false);
      setNewPollData({ title: "", description: "", options: ["", ""] });
    },
    onError: (error: any) => {
      toast({ title: "Error creating poll", description: error.message, variant: "destructive" });
    },
  });

  const hasVoted = (pollId: string) => userVotes.some((v) => v.poll_id === pollId);
  const getVotedOptions = (pollId: string) => userVotes.filter((v) => v.poll_id === pollId).map((v) => v.option_index);

  const getVotePercentage = (pollId: string, optionIndex: number) => {
    const pollVotes = voteCountsData[pollId] || {};
    const totalPollVotes = Object.values(pollVotes).reduce((a, b) => a + b, 0);
    if (totalPollVotes === 0) return 0;
    return Math.round(((pollVotes[optionIndex] || 0) / totalPollVotes) * 100);
  };

  const getVoteCount = (pollId: string, optionIndex: number) => {
    return voteCountsData[pollId]?.[optionIndex] || 0;
  };

  const isPollExpired = (poll: Poll) => {
    if (!poll.ends_at) return false;
    return new Date(poll.ends_at) < new Date();
  };

  const getWinningOption = (poll: Poll) => {
    const pollVotes = voteCountsData[poll.id] || {};
    let maxVotes = 0;
    let winningIndex = 0;
    Object.entries(pollVotes).forEach(([index, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winningIndex = parseInt(index);
      }
    });
    return { option: poll.options[winningIndex], votes: maxVotes, index: winningIndex };
  };

  const totalVotes = polls.reduce((sum, poll) => sum + (poll.total_votes || 0), 0);
  const totalPolls = polls.length + recentPolls.length;
  const userParticipation = new Set(userVotes.map(v => v.poll_id)).size;

  const addOption = () => {
    if (newPollData.options.length < 6) {
      setNewPollData({ ...newPollData, options: [...newPollData.options, ""] });
    }
  };

  const removeOption = (index: number) => {
    if (newPollData.options.length > 2) {
      setNewPollData({ ...newPollData, options: newPollData.options.filter((_, i) => i !== index) });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newPollData.options];
    newOptions[index] = value;
    setNewPollData({ ...newPollData, options: newOptions });
  };

  const renderPollCard = (poll: Poll, index: number, isCommunity = false) => {
    const voted = hasVoted(poll.id);
    const votedOptions = getVotedOptions(poll.id);
    const expired = isPollExpired(poll);
    const showResults = voted || expired;
    const winner = getWinningOption(poll);

    return (
      <motion.div
        key={poll.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`glass rounded-xl p-5 ${isCommunity ? "border border-accent/30" : ""}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold">{poll.title}</h2>
              {isCommunity && (
                <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full">Community</span>
              )}
            </div>
            {poll.description && (
              <p className="text-muted-foreground text-sm">{poll.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            {poll.total_votes}
          </div>
        </div>

        {poll.ends_at && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Clock className="w-4 h-4" />
            {expired ? "Poll ended" : `Ends ${new Date(poll.ends_at).toLocaleDateString()}`}
          </div>
        )}

        <div className="space-y-2">
          {poll.options.map((option, optionIndex) => {
            const percentage = getVotePercentage(poll.id, optionIndex);
            const voteCount = getVoteCount(poll.id, optionIndex);
            const isSelected = votedOptions.includes(optionIndex);
            const isWinner = showResults && optionIndex === winner.index && winner.votes > 0;

            if (showResults) {
              return (
                <div key={optionIndex} className={`space-y-1 p-2 rounded-lg ${isWinner ? "bg-primary/10 border border-primary/30" : ""}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`flex items-center gap-2 ${isSelected ? "text-primary font-medium" : ""}`}>
                      {isSelected && <Check className="w-3 h-3" />}
                      {isWinner && <Trophy className="w-3 h-3 text-yellow-500" />}
                      {option}
                    </span>
                    <span className="text-muted-foreground">
                      {percentage}% ({voteCount})
                    </span>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                </div>
              );
            }

            return (
              <Button
                key={optionIndex}
                variant="outline"
                className="w-full justify-start h-auto py-2 px-3 text-sm"
                onClick={() => voteMutation.mutate({ pollId: poll.id, optionIndex })}
                disabled={!user || voteMutation.isPending}
              >
                {option}
              </Button>
            );
          })}
        </div>

        {voted && (
          <p className="text-xs text-green-400 mt-3 flex items-center gap-1">
            <Check className="w-3 h-3" />
            You voted on this poll
          </p>
        )}
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-1/3" />
            <div className="h-64 bg-secondary rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <BarChart className="w-10 h-10 text-primary" />
                Community Polls
              </h1>
              <p className="text-muted-foreground">
                Have your say! Vote on community polls and see what others think.
              </p>
            </div>
            {user && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Poll
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Community Poll</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Submit your poll for moderator review. Once approved, it will appear in the Community Polls section.
                    </p>
                    <div className="space-y-2">
                      <Label>Question</Label>
                      <Input
                        value={newPollData.title}
                        onChange={(e) => setNewPollData({ ...newPollData, title: e.target.value })}
                        placeholder="What's your favorite...?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Textarea
                        value={newPollData.description}
                        onChange={(e) => setNewPollData({ ...newPollData, description: e.target.value })}
                        placeholder="Additional context..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Options</Label>
                      {newPollData.options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                          />
                          {newPollData.options.length > 2 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)}>
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                      {newPollData.options.length < 6 && (
                        <Button type="button" variant="outline" size="sm" onClick={addOption}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Option
                        </Button>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => createCommunityPollMutation.mutate(newPollData)}
                      disabled={createCommunityPollMutation.isPending}
                    >
                      {createCommunityPollMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Submit for Review
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </motion.div>

        {/* Stats Overview - Only show when logged in */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="glass rounded-xl p-4 flex flex-col items-center justify-center min-h-[100px]">
              <BarChart className="w-6 h-6 mb-2 text-primary" />
              <p className="text-2xl font-bold">{polls.length}</p>
              <p className="text-xs text-muted-foreground text-center">Active Polls</p>
            </div>
            <div className="glass rounded-xl p-4 flex flex-col items-center justify-center min-h-[100px]">
              <Users className="w-6 h-6 mb-2 text-accent" />
              <p className="text-2xl font-bold">{totalVotes.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground text-center">Total Votes</p>
            </div>
            <div className="glass rounded-xl p-4 flex flex-col items-center justify-center min-h-[100px]">
              <PieChart className="w-6 h-6 mb-2 text-green-500" />
              <p className="text-2xl font-bold">{totalPolls}</p>
              <p className="text-xs text-muted-foreground text-center">All Time Polls</p>
            </div>
            <div className="glass rounded-xl p-4 flex flex-col items-center justify-center min-h-[100px]">
              <Trophy className="w-6 h-6 mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{userParticipation}</p>
              <p className="text-xs text-muted-foreground text-center">Your Participation</p>
            </div>
          </motion.div>
        )}

        {!user && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 mb-8 text-center">
            <p className="text-muted-foreground">
              <a href="/auth" className="text-primary hover:underline">Login</a> to vote on polls and create your own!
            </p>
          </motion.div>
        )}

        {/* Pending Polls */}
        {pendingPolls.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Your Pending Polls
            </h2>
            <div className="space-y-4">
              {pendingPolls.map((poll) => (
                <div key={poll.id} className="glass rounded-xl p-4 border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-xs rounded-full">Pending Approval</span>
                  </div>
                  <h3 className="font-semibold">{poll.title}</h3>
                  {poll.description && <p className="text-sm text-muted-foreground">{poll.description}</p>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {poll.options.map((opt, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-secondary rounded">{opt}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <Tabs defaultValue="official" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="official">Official Polls</TabsTrigger>
            <TabsTrigger value="community">
              Community Polls
              {communityPolls.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-accent/20 text-accent text-xs rounded">{communityPolls.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="official">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Active Polls
                </h2>
                
                {polls.filter(p => !p.is_community).map((poll, index) => renderPollCard(poll, index))}

                {polls.filter(p => !p.is_community).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground glass rounded-xl">
                    <BarChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No active polls right now</p>
                    <p className="text-sm">Check back later for new polls!</p>
                  </div>
                )}
              </div>

              {/* Sidebar - aligned with polls */}
              <div className="space-y-6">
                {/* Recent Results */}
                <div className="glass rounded-xl p-5">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-muted-foreground" />
                    Recent Results
                  </h2>
                  
                  {recentPolls.length > 0 ? (
                    <div className="space-y-3">
                      {recentPolls.map((poll) => {
                        const winner = getWinningOption(poll);
                        const expired = isPollExpired(poll);
                        return (
                          <div key={poll.id} className="p-3 bg-secondary/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm flex-1">{poll.title}</p>
                              {expired && poll.is_active && (
                                <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded">Expired</span>
                              )}
                            </div>
                            {winner.votes > 0 && (
                              <div className="flex items-center gap-2 text-sm">
                                <Trophy className="w-3 h-3 text-yellow-500" />
                                <span className="text-primary text-xs">{winner.option}</span>
                                <span className="text-muted-foreground text-xs">({winner.votes})</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">No recent polls</p>
                  )}
                </div>

                {/* How It Works */}
                <div className="glass rounded-xl p-5">
                  <h3 className="font-semibold mb-3">How It Works</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">1</div>
                      <p>Browse active polls</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">2</div>
                      <p>Click to vote</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">3</div>
                      <p>See live results</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="community">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent" />
                  Community Polls
                </h2>
                
                {communityPolls.map((poll, index) => renderPollCard(poll, index, true))}

                {communityPolls.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground glass rounded-xl">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No community polls yet</p>
                    <p className="text-sm">Be the first to create one!</p>
                    {user && (
                      <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Poll
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="glass rounded-xl p-5">
                  <h3 className="font-semibold mb-3">Community Polls</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Community polls are created by users like you! All submissions are reviewed by moderators before being published.
                  </p>
                  {user ? (
                    <Button className="w-full" onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create a Poll
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">
                      <a href="/auth" className="text-primary hover:underline">Login</a> to create polls
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
