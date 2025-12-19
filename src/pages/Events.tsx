import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarIcon, Clock, Users, Bell, BellOff, ChevronLeft, ChevronRight, User, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;
type Streamer = Tables<"streamers">;

const eventTypes: Record<string, string> = {
  Stream: "bg-primary/20 text-primary",
  "Special Event": "bg-accent/20 text-accent",
  Community: "bg-green-500/20 text-green-500",
  Giveaway: "bg-purple-500/20 text-purple-500",
};

export default function Events() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isSupported, isSubscribed, subscribeToPush, showNotification } = usePushNotifications();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
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
    queryKey: ["streamers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("streamers")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data as Streamer[];
    },
  });

  const { data: userSubscriptions = [] } = useQuery({
    queryKey: ["event-subscriptions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("event_subscriptions")
        .select("event_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((s) => s.event_id);
    },
    enabled: !!user,
  });

  const subscribeToEvent = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("event_subscriptions")
        .insert({ event_id: eventId, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ["event-subscriptions"] });
      const event = events?.find((e) => e.id === eventId);
      toast({ title: "Subscribed!", description: `You'll be notified when "${event?.title}" starts.` });
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast({ title: "Already subscribed", variant: "destructive" });
      } else {
        toast({ title: "Error subscribing", description: error.message, variant: "destructive" });
      }
    },
  });

  const unsubscribeFromEvent = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("event_subscriptions")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-subscriptions"] });
      toast({ title: "Unsubscribed from event notifications" });
    },
    onError: (error: any) => {
      toast({ title: "Error unsubscribing", description: error.message, variant: "destructive" });
    },
  });

  const handleToggleSubscription = async (eventId: string) => {
    if (!user) {
      toast({ title: "Please login to subscribe to events", variant: "destructive" });
      return;
    }
    
    if (!isSubscribed && isSupported) {
      await subscribeToPush();
    }
    
    if (userSubscriptions.includes(eventId)) {
      unsubscribeFromEvent.mutate(eventId);
    } else {
      subscribeToEvent.mutate(eventId);
    }
  };

  const getStreamerById = (streamerId: string | null) => {
    if (!streamerId || !streamers) return null;
    return streamers.find((s) => s.id === streamerId);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  const getEventsForDay = (day: number | null) => {
    if (!day || !events) return [];
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.event_date === dateStr);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  
  // Filter current events: must be today AND not past end_time
  const currentEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((e) => {
      if (e.event_date !== todayStr) return false;
      
      // If event has an end_time, check if it's still ongoing
      if (e.end_time) {
        const [hours, minutes] = e.end_time.split(':').map(Number);
        const endDateTime = new Date();
        endDateTime.setHours(hours, minutes, 0, 0);
        
        // If current time is past end time, exclude this event
        if (now > endDateTime) return false;
      }
      
      return true;
    });
  }, [events, todayStr, now]);

  const upcomingEvents = events
    ?.filter((e) => new Date(e.event_date) > new Date(todayStr))
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Event <span className="gradient-text">Calendar</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Don't miss our streams, bonus hunts, and special events
          </p>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-20">Loading events...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div className="glass rounded-2xl p-6">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-bold">{monthName}</h2>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day, index) => {
                    const dayEvents = getEventsForDay(day);
                    const isToday = day === new Date().getDate() && 
                      currentMonth.getMonth() === new Date().getMonth() &&
                      currentMonth.getFullYear() === new Date().getFullYear();

                    return (
                      <div
                        key={index}
                        className={`min-h-[80px] p-2 rounded-lg border transition-colors ${
                          day
                            ? isToday
                              ? "border-primary bg-primary/10"
                              : dayEvents.length > 0
                              ? "border-accent/50 bg-accent/5"
                              : "border-border hover:border-primary/30"
                            : "border-transparent"
                        }`}
                      >
                        {day && (
                          <>
                            <span className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>
                              {day}
                            </span>
                            <div className="mt-1 space-y-1">
                              {dayEvents.slice(0, 2).map((event) => (
                                <div
                                  key={event.id}
                                  className={`text-xs px-1.5 py-0.5 rounded truncate ${
                                    eventTypes[event.event_type || "Stream"] || eventTypes.Stream
                                  }`}
                                >
                                  {event.title}
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{dayEvents.length - 2} more
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Events Lists */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Current Events - Today with Scrollable Container */}
              {currentEvents && currentEvents.length > 0 && (
                <div className="glass rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    Current Events (Today)
                  </h2>
                  <ScrollArea className={currentEvents.length > 3 ? "h-[400px] pr-4" : ""}>
                    <div className="space-y-4">
                      {currentEvents.map((event) => {
                        const streamer = getStreamerById(event.streamer_id);
                        const isEventSubscribed = userSubscriptions.includes(event.id);
                        
                        return (
                          <div
                            key={event.id}
                            className="p-4 rounded-xl border border-green-500/30 bg-green-500/5"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                eventTypes[event.event_type || "Stream"] || eventTypes.Stream
                              }`}>
                                {event.event_type}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-green-400 font-medium">LIVE TODAY</span>
                                <button
                                  onClick={() => handleToggleSubscription(event.id)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isEventSubscribed 
                                      ? "bg-primary/20 text-primary" 
                                      : "bg-secondary/50 text-muted-foreground hover:text-primary"
                                  }`}
                                >
                                  <Bell className={`w-4 h-4 ${isEventSubscribed ? "fill-current" : ""}`} />
                                </button>
                              </div>
                            </div>
                            <h3 className="font-semibold mb-2">{event.title}</h3>
                            {streamer && (
                              <div className="flex items-center gap-2 mb-3 p-2 bg-secondary/50 rounded-lg">
                                {streamer.image_url ? (
                                  <img src={streamer.image_url} alt={streamer.name} className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary" />
                                  </div>
                                )}
                                <span className="text-sm font-medium">{streamer.name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {event.event_time || "TBA"}
                                {event.end_time && ` - ${event.end_time}`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Upcoming Events */}
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  Upcoming Events
                </h2>
                {upcomingEvents && upcomingEvents.length > 0 ? (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                    {upcomingEvents.map((event) => {
                      const streamer = getStreamerById(event.streamer_id);
                      const isEventSubscribed = userSubscriptions.includes(event.id);
                      
                      return (
                        <div
                          key={event.id}
                          className={`p-4 rounded-xl border ${
                            event.is_featured
                              ? "border-accent/50 bg-accent/5"
                              : "border-border hover:border-primary/30"
                          } transition-colors`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              eventTypes[event.event_type || "Stream"] || eventTypes.Stream
                            }`}>
                              {event.event_type}
                            </span>
                            <div className="flex items-center gap-2">
                              {event.is_featured && (
                                <span className="text-xs text-accent font-medium">Featured</span>
                              )}
                              <button
                                onClick={() => handleToggleSubscription(event.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isEventSubscribed 
                                    ? "bg-primary/20 text-primary" 
                                    : "bg-secondary/50 text-muted-foreground hover:text-primary"
                                }`}
                                title={isEventSubscribed ? "Unsubscribe from notifications" : "Get notified when this event starts"}
                              >
                                {isEventSubscribed ? (
                                  <Bell className="w-4 h-4 fill-current" />
                                ) : (
                                  <Bell className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <h3 className="font-semibold mb-2">{event.title}</h3>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          
                          {streamer && (
                            <div className="flex items-center gap-2 mb-3 p-2 bg-secondary/50 rounded-lg">
                              {streamer.image_url ? (
                                <img 
                                  src={streamer.image_url} 
                                  alt={streamer.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                              )}
                              <span className="text-sm font-medium">{streamer.name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {new Date(event.event_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {event.event_time || "TBA"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No upcoming events scheduled
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
