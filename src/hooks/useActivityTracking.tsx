import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ActivityDetails {
  [key: string]: any;
}

// Comprehensive list of tracked activities
export const TRACKED_ACTIVITIES = {
  // Auth
  LOGIN: 'login',
  SIGNUP: 'signup',
  LOGOUT: 'logout',
  PASSWORD_RESET: 'password_reset',
  
  // Profile
  PROFILE_UPDATED: 'profile_updated',
  AVATAR_UPLOADED: 'avatar_uploaded',
  COVER_UPLOADED: 'cover_uploaded',
  
  // Content
  VIDEO_VIEWED: 'video_viewed',
  VIDEO_LIKED: 'video_liked',
  ARTICLE_VIEWED: 'article_viewed',
  ARTICLE_LIKED: 'article_liked',
  ARTICLE_CREATED: 'article_created',
  ARTICLE_PUBLISHED: 'article_published',
  
  // Comments
  COMMENT_POSTED: 'comment_posted',
  COMMENT_LIKED: 'comment_liked',
  COMMENT_DELETED: 'comment_deleted',
  
  // Giveaways
  GIVEAWAY_ENTRY: 'giveaway_entry',
  GIVEAWAY_WON: 'giveaway_won',
  
  // Events
  EVENT_SUBSCRIBED: 'event_subscribed',
  EVENT_UNSUBSCRIBED: 'event_unsubscribed',
  
  // Polls
  POLL_VOTED: 'poll_voted',
  POLL_CREATED: 'poll_created',
  
  // Bonus Hunt
  BONUS_HUNT_GUESS: 'bonus_hunt_guess',
  AVGX_GUESS: 'avgx_guess',
  
  // Social
  USER_FOLLOWED: 'user_followed',
  USER_UNFOLLOWED: 'user_unfollowed',
  
  // Bookmarks
  BOOKMARK_ADDED: 'bookmark_added',
  BOOKMARK_REMOVED: 'bookmark_removed',
  
  // Reports
  CONTENT_REPORTED: 'content_reported',
  
  // Achievements
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  DAILY_SIGNIN: 'daily_signin',
  
  // Admin actions (for audit)
  ADMIN_ACTION: 'admin_action',
} as const;

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
      const importantActions = [
        'signup', 
        'article_created', 
        'article_published', 
        'giveaway_entry', 
        'profile_updated',
        'content_reported',
        'giveaway_won',
        'admin_action'
      ];
      
      if (importantActions.includes(action)) {
        const notificationTitles: Record<string, string> = {
          signup: 'New User Signup',
          article_created: 'Article Created',
          article_published: 'Article Published',
          giveaway_entry: 'Giveaway Entry',
          profile_updated: 'Profile Updated',
          content_reported: 'Content Reported',
          giveaway_won: 'Giveaway Winner',
          admin_action: 'Admin Action',
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

  return { trackActivity, TRACKED_ACTIVITIES };
}
