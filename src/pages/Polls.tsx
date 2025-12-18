import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart, Check, Clock, Users, Trophy, TrendingUp, History, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

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
}

interface PollVote {
  poll_id: string;
  option_index: number;
}

export default function Polls() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: polls = [], isLoading } = useQuery({
    queryKey: ["polls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Poll[];
    },
  });

  const { data: recentPolls = [] } = useQuery({
    queryKey: ["recent-polls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("is_active", false)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as Poll[];
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

      const poll = polls.find((p) => p.id === pollId);
      if (poll) {
        await supabase
          .from("polls")
          .update({ total_votes: (poll.total_votes || 0) + 1 })
          .eq("id", pollId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls"] });
      queryClient.invalidateQueries({ queryKey: ["user-poll-votes"] });
      queryClient.invalidateQueries({ queryKey: ["poll-vote-counts"] });
      toast({ title: "Vote submitted!" });
    },
    onError: (error: any) => {
      if (error.message.includes("duplicate")) {
        toast({ title: "Already voted", description: "You have already voted on this option", variant: "destructive" });
      } else {
        toast({ title: "Error voting", description: error.message, variant: "destructive" });
      }
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

  // Stats calculations
  const totalVotes = polls.reduce((sum, poll) => sum + (poll.total_votes || 0), 0);
  const totalPolls = polls.length + recentPolls.length;
  const userParticipation = new Set(userVotes.map(v => v.poll_id)).size;

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
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <BarChart className="w-10 h-10 text-primary" />
            Community Polls
          </h1>
          <p className="text-muted-foreground">
            Have your say! Vote on community polls and see what others think.
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="glass rounded-2xl p-4 text-center">
            <BarChart className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{polls.length}</p>
            <p className="text-sm text-muted-foreground">Active Polls</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">{totalVotes.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Votes</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <PieChart className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{totalPolls}</p>
            <p className="text-sm text-muted-foreground">All Time Polls</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{user ? userParticipation : 0}</p>
            <p className="text-sm text-muted-foreground">Your Participation</p>
          </div>
        </motion.div>

        {!user && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 mb-8 text-center">
            <p className="text-muted-foreground">
              <a href="/auth" className="text-primary hover:underline">Login</a> to vote on polls
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Polls */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Active Polls
            </h2>
            
            {polls.map((poll, index) => {
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
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-2xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{poll.title}</h2>
                      {poll.description && (
                        <p className="text-muted-foreground mt-1">{poll.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {poll.total_votes} votes
                    </div>
                  </div>

                  {poll.ends_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Clock className="w-4 h-4" />
                      {expired ? "Poll ended" : `Ends ${new Date(poll.ends_at).toLocaleDateString()}`}
                    </div>
                  )}

                  {poll.is_multiple_choice && !showResults && (
                    <p className="text-sm text-primary mb-4">You can select multiple options</p>
                  )}

                  <div className="space-y-3">
                    {poll.options.map((option, optionIndex) => {
                      const percentage = getVotePercentage(poll.id, optionIndex);
                      const voteCount = getVoteCount(poll.id, optionIndex);
                      const isSelected = votedOptions.includes(optionIndex);
                      const isWinner = showResults && optionIndex === winner.index && winner.votes > 0;

                      if (showResults) {
                        return (
                          <div key={optionIndex} className={`space-y-2 p-3 rounded-lg ${isWinner ? "bg-primary/10 border border-primary/30" : ""}`}>
                            <div className="flex items-center justify-between">
                              <span className={`flex items-center gap-2 ${isSelected ? "text-primary font-medium" : ""}`}>
                                {isSelected && <Check className="w-4 h-4" />}
                                {isWinner && <Trophy className="w-4 h-4 text-yellow-500" />}
                                {option}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {percentage}% ({voteCount})
                              </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      }

                      return (
                        <Button
                          key={optionIndex}
                          variant="outline"
                          className="w-full justify-start h-auto py-3 px-4"
                          onClick={() => voteMutation.mutate({ pollId: poll.id, optionIndex })}
                          disabled={!user || voteMutation.isPending}
                        >
                          {option}
                        </Button>
                      );
                    })}
                  </div>

                  {voted && (
                    <p className="text-sm text-green-400 mt-4 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      You voted on this poll
                    </p>
                  )}
                </motion.div>
              );
            })}

            {polls.length === 0 && (
              <div className="text-center py-16 text-muted-foreground glass rounded-2xl">
                <BarChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">No active polls right now</p>
                <p>Check back later for new polls!</p>
              </div>
            )}
          </div>

          {/* Sidebar - Recent Polls */}
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-muted-foreground" />
                Recent Results
              </h2>
              
              {recentPolls.length > 0 ? (
                <div className="space-y-4">
                  {recentPolls.map((poll) => {
                    const winner = getWinningOption(poll);
                    return (
                      <div key={poll.id} className="p-4 bg-secondary/30 rounded-xl">
                        <p className="font-medium text-sm mb-2">{poll.title}</p>
                        {winner.votes > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <span className="text-primary font-medium">{winner.option}</span>
                            <span className="text-muted-foreground">({winner.votes} votes)</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {poll.total_votes} total votes • {new Date(poll.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">No recent polls</p>
              )}
            </div>

            {/* How Polls Work */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-4">How It Works</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">1</div>
                  <p>Browse active community polls</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">2</div>
                  <p>Click to vote for your choice</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">3</div>
                  <p>See live results after voting</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}