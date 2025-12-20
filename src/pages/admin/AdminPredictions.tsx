import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Plus, Edit2, Trash2, Lock, CheckCircle, 
  XCircle, Loader2, Users, Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

interface Prediction {
  id: string;
  title: string;
  description: string | null;
  status: string;
  outcome: string | null;
  profit_pool: number;
  loss_pool: number;
  min_bet: number;
  max_bet: number;
  created_at: string;
}

export default function AdminPredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrediction, setEditingPrediction] = useState<Prediction | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    min_bet: 10,
    max_bet: 1000,
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    const { data, error } = await supabase
      .from("stream_predictions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPredictions(data);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    if (editingPrediction) {
      const { error } = await supabase
        .from("stream_predictions")
        .update({
          title: formData.title,
          description: formData.description || null,
          min_bet: formData.min_bet,
          max_bet: formData.max_bet,
        })
        .eq("id", editingPrediction.id);

      if (error) {
        toast({ title: "Error updating prediction", variant: "destructive" });
        return;
      }
      toast({ title: "Prediction updated" });
    } else {
      const { error } = await supabase.from("stream_predictions").insert({
        title: formData.title,
        description: formData.description || null,
        min_bet: formData.min_bet,
        max_bet: formData.max_bet,
        created_by: user?.id,
      });

      if (error) {
        toast({ title: "Error creating prediction", variant: "destructive" });
        return;
      }
      toast({ title: "Prediction created" });
    }

    setIsDialogOpen(false);
    setEditingPrediction(null);
    setFormData({ title: "", description: "", min_bet: 10, max_bet: 1000 });
    fetchPredictions();
  };

  const lockPrediction = async (id: string) => {
    const { error } = await supabase
      .from("stream_predictions")
      .update({ status: "locked", locked_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      toast({ title: "Prediction locked - no more bets allowed" });
      fetchPredictions();
    }
  };

  const resolvePrediction = async (id: string, outcome: "profit" | "loss") => {
    const prediction = predictions.find((p) => p.id === id);
    if (!prediction) return;

    // Calculate payouts
    const winningPool = outcome === "profit" ? prediction.profit_pool : prediction.loss_pool;
    const losingPool = outcome === "profit" ? prediction.loss_pool : prediction.profit_pool;
    const totalPool = winningPool + losingPool;

    // Get winning bets and distribute payouts
    const { data: winningBets } = await supabase
      .from("prediction_bets")
      .select("*")
      .eq("prediction_id", id)
      .eq("predicted_outcome", outcome);

    if (winningBets && winningBets.length > 0) {
      for (const bet of winningBets) {
        const payout = Math.floor((bet.bet_amount / winningPool) * totalPool);
        
        // Update bet with payout
        await supabase
          .from("prediction_bets")
          .update({ payout })
          .eq("id", bet.id);

        // Add points to user
        const { data: profile } = await supabase
          .from("profiles")
          .select("points")
          .eq("user_id", bet.user_id)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({ points: (profile.points || 0) + payout })
            .eq("user_id", bet.user_id);
        }

        // Send notification
        await supabase.from("user_notifications").insert({
          user_id: bet.user_id,
          title: "You won your prediction bet!",
          message: `You won ${payout} points from the "${prediction.title}" prediction!`,
          type: "achievement",
          link: "/predictions",
        });
      }
    }

    // Update prediction status
    const { error } = await supabase
      .from("stream_predictions")
      .update({
        status: "resolved",
        outcome,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (!error) {
      toast({ title: `Prediction resolved as ${outcome}` });
      fetchPredictions();
    }
  };

  const deletePrediction = async (id: string) => {
    const { error } = await supabase.from("stream_predictions").delete().eq("id", id);
    if (!error) {
      toast({ title: "Prediction deleted" });
      fetchPredictions();
    }
  };

  const openEditDialog = (prediction: Prediction) => {
    setEditingPrediction(prediction);
    setFormData({
      title: prediction.title,
      description: prediction.description || "",
      min_bet: prediction.min_bet,
      max_bet: prediction.max_bet,
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500/20 text-green-400">Open</Badge>;
      case "locked":
        return <Badge className="bg-yellow-500/20 text-yellow-400">Locked</Badge>;
      case "resolved":
        return <Badge className="bg-blue-500/20 text-blue-400">Resolved</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-400">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <AdminPageHeader
          title="Stream Predictions"
          description="Manage viewer point betting on stream outcomes"
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="glow"
              className="gap-2"
              onClick={() => {
                setEditingPrediction(null);
                setFormData({ title: "", description: "", min_bet: 10, max_bet: 1000 });
              }}
            >
              <Plus className="w-4 h-4" />
              New Prediction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPrediction ? "Edit Prediction" : "Create New Prediction"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Will the stream end in profit?"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details about the prediction..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Bet (points)</Label>
                  <Input
                    type="number"
                    value={formData.min_bet}
                    onChange={(e) => setFormData({ ...formData, min_bet: parseInt(e.target.value) || 10 })}
                  />
                </div>
                <div>
                  <Label>Max Bet (points)</Label>
                  <Input
                    type="number"
                    value={formData.max_bet}
                    onChange={(e) => setFormData({ ...formData, max_bet: parseInt(e.target.value) || 1000 })}
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingPrediction ? "Update" : "Create"} Prediction
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : predictions.length === 0 ? (
        <Card className="glass border-border/50">
          <CardContent className="p-12 text-center">
            <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Predictions Yet</h3>
            <p className="text-muted-foreground mt-2">
              Create your first prediction to let viewers bet on stream outcomes
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pools</TableHead>
                  <TableHead>Bet Range</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictions.map((prediction) => (
                  <TableRow key={prediction.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{prediction.title}</p>
                        {prediction.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {prediction.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(prediction.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-1 text-green-400">
                          <TrendingUp className="w-3 h-3" />
                          {prediction.profit_pool.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 text-red-400">
                          <TrendingDown className="w-3 h-3" />
                          {prediction.loss_pool.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {prediction.min_bet} - {prediction.max_bet}
                    </TableCell>
                    <TableCell>
                      {prediction.outcome ? (
                        <Badge
                          className={
                            prediction.outcome === "profit"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }
                        >
                          {prediction.outcome}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {prediction.status === "open" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => lockPrediction(prediction.id)}
                            >
                              <Lock className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(prediction)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {prediction.status === "locked" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-400"
                              onClick={() => resolvePrediction(prediction.id, "profit")}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Profit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-400"
                              onClick={() => resolvePrediction(prediction.id, "loss")}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Loss
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deletePrediction(prediction.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
