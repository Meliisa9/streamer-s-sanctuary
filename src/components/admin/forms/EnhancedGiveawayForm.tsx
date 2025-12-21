import { useState, useEffect } from "react";
import { Gift, Users, Calendar, Trophy, Star, Clock, FileText, Target, Infinity, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedFormDialog, FormSection, FormField, FormRow, ToggleOption } from "./EnhancedFormDialog";

interface GiveawayFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGiveaway?: any;
  onSuccess: () => void;
}

export function EnhancedGiveawayForm({ open, onOpenChange, editingGiveaway, onSuccess }: GiveawayFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prize: "",
    prize_type: "Cash",
    currency: "USD",
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
    if (editingGiveaway) {
      const endDateTime = new Date(editingGiveaway.end_date);
      setFormData({
        title: editingGiveaway.title,
        description: editingGiveaway.description || "",
        prize: editingGiveaway.prize,
        prize_type: editingGiveaway.prize_type || "Cash",
        currency: editingGiveaway.currency || "USD",
        image_url: editingGiveaway.image_url || "",
        max_entries: editingGiveaway.max_entries?.toString() || "",
        winners_count: editingGiveaway.winners_count || 1,
        requirements: editingGiveaway.requirements?.join("\n") || "",
        status: editingGiveaway.status || "active",
        end_date: endDateTime.toISOString().split("T")[0],
        end_time: endDateTime.toTimeString().slice(0, 5),
        is_exclusive: editingGiveaway.is_exclusive ?? false,
      });
    } else {
      resetForm();
    }
  }, [editingGiveaway, open]);

  const resetForm = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    setFormData({
      title: "",
      description: "",
      prize: "",
      prize_type: "Cash",
      currency: "USD",
      image_url: "",
      max_entries: "",
      winners_count: 1,
      requirements: "",
      status: "active",
      end_date: tomorrow.toISOString().split("T")[0],
      end_time: "23:59",
      is_exclusive: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const endDateISO = formData.end_time
        ? new Date(`${formData.end_date}T${formData.end_time}`).toISOString()
        : new Date(`${formData.end_date}T23:59:59`).toISOString();

      const maxEntries = formData.max_entries ? parseInt(formData.max_entries) : null;
      const finalMaxEntries = maxEntries === 0 ? null : maxEntries;

      const giveawayData = {
        title: formData.title,
        description: formData.description || null,
        prize: formData.prize,
        prize_type: formData.prize_type,
        currency: formData.prize_type === "Cash" ? formData.currency : null,
        image_url: formData.image_url || null,
        max_entries: finalMaxEntries,
        winners_count: formData.winners_count,
        requirements: formData.requirements.split("\n").filter(Boolean),
        status: formData.status,
        end_date: endDateISO,
        is_exclusive: formData.is_exclusive,
        created_by: user?.id,
      };

      if (editingGiveaway) {
        const { error } = await supabase.from("giveaways").update(giveawayData).eq("id", editingGiveaway.id);
        if (error) throw error;
        toast({ title: "Giveaway updated" });
      } else {
        const { error } = await supabase.from("giveaways").insert(giveawayData);
        if (error) throw error;
        toast({ title: "Giveaway created" });
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
      title={editingGiveaway ? "Edit Giveaway" : "Create New Giveaway"}
      subtitle="Set up an exciting giveaway for your community"
      icon={<Gift className="w-5 h-5 text-primary" />}
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
      submitText={isSaving ? "Saving..." : "Save Giveaway"}
      submitIcon={<Trophy className="w-4 h-4" />}
      size="xl"
    >
      {/* Basic Info */}
      <FormSection title="Giveaway Details" icon={<FileText className="w-4 h-4" />}>
        <FormField label="Title" required>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Weekly Cash Giveaway"
            required
          />
        </FormField>

        <FormField label="Description">
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            placeholder="Describe what this giveaway is about..."
          />
        </FormField>

        <FormField label="Image URL">
          <Input
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            placeholder="https://..."
          />
        </FormField>
      </FormSection>

      {/* Prize Details */}
      <FormSection title="Prize Information" icon={<Trophy className="w-4 h-4" />}>
        <FormRow cols={3}>
          <FormField label="Prize Value" required>
            <div className="relative">
              <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={formData.prize}
                onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                placeholder="10,000"
                required
                className="pl-10"
              />
            </div>
          </FormField>
          <FormField label="Prize Type">
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
          </FormField>
          {formData.prize_type === "Cash" && (
            <FormField label="Currency">
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
              >
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
                <option value="CAD">C$ CAD</option>
                <option value="AUD">A$ AUD</option>
                <option value="SEK">kr SEK</option>
              </select>
            </FormField>
          )}
        </FormRow>
      </FormSection>

      {/* Timing */}
      <FormSection title="Schedule" icon={<Calendar className="w-4 h-4" />}>
        <FormRow cols={3}>
          <FormField label="End Date" required>
            <Input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </FormField>
          <FormField label="End Time" hint="Leave empty for 23:59">
            <Input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </FormField>
          <FormField label="Status">
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
          </FormField>
        </FormRow>
      </FormSection>

      {/* Entry Settings */}
      <FormSection title="Entry Settings" icon={<Users className="w-4 h-4" />}>
        <FormRow>
          <FormField label="Max Entries" hint="0 or empty = unlimited">
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={formData.max_entries}
                onChange={(e) => setFormData({ ...formData, max_entries: e.target.value })}
                placeholder="Unlimited"
                className="pl-10"
              />
            </div>
          </FormField>
          <FormField label="Winners Count">
            <div className="relative">
              <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                min="1"
                value={formData.winners_count}
                onChange={(e) => setFormData({ ...formData, winners_count: parseInt(e.target.value) || 1 })}
                className="pl-10"
              />
            </div>
          </FormField>
        </FormRow>

        <FormField label="Entry Requirements" hint="One per line">
          <Textarea
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            rows={3}
            placeholder="Follow on Twitch&#10;Join Discord Server&#10;Subscribe to Newsletter"
          />
        </FormField>
      </FormSection>

      {/* Options */}
      <FormSection title="Options" icon={<Star className="w-4 h-4" />}>
        <ToggleOption
          checked={formData.is_exclusive}
          onChange={(checked) => setFormData({ ...formData, is_exclusive: checked })}
          icon={<Star className="w-4 h-4" />}
          label="Exclusive Giveaway"
          description="Mark as a special exclusive offer"
          color="purple"
        />
      </FormSection>
    </EnhancedFormDialog>
  );
}
