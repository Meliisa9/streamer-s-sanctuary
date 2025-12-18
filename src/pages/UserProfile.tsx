import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserFollow } from "@/hooks/useUserFollow";
import { ProfileComments } from "@/components/ProfileComments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Trophy, Calendar, Users, MessageSquare, 
  Award, ArrowLeft, UserPlus, UserMinus, Loader2
} from "lucide-react";
import { LEVEL_THRESHOLDS } from "@/hooks/useAchievements";

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    isFollowing, 
    checkingFollow, 
    followersCount, 
    followingCount, 
    toggleFollow, 
    isToggling 
  } = useUserFollow(userId);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: badges } = useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", userId)
        .order("awarded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: achievementsCount } = useQuery({
    queryKey: ["user-achievements-count", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from("user_achievements")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });

  const { data: activityStats } = useQuery({
    queryKey: ["user-activity-stats", userId],
    queryFn: async () => {
      if (!userId) return { giveawayEntries: 0, comments: 0, pollVotes: 0 };
      
      const [entries, comments, votes] = await Promise.all([
        supabase.from("giveaway_entries").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("news_comments").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("poll_votes").select("*", { count: "exact", head: true }).eq("user_id", userId),
      ]);

      return {
        giveawayEntries: entries.count || 0,
        comments: comments.count || 0,
        pollVotes: votes.count || 0,
      };
    },
    enabled: !!userId,
  });

  const getLevelInfo = (points: number) => {
    let level = 1;
    let minXP = 0;
    let maxXP = 100;

    const thresholds = Object.values(LEVEL_THRESHOLDS).map(t => typeof t === 'number' ? t : t.minXP);

    for (let i = 0; i < thresholds.length; i++) {
      if (points >= thresholds[i]) {
        level = i + 1;
        minXP = thresholds[i];
        maxXP = thresholds[i + 1] || Infinity;
      } else {
        break;
      }
    }

    const progressPercent = maxXP === Infinity ? 100 : ((points - minXP) / (maxXP - minXP)) * 100;
    
    const levelNames: Record<number, string> = {
      1: "Newcomer", 2: "Regular", 3: "Active", 4: "Veteran", 
      5: "Expert", 6: "Master", 7: "Legend", 8: "Champion"
    };

    return {
      level,
      name: levelNames[level] || "Champion",
      progressPercent: Math.min(progressPercent, 100),
      color: level >= 7 ? "text-yellow-500" : level >= 5 ? "text-purple-500" : level >= 3 ? "text-blue-500" : "text-muted-foreground"
    };
  };

  const isOwnProfile = user?.id === userId;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen py-8 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
          <p className="text-muted-foreground mb-4">This profile doesn't exist or has been removed.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(profile.points || 0);
  const equippedBadge = badges?.find(b => b.is_equipped && !b.is_title);
  const equippedTitle = badges?.find(b => b.is_equipped && b.is_title);

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-4 gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl overflow-hidden mb-6"
        >
          <div className="h-28 bg-gradient-to-r from-primary/30 via-primary/20 to-accent/30 relative">
            <div className="absolute -bottom-10 left-6">
              <div className="w-24 h-24 rounded-2xl bg-background border-4 border-background overflow-hidden shadow-xl">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <User className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-14 px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h1 className="text-2xl font-bold">
                    {profile.display_name || profile.username || "Anonymous"}
                  </h1>
                  {equippedTitle && (
                    <Badge style={{ backgroundColor: equippedTitle.badge_color || undefined }}>
                      {equippedTitle.badge_name}
                    </Badge>
                  )}
                  {equippedBadge && (
                    <Badge variant="outline" style={{ borderColor: equippedBadge.badge_color || undefined }}>
                      {equippedBadge.badge_icon} {equippedBadge.badge_name}
                    </Badge>
                  )}
                  <Badge variant="outline" className={levelInfo.color}>
                    Lv.{levelInfo.level} {levelInfo.name}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  @{profile.username || "username"}
                </p>
                {profile.bio && (
                  <p className="mt-2 text-sm max-w-lg">{profile.bio}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {!isOwnProfile && user && (
                  <Button
                    variant={isFollowing ? "outline" : "glow"}
                    onClick={() => toggleFollow(userId!)}
                    disabled={isToggling || checkingFollow}
                    className="gap-2"
                  >
                    {isToggling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
                {isOwnProfile && (
                  <Link to="/profile">
                    <Button variant="outline">Edit Profile</Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-xl font-bold text-primary">{profile.points || 0}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{followersCount || 0}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{followingCount || 0}</p>
                <p className="text-xs text-muted-foreground">Following</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{achievementsCount}</p>
                <p className="text-xs text-muted-foreground">Achievements</p>
              </div>
            </div>

            {/* Level Progress */}
            <div className="mt-4 p-3 bg-secondary/30 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium">
                  Level {levelInfo.level}: {levelInfo.name}
                </span>
                <span className="text-xs text-muted-foreground">{levelInfo.progressPercent.toFixed(0)}%</span>
              </div>
              <Progress value={levelInfo.progressPercent} className="h-1.5" />
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="mb-6 bg-secondary/30 p-1 rounded-xl">
            <TabsTrigger value="activity" className="gap-2">
              <Trophy className="w-4 h-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Award className="w-4 h-4" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Wall
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-xl p-4 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{activityStats?.giveawayEntries || 0}</p>
                <p className="text-sm text-muted-foreground">Giveaway Entries</p>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-accent" />
                <p className="text-2xl font-bold">{activityStats?.comments || 0}</p>
                <p className="text-sm text-muted-foreground">Comments</p>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{activityStats?.pollVotes || 0}</p>
                <p className="text-sm text-muted-foreground">Poll Votes</p>
              </div>
            </div>

            {/* Member Since */}
            <div className="glass rounded-xl p-4 mt-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="w-5 h-5" />
                <span>
                  Member since {new Date(profile.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="badges">
            {badges && badges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map((badge) => (
                  <div 
                    key={badge.id} 
                    className="glass rounded-xl p-4 text-center"
                    style={{ borderColor: badge.badge_color || undefined }}
                  >
                    <div 
                      className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${badge.badge_color}20` }}
                    >
                      {badge.badge_icon || "🏆"}
                    </div>
                    <p className="font-medium text-sm">{badge.badge_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(badge.awarded_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass rounded-xl p-8 text-center text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No badges earned yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments">
            <ProfileComments profileUserId={userId!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
