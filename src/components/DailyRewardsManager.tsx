import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDailySignIn } from "@/hooks/useDailySignIn";
import { useAchievements } from "@/hooks/useAchievements";

// This component runs in the background to handle achievement checking sparingly
export function DailyRewardsManager() {
  const { user, profile } = useAuth();
  const { consecutiveDays } = useDailySignIn();
  const { refreshAchievements } = useAchievements();
  const lastCheckedDays = useRef<number | null>(null);

  // Only refresh achievements when consecutive days actually increases (not on every render)
  useEffect(() => {
    if (user && profile && consecutiveDays > 0 && lastCheckedDays.current !== consecutiveDays) {
      lastCheckedDays.current = consecutiveDays;
      // Delay to prevent blocking
      const timer = setTimeout(() => {
        refreshAchievements();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [consecutiveDays, user?.id, profile?.id]);

  return null;
}
