import { useState, useEffect } from "react";
import { Calendar, Clock, Star, Repeat, Video, Users, Globe, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EnhancedFormDialog, FormSection, FormField, FormRow, ToggleOption } from "./EnhancedFormDialog";

const eventTypes = ["Stream", "Special Event", "Community", "Giveaway", "Tournament", "Collab"];
const platforms = ["Twitch", "Kick", "YouTube", "Discord", "Multiple"];
const timezones = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "EST/EDT" },
  { value: "America/Los_Angeles", label: "PST/PDT" },
  { value: "Europe/London", label: "GMT/BST" },
  { value: "Europe/Paris", label: "CET/CEST" },
  { value: "Europe/Stockholm", label: "CET (Stockholm)" },
  { value: "Asia/Tokyo", label: "JST" },
  { value: "Australia/Sydney", label: "AEST/AEDT" },
];

const generateTimeOptions = () => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      times.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
  }
  return times;
};

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent?: any;
  onSuccess: () => void;
  streamers?: { id: string; name: string }[];
}

export function EnhancedEventForm({ open, onOpenChange, editingEvent, onSuccess, streamers = [] }: EventFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    end_time: "",
    event_type: "Stream",
    platform: "Twitch",
    streamer_id: "",
    is_featured: false,
    is_recurring: false,
    timezone: "UTC",
  });

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description || "",
        event_date: editingEvent.event_date,
        event_time: editingEvent.event_time || "",
        end_time: editingEvent.end_time || "",
        event_type: editingEvent.event_type || "Stream",
        platform: editingEvent.platform || "Twitch",
        streamer_id: editingEvent.streamer_id || "",
        is_featured: editingEvent.is_featured ?? false,
        is_recurring: editingEvent.is_recurring ?? false,
        timezone: editingEvent.timezone || "UTC",
      });
    } else {
      resetForm();
    }
  }, [editingEvent, open]);

  const resetForm = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData({
      title: "",
      description: "",
      event_date: tomorrow.toISOString().split("T")[0],
      event_time: "",
      end_time: "",
      event_type: "Stream",
      platform: "Twitch",
      streamer_id: "",
      is_featured: false,
      is_recurring: false,
      timezone: "UTC",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const eventData = {
        title: formData.title,
        event_date: formData.event_date,
        event_type: formData.event_type,
        platform: formData.platform,
        is_featured: formData.is_featured,
        is_recurring: formData.is_recurring,
        streamer_id: formData.streamer_id || null,
        end_time: formData.end_time || null,
        event_time: formData.event_time || null,
        description: formData.description || null,
        timezone: formData.timezone,
      };

      if (editingEvent) {
        const { error } = await supabase.from("events").update(eventData).eq("id", editingEvent.id);
        if (error) throw error;
        toast({ title: "Event updated" });
      } else {
        const { error } = await supabase.from("events").insert([eventData]);
        if (error) throw error;
        toast({ title: "Event created" });
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

  const timeOptions = generateTimeOptions();

  return (
    <EnhancedFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingEvent ? "Edit Event" : "Create New Event"}
      subtitle="Schedule a stream or special event"
      icon={<Calendar className="w-5 h-5 text-primary" />}
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
      submitText={isSaving ? "Saving..." : "Save Event"}
      submitIcon={<Calendar className="w-4 h-4" />}
      size="lg"
    >
      {/* Basic Info */}
      <FormSection title="Event Details" icon={<FileText className="w-4 h-4" />}>
        <FormField label="Title" required>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Weekly Stream"
            required
          />
        </FormField>

        <FormField label="Description">
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            placeholder="Event description..."
          />
        </FormField>
      </FormSection>

      {/* Schedule */}
      <FormSection title="Schedule" icon={<Clock className="w-4 h-4" />}>
        <FormRow cols={3}>
          <FormField label="Date" required>
            <Input
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Start Time">
            <select
              value={formData.event_time || "none"}
              onChange={(e) => setFormData({ ...formData, event_time: e.target.value === "none" ? "" : e.target.value })}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
            >
              <option value="none">No specific time</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </FormField>
          <FormField label="End Time">
            <select
              value={formData.end_time || "none"}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value === "none" ? "" : e.target.value })}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
            >
              <option value="none">No end time</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </FormField>
        </FormRow>

        <FormField label="Timezone">
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </FormField>
      </FormSection>

      {/* Platform & Type */}
      <FormSection title="Event Type" icon={<Video className="w-4 h-4" />}>
        <FormRow>
          <FormField label="Event Type">
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
            >
              {eventTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Platform">
            <select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
            >
              {platforms.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </FormField>
        </FormRow>

        {streamers.length > 0 && (
          <FormField label="Streamer">
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={formData.streamer_id}
                onChange={(e) => setFormData({ ...formData, streamer_id: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
              >
                <option value="">No streamer</option>
                {streamers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </FormField>
        )}
      </FormSection>

      {/* Options */}
      <FormSection title="Options" icon={<Star className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <ToggleOption
            checked={formData.is_featured}
            onChange={(checked) => setFormData({ ...formData, is_featured: checked })}
            icon={<Star className="w-4 h-4" />}
            label="Featured"
            description="Highlight this event"
            color="amber"
          />
          <ToggleOption
            checked={formData.is_recurring}
            onChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
            icon={<Repeat className="w-4 h-4" />}
            label="Recurring"
            description="Repeating event"
            color="primary"
          />
        </div>
      </FormSection>
    </EnhancedFormDialog>
  );
}
