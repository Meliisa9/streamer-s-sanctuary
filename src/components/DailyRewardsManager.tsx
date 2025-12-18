import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDailySignIn } from "@/hooks/useDailySignIn";
import { useAchievements } from "@/hooks/useAchievements";

// This component runs in the background to handle daily rewards and achievement checking
export function DailyRewardsManager() {
  const { user, profile } = useAuth();
  const { claimDailyReward, consecutiveDays, hasClaimedToday } = useDailySignIn();
  const { refreshAchievements } = useAchievements();

  // Refresh achievements when consecutive days change (new sign-in streak milestone)
  useEffect(() => {
    if (user && profile && consecutiveDays > 0) {
      refreshAchievements();
    }
  }, [consecutiveDays, user, profile, refreshAchievements]);

  // This component doesn't render anything visible
  return null;
}
