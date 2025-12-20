import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, Plus, Edit2, Trash2, Loader2, Calendar, 
  DollarSign, Trophy, Clock, Save
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
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

interface StreamerStat {
  id: string;
  streamer_id: string;
  date: string;
  starting_balance: number | null;
  ending_balance: number | null;
  profit_loss: number | null;
  total_wagered: number | null;
  biggest_win: number | null;
  biggest_win_game: string | null;
  biggest_multiplier: number | null;
  games_played: string[] | null;
  session_duration_minutes: number | null;
  notes: string | null;
}

interface Streamer {
  id: string;
  name: string;
}

export default function AdminStreamerStats() {
  const [stats, setStats] = useState<StreamerStat[]>([]);
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [selectedStreamer, setSelectedStreamer] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStat, setEditingStat] = useState<StreamerStat | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    starting_balance: "",
    ending_balance: "",
    total_wagered: "",
    biggest_win: "",
    biggest_win_game: "",
    biggest_multiplier: "",
    games_played: "",
    session_duration_minutes: "",
    notes: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStreamers();
  }, []);

  useEffect(() => {
    if (selectedStreamer) {
      fetchStats();
    }
  }, [selectedStreamer]);

  const fetchStreamers = async () => {
    const { data } = await supabase
      .from("streamers")
      .select("id, name")
      .eq("is_active", true)
      .order("is_main_streamer", { ascending: false });

    if (data) {
      setStreamers(data);
      if (data.length > 0) {
        setSelectedStreamer(data[0].id);
      }
    }
    setIsLoading(false);
  };

  const fetchStats = async () => {
    const { data } = await supabase
      .from("streamer_stats")
      .select("*")
      .eq("streamer_id", selectedStreamer)
      .order("date", { ascending: false })
      .limit(50);

    if (data) {
      setStats(data);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStreamer) {
      toast({ title: "Please select a streamer", variant: "destructive" });
      return;
    }

    const startingBalance = formData.starting_balance ? parseFloat(formData.starting_balance) : null;
    const endingBalance = formData.ending_balance ? parseFloat(formData.ending_balance) : null;
    const profitLoss = startingBalance !== null && endingBalance !== null 
      ? endingBalance - startingBalance 
      : null;

    const statData = {
      streamer_id: selectedStreamer,
      date: formData.date,
      starting_balance: startingBalance,
      ending_balance: endingBalance,
      profit_loss: profitLoss,
      total_wagered: formData.total_wagered ? parseFloat(formData.total_wagered) : null,
      biggest_win: formData.biggest_win ? parseFloat(formData.biggest_win) : null,
      biggest_win_game: formData.biggest_win_game || null,
      biggest_multiplier: formData.biggest_multiplier ? parseFloat(formData.biggest_multiplier) : null,
      games_played: formData.games_played ? formData.games_played.split(",").map((g) => g.trim()) : null,
      session_duration_minutes: formData.session_duration_minutes ? parseInt(formData.session_duration_minutes) : null,
      notes: formData.notes || null,
    };

    if (editingStat) {
      const { error } = await supabase
        .from("streamer_stats")
        .update(statData)
        .eq("id", editingStat.id);

      if (error) {
        toast({ title: "Error updating stats", variant: "destructive" });
        return;
      }
      toast({ title: "Stats updated" });
    } else {
      const { error } = await supabase.from("streamer_stats").insert(statData);

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Stats for this date already exist", variant: "destructive" });
        } else {
          toast({ title: "Error saving stats", variant: "destructive" });
        }
        return;
      }
      toast({ title: "Stats saved" });
    }

    resetForm();
    fetchStats();
  };

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingStat(null);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      starting_balance: "",
      ending_balance: "",
      total_wagered: "",
      biggest_win: "",
      biggest_win_game: "",
      biggest_multiplier: "",
      games_played: "",
      session_duration_minutes: "",
      notes: "",
    });
  };

  const openEditDialog = (stat: StreamerStat) => {
    setEditingStat(stat);
    setFormData({
      date: stat.date,
      starting_balance: stat.starting_balance?.toString() || "",
      ending_balance: stat.ending_balance?.toString() || "",
      total_wagered: stat.total_wagered?.toString() || "",
      biggest_win: stat.biggest_win?.toString() || "",
      biggest_win_game: stat.biggest_win_game || "",
      biggest_multiplier: stat.biggest_multiplier?.toString() || "",
      games_played: stat.games_played?.join(", ") || "",
      session_duration_minutes: stat.session_duration_minutes?.toString() || "",
      notes: stat.notes || "",
    });
    setIsDialogOpen(true);
  };

  const deleteStat = async (id: string) => {
    const { error } = await supabase.from("streamer_stats").delete().eq("id", id);
    if (!error) {
      toast({ title: "Stats deleted" });
      fetchStats();
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    const prefix = amount >= 0 ? "+" : "";
    return prefix + new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <AdminPageHeader
          title="Streamer Stats"
          description="Track daily win/loss and session data"
        />
        <div className="flex items-center gap-3">
          <Select value={selectedStreamer} onValueChange={setSelectedStreamer}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select streamer" />
            </SelectTrigger>
            <SelectContent>
              {streamers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="glow"
                className="gap-2"
                onClick={() => {
                  setEditingStat(null);
                  setFormData({
                    ...formData,
                    date: new Date().toISOString().split("T")[0],
                  });
                }}
              >
                <Plus className="w-4 h-4" />
                Add Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingStat ? "Edit Session Stats" : "Add Session Stats"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Session Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={formData.session_duration_minutes}
                      onChange={(e) =>
                        setFormData({ ...formData, session_duration_minutes: e.target.value })
                      }
                      placeholder="180"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Starting Balance</Label>
                    <Input
                      type="number"
                      value={formData.starting_balance}
                      onChange={(e) =>
                        setFormData({ ...formData, starting_balance: e.target.value })
                      }
                      placeholder="10000"
                    />
                  </div>
                  <div>
                    <Label>Ending Balance</Label>
                    <Input
                      type="number"
                      value={formData.ending_balance}
                      onChange={(e) =>
                        setFormData({ ...formData, ending_balance: e.target.value })
                      }
                      placeholder="12000"
                    />
                  </div>
                  <div>
                    <Label>Total Wagered</Label>
                    <Input
                      type="number"
                      value={formData.total_wagered}
                      onChange={(e) =>
                        setFormData({ ...formData, total_wagered: e.target.value })
                      }
                      placeholder="50000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Biggest Win</Label>
                    <Input
                      type="number"
                      value={formData.biggest_win}
                      onChange={(e) =>
                        setFormData({ ...formData, biggest_win: e.target.value })
                      }
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <Label>Biggest Win Game</Label>
                    <Input
                      value={formData.biggest_win_game}
                      onChange={(e) =>
                        setFormData({ ...formData, biggest_win_game: e.target.value })
                      }
                      placeholder="Sweet Bonanza"
                    />
                  </div>
                  <div>
                    <Label>Biggest Multiplier</Label>
                    <Input
                      type="number"
                      value={formData.biggest_multiplier}
                      onChange={(e) =>
                        setFormData({ ...formData, biggest_multiplier: e.target.value })
                      }
                      placeholder="500"
                    />
                  </div>
                </div>

                <div>
                  <Label>Games Played (comma-separated)</Label>
                  <Input
                    value={formData.games_played}
                    onChange={(e) =>
                      setFormData({ ...formData, games_played: e.target.value })
                    }
                    placeholder="Sweet Bonanza, Gates of Olympus, Big Bass"
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Session highlights, notable wins, etc."
                    rows={3}
                  />
                </div>

                <Button onClick={handleSubmit} className="w-full gap-2">
                  <Save className="w-4 h-4" />
                  {editingStat ? "Update" : "Save"} Stats
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : stats.length === 0 ? (
        <Card className="glass border-border/50">
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Stats Recorded</h3>
            <p className="text-muted-foreground mt-2">
              Start tracking session data by adding your first session
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Profit/Loss</TableHead>
                  <TableHead>Biggest Win</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell>
                      {new Date(stat.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      {stat.starting_balance ? formatCurrency(stat.starting_balance).replace("+", "") : "-"}
                    </TableCell>
                    <TableCell>
                      {stat.ending_balance ? formatCurrency(stat.ending_balance).replace("+", "") : "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          stat.profit_loss !== null
                            ? stat.profit_loss >= 0
                              ? "text-green-400"
                              : "text-red-400"
                            : ""
                        }
                      >
                        {formatCurrency(stat.profit_loss)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {stat.biggest_win ? (
                        <div>
                          <span className="text-yellow-400">
                            {formatCurrency(stat.biggest_win).replace("+", "")}
                          </span>
                          {stat.biggest_win_game && (
                            <p className="text-xs text-muted-foreground">{stat.biggest_win_game}</p>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {stat.session_duration_minutes
                        ? `${Math.floor(stat.session_duration_minutes / 60)}h ${stat.session_duration_minutes % 60}m`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(stat)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteStat(stat.id)}
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
