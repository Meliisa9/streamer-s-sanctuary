import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ActivityDetails {
  [key: string]: any;
}

export function useActivityTracking() {
  const { user } = useAuth();

  const trackActivity = async (action: string, details?: ActivityDetails) => {
    if (!user) return;

    try {
      await supabase.from("user_activities").insert({
        user_id: user.id,
        action,
        details: details || {},
      });

      // Create admin notification for important activities
      const importantActions = ['login', 'signup', 'article_created', 'article_published', 'giveaway_entry', 'profile_updated'];
      
      if (importantActions.includes(action)) {
        const notificationTitles: Record<string, string> = {
          login: 'User Login',
          signup: 'New User Signup',
          article_created: 'Article Created',
          article_published: 'Article Published',
          giveaway_entry: 'Giveaway Entry',
          profile_updated: 'Profile Updated',
        };

        await supabase.from("admin_notifications").insert({
          type: action,
          title: notificationTitles[action] || action,
          message: `User ${user.email || user.id} performed: ${action}`,
        });
      }
    } catch (error) {
      console.error("Error tracking activity:", error);
    }
  };

  return { trackActivity };
}
