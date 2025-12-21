import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlinePresence } from "@/contexts/OnlinePresenceContext";
import { useUserFollow } from "@/hooks/useUserFollow";
import { ProfileComments } from "@/components/ProfileComments";
import { SocialBadges } from "@/components/SocialBadges";
import { FollowersModal } from "@/components/FollowersModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  User, Trophy, Calendar, Users, MessageSquare, 
  Award, ArrowLeft, UserPlus, UserMinus, Loader2,
  TrendingUp, Target, Gift, Star, Shield, Zap,
  ExternalLink, Heart, Share2, Flag, BarChart3, Gamepad2, 
  Flame, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6,
  MapPin, Clock, CheckCircle2, Sparkles, Copy
} from "lucide-react";
import { ACHIEVEMENTS, LEVEL_THRESHOLDS } from "@/hooks/useAchievements";
import { ReportDialog } from "@/components/ReportDialog";

export default function UserProfile() {
  const { usernameOrId } = useParams<{ usernameOrId: string }>();
  const { user } = useAuth();
  const { onlineUserIds } = useOnlinePresence();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("about");
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<"followers" | "following">("followers");
  const [reportOpen, setReportOpen] = useState(false);

  // Handle hash-based navigation for comments
  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      if (hash.includes('comment') || hash === '#wall') {
        setActiveTab("wall");
        setTimeout(() => {
          const element = document.getElementById(hash.slice(1));
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
            }, 3000);
          }
        }, 500);
      }
    }
  }, [location.hash]);

  // Resolve username to user_id
  const { data: resolvedUserId, isLoading: resolvingUser } = useQuery({
    queryKey: ["resolve-user", usernameOrId],
    queryFn: async () => {
      if (!usernameOrId) return null;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usernameOrId);
      
      if (isUUID) {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("user_id, username")
          .eq("user_id", usernameOrId)
          .maybeSingle();
        
        if (error || !profileData) return null;
        
        if (profileData.username && profileData.username !== usernameOrId) {
          navigate(`/user/${profileData.username}`, { replace: true });
        }
        return profileData.user_id;
      }
      
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

  const { data: unlockedAchievements } = useQuery({
    queryKey: ["user-achievements", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return [] as Array<{ achievement_key: string; unlocked_at: string }>;
      const { data, error } = await supabase
        .from("user_achievements")
        .select("achievement_key, unlocked_at")
        .eq("user_id", resolvedUserId)
        .order("unlocked_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Array<{ achievement_key: string; unlocked_at: string }>;
    },
    enabled: !!resolvedUserId,
  });

  // Activity stats
  const { data: activityStats } = useQuery({
    queryKey: ["user-activity-stats", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return { 
        gtwGuesses: 0, gtwWins: 0, bonusHuntGuesses: 0, bonusHuntWins: 0,
        giveawayEntries: 0, giveawayWins: 0, pollVotes: 0, pollsCreated: 0
      };
      
      const [gtwGuesses, bonusHuntGuesses, giveawayEntries, pollVotes, pollsCreated] = await Promise.all([
        supabase.from("gtw_guesses").select("*", { count: "exact", head: true }).eq("user_id", resolvedUserId),
        supabase.from("bonus_hunt_guesses").select("*", { count: "exact", head: true }).eq("user_id", resolvedUserId),
        supabase.from("giveaway_entries").select("*", { count: "exact", head: true }).eq("user_id", resolvedUserId),
        supabase.from("poll_votes").select("*", { count: "exact", head: true }).eq("user_id", resolvedUserId),
        supabase.from("polls").select("*", { count: "exact", head: true }).eq("created_by", resolvedUserId).eq("is_community", true),
      ]);

      const [gtwWins, bonusHuntWins, giveawayWins] = await Promise.all([
        supabase.from("gtw_sessions").select("*", { count: "exact", head: true }).eq("winner_id", resolvedUserId),
        supabase.from("bonus_hunts").select("*", { count: "exact", head: true }).eq("winner_user_id", resolvedUserId),
        supabase.from("giveaways").select("winner_ids").contains("winner_ids", [resolvedUserId]),
      ]);

      return {
        gtwGuesses: gtwGuesses.count || 0,
        gtwWins: gtwWins.count || 0,
        bonusHuntGuesses: bonusHuntGuesses.count || 0,
        bonusHuntWins: bonusHuntWins.count || 0,
        giveawayEntries: giveawayEntries.count || 0,
        giveawayWins: giveawayWins.data?.length || 0,
        pollVotes: pollVotes.count || 0,
        pollsCreated: pollsCreated.count || 0,
      };
    },
    enabled: !!resolvedUserId,
  });

  // Recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ["user-recent-activity-filtered", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return [];
      
      const [gtwGuesses, bonusGuesses, giveawayEntries, pollVotes] = await Promise.all([
        supabase.from("gtw_guesses").select("id, created_at, guess_amount, points_earned").eq("user_id", resolvedUserId).order("created_at", { ascending: false }).limit(5),
        supabase.from("bonus_hunt_guesses").select("id, created_at, guess_amount, points_earned").eq("user_id", resolvedUserId).order("created_at", { ascending: false }).limit(5),
        supabase.from("giveaway_entries").select("id, created_at, giveaway_id, giveaways(title)").eq("user_id", resolvedUserId).order("created_at", { ascending: false }).limit(5),
        supabase.from("poll_votes").select("id, created_at, poll_id, polls(title)").eq("user_id", resolvedUserId).order("created_at", { ascending: false }).limit(5),
      ]);

      const activities: Array<{ id: string; type: string; description: string; link?: string; created_at: string; points?: number; }> = [];

      gtwGuesses.data?.forEach(g => {
        activities.push({ id: g.id, type: "gtw_guess", description: `Guessed ${g.guess_amount?.toLocaleString()} in GTW`, link: "/bonus-hunt?tab=gtw", created_at: g.created_at, points: g.points_earned || undefined });
      });

      bonusGuesses.data?.forEach(g => {
        activities.push({ id: g.id, type: "bonus_hunt_guess", description: `Made a Bonus Hunt guess of ${g.guess_amount?.toLocaleString()}`, link: "/bonus-hunt", created_at: g.created_at, points: g.points_earned || undefined });
      });

      giveawayEntries.data?.forEach(e => {
        activities.push({ id: e.id, type: "giveaway_entry", description: `Entered giveaway: ${(e.giveaways as any)?.title || "Unknown"}`, link: "/giveaways", created_at: e.created_at });
      });

      pollVotes.data?.forEach(v => {
        activities.push({ id: v.id, type: "poll_vote", description: `Voted on poll: ${(v.polls as any)?.title || "Unknown"}`, link: "/polls", created_at: v.created_at });
      });

      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return activities.slice(0, 10);
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
      } else break;
    }

    const progressPercent = maxXP === Infinity ? 100 : ((points - minXP) / (maxXP - minXP)) * 100;
    const levelNames: Record<number, string> = { 1: "Newcomer", 2: "Regular", 3: "Active", 4: "Veteran", 5: "Expert", 6: "Master", 7: "Legend", 8: "Champion" };
    const levelColors: Record<number, string> = { 1: "from-gray-400 to-gray-500", 2: "from-green-400 to-green-500", 3: "from-blue-400 to-blue-500", 4: "from-purple-400 to-purple-500", 5: "from-pink-400 to-pink-500", 6: "from-orange-400 to-orange-500", 7: "from-yellow-400 to-amber-500", 8: "from-red-400 to-red-600" };

    return {
      level, name: levelNames[level] || "Champion",
      progressPercent: Math.min(progressPercent, 100),
      color: level >= 7 ? "text-yellow-500" : level >= 5 ? "text-purple-500" : level >= 3 ? "text-blue-500" : "text-muted-foreground",
      gradient: levelColors[level] || levelColors[1],
      xpToNext: maxXP === Infinity ? 0 : maxXP - points,
    };
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `${profile?.display_name || profile?.username}'s Profile`, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard" });
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "gtw_guess": return <Target className="w-4 h-4 text-green-500" />;
      case "bonus_hunt_guess": return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case "giveaway_entry": return <Gift className="w-4 h-4 text-primary" />;
      case "poll_vote": return <BarChart3 className="w-4 h-4 text-purple-500" />;
      default: return <Zap className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const isOwnProfile = user?.id === resolvedUserId;
  const isLoading = resolvingUser || loadingProfile;
  const isOnline = resolvedUserId && onlineUserIds.has(resolvedUserId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <User className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground">Loading profile...</p>
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen py-8 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-12"
          >
            <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-6">
              <User className="w-12 h-12 text-muted-foreground/30" />
            </div>
            <h1 className="text-3xl font-bold mb-3">User Not Found</h1>
            <p className="text-muted-foreground mb-6">This profile doesn't exist or has been removed.</p>
            <Button variant="glow" onClick={() => navigate(-1)}>Go Back</Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(profile.points || 0);
  const equippedBadge = badges?.find(b => b.is_equipped && !b.is_title);
  const equippedTitle = badges?.find(b => b.is_equipped && b.is_title);
  const privacy = (profile as any)?.privacy_settings || {};

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Banner with Gradient Overlay */}
      <div className="relative">
        <div 
          className={`h-48 md:h-64 relative ${!(profile as any)?.cover_url ? `bg-gradient-to-br ${levelInfo.gradient}` : ''}`}
          style={(profile as any)?.cover_url ? {
            backgroundImage: `url(${(profile as any).cover_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 left-4 z-10"
          >
            <Button 
              variant="secondary" 
              size="sm"
              className="gap-2 backdrop-blur-sm bg-background/50"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 right-4 z-10 flex gap-2"
          >
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={handleShare} 
              className="backdrop-blur-sm bg-background/50"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            {!isOwnProfile && user && (
              <Button 
                variant="secondary" 
                size="icon" 
                onClick={() => setReportOpen(true)} 
                className="backdrop-blur-sm bg-background/50 text-muted-foreground hover:text-destructive"
              >
                <Flag className="w-4 h-4" />
              </Button>
            )}
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 -mt-20 relative z-10">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl overflow-hidden mb-6"
        >
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center md:items-start">
                <div className="relative">
                  <Avatar className="w-28 h-28 md:w-32 md:h-32 ring-4 ring-background shadow-2xl">
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || "User"} className="object-cover" />
                    <AvatarFallback className={`bg-gradient-to-br ${levelInfo.gradient} text-4xl font-bold text-white`}>
                      {(profile.display_name || profile.username || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-background"
                    />
                  )}
                </div>
                
                {/* Level Badge */}
                <div className={`mt-3 px-4 py-1.5 rounded-full bg-gradient-to-r ${levelInfo.gradient} text-white text-sm font-bold`}>
                  Level {levelInfo.level} • {levelInfo.name}
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{profile.display_name || profile.username || "Anonymous"}</h1>
                  <SocialBadges 
                    twitchUsername={profile.twitch_username}
                    discordTag={profile.discord_tag}
                    kickUsername={profile.kick_username}
                    size="sm"
                  />
                  {isOnline && (
                    <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-500 border-green-500/30">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Online
                    </Badge>
                  )}
                </div>
                
                <p className="text-muted-foreground mb-1">@{profile.username || "username"}</p>
                
                {/* Badges */}
                {(equippedTitle || equippedBadge) && (
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
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
                  </div>
                )}

                {profile.bio && (
                  <p className="text-sm md:text-base max-w-2xl mb-4">{profile.bio}</p>
                )}

                {/* Quick Info */}
                <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm text-muted-foreground mb-4">
                  {(profile as any)?.country && privacy.show_country !== false && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {(profile as any).country}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>

                {/* Action Button */}
                {!isOwnProfile && user && (
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
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <button 
                onClick={() => { setFollowersModalTab("followers"); setFollowersModalOpen(true); }}
                className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-muted-foreground">Followers</span>
                </div>
                <p className="text-2xl font-bold">{followersCount || 0}</p>
              </button>
              <button 
                onClick={() => { setFollowersModalTab("following"); setFollowersModalOpen(true); }}
                className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-muted-foreground">Following</span>
                </div>
                <p className="text-2xl font-bold">{followingCount || 0}</p>
              </button>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Points</span>
                </div>
                <p className="text-2xl font-bold text-primary">{profile.points?.toLocaleString() || 0}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">Achievements</span>
                </div>
                <p className="text-2xl font-bold">{achievementsCount || 0}</p>
              </div>
            </div>

            {/* XP Progress */}
            <div className="mt-4 p-4 rounded-xl bg-secondary/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  XP Progress
                </span>
                {levelInfo.xpToNext > 0 && (
                  <span className="text-xs text-muted-foreground">{levelInfo.xpToNext} XP to Level {levelInfo.level + 1}</span>
                )}
              </div>
              <Progress value={levelInfo.progressPercent} className="h-2" />
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start mb-6 bg-secondary/30 p-1.5 rounded-xl flex-wrap gap-1">
            <TabsTrigger value="about" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
              <User className="w-4 h-4" />
              About
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
              <BarChart3 className="w-4 h-4" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
              <Award className="w-4 h-4" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="wall" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
              <MessageSquare className="w-4 h-4" />
              Wall
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {/* About Tab */}
            <TabsContent value="about" className="mt-0 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Profile Info */}
                  <Card className="glass border-0">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        About
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {profile.bio && (
                          <div className="col-span-full p-4 bg-secondary/30 rounded-xl">
                            <p className="text-sm text-muted-foreground mb-1">Bio</p>
                            <p>{profile.bio}</p>
                          </div>
                        )}
                        {(profile as any)?.age && privacy.show_age !== false && (
                          <div className="p-4 bg-secondary/30 rounded-xl">
                            <p className="text-sm text-muted-foreground mb-1">Age</p>
                            <p className="font-medium">{(profile as any).age} years old</p>
                          </div>
                        )}
                        {(profile as any)?.country && privacy.show_country !== false && (
                          <div className="p-4 bg-secondary/30 rounded-xl">
                            <p className="text-sm text-muted-foreground mb-1">Country</p>
                            <p className="font-medium">{(profile as any).country}</p>
                          </div>
                        )}
                        {(profile as any)?.city && privacy.show_city !== false && (
                          <div className="p-4 bg-secondary/30 rounded-xl">
                            <p className="text-sm text-muted-foreground mb-1">City</p>
                            <p className="font-medium">{(profile as any).city}</p>
                          </div>
                        )}
                      </div>
                      {!profile.bio && !(profile as any)?.age && !(profile as any)?.country && (
                        <div className="text-center py-8 text-muted-foreground">
                          <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p>No profile information available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Casino Corner */}
                  {(() => {
                    const hasCasinoStats = ((profile as any)?.favorite_slot && privacy.show_favorites !== false) || 
                                           ((profile as any)?.favorite_casino && privacy.show_favorites !== false) || 
                                           (profile as any)?.biggest_win;
                    if (!hasCasinoStats) return null;
                    const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
                    const RandomDice = diceIcons[Math.floor(Math.random() * diceIcons.length)];
                    
                    return (
                      <Card className="glass border-0">
                        <CardContent className="p-6">
                          <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <RandomDice className="w-5 h-5 text-primary" />
                            Casino Corner
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {(profile as any)?.favorite_slot && privacy.show_favorites !== false && (
                              <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20">
                                <div className="flex items-center gap-2 text-purple-400 mb-1">
                                  <Gamepad2 className="w-4 h-4" />
                                  <span className="text-sm">Favorite Slot</span>
                                </div>
                                <p className="font-medium">{(profile as any).favorite_slot}</p>
                              </div>
                            )}
                            {(profile as any)?.favorite_casino && privacy.show_favorites !== false && (
                              <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20">
                                <div className="flex items-center gap-2 text-blue-400 mb-1">
                                  <Star className="w-4 h-4" />
                                  <span className="text-sm">Favorite Casino</span>
                                </div>
                                <p className="font-medium">{(profile as any).favorite_casino}</p>
                              </div>
                            )}
                            {(profile as any)?.biggest_win && (
                              <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-xl border border-yellow-500/20">
                                <div className="flex items-center gap-2 text-yellow-500 mb-1">
                                  <Trophy className="w-4 h-4" />
                                  <span className="text-sm">Biggest Win</span>
                                </div>
                                <p className="font-medium">{(profile as any).biggest_win}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* Recent Activity */}
                  <Card className="glass border-0">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        Recent Activity
                      </h3>
                      <div className="space-y-3">
                        {recentActivity && recentActivity.length > 0 ? (
                          recentActivity.map((activity) => (
                            <Link
                              key={activity.id}
                              to={activity.link || "#"}
                              className="flex items-center gap-4 p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors"
                            >
                              <div className="p-2 rounded-lg bg-background">{getActivityIcon(activity.type)}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{activity.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(activity.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                              {activity.points && (
                                <Badge variant="outline" className="text-primary">+{activity.points} pts</Badge>
                              )}
                            </Link>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>No recent activity</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Connected Accounts */}
                  <Card className="glass border-0">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-primary" />
                        Connected Accounts
                      </h3>
                      <div className="space-y-3">
                        {profile.twitch_username && (
                          <a href={`https://twitch.tv/${profile.twitch_username}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-purple-600/10 rounded-xl hover:bg-purple-600/20 transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
                              <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>
                            </div>
                            <span className="text-sm font-medium">@{profile.twitch_username}</span>
                          </a>
                        )}
                        {profile.discord_tag && (
                          <div className="flex items-center gap-3 p-3 bg-indigo-600/10 rounded-xl">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                              <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"/></svg>
                            </div>
                            <span className="text-sm font-medium">{profile.discord_tag}</span>
                          </div>
                        )}
                        {profile.kick_username && (
                          <a href={`https://kick.com/${profile.kick_username}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-green-600/10 rounded-xl hover:bg-green-600/20 transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center">
                              <span className="text-green-400 font-bold text-sm">K</span>
                            </div>
                            <span className="text-sm font-medium">@{profile.kick_username}</span>
                          </a>
                        )}
                        {!profile.twitch_username && !profile.discord_tag && !profile.kick_username && (
                          <p className="text-muted-foreground text-sm text-center py-4">No connected accounts</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <Card className="glass border-0">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      Bonus Hunt Stats
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: "Total Guesses", value: activityStats?.bonusHuntGuesses || 0 },
                        { label: "Wins", value: activityStats?.bonusHuntWins || 0, highlight: true },
                        { label: "GTW Guesses", value: activityStats?.gtwGuesses || 0 },
                        { label: "GTW Wins", value: activityStats?.gtwWins || 0, highlight: true },
                      ].map((stat) => (
                        <div key={stat.label} className="flex justify-between p-3 bg-secondary/30 rounded-xl">
                          <span className="text-muted-foreground">{stat.label}</span>
                          <span className={`font-bold ${stat.highlight ? "text-primary" : ""}`}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-0">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-primary" />
                      Giveaway Stats
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: "Total Entries", value: activityStats?.giveawayEntries || 0 },
                        { label: "Wins", value: activityStats?.giveawayWins || 0, highlight: true },
                        { label: "Poll Votes", value: activityStats?.pollVotes || 0 },
                        { label: "Polls Created", value: activityStats?.pollsCreated || 0 },
                      ].map((stat) => (
                        <div key={stat.label} className="flex justify-between p-3 bg-secondary/30 rounded-xl">
                          <span className="text-muted-foreground">{stat.label}</span>
                          <span className={`font-bold ${stat.highlight ? "text-primary" : ""}`}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-0 md:col-span-2">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Account Info
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { icon: Calendar, label: "Member Since", value: new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }), color: "text-muted-foreground" },
                        { icon: Trophy, label: "Total Points", value: profile.points?.toLocaleString() || "0", color: "text-primary" },
                        { icon: Star, label: "Level", value: `${levelInfo.level} - ${levelInfo.name}`, color: "text-yellow-500" },
                        { icon: Award, label: "Achievements", value: achievementsCount || 0, color: "text-orange-500" },
                      ].map((item) => (
                        <div key={item.label} className="p-4 bg-secondary/30 rounded-xl text-center">
                          <item.icon className={`w-5 h-5 mx-auto mb-2 ${item.color}`} />
                          <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                          <p className="font-medium text-sm">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Badges Tab */}
            <TabsContent value="badges" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="glass border-0">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      Badges & Titles ({badges?.length || 0})
                    </h3>
                    {badges && badges.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {badges.map((badge) => (
                          <motion.div
                            key={badge.id}
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 rounded-xl border transition-all ${
                              badge.is_equipped ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/10" : "bg-secondary/30 border-border/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{badge.badge_icon || "🏆"}</span>
                              <div className="flex-1">
                                <p className="font-medium">{badge.badge_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {badge.is_title ? "Title" : "Badge"} • {new Date(badge.awarded_at).toLocaleDateString()}
                                </p>
                              </div>
                              {badge.is_equipped && (
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Award className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No badges earned yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Wall Tab */}
            <TabsContent value="wall" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="glass border-0">
                  <CardContent className="p-6">
                    <ProfileComments profileUserId={resolvedUserId!} />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>

        {/* Modals */}
        <FollowersModal
          isOpen={followersModalOpen}
          onClose={() => setFollowersModalOpen(false)}
          userId={resolvedUserId!}
          initialTab={followersModalTab}
        />

        <ReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          contentType="profile"
          contentId={resolvedUserId!}
        />
      </div>
    </div>
  );
}