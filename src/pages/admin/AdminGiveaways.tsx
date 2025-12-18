import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Users, Loader2, Infinity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prize: "",
    prize_type: "Cash",
    image_url: "",
    max_entries: "",
    winners_count: 1,
    requirements: "",
    status: "active",
    end_date: "",
    end_time: "",
    is_exclusive: false,
  });

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

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      prize: "",
      prize_type: "Cash",
      image_url: "",
      max_entries: "",
      winners_count: 1,
      requirements: "",
      status: "active",
      end_date: "",
      end_time: "",
      is_exclusive: false,
    });
    setEditingGiveaway(null);
    setShowForm(false);
  };

  const handleEdit = (giveaway: Giveaway) => {
    const endDateTime = new Date(giveaway.end_date);
    const dateStr = endDateTime.toISOString().split("T")[0];
    const timeStr = endDateTime.toTimeString().slice(0, 5);
    
    setFormData({
      title: giveaway.title,
      description: giveaway.description || "",
      prize: giveaway.prize,
      prize_type: giveaway.prize_type || "Cash",
      image_url: giveaway.image_url || "",
      max_entries: giveaway.max_entries?.toString() || "",
      winners_count: giveaway.winners_count,
      requirements: giveaway.requirements?.join("\n") || "",
      status: giveaway.status,
      end_date: dateStr,
      end_time: timeStr,
      is_exclusive: giveaway.is_exclusive,
    });
    setEditingGiveaway(giveaway);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Combine date and time
    let endDateISO: string;
    if (formData.end_time) {
      endDateISO = new Date(`${formData.end_date}T${formData.end_time}`).toISOString();
    } else {
      endDateISO = new Date(`${formData.end_date}T23:59:59`).toISOString();
    }

    // Handle max_entries: empty or 0 means unlimited (null)
    const maxEntries = formData.max_entries ? parseInt(formData.max_entries) : null;
    const finalMaxEntries = maxEntries === 0 ? null : maxEntries;

    const giveawayData = {
      title: formData.title,
      description: formData.description || null,
      prize: formData.prize,
      prize_type: formData.prize_type,
      image_url: formData.image_url || null,
      max_entries: finalMaxEntries,
      winners_count: formData.winners_count,
      requirements: formData.requirements.split("\n").filter(Boolean),
      status: formData.status,
      end_date: endDateISO,
      is_exclusive: formData.is_exclusive,
      created_by: user?.id,
    };

    try {
      if (editingGiveaway) {
        const { error } = await supabase
          .from("giveaways")
          .update(giveawayData)
          .eq("id", editingGiveaway.id);
        if (error) throw error;
        toast({ title: "Giveaway updated" });
      } else {
        const { error } = await supabase.from("giveaways").insert(giveawayData);
        if (error) throw error;
        toast({ title: "Giveaway created" });
      }
      resetForm();
      fetchGiveaways();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
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
      case "active": return "bg-green-500/20 text-green-500";
      case "upcoming": return "bg-blue-500/20 text-blue-500";
      case "locked": return "bg-amber-500/20 text-amber-500";
      case "ended": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
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
        <h2 className="text-2xl font-bold">Manage Giveaways</h2>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Giveaway
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">{editingGiveaway ? "Edit Giveaway" : "Create New Giveaway"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Prize *</label>
                <input
                  type="text"
                  value={formData.prize}
                  onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                  required
                  placeholder="$10,000"
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Prize Type</label>
                <select
                  value={formData.prize_type}
                  onChange={(e) => setFormData({ ...formData, prize_type: e.target.value })}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bonus">Bonus</option>
                  <option value="Merchandise">Merchandise</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Date *</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Time</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty for 23:59</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Max Entries</label>
                <input
                  type="number"
                  value={formData.max_entries}
                  onChange={(e) => setFormData({ ...formData, max_entries: e.target.value })}
                  placeholder="Leave empty or 0 for unlimited"
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">0 or empty = unlimited entries</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Winners Count</label>
                <input
                  type="number"
                  min="1"
                  value={formData.winners_count}
                  onChange={(e) => setFormData({ ...formData, winners_count: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="locked">Locked</option>
                  <option value="ended">Ended</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Add a description for the giveaway..."
                className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Requirements (one per line)</label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                rows={3}
                placeholder="Follow on Twitch&#10;Join Discord Server&#10;Subscribe to Newsletter"
                className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.is_exclusive} onChange={(e) => setFormData({ ...formData, is_exclusive: e.target.checked })} />
              <span className="text-sm">Exclusive Giveaway</span>
            </label>
            <div className="flex gap-3">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Giveaway"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        </motion.div>
      )}

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
            {giveaways.map((giveaway) => (
              <tr key={giveaway.id} className="border-b border-border/50 last:border-0">
                <td className="p-4">
                  <p className="font-medium">{giveaway.title}</p>
                  {giveaway.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{giveaway.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Ends: {new Date(giveaway.end_date).toLocaleString()}
                  </p>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <span className="text-accent font-semibold">{giveaway.prize}</span>
                </td>
                <td className="p-4 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <Users className="w-4 h-4" />
                    {entryCounts[giveaway.id] || 0}
                    {giveaway.max_entries ? (
                      <span className="text-muted-foreground">/ {giveaway.max_entries}</span>
                    ) : (
                      <Infinity className="w-3 h-3 text-muted-foreground ml-1" />
                    )}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <select
                    value={giveaway.status}
                    onChange={(e) => updateStatus(giveaway.id, e.target.value)}
                    className={`px-2 py-1 text-xs rounded-full ${getStatusColor(giveaway.status)} bg-transparent border-0 cursor-pointer`}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="locked">Locked</option>
                    <option value="ended">Ended</option>
                  </select>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(giveaway)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(giveaway.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {giveaways.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No giveaways found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}