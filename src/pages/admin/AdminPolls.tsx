import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, BarChart, Eye, Trophy, Users, TrendingUp, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { EnhancedPollForm } from "@/components/admin/forms";

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

export default function AdminPolls() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingPoll, setViewingPoll] = useState<Poll | null>(null);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    options: ["", ""],
    is_active: true,
    is_multiple_choice: false,
    ends_at: "",
  });

  const { data: polls, isLoading } = useQuery({
    queryKey: ["admin-polls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Poll[];
    },
  });

  const { data: voteCountsData = {} } = useQuery({
    queryKey: ["admin-poll-vote-counts"],
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

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const filteredOptions = data.options.filter((o) => o.trim() !== "");
      if (filteredOptions.length < 2) throw new Error("At least 2 options required");
      
      const { error } = await supabase.from("polls").insert([{
        title: data.title,
        description: data.description || null,
        options: filteredOptions,
        is_active: data.is_active,
        is_multiple_choice: data.is_multiple_choice,
        ends_at: data.ends_at || null,
        created_by: user?.id,
        is_community: false,
        is_approved: true,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-polls"] });
      toast({ title: "Poll created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error creating poll", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const filteredOptions = data.options.filter((o) => o.trim() !== "");
      if (filteredOptions.length < 2) throw new Error("At least 2 options required");

      const { error } = await supabase.from("polls").update({
        title: data.title,
        description: data.description || null,
        options: filteredOptions,
        is_active: data.is_active,
        is_multiple_choice: data.is_multiple_choice,
        ends_at: data.ends_at || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-polls"] });
      toast({ title: "Poll updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error updating poll", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("poll_votes").delete().eq("poll_id", id);
      const { error } = await supabase.from("polls").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-polls"] });
      queryClient.invalidateQueries({ queryKey: ["admin-poll-vote-counts"] });
      toast({ title: "Poll deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting poll", description: error.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("polls").update({ is_approved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-polls"] });
      toast({ title: "Poll approved!" });
    },
    onError: (error) => {
      toast({ title: "Error approving poll", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("poll_votes").delete().eq("poll_id", id);
      const { error } = await supabase.from("polls").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-polls"] });
      toast({ title: "Poll rejected and deleted" });
    },
    onError: (error) => {
      toast({ title: "Error rejecting poll", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      options: ["", ""],
      is_active: true,
      is_multiple_choice: false,
      ends_at: "",
    });
    setEditingPoll(null);
  };

  const handleEdit = (poll: Poll) => {
    setEditingPoll(poll);
    setFormData({
      title: poll.title,
      description: poll.description || "",
      options: poll.options.length > 0 ? poll.options : ["", ""],
      is_active: poll.is_active,
      is_multiple_choice: poll.is_multiple_choice,
      ends_at: poll.ends_at ? poll.ends_at.slice(0, 16) : "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPoll) {
      updateMutation.mutate({ id: editingPoll.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ""] });
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData({ ...formData, options: formData.options.filter((_, i) => i !== index) });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const getVotePercentage = (pollId: string, optionIndex: number) => {
    const pollVotes = voteCountsData[pollId] || {};
    const totalPollVotes = Object.values(pollVotes).reduce((a, b) => a + b, 0);
    if (totalPollVotes === 0) return 0;
    return Math.round(((pollVotes[optionIndex] || 0) / totalPollVotes) * 100);
  };

  const getVoteCount = (pollId: string, optionIndex: number) => {
    return voteCountsData[pollId]?.[optionIndex] || 0;
  };

  const getWinningOption = (poll: Poll) => {
    const pollVotes = voteCountsData[poll.id] || {};
    let maxVotes = 0;
    let winningIndex = -1;
    Object.entries(pollVotes).forEach(([index, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winningIndex = parseInt(index);
      }
    });
    return winningIndex >= 0 ? { option: poll.options[winningIndex], votes: maxVotes } : null;
  };

  // Filter polls by type
  const officialPolls = polls?.filter(p => !p.is_community) || [];
  const communityPolls = polls?.filter(p => p.is_community && p.is_approved) || [];
  const pendingPolls = polls?.filter(p => p.is_community && !p.is_approved) || [];

  // Stats
  const totalVotes = polls?.reduce((sum, poll) => sum + (poll.total_votes || 0), 0) || 0;
  const activePolls = polls?.filter(p => p.is_active).length || 0;
  const completedPolls = polls?.filter(p => !p.is_active).length || 0;

  const renderPollCard = (poll: Poll, showApproveReject = false) => {
    const winner = getWinningOption(poll);
    
    return (
      <div key={poll.id} className="glass rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{poll.title}</h3>
              <span className={`px-2 py-0.5 text-xs rounded-full ${poll.is_active ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
                {poll.is_active ? "Active" : "Inactive"}
              </span>
              {poll.is_community && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-accent/20 text-accent">
                  Community
                </span>
              )}
            </div>
            {poll.description && <p className="text-muted-foreground text-sm mb-3">{poll.description}</p>}
            
            <div className="flex flex-wrap gap-2 mb-3">
              {poll.options.map((option, i) => {
                const voteCount = getVoteCount(poll.id, i);
                const isWinner = winner?.option === option && winner.votes > 0;
                return (
                  <span 
                    key={i} 
                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                      isWinner ? "bg-primary/20 text-primary" : "bg-secondary"
                    }`}
                  >
                    {isWinner && <Trophy className="w-3 h-3" />}
                    {option} ({voteCount})
                  </span>
                );
              })}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BarChart className="w-4 h-4" />
                {poll.total_votes} votes
              </span>
              {poll.ends_at && (
                <span>Ends: {new Date(poll.ends_at).toLocaleDateString()}</span>
              )}
              {poll.is_multiple_choice && (
                <span className="text-primary">Multiple choice</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setViewingPoll(poll)} title="View Results">
              <Eye className="w-4 h-4" />
            </Button>
            {showApproveReject ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-green-500 border-green-500/30 hover:bg-green-500/10"
                  onClick={() => approveMutation.mutate(poll.id)}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm("Reject and delete this poll?")) {
                      rejectMutation.mutate(poll.id);
                    }
                  }}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(poll)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    if (confirm("Delete this poll and all votes?")) {
                      deleteMutation.mutate(poll.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
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
          <h1 className="text-3xl font-bold">Polls</h1>
          <p className="text-muted-foreground">Create and manage community polls</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Official Poll
        </Button>
      </div>

      <EnhancedPollForm
        open={isDialogOpen}
        onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}
        editingPoll={editingPoll}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-polls"] });
          setIsDialogOpen(false);
          resetForm();
        }}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <BarChart className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{polls?.length || 0}</p>
          <p className="text-sm text-muted-foreground">Total Polls</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
          <p className="text-2xl font-bold">{activePolls}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
          <p className="text-2xl font-bold">{completedPolls}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <Users className="w-6 h-6 mx-auto mb-2 text-accent" />
          <p className="text-2xl font-bold">{totalVotes.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Total Votes</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 mx-auto mb-2 text-amber-500" />
          <p className="text-2xl font-bold">{pendingPolls.length}</p>
          <p className="text-sm text-muted-foreground">Pending Review</p>
        </div>
      </div>

      {/* View Poll Results Modal */}
      <Dialog open={!!viewingPoll} onOpenChange={() => setViewingPoll(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Poll Results: {viewingPoll?.title}</DialogTitle>
          </DialogHeader>
          {viewingPoll && (
            <div className="space-y-4 mt-4">
              {viewingPoll.description && (
                <p className="text-muted-foreground">{viewingPoll.description}</p>
              )}
              <div className="space-y-3">
                {viewingPoll.options.map((option, index) => {
                  const percentage = getVotePercentage(viewingPoll.id, index);
                  const voteCount = getVoteCount(viewingPoll.id, index);
                  const winner = getWinningOption(viewingPoll);
                  const isWinner = winner?.option === option && winner.votes > 0;
                  
                  return (
                    <div key={index} className={`p-3 rounded-lg ${isWinner ? "bg-primary/10 border border-primary/30" : "bg-secondary/50"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2 font-medium">
                          {isWinner && <Trophy className="w-4 h-4 text-yellow-500" />}
                          {option}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {percentage}% ({voteCount} votes)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
              <div className="pt-4 border-t border-border text-center text-muted-foreground">
                <p>Total: {viewingPoll.total_votes} votes</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tabs for different poll types */}
      <Tabs defaultValue="official" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="official" className="gap-2">
            <BarChart className="w-4 h-4" />
            Official Polls
            <span className="ml-1 px-1.5 py-0.5 bg-secondary text-xs rounded">{officialPolls.length}</span>
          </TabsTrigger>
          <TabsTrigger value="community" className="gap-2">
            <Users className="w-4 h-4" />
            Community Polls
            <span className="ml-1 px-1.5 py-0.5 bg-secondary text-xs rounded">{communityPolls.length}</span>
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-2">
            <Clock className="w-4 h-4" />
            Review Polls
            {pendingPolls.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-xs rounded">{pendingPolls.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="official" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Official Polls</h2>
            <p className="text-sm text-muted-foreground">Admin-created polls</p>
          </div>
          {officialPolls.map((poll) => renderPollCard(poll))}
          {officialPolls.length === 0 && (
            <div className="text-center py-12 text-muted-foreground glass rounded-xl">
              No official polls created yet. Create your first poll to engage your community!
            </div>
          )}
        </TabsContent>

        <TabsContent value="community" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Community Polls</h2>
            <p className="text-sm text-muted-foreground">User-created polls (approved)</p>
          </div>
          {communityPolls.map((poll) => renderPollCard(poll))}
          {communityPolls.length === 0 && (
            <div className="text-center py-12 text-muted-foreground glass rounded-xl">
              No approved community polls yet.
            </div>
          )}
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Review Polls</h2>
            <p className="text-sm text-muted-foreground">Community polls pending approval</p>
          </div>
          {pendingPolls.map((poll) => renderPollCard(poll, true))}
          {pendingPolls.length === 0 && (
            <div className="text-center py-12 text-muted-foreground glass rounded-xl">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">All caught up!</p>
              <p className="text-sm">No polls pending review.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
