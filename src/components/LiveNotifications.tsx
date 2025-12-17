import { useState, useEffect } from "react";
import { Bell, X, ExternalLink, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Notification {
  id: string;
  type: "stream" | "giveaway" | "event" | "news";
  title: string;
  message: string;
  link?: string;
  timestamp: Date;
  read: boolean;
}

export function LiveNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch upcoming events for notifications
  const { data: upcomingEvents } = useQuery({
    queryKey: ["upcoming-events-notifications"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(3);
      return data || [];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch active giveaways
  const { data: activeGiveaways } = useQuery({
    queryKey: ["active-giveaways-notifications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("giveaways")
        .select("*")
        .eq("status", "active")
        .order("end_date", { ascending: true })
        .limit(3);
      return data || [];
    },
    refetchInterval: 60000,
  });

  // Fetch stream status
  const { data: streamSettings } = useQuery({
    queryKey: ["stream-status-notifications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["stream_enabled", "stream_channel", "stream_platform"]);
      const settings: Record<string, any> = {};
      data?.forEach((row) => {
        settings[row.key] = row.value;
      });
      return settings;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Build notifications from data
  useEffect(() => {
    const newNotifications: Notification[] = [];

    // Stream notification
    if (streamSettings?.stream_enabled && streamSettings?.stream_channel) {
      newNotifications.push({
        id: "stream-live",
        type: "stream",
        title: "Stream is Live! 🔴",
        message: `Watch the live stream on ${streamSettings.stream_platform === "twitch" ? "Twitch" : "Kick"}`,
        link: "/stream",
        timestamp: new Date(),
        read: false,
      });
    }

    // Event notifications
    upcomingEvents?.forEach((event) => {
      const eventDate = new Date(event.event_date);
      const today = new Date();
      const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        newNotifications.push({
          id: `event-${event.id}`,
          type: "event",
          title: diffDays === 0 ? "Event Today!" : "Event Tomorrow!",
          message: `${event.title}${event.event_time ? ` at ${event.event_time}` : ""}`,
          link: "/events",
          timestamp: eventDate,
          read: false,
        });
      }
    });

    // Giveaway notifications
    activeGiveaways?.forEach((giveaway) => {
      const endDate = new Date(giveaway.end_date);
      const today = new Date();
      const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 3) {
        newNotifications.push({
          id: `giveaway-${giveaway.id}`,
          type: "giveaway",
          title: diffDays <= 1 ? "Giveaway Ending Soon! 🎁" : "Active Giveaway",
          message: `${giveaway.title} - ${giveaway.prize}`,
          link: "/giveaways",
          timestamp: endDate,
          read: false,
        });
      }
    });

    setNotifications(newNotifications);
  }, [upcomingEvents, activeGiveaways, streamSettings]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "stream":
        return "bg-red-500/20 text-red-400";
      case "giveaway":
        return "bg-purple-500/20 text-purple-400";
      case "event":
        return "bg-blue-500/20 text-blue-400";
      case "news":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-primary/20 text-primary";
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 glass rounded-xl border border-border shadow-xl z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-3 border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors ${
                        !notification.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(notification.type)}`}>
                          {notification.type}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                        </div>
                        {notification.link && (
                          <a
                            href={notification.link}
                            onClick={() => {
                              markAsRead(notification.id);
                              setIsOpen(false);
                            }}
                            className="p-1 hover:bg-secondary rounded"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setIsOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}