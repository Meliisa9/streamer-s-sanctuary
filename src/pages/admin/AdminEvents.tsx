import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Calendar, Search, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  end_time: string | null;
  event_type: string | null;
  platform: string | null;
  streamer_id: string | null;
  is_featured: boolean | null;
  is_recurring: boolean | null;
  timezone: string | null;
  created_at: string;
}

interface Streamer {
  id: string;
  name: string;
  image_url: string | null;
}

const eventTypes = ["Stream", "Special Event", "Community", "Giveaway"];
const platforms = ["Twitch", "Kick", "YouTube", "Discord"];

const timezones = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "EST/EDT (Eastern Time)" },
  { value: "America/Chicago", label: "CST/CDT (Central Time)" },
  { value: "America/Denver", label: "MST/MDT (Mountain Time)" },
  { value: "America/Los_Angeles", label: "PST/PDT (Pacific Time)" },
  { value: "Europe/London", label: "GMT/BST (London)" },
  { value: "Europe/Paris", label: "CET/CEST (Central European)" },
  { value: "Europe/Stockholm", label: "CET/CEST (Stockholm)" },
  { value: "Europe/Berlin", label: "CET/CEST (Berlin)" },
  { value: "Asia/Tokyo", label: "JST (Japan)" },
  { value: "Asia/Singapore", label: "SGT (Singapore)" },
  { value: "Australia/Sydney", label: "AEST/AEDT (Sydney)" },
];

// Generate time options in 15-minute intervals
const generateTimeOptions = () => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      times.push(`${hour}:${minute}`);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

export default function AdminEvents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
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

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data as Event[];
    },
  });

  const { data: streamers } = useQuery({
    queryKey: ["streamers-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("streamers")
        .select("id, name, image_url")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Streamer[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Ensure required fields are present
      if (!data.title || !data.event_date) {
        throw new Error("Title and date are required");
      }
      
      const cleanData = {
        title: data.title,
        event_date: data.event_date,
        event_type: data.event_type || "Stream",
        platform: data.platform || "Twitch",
        is_featured: data.is_featured || false,
        is_recurring: data.is_recurring || false,
        streamer_id: data.streamer_id && data.streamer_id.trim() !== "" ? data.streamer_id : null,
        end_time: data.end_time && data.end_time.trim() !== "" ? data.end_time : null,
        event_time: data.event_time && data.event_time.trim() !== "" ? data.event_time : null,
        description: data.description && data.description.trim() !== "" ? data.description : null,
        timezone: data.timezone || "UTC",
      };
      
      const { data: result, error } = await supabase.from("events").insert([cleanData]).select();
      if (error) {
        console.error("Event creation error:", error);
        throw error;
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({ title: "Event created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Event mutation error:", error);
      toast({ title: "Error creating event", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const cleanData = {
        ...data,
        streamer_id: data.streamer_id || null,
        end_time: data.end_time || null,
        event_time: data.event_time || null,
        description: data.description || null,
        timezone: data.timezone || "UTC",
      };
      const { error } = await supabase.from("events").update(cleanData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({ title: "Event updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error updating event", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({ title: "Event deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting event", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
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
    setEditingEvent(null);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date,
      event_time: event.event_time || "",
      end_time: event.end_time || "",
      event_type: event.event_type || "Stream",
      platform: event.platform || "Twitch",
      streamer_id: event.streamer_id || "",
      is_featured: event.is_featured ?? false,
      is_recurring: event.is_recurring ?? false,
      timezone: event.timezone || "UTC",
    });
    setIsDialogOpen(true);
  };

  const getStreamerName = (streamerId: string | null) => {
    if (!streamerId) return null;
    return streamers?.find((s) => s.id === streamerId)?.name;
  };

  const getTimezoneLabel = (tz: string | null) => {
    if (!tz) return "UTC";
    const found = timezones.find(t => t.value === tz);
    return found ? found.value.split("/").pop()?.replace("_", " ") : tz;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredEvents = events?.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.event_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingEvents = filteredEvents?.filter((e) => new Date(e.event_date) >= new Date());
  const pastEvents = filteredEvents?.filter((e) => new Date(e.event_date) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">Manage streams and events</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select
                    value={formData.event_time || "none"}
                    onValueChange={(value) => setFormData({ ...formData, event_time: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      <SelectItem value="none">No specific time</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Select
                    value={formData.end_time || "none"}
                    onValueChange={(value) => setFormData({ ...formData, end_time: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      <SelectItem value="none">No end time</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => setFormData({ ...formData, platform: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Streamer</Label>
                <Select
                  value={formData.streamer_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, streamer_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a streamer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific streamer</SelectItem>
                    {streamers?.map((streamer) => (
                      <SelectItem key={streamer.id} value={streamer.id}>{streamer.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label>Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                  />
                  <Label>Recurring</Label>
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingEvent ? "Update Event" : "Create Event"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="space-y-8">
          {upcomingEvents && upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
              <div className="grid gap-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="glass rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{event.title}</h3>
                        {event.is_featured && (
                          <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded">Featured</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                        {event.event_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.event_time}{event.end_time && ` - ${event.end_time}`}
                            {event.timezone && ` (${getTimezoneLabel(event.timezone)})`}
                          </span>
                        )}
                        <span>• {event.event_type}</span>
                        <span>• {event.platform}</span>
                        {event.streamer_id && <span>• {getStreamerName(event.streamer_id)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Delete this event?")) deleteMutation.mutate(event.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pastEvents && pastEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Past Events</h2>
              <div className="grid gap-4 opacity-60">
                {pastEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="glass rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{event.title}</h3>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.event_date).toLocaleDateString()} • {event.event_type}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Delete this event?")) deleteMutation.mutate(event.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredEvents?.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">No events found</div>
          )}
        </div>
      )}
    </div>
  );
}