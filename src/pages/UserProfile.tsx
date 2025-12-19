import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserFollow } from "@/hooks/useUserFollow";
import { ProfileComments } from "@/components/ProfileComments";
import { SocialBadges } from "@/components/SocialBadges";
import { FollowersModal } from "@/components/FollowersModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, Trophy, Calendar, Users, MessageSquare, 
  Award, ArrowLeft, UserPlus, UserMinus, Loader2,
  TrendingUp, Target, Gift, Star, Shield, Zap,
  ExternalLink, Heart, Share2, Flag
} from "lucide-react";
import { LEVEL_THRESHOLDS } from "@/hooks/useAchievements";
import { ReportDialog } from "@/components/ReportDialog";

export default function UserProfile() {
  const { usernameOrId } = useParams<{ usernameOrId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("activity");
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<"followers" | "following">("followers");
  const [reportOpen, setReportOpen] = useState(false);

  // Resolve username to user_id
  const { data: resolvedUserId, isLoading: resolvingUser } = useQuery({
    queryKey: ["resolve-user", usernameOrId],
    queryFn: async () => {
      if (!usernameOrId) return null;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usernameOrId);
      if (isUUID) return usernameOrId;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", usernameOrId)
        .maybeSingle();
      
      if (error || !data) return null;
      return data.user_id;
    },
    enabled: !!usernameOrId,
  });

  const { 
    isFollowing, 
    checkingFollow, 
    followersCount, 
    followingCount,
    followers,
    following, 
    toggleFollow, 
    isToggling 
  } = useUserFollow(resolvedUserId || undefined);

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["public-profile", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", resolvedUserId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!resolvedUserId,
  });

  const { data: badges } = useQuery({
    queryKey: ["user-badges", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", resolvedUserId)
        .order("awarded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!resolvedUserId,
  });

  const { data: achievementsCount } = useQuery({
    queryKey: ["user-achievements-count", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return 0;
      const { count, error } = await supabase
        .from("user_achievements")
        .select("*", { count: "exact", head: true })
        .eq("user_id", resolvedUserId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!resolvedUserId,
  });

  const { data: activityStats } = useQuery({
    queryKey: ["user-activity-stats", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return { giveawayEntries: 0, comments: 0, pollVotes: 0, bonusHuntGuesses: 0 };
      
      const [entries, comments, votes, guesses] = await Promise.all([
        supabase.from("giveaway_entries").select("*", { count: "exact", head: true }).eq("user_id", resolvedUserId),
        supabase.from("news_comments").select("*", { count: "exact", head: true }).eq("user_id", resolvedUserId),
        supabase.from("poll_votes").select("*", { count: "exact", head: true }).eq("user_id", resolvedUserId),
        supabase.from("bonus_hunt_guesses").select("*", { count: "exact", head: true }).eq("user_id", resolvedUserId),
      ]);

      return {
        giveawayEntries: entries.count || 0,
        comments: comments.count || 0,
        pollVotes: votes.count || 0,
        bonusHuntGuesses: guesses.count || 0,
      };
    },
    enabled: !!resolvedUserId,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["user-recent-activity", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return [];
      const { data, error } = await supabase
        .from("user_activities")
        .select("*")
        .eq("user_id", resolvedUserId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!resolvedUserId,
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

    const levelColors: Record<number, string> = {
      1: "from-gray-400 to-gray-500",
      2: "from-green-400 to-green-500",
      3: "from-blue-400 to-blue-500",
      4: "from-purple-400 to-purple-500",
      5: "from-pink-400 to-pink-500",
      6: "from-orange-400 to-orange-500",
      7: "from-yellow-400 to-amber-500",
      8: "from-red-400 to-red-600",
    };

    return {
      level,
      name: levelNames[level] || "Champion",
      progressPercent: Math.min(progressPercent, 100),
      color: level >= 7 ? "text-yellow-500" : level >= 5 ? "text-purple-500" : level >= 3 ? "text-blue-500" : "text-muted-foreground",
      gradient: levelColors[level] || levelColors[1],
      xpToNext: maxXP === Infinity ? 0 : maxXP - points,
    };
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile?.display_name || profile?.username}'s Profile`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const isOwnProfile = user?.id === resolvedUserId;
  const isLoading = resolvingUser || loadingProfile;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen py-8 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="glass rounded-3xl p-12">
            <User className="w-20 h-20 mx-auto mb-6 text-muted-foreground/30" />
            <h1 className="text-3xl font-bold mb-3">User Not Found</h1>
            <p className="text-muted-foreground mb-6">This profile doesn't exist or has been removed.</p>
            <Button variant="glow" onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(profile.points || 0);
  const equippedBadge = badges?.find(b => b.is_equipped && !b.is_title);
  const equippedTitle = badges?.find(b => b.is_equipped && b.is_title);

  return (
    <div className="min-h-screen py-6 px-4 md:px-6">
      <div className="container mx-auto max-w-5xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-4 gap-2 hover:bg-secondary/50"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative glass rounded-3xl overflow-hidden mb-6"
        >
          {/* Banner Gradient */}
          <div className={`h-36 md:h-44 bg-gradient-to-br ${levelInfo.gradient} relative`}>
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
            
            {/* Level Badge */}
            <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50">
              <span className="text-sm font-bold">Level {levelInfo.level}</span>
            </div>
          </div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="absolute -top-16 left-6">
              <div className="relative">
                <Avatar className="w-32 h-32 ring-4 ring-background shadow-2xl">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || "User"} className="object-cover" />
                  <AvatarFallback className={`bg-gradient-to-br ${levelInfo.gradient} text-4xl font-bold text-white`}>
                    {(profile.display_name || profile.username || "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Online Indicator */}
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-3 border-background" />
              </div>
            </div>

            {/* Actions - Top Right */}
            <div className="flex items-center gap-2 justify-end pt-3 mb-4">
              <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full">
                <Share2 className="w-4 h-4" />
              </Button>
              {!isOwnProfile && user && (
                <>
                  <Button variant="ghost" size="icon" onClick={() => setReportOpen(true)} className="rounded-full text-muted-foreground hover:text-destructive">
                    <Flag className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={isFollowing ? "outline" : "glow"}
                    onClick={() => toggleFollow(resolvedUserId!)}
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
                </>
              )}
              {isOwnProfile && (
                <Link to="/profile">
                  <Button variant="outline" className="gap-2">
                    <User className="w-4 h-4" />
                    Edit Profile
                  </Button>
                </Link>
              )}
            </div>

            {/* User Info */}
            <div className="mt-8 md:mt-4 md:ml-36">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {profile.display_name || profile.username || "Anonymous"}
                </h1>
                
                {/* Social Connection Badges */}
                <SocialBadges 
                  twitchUsername={profile.twitch_username}
                  discordTag={profile.discord_tag}
                  kickUsername={profile.kick_username}
                />
                
                {equippedTitle && (
                  <Badge className="ml-1" style={{ backgroundColor: equippedTitle.badge_color || undefined }}>
                    {equippedTitle.badge_name}
                  </Badge>
                )}
                {equippedBadge && (
                  <Badge variant="outline" style={{ borderColor: equippedBadge.badge_color || undefined }}>
                    {equippedBadge.badge_icon} {equippedBadge.badge_name}
                  </Badge>
                )}
              </div>
              
              <p className="text-muted-foreground mb-3">
                @{profile.username || "username"}
              </p>
              
              {profile.bio && (
                <p className="text-sm md:text-base max-w-2xl mb-4">{profile.bio}</p>
              )}

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 md:gap-8 mt-4">
                <div className="text-center px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-xl md:text-2xl font-bold text-primary">{profile.points?.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">Points</p>
                </div>
                <button 
                  onClick={() => { setFollowersModalTab("followers"); setFollowersModalOpen(true); }}
                  className="text-center px-4 py-2 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <p className="text-xl md:text-2xl font-bold">{followersCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </button>
                <button 
                  onClick={() => { setFollowersModalTab("following"); setFollowersModalOpen(true); }}
                  className="text-center px-4 py-2 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <p className="text-xl md:text-2xl font-bold">{followingCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </button>
                <div className="text-center px-4 py-2 rounded-xl">
                  <p className="text-xl md:text-2xl font-bold">{achievementsCount}</p>
                  <p className="text-xs text-muted-foreground">Achievements</p>
                </div>
              </div>

              {/* Level Progress */}
              <div className="mt-5 p-4 bg-secondary/30 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${levelInfo.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                      {levelInfo.level}
                    </div>
                    <span className="font-medium">{levelInfo.name}</span>
                  </div>
                  {levelInfo.xpToNext > 0 && (
                    <span className="text-sm text-muted-foreground">{levelInfo.xpToNext} XP to next level</span>
                  )}
                </div>
                <Progress value={levelInfo.progressPercent} className="h-2" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start mb-6 bg-secondary/30 p-1.5 rounded-xl flex-wrap">
            <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingUp className="w-4 h-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Target className="w-4 h-4" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Award className="w-4 h-4" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="wall" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="w-4 h-4" />
              Wall
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="activity" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Activity Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass rounded-xl p-4 text-center hover:border-primary/30 transition-colors">
                    <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                    <p className="text-2xl font-bold">{activityStats?.giveawayEntries || 0}</p>
                    <p className="text-sm text-muted-foreground">Giveaway Entries</p>
                  </div>
                  <div className="glass rounded-xl p-4 text-center hover:border-primary/30 transition-colors">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{activityStats?.comments || 0}</p>
                    <p className="text-sm text-muted-foreground">Comments</p>
                  </div>
                  <div className="glass rounded-xl p-4 text-center hover:border-primary/30 transition-colors">
                    <Users className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{activityStats?.pollVotes || 0}</p>
                    <p className="text-sm text-muted-foreground">Poll Votes</p>
                  </div>
                  <div className="glass rounded-xl p-4 text-center hover:border-primary/30 transition-colors">
                    <Target className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                    <p className="text-2xl font-bold">{activityStats?.bonusHuntGuesses || 0}</p>
                    <p className="text-sm text-muted-foreground">GTW Guesses</p>
                  </div>
                </div>

                {/* Member Since */}
                <div className="glass rounded-xl p-4">
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

                {/* Recent Activity */}
                {recentActivity && recentActivity.length > 0 && (
                  <div className="glass rounded-xl p-5">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      {recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Star className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm">{activity.action.replace(/_/g, ' ')}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="stats" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="glass rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-500" />
                    Bonus Hunt Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Guesses</span>
                      <span className="font-bold">{activityStats?.bonusHuntGuesses || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Points Earned</span>
                      <span className="font-bold text-primary">{profile.points?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary" />
                    Giveaway Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Entries</span>
                      <span className="font-bold">{activityStats?.giveawayEntries || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Win Rate</span>
                      <span className="font-bold">Coming Soon</span>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-6 md:col-span-2">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-yellow-500" />
                    Account Status
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-2 rounded-full bg-green-500/20 text-green-500 text-sm font-medium">
                      Active Member
                    </div>
                    <div className="px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium">
                      Level {levelInfo.level} {levelInfo.name}
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="badges" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {badges && badges.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {badges.map((badge) => (
                      <div 
                        key={badge.id} 
                        className="glass rounded-xl p-5 text-center hover:border-primary/30 transition-all hover:scale-[1.02]"
                        style={{ borderColor: badge.is_equipped ? badge.badge_color || undefined : undefined }}
                      >
                        <div 
                          className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl"
                          style={{ backgroundColor: `${badge.badge_color}20` }}
                        >
                          {badge.badge_icon || "🏆"}
                        </div>
                        <p className="font-medium">{badge.badge_name}</p>
                        {badge.is_equipped && (
                          <Badge variant="outline" className="mt-2 text-xs">Equipped</Badge>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(badge.awarded_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass rounded-xl p-12 text-center">
                    <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="text-lg font-semibold mb-2">No Badges Yet</h3>
                    <p className="text-muted-foreground">This user hasn't earned any badges yet.</p>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="wall" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ProfileComments profileUserId={resolvedUserId!} />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>

        {/* Followers Modal */}
        <FollowersModal
          isOpen={followersModalOpen}
          onClose={() => setFollowersModalOpen(false)}
          userId={resolvedUserId!}
          initialTab={followersModalTab}
        />

        {/* Report Dialog */}
        {resolvedUserId && (
          <ReportDialog
            open={reportOpen}
            onOpenChange={setReportOpen}
            contentType="profile"
            contentId={resolvedUserId}
          />
        )}
      </div>
    </div>
  );
}