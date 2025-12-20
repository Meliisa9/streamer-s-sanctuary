import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Users, Loader2, Infinity, Gift, Trophy, Clock, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedGiveawayForm } from "@/components/admin/forms";

interface Giveaway {
  id: string;
  title: string;
  description: string | null;
  prize: string;
  prize_type: string | null;
  image_url: string | null;
  max_entries: number | null;
  winners_count: number;
  requirements: string[] | null;
  status: string;
  end_date: string;
  is_exclusive: boolean;
  created_at: string;
}

export default function AdminGiveaways() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [entryCounts, setEntryCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGiveaway, setEditingGiveaway] = useState<Giveaway | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchGiveaways();
  }, []);

  const fetchGiveaways = async () => {
    try {
      const { data } = await supabase
        .from("giveaways")
        .select("*")
        .order("created_at", { ascending: false });
      setGiveaways(data || []);

      // Fetch entry counts
      if (data) {
        const counts: Record<string, number> = {};
        for (const g of data) {
          const { count } = await supabase
            .from("giveaway_entries")
            .select("*", { count: "exact", head: true })
            .eq("giveaway_id", g.id);
          counts[g.id] = count || 0;
        }
        setEntryCounts(counts);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (giveaway: Giveaway) => {
    setEditingGiveaway(giveaway);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this giveaway?")) return;
    try {
      const { error } = await supabase.from("giveaways").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Giveaway deleted" });
      fetchGiveaways();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from("giveaways").update({ status }).eq("id", id);
      if (error) throw error;
      fetchGiveaways();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "upcoming": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "locked": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "ended": return "bg-muted text-muted-foreground border-border";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const filteredGiveaways = giveaways.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.prize.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: giveaways.length,
    active: giveaways.filter((g) => g.status === "active").length,
    totalEntries: Object.values(entryCounts).reduce((a, b) => a + b, 0),
    exclusive: giveaways.filter((g) => g.is_exclusive).length,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Giveaways</h1>
          <p className="text-muted-foreground">Manage giveaways and prizes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchGiveaways}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => { setEditingGiveaway(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Giveaway
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total Giveaways</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-500">{stats.active}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="w-5 h-5 text-accent" />
          </div>
          <p className="text-2xl font-bold text-accent">{stats.totalEntries}</p>
          <p className="text-sm text-muted-foreground">Total Entries</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-500">{stats.exclusive}</p>
          <p className="text-sm text-muted-foreground">Exclusive</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search giveaways..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Enhanced Form Modal */}
      <EnhancedGiveawayForm
        open={showForm}
        onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingGiveaway(null); } else setShowForm(true); }}
        onSuccess={() => { setShowForm(false); setEditingGiveaway(null); fetchGiveaways(); }}
        editingGiveaway={editingGiveaway}
      />

      {/* Giveaways List */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left p-4 text-sm font-medium">Giveaway</th>
              <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Prize</th>
              <th className="text-center p-4 text-sm font-medium">Entries</th>
              <th className="text-center p-4 text-sm font-medium">Status</th>
              <th className="text-right p-4 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGiveaways.map((giveaway) => (
              <motion.tr
                key={giveaway.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {giveaway.image_url ? (
                      <img src={giveaway.image_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{giveaway.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Ends: {new Date(giveaway.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <div>
                    <span className="text-accent font-semibold">{giveaway.prize}</span>
                    <Badge variant="outline" className="ml-2 text-xs">{giveaway.prize_type}</Badge>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{entryCounts[giveaway.id] || 0}</span>
                    {giveaway.max_entries ? (
                      <span className="text-muted-foreground">/ {giveaway.max_entries}</span>
                    ) : (
                      <Infinity className="w-3 h-3 text-muted-foreground ml-1" />
                    )}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <select
                    value={giveaway.status}
                    onChange={(e) => updateStatus(giveaway.id, e.target.value)}
                    className={`px-3 py-1.5 text-xs rounded-full border cursor-pointer ${getStatusColor(giveaway.status)} bg-transparent`}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="locked">Locked</option>
                    <option value="ended">Ended</option>
                  </select>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(giveaway)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(giveaway.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {filteredGiveaways.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">No giveaways found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
