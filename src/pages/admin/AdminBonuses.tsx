import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
}

export default function AdminBonuses() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBonus, setEditingBonus] = useState<Bonus | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    bonus_text: "",
    bonus_type: "Welcome Bonus",
    wagering: "",
    min_deposit: "",
    free_spins: 0,
    promo_code: "",
    affiliate_url: "",
    rating: 4.5,
    is_exclusive: false,
    is_featured: false,
    is_published: true,
    sort_order: 0,
  });

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

  const resetForm = () => {
    setFormData({
      name: "",
      logo_url: "",
      bonus_text: "",
      bonus_type: "Welcome Bonus",
      wagering: "",
      min_deposit: "",
      free_spins: 0,
      promo_code: "",
      affiliate_url: "",
      rating: 4.5,
      is_exclusive: false,
      is_featured: false,
      is_published: true,
      sort_order: 0,
    });
    setEditingBonus(null);
    setShowForm(false);
  };

  const handleEdit = (bonus: Bonus) => {
    setFormData({
      name: bonus.name,
      logo_url: bonus.logo_url || "",
      bonus_text: bonus.bonus_text,
      bonus_type: bonus.bonus_type || "Welcome Bonus",
      wagering: bonus.wagering || "",
      min_deposit: bonus.min_deposit || "",
      free_spins: bonus.free_spins,
      promo_code: bonus.promo_code || "",
      affiliate_url: bonus.affiliate_url || "",
      rating: bonus.rating,
      is_exclusive: bonus.is_exclusive,
      is_featured: bonus.is_featured,
      is_published: bonus.is_published,
      sort_order: bonus.sort_order,
    });
    setEditingBonus(bonus);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingBonus) {
        const { error } = await supabase
          .from("casino_bonuses")
          .update(formData)
          .eq("id", editingBonus.id);
        if (error) throw error;
        toast({ title: "Bonus updated successfully" });
      } else {
        const { error } = await supabase.from("casino_bonuses").insert(formData);
        if (error) throw error;
        toast({ title: "Bonus added successfully" });
      }
      resetForm();
      fetchBonuses();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
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
        <h2 className="text-2xl font-bold">Manage Casino Bonuses</h2>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Bonus
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">{editingBonus ? "Edit Bonus" : "Add New Bonus"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Casino Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Bonus Text *</label>
                <input
                  type="text"
                  value={formData.bonus_text}
                  onChange={(e) => setFormData({ ...formData, bonus_text: e.target.value })}
                  required
                  placeholder="200% up to $3000"
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Logo URL</label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Affiliate URL</label>
                <input
                  type="url"
                  value={formData.affiliate_url}
                  onChange={(e) => setFormData({ ...formData, affiliate_url: e.target.value })}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Wagering</label>
                <input
                  type="text"
                  value={formData.wagering}
                  onChange={(e) => setFormData({ ...formData, wagering: e.target.value })}
                  placeholder="40x"
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Min Deposit</label>
                <input
                  type="text"
                  value={formData.min_deposit}
                  onChange={(e) => setFormData({ ...formData, min_deposit: e.target.value })}
                  placeholder="$20"
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Promo Code</label>
                <input
                  type="text"
                  value={formData.promo_code}
                  onChange={(e) => setFormData({ ...formData, promo_code: e.target.value })}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Free Spins</label>
                <input
                  type="number"
                  value={formData.free_spins}
                  onChange={(e) => setFormData({ ...formData, free_spins: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Rating</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.is_exclusive} onChange={(e) => setFormData({ ...formData, is_exclusive: e.target.checked })} />
                <span className="text-sm">Exclusive</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} />
                <span className="text-sm">Featured</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} />
                <span className="text-sm">Published</span>
              </label>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Bonus"}
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
              <th className="text-left p-4 text-sm font-medium">Casino</th>
              <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Bonus</th>
              <th className="text-center p-4 text-sm font-medium">Rating</th>
              <th className="text-center p-4 text-sm font-medium">Status</th>
              <th className="text-right p-4 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bonuses.map((bonus) => (
              <tr key={bonus.id} className="border-b border-border/50 last:border-0">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {bonus.logo_url && <img src={bonus.logo_url} alt="" className="w-10 h-10 rounded object-cover" />}
                    <div>
                      <p className="font-medium">{bonus.name}</p>
                      {bonus.promo_code && <code className="text-xs text-primary">{bonus.promo_code}</code>}
                    </div>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <span className="text-sm text-accent">{bonus.bonus_text}</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-sm">{bonus.rating}/5</span>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {bonus.is_exclusive && <span className="px-2 py-0.5 text-xs bg-accent/20 text-accent rounded">Exclusive</span>}
                    {bonus.is_published ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(bonus)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(bonus.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {bonuses.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No bonuses found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
