import { useState, useEffect } from "react";
import { Trophy, Target, Calendar, Clock, DollarSign, Globe, Award, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EnhancedFormDialog, FormSection, FormField, FormRow } from "./EnhancedFormDialog";

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Europe/Stockholm", label: "Stockholm (CET/CEST)" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
];

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
];

interface BonusHuntFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingHunt?: any;
  onSuccess: () => void;
}

export function EnhancedBonusHuntForm({ open, onOpenChange, editingHunt, onSuccess }: BonusHuntFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "",
    timezone: "UTC",
    status: "to_be_played" as "ongoing" | "complete" | "to_be_played",
    starting_balance: "",
    target_balance: "",
    ending_balance: "",
    average_bet: "",
    highest_win: "",
    highest_multiplier: "",
    currency: "USD",
    winner_points: "1000",
  });

  useEffect(() => {
    if (editingHunt) {
      setFormData({
        title: editingHunt.title,
        date: editingHunt.date,
        start_time: editingHunt.start_time ? new Date(editingHunt.start_time).toISOString().slice(11, 16) : "",
        timezone: editingHunt.timezone || "UTC",
        status: editingHunt.status,
        starting_balance: editingHunt.starting_balance?.toString() || "",
        target_balance: editingHunt.target_balance?.toString() || "",
        ending_balance: editingHunt.ending_balance?.toString() || "",
        average_bet: editingHunt.average_bet?.toString() || "",
        highest_win: editingHunt.highest_win?.toString() || "",
        highest_multiplier: editingHunt.highest_multiplier?.toString() || "",
        currency: editingHunt.currency || "USD",
        winner_points: editingHunt.winner_points?.toString() || "1000",
      });
    } else {
      resetForm();
    }
  }, [editingHunt, open]);

  const resetForm = () => {
    setFormData({
      title: "",
      date: new Date().toISOString().split("T")[0],
      start_time: "",
      timezone: "UTC",
      status: "to_be_played",
      starting_balance: "",
      target_balance: "",
      ending_balance: "",
      average_bet: "",
      highest_win: "",
      highest_multiplier: "",
      currency: "USD",
      winner_points: "1000",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const huntData = {
        title: formData.title,
        date: formData.date,
        status: formData.status,
        currency: formData.currency,
        winner_points: parseInt(formData.winner_points) || 1000,
        starting_balance: formData.starting_balance ? parseFloat(formData.starting_balance) : null,
        target_balance: formData.target_balance ? parseFloat(formData.target_balance) : null,
        ending_balance: formData.ending_balance ? parseFloat(formData.ending_balance) : null,
        average_bet: formData.average_bet ? parseFloat(formData.average_bet) : null,
        highest_win: formData.highest_win ? parseFloat(formData.highest_win) : null,
        highest_multiplier: formData.highest_multiplier ? parseFloat(formData.highest_multiplier) : null,
        start_time: formData.start_time ? `${formData.date}T${formData.start_time}:00` : null,
      };

      if (editingHunt) {
        const { error } = await supabase.from("bonus_hunts").update(huntData).eq("id", editingHunt.id);
        if (error) throw error;
        toast({ title: "Bonus hunt updated" });
      } else {
        const { error } = await supabase.from("bonus_hunts").insert([huntData]);
        if (error) throw error;
        toast({ title: "Bonus hunt created" });
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

  const currencySymbol = formData.currency === "EUR" ? "€" : formData.currency === "GBP" ? "£" : "$";

  return (
    <EnhancedFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingHunt ? "Edit Bonus Hunt" : "Create New Bonus Hunt"}
      subtitle="Set up a bonus hunt session"
      icon={<Trophy className="w-5 h-5 text-primary" />}
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
      submitText={isSaving ? "Saving..." : "Save Hunt"}
      submitIcon={<Trophy className="w-4 h-4" />}
      size="xl"
    >
      {/* Basic Info */}
      <FormSection title="Hunt Details" icon={<Trophy className="w-4 h-4" />}>
        <FormField label="Hunt Title" required>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Friday Hunt #42"
            required
          />
        </FormField>

        <FormRow cols={3}>
          <FormField label="Date" required>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Start Time">
            <Input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
          </FormField>
          <FormField label="Timezone">
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </FormField>
        </FormRow>

        <FormRow>
          <FormField label="Currency">
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Status">
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
            >
              <option value="to_be_played">To Be Played</option>
              <option value="ongoing">Ongoing</option>
              <option value="complete">Complete</option>
            </select>
          </FormField>
        </FormRow>
      </FormSection>

      {/* Balances */}
      <FormSection title="Balances" icon={<DollarSign className="w-4 h-4" />}>
        <FormRow cols={3}>
          <FormField label="Starting Balance">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
              <Input
                type="number"
                value={formData.starting_balance}
                onChange={(e) => setFormData({ ...formData, starting_balance: e.target.value })}
                placeholder="10,000"
                className="pl-8"
              />
            </div>
          </FormField>
          <FormField label="Target Balance">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
              <Input
                type="number"
                value={formData.target_balance}
                onChange={(e) => setFormData({ ...formData, target_balance: e.target.value })}
                placeholder="50,000"
                className="pl-8"
              />
            </div>
          </FormField>
          <FormField label="Ending Balance">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
              <Input
                type="number"
                value={formData.ending_balance}
                onChange={(e) => setFormData({ ...formData, ending_balance: e.target.value })}
                placeholder="0"
                className="pl-8"
              />
            </div>
          </FormField>
        </FormRow>
      </FormSection>

      {/* Stats */}
      <FormSection title="Statistics" icon={<Target className="w-4 h-4" />}>
        <FormRow cols={3}>
          <FormField label="Average Bet">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
              <Input
                type="number"
                value={formData.average_bet}
                onChange={(e) => setFormData({ ...formData, average_bet: e.target.value })}
                placeholder="50"
                className="pl-8"
              />
            </div>
          </FormField>
          <FormField label="Highest Win">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
              <Input
                type="number"
                value={formData.highest_win}
                onChange={(e) => setFormData({ ...formData, highest_win: e.target.value })}
                placeholder="25,000"
                className="pl-8"
              />
            </div>
          </FormField>
          <FormField label="Highest Multiplier">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">×</span>
              <Input
                type="number"
                value={formData.highest_multiplier}
                onChange={(e) => setFormData({ ...formData, highest_multiplier: e.target.value })}
                placeholder="5000"
                className="pl-8"
              />
            </div>
          </FormField>
        </FormRow>
      </FormSection>

      {/* Winner Points */}
      <FormSection title="Winner Rewards" icon={<Award className="w-4 h-4" />}>
        <FormField label="Winner Points" hint="Points awarded to the closest guess">
          <div className="relative">
            <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              value={formData.winner_points}
              onChange={(e) => setFormData({ ...formData, winner_points: e.target.value })}
              placeholder="1000"
              className="pl-10"
            />
          </div>
        </FormField>
      </FormSection>
    </EnhancedFormDialog>
  );
}
