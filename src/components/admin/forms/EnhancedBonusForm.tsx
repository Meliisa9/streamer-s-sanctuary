import { useState, useEffect } from "react";
import { DollarSign, Star, Eye, Upload, Link2, Percent, Gift, Globe, Tag, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EnhancedFormDialog, FormSection, FormField, FormRow, ToggleOption } from "./EnhancedFormDialog";

const regionOptions = [
  "Worldwide", "Europe", "North America", "South America", 
  "Asia", "Africa", "Oceania", "Middle East"
];

interface BonusFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBonus?: any;
  onSuccess: () => void;
}

export function EnhancedBonusForm({ open, onOpenChange, editingBonus, onSuccess }: BonusFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

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
    countries: [] as string[],
  });

  useEffect(() => {
    if (editingBonus) {
      setFormData({
        name: editingBonus.name,
        logo_url: editingBonus.logo_url || "",
        bonus_text: editingBonus.bonus_text,
        bonus_type: editingBonus.bonus_type || "Welcome Bonus",
        wagering: editingBonus.wagering || "",
        min_deposit: editingBonus.min_deposit || "",
        free_spins: editingBonus.free_spins || 0,
        promo_code: editingBonus.promo_code || "",
        affiliate_url: editingBonus.affiliate_url || "",
        rating: editingBonus.rating || 4.5,
        is_exclusive: editingBonus.is_exclusive ?? false,
        is_featured: editingBonus.is_featured ?? false,
        is_published: editingBonus.is_published ?? true,
        sort_order: editingBonus.sort_order || 0,
        countries: editingBonus.countries || [],
      });
    } else {
      resetForm();
    }
  }, [editingBonus, open]);

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
      countries: [],
    });
  };

  const toggleRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      countries: prev.countries.includes(region)
        ? prev.countries.filter(r => r !== region)
        : [...prev.countries, region]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingBonus) {
        const { error } = await supabase.from("casino_bonuses").update(formData).eq("id", editingBonus.id);
        if (error) throw error;
        toast({ title: "Bonus updated successfully" });
      } else {
        const { error } = await supabase.from("casino_bonuses").insert(formData);
        if (error) throw error;
        toast({ title: "Bonus added successfully" });
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EnhancedFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingBonus ? "Edit Casino Bonus" : "Add New Bonus"}
      subtitle="Create an attractive casino bonus offer"
      icon={<DollarSign className="w-5 h-5 text-primary" />}
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
      submitText={isSaving ? "Saving..." : "Save Bonus"}
      submitIcon={<Gift className="w-4 h-4" />}
      size="xl"
    >
      {/* Casino Details */}
      <FormSection title="Casino Information" icon={<Award className="w-4 h-4" />}>
        <FormRow>
          <FormField label="Casino Name" required>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Casino Name"
              required
            />
          </FormField>
          <FormField label="Logo URL">
            <Input
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://..."
            />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField label="Rating" hint="1-5 stars">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <Input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">/ 5</span>
            </div>
          </FormField>
          <FormField label="Sort Order">
            <Input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
            />
          </FormField>
        </FormRow>
      </FormSection>

      {/* Bonus Details */}
      <FormSection title="Bonus Offer" icon={<Gift className="w-4 h-4" />}>
        <FormField label="Bonus Text" required hint="e.g., 200% up to $3,000">
          <Input
            value={formData.bonus_text}
            onChange={(e) => setFormData({ ...formData, bonus_text: e.target.value })}
            placeholder="200% up to $3,000"
            required
          />
        </FormField>

        <FormRow cols={3}>
          <FormField label="Wagering">
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={formData.wagering}
                onChange={(e) => setFormData({ ...formData, wagering: e.target.value })}
                placeholder="40x"
                className="pl-10"
              />
            </div>
          </FormField>
          <FormField label="Min Deposit">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={formData.min_deposit}
                onChange={(e) => setFormData({ ...formData, min_deposit: e.target.value })}
                placeholder="$20"
                className="pl-10"
              />
            </div>
          </FormField>
          <FormField label="Free Spins">
            <Input
              type="number"
              value={formData.free_spins}
              onChange={(e) => setFormData({ ...formData, free_spins: parseInt(e.target.value) || 0 })}
            />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField label="Promo Code">
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={formData.promo_code}
                onChange={(e) => setFormData({ ...formData, promo_code: e.target.value })}
                placeholder="BONUS200"
                className="pl-10"
              />
            </div>
          </FormField>
          <FormField label="Affiliate URL">
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={formData.affiliate_url}
                onChange={(e) => setFormData({ ...formData, affiliate_url: e.target.value })}
                placeholder="https://..."
                className="pl-10"
              />
            </div>
          </FormField>
        </FormRow>
      </FormSection>

      {/* Region Availability */}
      <FormSection title="Region Availability" icon={<Globe className="w-4 h-4" />}>
        <div className="flex flex-wrap gap-2">
          {regionOptions.map((region) => (
            <button
              key={region}
              type="button"
              onClick={() => toggleRegion(region)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                formData.countries.includes(region)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary border-border hover:border-primary/50"
              }`}
            >
              {region}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {formData.countries.length === 0 ? "No regions selected (shows as Worldwide)" : `Selected: ${formData.countries.join(", ")}`}
        </p>
      </FormSection>

      {/* Visibility */}
      <FormSection title="Visibility Options" icon={<Eye className="w-4 h-4" />}>
        <div className="grid grid-cols-3 gap-3">
          <ToggleOption
            checked={formData.is_exclusive}
            onChange={(checked) => setFormData({ ...formData, is_exclusive: checked })}
            icon={<Star className="w-4 h-4" />}
            label="Exclusive"
            description="Special offer"
            color="purple"
          />
          <ToggleOption
            checked={formData.is_featured}
            onChange={(checked) => setFormData({ ...formData, is_featured: checked })}
            icon={<Award className="w-4 h-4" />}
            label="Featured"
            description="Top placement"
            color="amber"
          />
          <ToggleOption
            checked={formData.is_published}
            onChange={(checked) => setFormData({ ...formData, is_published: checked })}
            icon={<Eye className="w-4 h-4" />}
            label="Published"
            description="Visible to all"
            color="green"
          />
        </div>
      </FormSection>
    </EnhancedFormDialog>
  );
}
