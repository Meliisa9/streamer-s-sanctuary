import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Trophy, Gift, Calendar, Megaphone, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface NotificationPrefs {
  push_enabled: boolean;
  achievement_notifications: boolean;
  giveaway_notifications: boolean;
  event_notifications: boolean;
  system_notifications: boolean;
}

const defaultPrefs: NotificationPrefs = {
  push_enabled: false,
  achievement_notifications: true,
  giveaway_notifications: true,
  event_notifications: true,
  system_notifications: true,
};

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { isSupported, isSubscribed, subscribeToPush, unsubscribeFromPush, isLoading: pushLoading } = usePushNotifications();

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setPrefs({
          push_enabled: data.push_enabled,
          achievement_notifications: data.achievement_notifications,
          giveaway_notifications: data.giveaway_notifications,
          event_notifications: data.event_notifications,
          system_notifications: data.system_notifications,
        });
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!user) return;

    const oldValue = prefs[key];
    setPrefs((prev) => ({ ...prev, [key]: value }));

    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          [key]: value,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;
    } catch (error: any) {
      setPrefs((prev) => ({ ...prev, [key]: oldValue }));
      toast({
        title: "Error",
        description: "Failed to update preference.",
        variant: "destructive",
      });
    }
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribeFromPush();
      setPrefs((prev) => ({ ...prev, push_enabled: false }));
    } else {
      const success = await subscribeToPush();
      if (success) {
        setPrefs((prev) => ({ ...prev, push_enabled: true }));
      }
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const preferenceItems = [
    {
      key: "achievement_notifications" as const,
      label: "Achievement Notifications",
      description: "Get notified when you unlock achievements",
      icon: Trophy,
      color: "text-yellow-400",
    },
    {
      key: "giveaway_notifications" as const,
      label: "Giveaway Notifications",
      description: "Get notified about new giveaways and winners",
      icon: Gift,
      color: "text-purple-400",
    },
    {
      key: "event_notifications" as const,
      label: "Event Notifications",
      description: "Get notified about upcoming events and streams",
      icon: Calendar,
      color: "text-blue-400",
    },
    {
      key: "system_notifications" as const,
      label: "System Notifications",
      description: "Receive important announcements and updates",
      icon: Megaphone,
      color: "text-primary",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Notification Preferences</h3>
          <p className="text-sm text-muted-foreground">Control how you receive notifications</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Push Notifications Toggle */}
        <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSubscribed ? "bg-green-500/20" : "bg-secondary"}`}>
                {isSubscribed ? (
                  <Bell className="w-5 h-5 text-green-400" />
                ) : (
                  <BellOff className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  {!isSupported 
                    ? "Not supported in this browser" 
                    : isSubscribed 
                      ? "Enabled - You'll receive browser notifications"
                      : "Disabled - Enable to receive browser notifications"}
                </p>
              </div>
            </div>
            <Button
              variant={isSubscribed ? "outline" : "default"}
              size="sm"
              onClick={handlePushToggle}
              disabled={!isSupported || pushLoading}
              className="gap-2"
            >
              {pushLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSubscribed ? (
                <>
                  <BellOff className="w-4 h-4" />
                  Disable
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Enable
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Notification Type Toggles */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Notification Types</p>
          {preferenceItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <Switch
                checked={prefs[item.key]}
                onCheckedChange={(checked) => updatePreference(item.key, checked)}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
