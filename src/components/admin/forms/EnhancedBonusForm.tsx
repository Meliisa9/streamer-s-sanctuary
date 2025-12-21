import { useState, useEffect } from "react";
import { DollarSign, Star, Eye, Link2, Percent, Gift, Globe, Tag, Award, Shield, Crown, Undo2, BadgePercent, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EnhancedFormDialog, FormSection, FormField, FormRow } from "./EnhancedFormDialog";
import { cn } from "@/lib/utils";

const regionOptions = [
  "Worldwide", "Europe", "North America", "South America", 
  "Asia", "Africa", "Oceania", "Middle East"
];

const licenseOptions = [
  { value: "MGA", label: "MGA", description: "Malta Gaming Authority" },
  { value: "Curacao", label: "Curaçao", description: "Curaçao eGaming" },
  { value: "UKGC", label: "UKGC", description: "UK Gambling Commission" },
  { value: "Gibraltar", label: "Gibraltar", description: "Gibraltar Licensing Authority" },
  { value: "Kahnawake", label: "Kahnawake", description: "Kahnawake Gaming Commission" },
  { value: "Isle of Man", label: "Isle of Man", description: "Isle of Man GSC" },
];

interface BonusFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBonus?: any;
  onSuccess: () => void;
}

// Feature Toggle Card Component
function FeatureCard({
  checked,
  onChange,
  icon: Icon,
  label,
  description,
  color,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    blue: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/40",
      text: "text-blue-400",
      iconBg: "bg-blue-500/20",
    },
    green: {
      bg: "bg-green-500/10",
      border: "border-green-500/40",
      text: "text-green-400",
      iconBg: "bg-green-500/20",
    },
    amber: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/40",
      text: "text-amber-400",
      iconBg: "bg-amber-500/20",
    },
    purple: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/40",
      text: "text-purple-400",
      iconBg: "bg-purple-500/20",
    },
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
        "hover:scale-[1.02] active:scale-[0.98]",
        checked
          ? cn(colors.bg, colors.border, "shadow-lg")
          : "bg-secondary/30 border-border/50 hover:border-border"
      )}
    >
      {/* Checkmark indicator */}
      {checked && (
        <div className={cn(
          "absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center",
          colors.iconBg
        )}>
          <Check className={cn("w-3 h-3", colors.text)} />
        </div>
      )}
      
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors",
        checked ? colors.iconBg : "bg-secondary"
      )}>
        <Icon className={cn("w-6 h-6", checked ? colors.text : "text-muted-foreground")} />
      </div>
      
      <p className={cn(
        "font-semibold text-sm transition-colors",
        checked ? colors.text : "text-foreground"
      )}>
        {label}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </button>
  );
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
    is_non_sticky: false,
    has_cashback: false,
    license: "",
    is_vip_friendly: false,
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
        is_non_sticky: editingBonus.is_non_sticky ?? false,
        has_cashback: editingBonus.has_cashback ?? false,
        license: editingBonus.license || "",
        is_vip_friendly: editingBonus.is_vip_friendly ?? false,
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
      is_non_sticky: false,
      has_cashback: false,
      license: "",
      is_vip_friendly: false,
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

      {/* License Selection */}
      <FormSection title="Casino License" icon={<Shield className="w-4 h-4" />}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {licenseOptions.map((license) => (
            <button
              key={license.value}
              type="button"
              onClick={() => setFormData({ 
                ...formData, 
                license: formData.license === license.value ? "" : license.value 
              })}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                formData.license === license.value
                  ? "bg-primary/10 border-primary/40 shadow-lg"
                  : "bg-secondary/30 border-border/50 hover:border-border"
              )}
            >
              <Shield className={cn(
                "w-5 h-5 shrink-0",
                formData.license === license.value ? "text-primary" : "text-muted-foreground"
              )} />
              <div className="min-w-0">
                <p className={cn(
                  "font-medium text-sm",
                  formData.license === license.value ? "text-primary" : ""
                )}>
                  {license.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">{license.description}</p>
              </div>
              {formData.license === license.value && (
                <Check className="w-4 h-4 text-primary shrink-0 ml-auto" />
              )}
            </button>
          ))}
        </div>
        <Input
          value={formData.license}
          onChange={(e) => setFormData({ ...formData, license: e.target.value })}
          placeholder="Or enter custom license..."
          className="mt-3"
        />
      </FormSection>

      {/* Region Availability */}
      <FormSection title="Region Availability" icon={<Globe className="w-4 h-4" />}>
        <div className="flex flex-wrap gap-2">
          {regionOptions.map((region) => (
            <button
              key={region}
              type="button"
              onClick={() => toggleRegion(region)}
              className={cn(
                "px-4 py-2 text-sm rounded-lg border-2 font-medium transition-all",
                formData.countries.includes(region)
                  ? "bg-primary/10 text-primary border-primary/40 shadow-sm"
                  : "bg-secondary/50 border-border/50 hover:border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {formData.countries.includes(region) && (
                <Check className="w-3 h-3 inline mr-1.5 -mt-0.5" />
              )}
              {region}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {formData.countries.length === 0 ? "No regions selected (shows as Worldwide)" : `Selected: ${formData.countries.join(", ")}`}
        </p>
      </FormSection>

      {/* Bonus Features - Improved Grid */}
      <FormSection title="Bonus Features" icon={<Gift className="w-4 h-4" />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FeatureCard
            checked={formData.is_non_sticky}
            onChange={(checked) => setFormData({ ...formData, is_non_sticky: checked })}
            icon={Undo2}
            label="Non-Sticky"
            description="Withdrawable bonus"
            color="blue"
          />
          <FeatureCard
            checked={formData.has_cashback}
            onChange={(checked) => setFormData({ ...formData, has_cashback: checked })}
            icon={BadgePercent}
            label="Cashback"
            description="Offers cashback"
            color="green"
          />
          <FeatureCard
            checked={formData.is_vip_friendly}
            onChange={(checked) => setFormData({ ...formData, is_vip_friendly: checked })}
            icon={Crown}
            label="VIP Friendly"
            description="High roller perks"
            color="amber"
          />
          <FeatureCard
            checked={formData.is_exclusive}
            onChange={(checked) => setFormData({ ...formData, is_exclusive: checked })}
            icon={Star}
            label="Exclusive"
            description="Special offer"
            color="purple"
          />
        </div>
      </FormSection>

      {/* Visibility */}
      <FormSection title="Visibility" icon={<Eye className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <FeatureCard
            checked={formData.is_featured}
            onChange={(checked) => setFormData({ ...formData, is_featured: checked })}
            icon={Award}
            label="Featured"
            description="Top placement"
            color="amber"
          />
          <FeatureCard
            checked={formData.is_published}
            onChange={(checked) => setFormData({ ...formData, is_published: checked })}
            icon={Eye}
            label="Published"
            description="Visible to all"
            color="green"
          />
        </div>
      </FormSection>
    </EnhancedFormDialog>
  );
}
