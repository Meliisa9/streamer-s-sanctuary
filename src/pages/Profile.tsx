import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarUpload } from "@/components/AvatarUpload";
import { CoverPhotoUpload } from "@/components/CoverPhotoUpload";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { useAchievements, ACHIEVEMENTS, LEVEL_THRESHOLDS } from "@/hooks/useAchievements";
import { useQuery } from "@tanstack/react-query";
import { 
  User, Trophy, Gift, Target, Save, LogOut, 
  Calendar, Edit2, Shield, TrendingUp,
  MessageSquare, Heart, Award, Link2, CheckCircle2, Settings, Loader2, Users, Bookmark,
  Video, Newspaper, Mail, AlertCircle, MapPin, Cake, Star, Gamepad2, Flame
} from "lucide-react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useUserFollow } from "@/hooks/useUserFollow";
import { ProfileComments } from "@/components/ProfileComments";
import { useBookmarks } from "@/hooks/useBookmarks";
import { FollowersModal } from "@/components/FollowersModal";
import { UserImageLink } from "@/components/UserAvatarLink";
import { PrivacyControls } from "@/components/PrivacyControls";
import { GamblingStatsBox } from "@/components/profile/GamblingStatsBox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { COUNTRIES } from "@/lib/countries";

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<"followers" | "following">("followers");
  const [activeTab, setActiveTab] = useState("profile");
  const { achievements, getAchievementProgress, stats, refreshAchievements, getLevelInfo } = useAchievements();
  const { following, followers, followersCount, followingCount } = useUserFollow(user?.id);
  const { bookmarks, getBookmarksByType } = useBookmarks();
  
  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [emailChangePending, setEmailChangePending] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    avatar_url: "",
    cover_url: "",
    birthdate: "",
    country: "",
    city: "",
    favorite_slot: "",
    favorite_casino: "",
    biggest_win: "",
  });

  // Fetch bookmarked content details
  const videoBookmarks = getBookmarksByType("video");
  const articleBookmarks = getBookmarksByType("article");
  const giveawayBookmarks = getBookmarksByType("giveaway");

  const { data: bookmarkedVideos } = useQuery({
    queryKey: ["bookmarked-videos", videoBookmarks.map(b => b.content_id)],
    queryFn: async () => {
      if (videoBookmarks.length === 0) return [];
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, thumbnail_url, video_url, created_at")
        .in("id", videoBookmarks.map(b => b.content_id));
      if (error) throw error;
      return data;
    },
    enabled: videoBookmarks.length > 0,
  });

  const { data: bookmarkedArticles } = useQuery({
    queryKey: ["bookmarked-articles", articleBookmarks.map(b => b.content_id)],
    queryFn: async () => {
      if (articleBookmarks.length === 0) return [];
      const { data, error } = await supabase
        .from("news_articles")
        .select("id, title, image_url, slug, created_at")
        .in("id", articleBookmarks.map(b => b.content_id));
      if (error) throw error;
      return data;
    },
    enabled: articleBookmarks.length > 0,
  });

  const { data: bookmarkedGiveaways } = useQuery({
    queryKey: ["bookmarked-giveaways", giveawayBookmarks.map(b => b.content_id)],
    queryFn: async () => {
      if (giveawayBookmarks.length === 0) return [];
      const { data, error } = await supabase
        .from("giveaways")
        .select("id, title, image_url, prize, end_date")
        .in("id", giveawayBookmarks.map(b => b.content_id));
      if (error) throw error;
      return data;
    },
    enabled: giveawayBookmarks.length > 0,
  });

  // Handle Kick OAuth callback
  useEffect(() => {
    const kickUsername = searchParams.get("kick_username");
    const kickSuccess = searchParams.get("kick_success");
    const kickError = searchParams.get("kick_error");

    if (kickSuccess && kickUsername && user) {
      supabase
        .from("profiles")
        .update({ kick_username: kickUsername })
        .eq("user_id", user.id)
        .then(({ error }) => {
          if (error) {
            toast({ title: "Failed to link Kick account", description: error.message, variant: "destructive" });
          } else {
            toast({ title: "Kick account connected!", description: `Linked as ${kickUsername}` });
            refreshProfile();
          }
        });
      
      setSearchParams({});
    } else if (kickError) {
      toast({ title: "Failed to connect Kick", description: kickError, variant: "destructive" });
      setSearchParams({});
    }
  }, [searchParams, user]);

  // Handle hash-based navigation
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#comment-")) {
      setActiveTab("profile");
      setTimeout(() => {
        const commentId = hash.replace("#", "");
        const element = document.getElementById(commentId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-primary", "ring-offset-2");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
          }, 3000);
        }
      }, 300);
    } else if (hash === "#wall") {
      setActiveTab("profile");
    }
  }, []);

  useEffect(() => {
    if (profile) {
      // Convert age to approximate birthdate for display
      const age = (profile as any).age;
      let birthdate = "";
      if (age) {
        const birthYear = new Date().getFullYear() - age;
        birthdate = `${birthYear}-01-01`;
      }
      
      setFormData({
        username: profile.username || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || "",
        cover_url: (profile as any).cover_url || "",
        birthdate: birthdate,
        country: (profile as any).country || "",
        city: (profile as any).city || "",
        favorite_slot: (profile as any).favorite_slot || "",
        favorite_casino: (profile as any).favorite_casino || "",
        biggest_win: (profile as any).biggest_win || "",
      });
    }
  }, [profile]);

  // Calculate age from birthdate
  const calculateAge = (birthdate: string): number | null => {
    if (!birthdate) return null;
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const age = calculateAge(formData.birthdate);

    const updatePayload = {
      username: formData.username,
      bio: formData.bio,
      avatar_url: formData.avatar_url,
      cover_url: formData.cover_url,
      age: age,
      country: formData.country || null,
      city: formData.city || null,
      favorite_slot: formData.favorite_slot || null,
      favorite_casino: formData.favorite_casino || null,
      biggest_win: formData.biggest_win || null,
    };
    
    const { error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("user_id", user.id);

    setLoading(false);

    if (error) {
      toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully" });
      setIsEditing(false);
      refreshAchievements();
      refreshProfile();
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast({ title: "Please enter a valid email", variant: "destructive" });
      return;
    }
    
    setEmailChangePending(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ 
        email: newEmail 
      });
      
      if (error) throw error;
      
      toast({ 
        title: "Verification email sent", 
        description: "Please check both your current and new email inbox and click the confirmation links." 
      });
      setNewEmail("");
    } catch (error: any) {
      toast({ title: "Error changing email", description: error.message, variant: "destructive" });
    } finally {
      setEmailChangePending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleConnectTwitch = async () => {
    setConnectingProvider("twitch");
    try {
      const { error } = await supabase.auth.linkIdentity({ provider: "twitch" });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Failed to connect Twitch", description: error.message, variant: "destructive" });
      setConnectingProvider(null);
    }
  };

  const handleConnectDiscord = async () => {
    setConnectingProvider("discord");
    try {
      const { error } = await supabase.auth.linkIdentity({ provider: "discord" });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Failed to connect Discord", description: error.message, variant: "destructive" });
      setConnectingProvider(null);
    }
  };

  const handleConnectKick = async () => {
    setConnectingProvider("kick");
    try {
      const frontendUrl = window.location.origin;
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const callbackBase = (localStorage.getItem("kick_callback_base") || "").trim();

      if (isLocalhost && !callbackBase) {
        throw new Error('For localhost, set localStorage key "kick_callback_base" to your ngrok/HTTPS tunnel base URL.');
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kick-oauth?action=authorize&frontend_url=${encodeURIComponent(frontendUrl)}${callbackBase ? `&callback_base=${encodeURIComponent(callbackBase)}` : ""}`;

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const raw = await response.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const detail = data?.error || raw || `HTTP ${response.status}`;
        throw new Error(`Kick authorize failed: ${detail}`);
      }

      const authorizeUrl: string | undefined = data?.authorize_url;
      if (!authorizeUrl) {
        throw new Error(`Kick authorize response missing authorize_url.`);
      }

      window.location.assign(authorizeUrl);
    } catch (error: any) {
      toast({ title: "Failed to connect Kick", description: error.message, variant: "destructive" });
      setConnectingProvider(null);
    }
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  const totalActivity = stats.giveawayEntries + stats.gtwGuesses + stats.comments + stats.articleLikes + stats.pollVotes;
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  const level = getLevelInfo(profile?.points || 0);
  const identities = user.identities || [];
  const twitchConnected = identities.some((i) => i.provider === "twitch");
  const discordConnected = identities.some((i) => i.provider === "discord");
  const kickConnected = !!profile?.kick_username;

  const achievementsByCategory = ACHIEVEMENTS.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, typeof ACHIEVEMENTS>);

  const categoryNames = {
    participation: "Participation",
    social: "Social",
    loyalty: "Loyalty",
    special: "Special",
  };

  const unlockedCount = ACHIEVEMENTS.filter(a => getAchievementProgress(a.key).unlocked).length;
  
  // Get display age from profile
  const displayAge = (profile as any)?.age;

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header with Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl overflow-hidden mb-6"
        >
          {/* Profile Header Banner with Cover Photo */}
          <div 
            className="h-36 md:h-44 relative bg-gradient-to-r from-primary/30 via-primary/20 to-accent/30"
            style={(profile as any)?.cover_url ? { 
              backgroundImage: `url(${(profile as any).cover_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            
            {/* Cover Photo Upload and Edit buttons - positioned together */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              {isEditing && (
                <CoverPhotoUpload
                  currentCoverUrl={(profile as any)?.cover_url}
                  userId={user.id}
                  onCoverChange={(url) => setFormData({ ...formData, cover_url: url })}
                />
              )}
              <Button
                variant={isEditing ? "outline" : "secondary"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="gap-2"
              >
                {isEditing ? <>Cancel</> : <><Edit2 className="w-4 h-4" />Edit</>}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10" 
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="absolute -bottom-12 left-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-2xl bg-background border-4 border-background overflow-hidden shadow-xl">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <User className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <AvatarUpload
                    currentAvatarUrl={formData.avatar_url}
                    userId={user.id}
                    onAvatarChange={(url) => setFormData({ ...formData, avatar_url: url })}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-16 px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold">{formData.username || "Anonymous"}</h1>
                  <Badge variant="outline" className={level.color}>{level.name}</Badge>
                </div>
                <p className="text-muted-foreground text-sm">@{formData.username || "username"}</p>
              </div>
              
              {/* Enhanced Stats Tabs */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/20 shadow-sm">
                  <Trophy className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-lg font-bold text-primary">{profile?.points || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Points</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-xl border border-orange-500/20 shadow-sm">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-lg font-bold text-orange-500">{stats.consecutiveSignIns}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Streak</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setFollowersModalTab("followers"); setFollowersModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl border border-blue-500/20 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-lg font-bold">{followersCount}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Followers</p>
                  </div>
                </button>
                <button 
                  onClick={() => { setFollowersModalTab("following"); setFollowersModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-xl border border-purple-500/20 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-lg font-bold">{followingCount}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Following</p>
                  </div>
                </button>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-xl border border-yellow-500/20 shadow-sm">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <div>
                    <p className="text-lg font-bold">{unlockedCount}/{ACHIEVEMENTS.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Achievements</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Level Progress */}
            <div className="mt-4 p-3 bg-secondary/30 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium">
                  Level {level.level}: {level.name}
                  {level.xpToNextLevel > 0 && (
                    <span className="text-muted-foreground ml-2">({level.xpToNextLevel} XP to next level)</span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">{level.progressPercent.toFixed(0)}%</span>
              </div>
              <Progress value={level.progressPercent} className="h-1.5" />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>{level.currentXP} XP</span>
                <span>{level.maxXP === Infinity ? "Max Level" : `${level.maxXP + 1} XP`}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabbed Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start mb-6 bg-secondary/30 p-1 rounded-xl flex-wrap">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />Profile
              </TabsTrigger>
              <TabsTrigger value="bookmarks" className="gap-2">
                <Bookmark className="w-4 h-4" />Bookmarks
              </TabsTrigger>
              <TabsTrigger value="achievements" className="gap-2">
                <Award className="w-4 h-4" />Achievements
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <TrendingUp className="w-4 h-4" />Activity
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="w-4 h-4" />Settings
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab - Now includes display-only profile info, connected accounts, and wall */}
            <TabsContent value="profile" className="space-y-6">
              {/* Member Since - Separate */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Member since {memberSince}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Info Display */}
                <div className="lg:col-span-2 glass rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Profile Information</h3>
                  <div className="space-y-4">
                    {/* Bio */}
                    {profile?.bio && (
                      <div className="p-4 bg-secondary/30 rounded-xl">
                        <p className="text-sm text-muted-foreground mb-1">Bio</p>
                        <p>{profile.bio}</p>
                      </div>
                    )}
                    
                    {/* Profile Details Grid - respect privacy settings */}
                    {(() => {
                      const privacy = (profile as any)?.privacy_settings || {};
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {displayAge && privacy.show_age !== false && (
                            <div className="p-4 bg-secondary/30 rounded-xl">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Cake className="w-4 h-4" />
                                <span className="text-sm">Age</span>
                              </div>
                              <p className="font-medium">{displayAge} years old</p>
                            </div>
                          )}
                          {(profile as any)?.country && privacy.show_country !== false && (
                            <div className="p-4 bg-secondary/30 rounded-xl">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">Country</span>
                              </div>
                              <p className="font-medium">{(profile as any).country}</p>
                            </div>
                          )}
                          {(profile as any)?.city && privacy.show_city !== false && (
                            <div className="p-4 bg-secondary/30 rounded-xl">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">City</span>
                              </div>
                              <p className="font-medium">{(profile as any).city}</p>
                            </div>
                          )}
                          {(profile as any)?.favorite_slot && privacy.show_favorites !== false && (
                            <div className="p-4 bg-secondary/30 rounded-xl">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Gamepad2 className="w-4 h-4" />
                                <span className="text-sm">Favorite Slot</span>
                              </div>
                              <p className="font-medium">{(profile as any).favorite_slot}</p>
                            </div>
                          )}
                          {(profile as any)?.favorite_casino && privacy.show_favorites !== false && (
                            <div className="p-4 bg-secondary/30 rounded-xl">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
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
                      );
                    })()}
                    
                    {!profile?.bio && !displayAge && !(profile as any)?.country && !(profile as any)?.favorite_slot && (
                      <div className="text-center py-8 text-muted-foreground">
                        <User className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No profile information set yet.</p>
                        <p className="text-sm">Go to Settings tab to add your details.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Links */}
                  <div className="glass rounded-2xl p-6">
                    <h3 className="font-semibold mb-4">Quick Links</h3>
                    <div className="space-y-2">
                      <Link to="/giveaways">
                        <Button variant="ghost" className="w-full justify-start gap-2 h-9">
                          <Gift className="w-4 h-4" />Browse Giveaways
                        </Button>
                      </Link>
                      <Link to="/leaderboard">
                        <Button variant="ghost" className="w-full justify-start gap-2 h-9">
                          <Trophy className="w-4 h-4" />Leaderboard
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  {/* Casino Corner Box */}
                  <GamblingStatsBox 
                    favoriteSlot={(profile as any)?.favorite_slot}
                    favoriteCasino={(profile as any)?.favorite_casino}
                    biggestWin={(profile as any)?.biggest_win}
                  />
                </div>
              </div>

              {/* Connected Accounts */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  Connected Accounts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Twitch */}
                  <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Twitch</p>
                        <p className="text-xs">
                          {twitchConnected || profile?.twitch_username ? (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle2 className="w-3 h-3" />
                              {profile?.twitch_username ? `@${profile.twitch_username}` : "Connected"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Not connected</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {!twitchConnected && (
                      <Button size="sm" variant="outline" onClick={handleConnectTwitch} disabled={connectingProvider === "twitch"} className="h-8 text-xs">
                        {connectingProvider === "twitch" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Connect"}
                      </Button>
                    )}
                  </div>

                  {/* Discord */}
                  <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Discord</p>
                        <p className="text-xs">
                          {discordConnected || profile?.discord_tag ? (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle2 className="w-3 h-3" />
                              {profile?.discord_tag || "Connected"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Not connected</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {!discordConnected && (
                      <Button size="sm" variant="outline" onClick={handleConnectDiscord} disabled={connectingProvider === "discord"} className="h-8 text-xs">
                        {connectingProvider === "discord" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Connect"}
                      </Button>
                    )}
                  </div>

                  {/* Kick */}
                  <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                        <span className="text-green-400 font-bold text-sm">K</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Kick</p>
                        <p className="text-xs text-muted-foreground">
                          {kickConnected ? (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle2 className="w-3 h-3" />
                              @{profile?.kick_username}
                            </span>
                          ) : "Not connected"}
                        </p>
                      </div>
                    </div>
                    {!kickConnected && (
                      <Button size="sm" variant="outline" onClick={handleConnectKick} disabled={connectingProvider === "kick"} className="h-8 text-xs">
                        {connectingProvider === "kick" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Connect"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Wall */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Profile Wall
                  </h3>
                </div>
                <ProfileComments profileUserId={user.id} />
              </div>
            </TabsContent>

            {/* Bookmarks Tab */}
            <TabsContent value="bookmarks" className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-primary" />
                  Your Bookmarks
                </h3>
                
                {/* Videos */}
                {bookmarkedVideos && bookmarkedVideos.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Videos ({bookmarkedVideos.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bookmarkedVideos.map((video) => (
                        <Link key={video.id} to="/videos" className="glass rounded-lg p-3 hover:bg-secondary/50 transition-colors">
                          <p className="font-medium text-sm line-clamp-2">{video.title}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Articles */}
                {bookmarkedArticles && bookmarkedArticles.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Newspaper className="w-4 h-4" />
                      Articles ({bookmarkedArticles.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bookmarkedArticles.map((article) => (
                        <Link key={article.id} to={`/news/${article.slug}`} className="glass rounded-lg p-3 hover:bg-secondary/50 transition-colors">
                          <p className="font-medium text-sm line-clamp-2">{article.title}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Giveaways */}
                {bookmarkedGiveaways && bookmarkedGiveaways.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      Giveaways ({bookmarkedGiveaways.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bookmarkedGiveaways.map((giveaway) => (
                        <Link key={giveaway.id} to="/giveaways" className="glass rounded-lg p-3 hover:bg-secondary/50 transition-colors">
                          <p className="font-medium text-sm line-clamp-2">{giveaway.title}</p>
                          <p className="text-xs text-primary mt-1">{giveaway.prize}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {(!bookmarkedVideos?.length && !bookmarkedArticles?.length && !bookmarkedGiveaways?.length) && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>You haven't bookmarked anything yet.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    Achievements ({unlockedCount}/{ACHIEVEMENTS.length})
                  </h3>
                </div>
                
                {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
                  <div key={category} className="mb-6">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                      {categoryNames[category as keyof typeof categoryNames] || category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryAchievements.map((achievement) => {
                        const progress = getAchievementProgress(achievement.key);
                        return (
                          <div
                            key={achievement.key}
                            className={`p-4 rounded-xl border transition-all ${
                              progress.unlocked
                                ? "bg-primary/10 border-primary/30"
                                : "bg-secondary/30 border-border/50 opacity-60"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{achievement.icon}</span>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{achievement.name}</p>
                                <p className="text-xs text-muted-foreground">{achievement.description}</p>
                                {!progress.unlocked && progress.progress !== undefined && (
                                  <div className="mt-2">
                                    <Progress value={(progress.progress / achievement.requirement) * 100} className="h-1" />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {progress.progress}/{achievement.requirement}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {progress.unlocked && <CheckCircle2 className="w-5 h-5 text-primary" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Activity Stats
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-secondary/30 rounded-xl text-center">
                    <Gift className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{stats.giveawayEntries}</p>
                    <p className="text-xs text-muted-foreground">Giveaway Entries</p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-xl text-center">
                    <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{stats.gtwGuesses}</p>
                    <p className="text-xs text-muted-foreground">GTW Guesses</p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-xl text-center">
                    <MessageSquare className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{stats.comments}</p>
                    <p className="text-xs text-muted-foreground">Comments</p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-xl text-center">
                    <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
                    <p className="text-2xl font-bold">{stats.articleLikes}</p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab - Now contains all editable profile fields */}
            <TabsContent value="settings" className="space-y-6">
              {/* Profile Information Edit Form */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Edit Profile Information
                </h3>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Username</label>
                      <Input
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="username"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Cake className="w-4 h-4 text-muted-foreground" />
                        Birth Date (Optional)
                      </label>
                      <Input
                        type="date"
                        value={formData.birthdate}
                        onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        Country (Optional)
                      </label>
                      <Select
                        value={formData.country}
                        onValueChange={(value) => setFormData({ ...formData, country: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        City (Optional)
                      </label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Your city"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                        Favorite Slot (Optional)
                      </label>
                      <Input
                        value={formData.favorite_slot}
                        onChange={(e) => setFormData({ ...formData, favorite_slot: e.target.value })}
                        placeholder="e.g., Gates of Olympus"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Star className="w-4 h-4 text-muted-foreground" />
                        Favorite Casino (Optional)
                      </label>
                      <Input
                        value={formData.favorite_casino}
                                      onChange={(e) => setFormData({ ...formData, favorite_casino: e.target.value })}
                        placeholder="e.g., Stake"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        Biggest Win (Optional)
                      </label>
                      <Input
                        value={formData.biggest_win}
                        onChange={(e) => setFormData({ ...formData, biggest_win: e.target.value })}
                        placeholder="e.g., $50,000 on Gates of Olympus"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <label className="text-sm font-medium">Bio</label>
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full gap-2">
                    <Save className="w-4 h-4" />
                    {loading ? "Saving..." : "Save Profile Changes"}
                  </Button>
                </form>
              </div>

              {/* Email Change Section */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Change Email
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-secondary/30 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-2">Current Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Email Address</label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter new email"
                        className="flex-1"
                      />
                      <Button onClick={handleEmailChange} disabled={emailChangePending || !newEmail}>
                        {emailChangePending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Verification links will be sent to both your current and new email addresses.
                    </p>
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  Notification Preferences
                </h3>
                <NotificationPreferences />
              </div>

              {/* Privacy Controls */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Privacy Controls
                </h3>
                <PrivacyControls />
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Followers Modal */}
        <FollowersModal
          isOpen={followersModalOpen}
          onClose={() => setFollowersModalOpen(false)}
          userId={user.id}
          initialTab={followersModalTab}
        />
      </div>
    </div>
  );
}
