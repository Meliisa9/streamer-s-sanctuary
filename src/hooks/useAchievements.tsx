import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  category: "participation" | "social" | "loyalty" | "special";
  color: string;
  xpReward: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Participation - Giveaways
  { key: "first_entry", name: "First Steps", description: "Enter your first giveaway", icon: "🎯", requirement: 1, category: "participation", color: "pink", xpReward: 10 },
  { key: "giveaway_enthusiast", name: "Giveaway Enthusiast", description: "Enter 10 giveaways", icon: "🎁", requirement: 10, category: "participation", color: "pink", xpReward: 50 },
  { key: "giveaway_master", name: "Giveaway Master", description: "Enter 50 giveaways", icon: "🏆", requirement: 50, category: "participation", color: "yellow", xpReward: 200 },
  
  // Participation - GTW
  { key: "predictor", name: "Predictor", description: "Make 5 GTW guesses", icon: "🔮", requirement: 5, category: "participation", color: "purple", xpReward: 25 },
  { key: "fortune_teller", name: "Fortune Teller", description: "Make 25 GTW guesses", icon: "🎱", requirement: 25, category: "participation", color: "purple", xpReward: 100 },
  { key: "gtw_veteran", name: "GTW Veteran", description: "Make 100 GTW guesses", icon: "🔮", requirement: 100, category: "participation", color: "purple", xpReward: 300 },
  
  // Participation - Polls
  { key: "first_vote", name: "Voice of Reason", description: "Vote on your first poll", icon: "🗳️", requirement: 1, category: "participation", color: "blue", xpReward: 10 },
  { key: "poll_participant", name: "Poll Participant", description: "Vote on 10 polls", icon: "📊", requirement: 10, category: "participation", color: "blue", xpReward: 50 },
  { key: "poll_enthusiast", name: "Poll Enthusiast", description: "Vote on 50 polls", icon: "📈", requirement: 50, category: "participation", color: "blue", xpReward: 200 },
  
  // Social
  { key: "first_comment", name: "Voice Heard", description: "Post your first comment", icon: "💬", requirement: 1, category: "social", color: "blue", xpReward: 10 },
  { key: "commentator", name: "Commentator", description: "Post 10 comments", icon: "📝", requirement: 10, category: "social", color: "blue", xpReward: 50 },
  { key: "social_butterfly", name: "Social Butterfly", description: "Post 50 comments", icon: "🦋", requirement: 50, category: "social", color: "cyan", xpReward: 200 },
  { key: "first_like", name: "Appreciator", description: "Like your first article", icon: "❤️", requirement: 1, category: "social", color: "red", xpReward: 5 },
  { key: "supporter", name: "Supporter", description: "Like 20 articles", icon: "💖", requirement: 20, category: "social", color: "red", xpReward: 75 },
  
  // Loyalty
  { key: "point_collector", name: "Point Collector", description: "Earn 100 points", icon: "⭐", requirement: 100, category: "loyalty", color: "yellow", xpReward: 25 },
  { key: "point_hoarder", name: "Point Hoarder", description: "Earn 500 points", icon: "🌟", requirement: 500, category: "loyalty", color: "yellow", xpReward: 100 },
  { key: "point_master", name: "Point Master", description: "Earn 1000 points", icon: "✨", requirement: 1000, category: "loyalty", color: "yellow", xpReward: 250 },
  { key: "veteran", name: "Veteran", description: "Be a member for 30 days", icon: "🎖️", requirement: 30, category: "loyalty", color: "green", xpReward: 50 },
  { key: "legend", name: "Legend", description: "Be a member for 365 days", icon: "👑", requirement: 365, category: "loyalty", color: "gold", xpReward: 500 },
  
  // Special
  { key: "profile_complete", name: "Identity", description: "Complete your profile", icon: "🪪", requirement: 1, category: "special", color: "teal", xpReward: 25 },
  { key: "connected", name: "Connected", description: "Link a social account", icon: "🔗", requirement: 1, category: "special", color: "indigo", xpReward: 15 },
  { key: "early_bird", name: "Early Bird", description: "Be among first 100 users", icon: "🐦", requirement: 1, category: "special", color: "orange", xpReward: 100 },
];

// XP thresholds for each level
export const LEVEL_THRESHOLDS = [
  { level: 1, name: "Newbie", minXP: 0, maxXP: 99, color: "text-muted-foreground" },
  { level: 2, name: "Member", minXP: 100, maxXP: 299, color: "text-green-500" },
  { level: 3, name: "Active", minXP: 300, maxXP: 599, color: "text-blue-500" },
  { level: 4, name: "Pro", minXP: 600, maxXP: 999, color: "text-purple-500" },
  { level: 5, name: "Expert", minXP: 1000, maxXP: 1999, color: "text-yellow-500" },
  { level: 6, name: "Master", minXP: 2000, maxXP: 3999, color: "text-orange-500" },
  { level: 7, name: "Legend", minXP: 4000, maxXP: Infinity, color: "text-pink-500" },
];

interface UserAchievement {
  achievement_key: string;
  unlocked_at: string;
  progress: number;
}

export function useAchievements() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState({
    giveawayEntries: 0,
    gtwGuesses: 0,
    comments: 0,
    articleLikes: 0,
    memberDays: 0,
    pollVotes: 0,
  });

  const fetchUserAchievements = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_achievements")
      .select("achievement_key, unlocked_at, progress")
      .eq("user_id", user.id);

    if (data) {
      setUserAchievements(data);
    }
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    const [entriesResult, guessesResult, commentsResult, likesResult, pollVotesResult] = await Promise.all([
      supabase.from("giveaway_entries").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("gtw_guesses").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("news_comments").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("article_likes").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("poll_votes").select("id", { count: "exact" }).eq("user_id", user.id),
    ]);

    const memberDays = user.created_at
      ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    setStats({
      giveawayEntries: entriesResult.count || 0,
      gtwGuesses: guessesResult.count || 0,
      comments: commentsResult.count || 0,
      articleLikes: likesResult.count || 0,
      memberDays,
      pollVotes: pollVotesResult.count || 0,
    });
  }, [user]);

  const awardXP = useCallback(async (xpAmount: number, reason: string) => {
    if (!user || !profile) return;
    
    const newPoints = (profile.points || 0) + xpAmount;
    const { error } = await supabase
      .from("profiles")
      .update({ points: newPoints })
      .eq("user_id", user.id);
    
    if (!error) {
      refreshProfile();
    }
  }, [user, profile, refreshProfile]);

  const checkAndUnlockAchievements = useCallback(async () => {
    if (!user || !profile) return;

    const achievementsToCheck = [
      // Giveaway achievements
      { key: "first_entry", value: stats.giveawayEntries },
      { key: "giveaway_enthusiast", value: stats.giveawayEntries },
      { key: "giveaway_master", value: stats.giveawayEntries },
      // GTW achievements
      { key: "predictor", value: stats.gtwGuesses },
      { key: "fortune_teller", value: stats.gtwGuesses },
      { key: "gtw_veteran", value: stats.gtwGuesses },
      // Poll achievements
      { key: "first_vote", value: stats.pollVotes },
      { key: "poll_participant", value: stats.pollVotes },
      { key: "poll_enthusiast", value: stats.pollVotes },
      // Social achievements
      { key: "first_comment", value: stats.comments },
      { key: "commentator", value: stats.comments },
      { key: "social_butterfly", value: stats.comments },
      { key: "first_like", value: stats.articleLikes },
      { key: "supporter", value: stats.articleLikes },
      // Loyalty achievements
      { key: "point_collector", value: profile.points || 0 },
      { key: "point_hoarder", value: profile.points || 0 },
      { key: "point_master", value: profile.points || 0 },
      { key: "veteran", value: stats.memberDays },
      { key: "legend", value: stats.memberDays },
      // Special achievements
      { key: "profile_complete", value: profile.username && profile.display_name && profile.bio ? 1 : 0 },
      { key: "connected", value: profile.twitch_username || profile.discord_tag || profile.kick_username ? 1 : 0 },
    ];

    for (const check of achievementsToCheck) {
      const achievement = ACHIEVEMENTS.find(a => a.key === check.key);
      if (!achievement) continue;

      const alreadyUnlocked = userAchievements.some(ua => ua.achievement_key === check.key);
      
      if (!alreadyUnlocked && check.value >= achievement.requirement) {
        const { error } = await supabase
          .from("user_achievements")
          .upsert({
            user_id: user.id,
            achievement_key: check.key,
            progress: check.value,
          }, { onConflict: "user_id,achievement_key" });

        if (!error) {
          // Award XP for the achievement
          await awardXP(achievement.xpReward, `Achievement: ${achievement.name}`);

          // Send notification to user
          await supabase.from("user_notifications").insert({
            user_id: user.id,
            type: "achievement",
            title: `🏆 Achievement Unlocked!`,
            message: `${achievement.icon} ${achievement.name}: ${achievement.description} (+${achievement.xpReward} XP)`,
            link: "/profile",
          });

          toast({
            title: `🏆 Achievement Unlocked!`,
            description: `${achievement.icon} ${achievement.name} (+${achievement.xpReward} XP)`,
          });
          fetchUserAchievements();
        }
      }
    }
  }, [user, profile, stats, userAchievements, toast, fetchUserAchievements, awardXP]);

  useEffect(() => {
    fetchUserAchievements();
    fetchStats();
  }, [fetchUserAchievements, fetchStats]);

  useEffect(() => {
    if (stats.giveawayEntries > 0 || stats.comments > 0 || stats.pollVotes > 0 || stats.gtwGuesses > 0) {
      checkAndUnlockAchievements();
    }
  }, [stats, checkAndUnlockAchievements]);

  const getAchievementProgress = (achievementKey: string): { unlocked: boolean; progress: number; requirement: number } => {
    const achievement = ACHIEVEMENTS.find(a => a.key === achievementKey);
    const userAchievement = userAchievements.find(ua => ua.achievement_key === achievementKey);

    if (!achievement) return { unlocked: false, progress: 0, requirement: 0 };

    const progressValue = (() => {
      switch (achievementKey) {
        case "first_entry":
        case "giveaway_enthusiast":
        case "giveaway_master":
          return stats.giveawayEntries;
        case "predictor":
        case "fortune_teller":
        case "gtw_veteran":
          return stats.gtwGuesses;
        case "first_vote":
        case "poll_participant":
        case "poll_enthusiast":
          return stats.pollVotes;
        case "first_comment":
        case "commentator":
        case "social_butterfly":
          return stats.comments;
        case "first_like":
        case "supporter":
          return stats.articleLikes;
        case "point_collector":
        case "point_hoarder":
        case "point_master":
          return profile?.points || 0;
        case "veteran":
        case "legend":
          return stats.memberDays;
        default:
          return userAchievement?.progress || 0;
      }
    })();

    return {
      unlocked: !!userAchievement,
      progress: Math.min(progressValue, achievement.requirement),
      requirement: achievement.requirement,
    };
  };

  const getLevelInfo = (xp: number) => {
    const level = LEVEL_THRESHOLDS.find(l => xp >= l.minXP && xp <= l.maxXP) || LEVEL_THRESHOLDS[0];
    const nextLevel = LEVEL_THRESHOLDS.find(l => l.level === level.level + 1);
    
    const progressInLevel = xp - level.minXP;
    const levelRange = (nextLevel?.minXP || level.maxXP) - level.minXP;
    const progressPercent = nextLevel ? Math.min((progressInLevel / levelRange) * 100, 100) : 100;
    
    return {
      ...level,
      progressPercent,
      xpToNextLevel: nextLevel ? nextLevel.minXP - xp : 0,
      currentXP: xp,
    };
  };

  return {
    achievements: ACHIEVEMENTS,
    userAchievements,
    stats,
    getAchievementProgress,
    getLevelInfo,
    refreshAchievements: () => {
      fetchUserAchievements();
      fetchStats();
    },
  };
}
