import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const DAILY_XP_REWARD = 10;
const STREAK_BONUS_XP = 5; // Extra XP per consecutive day (capped)
const MAX_STREAK_BONUS = 50; // Max bonus XP from streak

interface DailySignInData {
  id: string;
  user_id: string;
  last_sign_in_date: string;
  consecutive_days: number;
  total_sign_ins: number;
}

export function useDailySignIn() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [signInData, setSignInData] = useState<DailySignInData | null>(null);
  const [hasClaimedToday, setHasClaimedToday] = useState(false);

  const fetchSignInData = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("daily_sign_ins")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setSignInData(data as DailySignInData);
      
      // Check if already claimed today
      const today = new Date().toISOString().split("T")[0];
      setHasClaimedToday(data.last_sign_in_date === today);
    }
  }, [user]);

  const claimDailyReward = useCallback(async () => {
    if (!user || !profile || hasClaimedToday) return { success: false, xpAwarded: 0 };

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    let newConsecutiveDays = 1;
    let totalSignIns = 1;

    if (signInData) {
      // Check if this continues a streak
      if (signInData.last_sign_in_date === yesterday) {
        newConsecutiveDays = signInData.consecutive_days + 1;
      } else if (signInData.last_sign_in_date === today) {
        // Already claimed today
        return { success: false, xpAwarded: 0 };
      }
      // If neither yesterday nor today, streak resets to 1
      totalSignIns = signInData.total_sign_ins + 1;
    }

    // Calculate XP with streak bonus
    const streakBonus = Math.min(newConsecutiveDays * STREAK_BONUS_XP, MAX_STREAK_BONUS);
    const totalXP = DAILY_XP_REWARD + streakBonus;

    try {
      // Upsert sign-in data
      const { error: signInError } = await supabase
        .from("daily_sign_ins")
        .upsert({
          user_id: user.id,
          last_sign_in_date: today,
          consecutive_days: newConsecutiveDays,
          total_sign_ins: totalSignIns,
        }, { onConflict: "user_id" });

      if (signInError) throw signInError;

      // Award XP
      const newPoints = (profile.points || 0) + totalXP;
      const { error: pointsError } = await supabase
        .from("profiles")
        .update({ points: newPoints })
        .eq("user_id", user.id);

      if (pointsError) throw pointsError;

      // Track activity
      await supabase.from("user_activities").insert({
        user_id: user.id,
        action: "daily_sign_in",
        details: {
          consecutive_days: newConsecutiveDays,
          total_sign_ins: totalSignIns,
          xp_awarded: totalXP,
        },
      });

      // Send notification
      await supabase.from("user_notifications").insert({
        user_id: user.id,
        type: "reward",
        title: "🎁 Daily Sign-In Reward!",
        message: `You earned ${totalXP} XP! ${newConsecutiveDays > 1 ? `🔥 ${newConsecutiveDays} day streak!` : ""}`,
        link: "/profile",
      });

      await refreshProfile();
      setHasClaimedToday(true);
      setSignInData({
        id: signInData?.id || "",
        user_id: user.id,
        last_sign_in_date: today,
        consecutive_days: newConsecutiveDays,
        total_sign_ins: totalSignIns,
      });

      toast({
        title: "🎁 Daily Reward Claimed!",
        description: `+${totalXP} XP${newConsecutiveDays > 1 ? ` (${newConsecutiveDays} day streak!)` : ""}`,
      });

      return { success: true, xpAwarded: totalXP, consecutiveDays: newConsecutiveDays };
    } catch (error: any) {
      console.error("Error claiming daily reward:", error);
      toast({
        title: "Error claiming reward",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, xpAwarded: 0 };
    }
  }, [user, profile, signInData, hasClaimedToday, refreshProfile, toast]);

  // Auto-claim on first load if logged in
  useEffect(() => {
    fetchSignInData();
  }, [fetchSignInData]);

  // Attempt to auto-claim when user logs in
  useEffect(() => {
    if (user && profile && signInData !== null && !hasClaimedToday) {
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        claimDailyReward();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, profile, signInData, hasClaimedToday, claimDailyReward]);

  return {
    signInData,
    hasClaimedToday,
    claimDailyReward,
    consecutiveDays: signInData?.consecutive_days || 0,
    totalSignIns: signInData?.total_sign_ins || 0,
  };
}
