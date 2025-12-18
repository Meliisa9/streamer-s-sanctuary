import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, Loader2, BarChart, Eye, Trophy, Users, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
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
  is_community?: boolean;
  is_approved?: boolean;
  created_by?: string;
}

interface PollVote {
  poll_id: string;
  option_index: number;
  user_id: string;
  created_at: string;
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
      // Delete votes first
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

  // Stats
  const totalVotes = polls?.reduce((sum, poll) => sum + (poll.total_votes || 0), 0) || 0;
  const activePolls = polls?.filter(p => p.is_active).length || 0;
  const completedPolls = polls?.filter(p => !p.is_active).length || 0;

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
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Poll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPoll ? "Edit Poll" : "Create New Poll"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Question/Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What's your favorite...?"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional context for the poll..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Options</Label>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      required={index < 2}
                    />
                    {formData.options.length > 2 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.ends_at}
                  onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Allow Multiple Choices</Label>
                <Switch
                  checked={formData.is_multiple_choice}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_multiple_choice: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingPoll ? "Update Poll" : "Create Poll"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      <div className="grid gap-4">
        {polls?.map((poll) => {
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
                      <span className={`px-2 py-0.5 text-xs rounded-full ${poll.is_approved ? "bg-accent/20 text-accent" : "bg-amber-500/20 text-amber-500"}`}>
                        {poll.is_approved ? "Community" : "Pending Approval"}
                      </span>
                    )}
                  </div>
                  {poll.description && <p className="text-muted-foreground text-sm mb-3">{poll.description}</p>}
                  
                  {/* Options with vote counts */}
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
                  {poll.is_community && !poll.is_approved && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-green-500 border-green-500/30 hover:bg-green-500/10"
                      onClick={async () => {
                        await supabase.from("polls").update({ is_approved: true }).eq("id", poll.id);
                        queryClient.invalidateQueries({ queryKey: ["admin-polls"] });
                        toast({ title: "Poll approved!" });
                      }}
                    >
                      Approve
                    </Button>
                  )}
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
                </div>
              </div>
            </div>
          );
        })}
        {polls?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No polls created yet. Create your first poll to engage your community!
          </div>
        )}
      </div>
    </div>
  );
}