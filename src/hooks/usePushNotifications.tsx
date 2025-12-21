import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationIcon, setNotificationIcon] = useState<string>("/favicon.ico");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);
    
    if (supported && user) {
      checkSubscription();
    } else {
      setIsLoading(false);
    }
    
    // Fetch custom notification icon
    fetchNotificationIcon();
  }, [user]);

  const fetchNotificationIcon = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "notification_icon_url")
        .single();
      
      if (data?.value && typeof data.value === "string") {
        setNotificationIcon(data.value);
      }
    } catch (error) {
      // Use default favicon if no custom icon is set
      console.log("Using default notification icon");
    }
  };

  const checkSubscription = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Check database for existing subscription
      const { data } = await supabase
        .from("notification_preferences")
        .select("push_enabled, push_subscription")
        .eq("user_id", user.id)
        .single();

      setIsSubscribed(data?.push_enabled || false);
    } catch (error) {
      console.error("Error checking push subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting permission:", error);
      return false;
    }
  }, [isSupported, toast]);

  const subscribeToPush = useCallback(async () => {
    if (!user || !isSupported) return false;

    setIsLoading(true);

    try {
      // Request permission first
      const permissionGranted = await requestPermission();
      if (!permissionGranted) {
        toast({
          title: "Permission Denied",
          description: "Please allow notifications in your browser settings.",
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Create a simple subscription object (no VAPID key required for local notifications)
      const subscriptionData = {
        endpoint: "local",
        userAgent: navigator.userAgent,
        subscribedAt: new Date().toISOString(),
      };

      // Save subscription to database
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          push_enabled: true,
          push_subscription: subscriptionData,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: "Push Notifications Enabled",
        description: "You'll now receive browser notifications.",
      });
      return true;
    } catch (error: any) {
      console.error("Error subscribing to push:", error);
      toast({
        title: "Subscription Failed",
        description: error.message || "Failed to enable push notifications.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported, requestPermission, toast]);

  const unsubscribeFromPush = useCallback(async () => {
    if (!user) return false;

    setIsLoading(true);

    try {
      // Update database
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          push_enabled: false,
          push_subscription: null,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;

      setIsSubscribed(false);
      toast({
        title: "Push Notifications Disabled",
        description: "You won't receive browser notifications anymore.",
      });
      return true;
    } catch (error: any) {
      console.error("Error unsubscribing from push:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to disable push notifications.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!isSupported || !isSubscribed) return;

    if (Notification.permission === "granted") {
      // Try using service worker first
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: notificationIcon,
          badge: notificationIcon,
          ...options,
        });
      } catch {
        // Fallback to regular notification
        new Notification(title, {
          icon: notificationIcon,
          ...options,
        });
      }
    }
  }, [isSupported, isSubscribed, notificationIcon]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribeToPush,
    unsubscribeFromPush,
    showNotification,
    requestPermission,
  };
}
