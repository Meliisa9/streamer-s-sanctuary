import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Flame, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useDailySignIn } from "@/hooks/useDailySignIn";

const DAILY_XP_REWARD = 10;
const STREAK_BONUS_XP = 5;
const MAX_STREAK_BONUS = 50;

export function DailyRewardPopup() {
  const { user, profile } = useAuth();
  const { hasClaimedToday, claimDailyReward, consecutiveDays, signInData } = useDailySignIn();
  const [isOpen, setIsOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  // Check if should show popup
  useEffect(() => {
    if (user && profile && signInData !== null && !hasClaimedToday && !claimed) {
      // Small delay to let the app load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, profile, signInData, hasClaimedToday, claimed]);

  const handleClaim = async () => {
    setIsClaiming(true);
    const result = await claimDailyReward();
    setIsClaiming(false);
    
    if (result.success) {
      setClaimed(true);
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    }
  };

  // Calculate potential XP reward
  const potentialStreak = consecutiveDays + 1;
  const streakBonus = Math.min(potentialStreak * STREAK_BONUS_XP, MAX_STREAK_BONUS);
  const totalXP = DAILY_XP_REWARD + streakBonus;

  if (!user || !profile) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={() => {}} // Don't close on backdrop click - must claim
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="glass rounded-3xl border border-border/50 overflow-hidden shadow-2xl">
              {/* Header with gradient */}
              <div className="relative bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10 p-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
                >
                  {claimed ? (
                    <Sparkles className="w-10 h-10 text-primary-foreground animate-pulse" />
                  ) : (
                    <Gift className="w-10 h-10 text-primary-foreground" />
                  )}
                </motion.div>
                <h2 className="text-2xl font-bold mb-1">
                  {claimed ? "Reward Claimed!" : "Daily Reward"}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {claimed ? "See you tomorrow!" : "Claim your daily sign-in bonus"}
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                {!claimed ? (
                  <>
                    {/* Streak info */}
                    <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-secondary/30 rounded-xl">
                      <Flame className="w-8 h-8 text-orange-500" />
                      <div className="text-center">
                        <p className="text-3xl font-bold">
                          {consecutiveDays > 0 ? consecutiveDays : 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Day Streak</p>
                      </div>
                      <div className="w-px h-10 bg-border" />
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary">+{totalXP}</p>
                        <p className="text-xs text-muted-foreground">XP Reward</p>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2 mb-6 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Reward</span>
                        <span>+{DAILY_XP_REWARD} XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Streak Bonus</span>
                        <span className="text-orange-500">+{streakBonus} XP</span>
                      </div>
                      {consecutiveDays > 0 && (
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          🔥 Keep your streak going for bigger bonuses!
                        </p>
                      )}
                    </div>

                    {/* Claim button */}
                    <Button
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className="w-full h-12 text-lg font-semibold gap-2"
                      size="lg"
                    >
                      {isClaiming ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Gift className="w-5 h-5" />
                          </motion.div>
                          Claiming...
                        </>
                      ) : (
                        <>
                          <Gift className="w-5 h-5" />
                          Claim Reward
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-4"
                  >
                    <p className="text-lg font-medium text-green-500 mb-2">
                      +{totalXP} XP Added!
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {potentialStreak > 1 
                        ? `🔥 ${potentialStreak} day streak! Come back tomorrow for more.`
                        : "Come back tomorrow to start a streak!"}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
