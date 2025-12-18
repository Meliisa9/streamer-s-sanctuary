import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAchievements, ACHIEVEMENTS, LEVEL_THRESHOLDS } from "@/hooks/useAchievements";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, Trophy, Lock, CheckCircle2, Flame, Star, TrendingUp } from "lucide-react";

export default function Achievements() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { getAchievementProgress, stats, getLevelInfo, refreshAchievements } = useAchievements();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      refreshAchievements();
    }
  }, [user]);

  if (!user || !profile) {
    return null;
  }

  const level = getLevelInfo(profile?.points || 0);
  const unlockedCount = ACHIEVEMENTS.filter(a => getAchievementProgress(a.key).unlocked).length;
  const totalXPFromAchievements = ACHIEVEMENTS
    .filter(a => getAchievementProgress(a.key).unlocked)
    .reduce((acc, a) => acc + a.xpReward, 0);

  // Group achievements by category
  const achievementsByCategory = ACHIEVEMENTS.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, typeof ACHIEVEMENTS>);

  const categoryInfo = {
    participation: { name: "Participation", icon: <TrendingUp className="w-5 h-5" />, color: "text-blue-400" },
    social: { name: "Social", icon: <Star className="w-5 h-5" />, color: "text-pink-400" },
    loyalty: { name: "Loyalty", icon: <Flame className="w-5 h-5" />, color: "text-orange-400" },
    special: { name: "Special", icon: <Trophy className="w-5 h-5" />, color: "text-yellow-400" },
  };

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4">
            <Award className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Achievements</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Complete challenges and earn XP rewards to level up your profile
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="glass rounded-xl p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{unlockedCount}</p>
            <p className="text-xs text-muted-foreground">Unlocked</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Lock className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{ACHIEVEMENTS.length - unlockedCount}</p>
            <p className="text-xs text-muted-foreground">Locked</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Star className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{totalXPFromAchievements}</p>
            <p className="text-xs text-muted-foreground">XP Earned</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{stats.consecutiveSignIns}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
        </motion.div>

        {/* Level Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <span className="text-xl font-bold">{level.level}</span>
              </div>
              <div>
                <h3 className="font-semibold">Level {level.level}: {level.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {profile?.points || 0} XP total
                </p>
              </div>
            </div>
            <Badge variant="outline" className={level.color}>
              {level.name}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress to Level {level.level + 1}</span>
              <span>{level.xpToNextLevel > 0 ? `${level.xpToNextLevel} XP needed` : "Max Level"}</span>
            </div>
            <Progress value={level.progressPercent} className="h-2" />
          </div>
          {/* Level milestones */}
          <div className="flex justify-between mt-4 pt-4 border-t border-border">
            {LEVEL_THRESHOLDS.map((l, i) => (
              <div
                key={l.level}
                className={`text-center ${(profile?.points || 0) >= l.minXP ? "opacity-100" : "opacity-40"}`}
              >
                <p className={`text-xs font-medium ${l.color}`}>{l.name}</p>
                <p className="text-xs text-muted-foreground">{l.minXP}+</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Achievements by Category */}
        {Object.entries(achievementsByCategory).map(([category, categoryAchievements], categoryIndex) => {
          const info = categoryInfo[category as keyof typeof categoryInfo];
          const unlockedInCategory = categoryAchievements.filter(a => getAchievementProgress(a.key).unlocked).length;
          
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + categoryIndex * 0.05 }}
              className="glass rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={info.color}>{info.icon}</div>
                  <h2 className="text-lg font-semibold">{info.name}</h2>
                </div>
                <Badge variant="secondary">
                  {unlockedInCategory}/{categoryAchievements.length}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryAchievements.map((achievement) => {
                  const { unlocked, progress, requirement } = getAchievementProgress(achievement.key);
                  const progressPercent = Math.min((progress / requirement) * 100, 100);

                  return (
                    <motion.div
                      key={achievement.key}
                      whileHover={{ scale: 1.02 }}
                      className={`relative p-4 rounded-xl border transition-all ${
                        unlocked
                          ? "bg-gradient-to-br from-primary/10 to-accent/5 border-primary/30"
                          : "bg-secondary/30 border-border/50"
                      }`}
                    >
                      {/* Unlocked badge */}
                      {unlocked && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <div
                          className={`text-3xl flex-shrink-0 ${!unlocked ? "grayscale opacity-50" : ""}`}
                        >
                          {achievement.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                            {achievement.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {achievement.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant={unlocked ? "default" : "outline"}
                              className="text-xs"
                            >
                              +{achievement.xpReward} XP
                            </Badge>
                          </div>

                          {/* Progress bar for locked achievements */}
                          {!unlocked && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Progress</span>
                                <span>{progress}/{requirement}</span>
                              </div>
                              <Progress value={progressPercent} className="h-1.5" />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
