import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Calendar as CalendarIcon, 
  Search, 
  Clock, 
  LayoutGrid, 
  List, 
  Filter,
  SortAsc,
  SortDesc,
  Star,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  Users
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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

const eventTypes = ["Stream", "Special Event", "Community", "Giveaway", "Tournament", "Collab"];
const platforms = ["Twitch", "Kick", "YouTube", "Discord", "Multiple"];

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

const eventTypeColors: Record<string, string> = {
  "Stream": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Special Event": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Community": "bg-green-500/20 text-green-400 border-green-500/30",
  "Giveaway": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Tournament": "bg-red-500/20 text-red-400 border-red-500/30",
  "Collab": "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

type SortField = "date" | "title" | "type";
type SortOrder = "asc" | "desc";
type ViewMode = "list" | "calendar";

export default function AdminEvents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [calendarDate, setCalendarDate] = useState(new Date());
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

  const { data: events, isLoading, refetch } = useQuery({
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
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({ title: "Event created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
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

  const duplicateMutation = useMutation({
    mutationFn: async (event: Event) => {
      const newEvent = {
        title: `${event.title} (Copy)`,
        event_date: event.event_date,
        event_type: event.event_type,
        platform: event.platform,
        is_featured: false,
        is_recurring: event.is_recurring,
        streamer_id: event.streamer_id,
        end_time: event.end_time,
        event_time: event.event_time,
        description: event.description,
        timezone: event.timezone,
      };
      const { error } = await supabase.from("events").insert([newEvent]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({ title: "Event duplicated" });
    },
    onError: (error: any) => {
      toast({ title: "Error duplicating event", description: error.message, variant: "destructive" });
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

  // Filter and sort events
  const filteredAndSortedEvents = events
    ?.filter((event) => {
      const matchesSearch = 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.event_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || event.event_type === filterType;
      const matchesPlatform = filterPlatform === "all" || event.platform === filterPlatform;
      return matchesSearch && matchesType && matchesPlatform;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison = new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "type":
          comparison = (a.event_type || "").localeCompare(b.event_type || "");
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const upcomingEvents = filteredAndSortedEvents?.filter((e) => new Date(e.event_date) >= new Date());
  const pastEvents = filteredAndSortedEvents?.filter((e) => new Date(e.event_date) < new Date());

  // Calendar helpers
  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day: Date) => {
    return events?.filter((event) => isSameDay(parseISO(event.event_date), day)) || [];
  };

  const stats = {
    total: events?.length || 0,
    upcoming: events?.filter((e) => new Date(e.event_date) >= new Date()).length || 0,
    featured: events?.filter((e) => e.is_featured).length || 0,
    thisMonth: events?.filter((e) => isSameMonth(parseISO(e.event_date), new Date())).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">Manage streams and events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
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
                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingEvent ? "Update Event" : "Create Event"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Events</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Clock className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.upcoming}</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.featured}</p>
              <p className="text-sm text-muted-foreground">Featured</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <CalendarIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.thisMonth}</p>
              <p className="text-sm text-muted-foreground">This Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {eventTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Platform Filter */}
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {platforms.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSortField("date"); setSortOrder("asc"); }}>
                Date (Oldest first)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortField("date"); setSortOrder("desc"); }}>
                Date (Newest first)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortField("title"); setSortOrder("asc"); }}>
                Title (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortField("type"); setSortOrder("asc"); }}>
                Type (A-Z)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="rounded-none"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="icon"
              className="rounded-none"
              onClick={() => setViewMode("calendar")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading...</div>
      ) : viewMode === "calendar" ? (
        /* Calendar View */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{format(calendarDate, "MMMM yyyy")}</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCalendarDate(subMonths(calendarDate, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCalendarDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCalendarDate(addMonths(calendarDate, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {daysInMonth.map((day) => {
              const dayEvents = getEventsForDay(day);
              const hasEvents = dayEvents.length > 0;
              
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "aspect-square p-1 rounded-lg border border-border/50 hover:border-primary/50 transition-colors relative",
                    isToday(day) && "bg-primary/10 border-primary",
                    hasEvents && "bg-secondary/50"
                  )}
                >
                  <span className={cn(
                    "text-sm font-medium",
                    isToday(day) && "text-primary"
                  )}>
                    {format(day, "d")}
                  </span>
                  {hasEvents && (
                    <div className="absolute bottom-1 left-1 right-1 flex gap-0.5 flex-wrap">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            event.event_type === "Stream" && "bg-blue-500",
                            event.event_type === "Giveaway" && "bg-yellow-500",
                            event.event_type === "Special Event" && "bg-purple-500",
                            event.event_type === "Community" && "bg-green-500",
                            !["Stream", "Giveaway", "Special Event", "Community"].includes(event.event_type || "") && "bg-primary"
                          )}
                          title={event.title}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        /* List View */
        <div className="space-y-8">
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming ({upcomingEvents?.length || 0})</TabsTrigger>
              <TabsTrigger value="past">Past ({pastEvents?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-4">
              <AnimatePresence>
                {upcomingEvents && upcomingEvents.length > 0 ? (
                  <div className="grid gap-3">
                    {upcomingEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="glass rounded-xl p-4 flex items-center gap-4 group hover:border-primary/30 transition-colors"
                      >
                        <div className="w-14 h-14 rounded-lg bg-primary/20 flex flex-col items-center justify-center text-primary">
                          <span className="text-xs font-medium">{format(parseISO(event.event_date), "MMM")}</span>
                          <span className="text-lg font-bold">{format(parseISO(event.event_date), "d")}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold truncate">{event.title}</h3>
                            {event.is_featured && (
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            {event.is_recurring && (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Recurring
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                            {event.event_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {event.event_time}{event.end_time && ` - ${event.end_time}`}
                                {event.timezone && ` (${getTimezoneLabel(event.timezone)})`}
                              </span>
                            )}
                            <Badge className={cn("text-xs", eventTypeColors[event.event_type || ""] || "bg-secondary")}>
                              {event.event_type}
                            </Badge>
                            <span className="text-xs">{event.platform}</span>
                            {event.streamer_id && (
                              <span className="flex items-center gap-1 text-xs">
                                <Users className="w-3 h-3" />
                                {getStreamerName(event.streamer_id)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(event)} title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => duplicateMutation.mutate(event)} title="Duplicate">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Delete this event?")) deleteMutation.mutate(event.id);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No upcoming events</p>
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="past" className="mt-4">
              {pastEvents && pastEvents.length > 0 ? (
                <div className="grid gap-3 opacity-70">
                  {pastEvents.slice(0, 10).map((event) => (
                    <div key={event.id} className="glass rounded-xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-muted flex flex-col items-center justify-center">
                        <span className="text-xs font-medium text-muted-foreground">{format(parseISO(event.event_date), "MMM")}</span>
                        <span className="text-lg font-bold text-muted-foreground">{format(parseISO(event.event_date), "d")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{event.title}</h3>
                        <div className="text-sm text-muted-foreground">
                          {event.event_type} • {event.platform}
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
              ) : (
                <div className="text-center py-10 text-muted-foreground">No past events</div>
              )}
            </TabsContent>
          </Tabs>

          {filteredAndSortedEvents?.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">No events found</div>
          )}
        </div>
      )}
    </div>
  );
}