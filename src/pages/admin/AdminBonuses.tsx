import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Loader2, Search, RefreshCw, DollarSign, Gift, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EnhancedBonusForm } from "@/components/admin/forms";

interface Bonus {
  id: string;
  name: string;
  logo_url: string | null;
  bonus_text: string;
  bonus_type: string | null;
  wagering: string | null;
  min_deposit: string | null;
  free_spins: number;
  promo_code: string | null;
  affiliate_url: string | null;
  rating: number;
  is_exclusive: boolean;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  countries: string[] | null;
}

export default function AdminBonuses() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBonus, setEditingBonus] = useState<Bonus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchBonuses();
  }, []);

  const fetchBonuses = async () => {
    try {
      const { data } = await supabase
        .from("casino_bonuses")
        .select("*")
        .order("sort_order");
      setBonuses(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (bonus: Bonus) => {
    setEditingBonus(bonus);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bonus?")) return;
    try {
      const { error } = await supabase.from("casino_bonuses").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Bonus deleted" });
      fetchBonuses();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const togglePublished = async (bonus: Bonus) => {
    try {
      const { error } = await supabase
        .from("casino_bonuses")
        .update({ is_published: !bonus.is_published })
        .eq("id", bonus.id);
      if (error) throw error;
      fetchBonuses();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleFeatured = async (bonus: Bonus) => {
    try {
      const { error } = await supabase
        .from("casino_bonuses")
        .update({ is_featured: !bonus.is_featured })
        .eq("id", bonus.id);
      if (error) throw error;
      fetchBonuses();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredBonuses = bonuses.filter((bonus) =>
    bonus.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bonus.bonus_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: bonuses.length,
    published: bonuses.filter((b) => b.is_published).length,
    exclusive: bonuses.filter((b) => b.is_exclusive).length,
    featured: bonuses.filter((b) => b.is_featured).length,
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
          <h1 className="text-3xl font-bold">Casino Bonuses</h1>
          <p className="text-muted-foreground">Manage casino offers and promotions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchBonuses}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => { setEditingBonus(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Bonus
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total Bonuses</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-500">{stats.published}</p>
          <p className="text-sm text-muted-foreground">Published</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-accent" />
          </div>
          <p className="text-2xl font-bold text-accent">{stats.exclusive}</p>
          <p className="text-sm text-muted-foreground">Exclusive</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-500">{stats.featured}</p>
          <p className="text-sm text-muted-foreground">Featured</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search bonuses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Enhanced Form Modal */}
      <EnhancedBonusForm
        open={showForm}
        onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingBonus(null); } else setShowForm(true); }}
        onSuccess={() => { setShowForm(false); setEditingBonus(null); fetchBonuses(); }}
        editingBonus={editingBonus}
      />

      {/* Bonuses List */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left p-4 text-sm font-medium">Casino</th>
              <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Bonus</th>
              <th className="text-left p-4 text-sm font-medium hidden lg:table-cell">Regions</th>
              <th className="text-center p-4 text-sm font-medium">Rating</th>
              <th className="text-center p-4 text-sm font-medium">Status</th>
              <th className="text-right p-4 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBonuses.map((bonus) => (
              <motion.tr
                key={bonus.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {bonus.logo_url ? (
                      <img src={bonus.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{bonus.name}</p>
                      {bonus.promo_code && (
                        <code className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">{bonus.promo_code}</code>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <span className="text-sm text-accent font-medium">{bonus.bonus_text}</span>
                  {bonus.free_spins > 0 && (
                    <p className="text-xs text-muted-foreground">+ {bonus.free_spins} Free Spins</p>
                  )}
                </td>
                <td className="p-4 hidden lg:table-cell">
                  <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {bonus.countries && bonus.countries.length > 0
                        ? bonus.countries.slice(0, 2).join(", ") + (bonus.countries.length > 2 ? ` +${bonus.countries.length - 2}` : "")
                        : "Worldwide"}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                    <span className="text-sm font-medium">{bonus.rating}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    {bonus.is_exclusive && (
                      <Badge variant="outline" className="border-accent/30 text-accent text-xs">Exclusive</Badge>
                    )}
                    <button
                      onClick={() => toggleFeatured(bonus)}
                      className={`p-1 rounded transition-colors ${bonus.is_featured ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}`}
                    >
                      <Star className="w-4 h-4" fill={bonus.is_featured ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={() => togglePublished(bonus)}
                      className={`p-1 rounded transition-colors ${bonus.is_published ? "text-green-500" : "text-muted-foreground hover:text-green-500"}`}
                    >
                      {bonus.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(bonus)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(bonus.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {filteredBonuses.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">No bonuses found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
