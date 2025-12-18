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
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { useAchievements, ACHIEVEMENTS, LEVEL_THRESHOLDS } from "@/hooks/useAchievements";
import { 
  User, Trophy, Gift, Target, Save, LogOut, 
  Calendar, Edit2, Shield, TrendingUp,
  MessageSquare, Heart, Award, Link2, CheckCircle2, Settings, Loader2
} from "lucide-react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const { achievements, getAchievementProgress, stats, refreshAchievements, getLevelInfo } = useAchievements();
  
  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    bio: "",
    avatar_url: "",
  });

  // Handle Kick OAuth callback
  useEffect(() => {
    const kickUsername = searchParams.get("kick_username");
    const kickSuccess = searchParams.get("kick_success");
    const kickError = searchParams.get("kick_error");

    if (kickSuccess && kickUsername && user) {
      // Update profile with kick username
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
      
      // Clear URL params
      setSearchParams({});
    } else if (kickError) {
      toast({ title: "Failed to connect Kick", description: kickError, variant: "destructive" });
      setSearchParams({});
    }
  }, [searchParams, user]);

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update(formData)
      .eq("user_id", user.id);

    setLoading(false);

    if (error) {
      toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully" });
      setIsEditing(false);
      refreshAchievements();
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

      const isLocalhost =
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const callbackBase = (localStorage.getItem("kick_callback_base") || "").trim();

      if (isLocalhost && !callbackBase) {
        throw new Error(
          'For localhost, set localStorage key "kick_callback_base" to your ngrok/HTTPS tunnel base URL (e.g. https://xxxx.ngrok-free.app).'
        );
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kick-oauth?action=authorize&frontend_url=${encodeURIComponent(frontendUrl)}${callbackBase ? `&callback_base=${encodeURIComponent(callbackBase)}` : ""}`;

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
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
        throw new Error(`Kick authorize response missing authorize_url. Received: ${raw || "<empty>"}`);
      }

      // Guard against the "blank" redirect symptom (Kick root) which indicates params were rejected.
      try {
        const parsed = new URL(authorizeUrl);
        const looksValid =
          parsed.origin === "https://id.kick.com" &&
          parsed.pathname.startsWith("/oauth/authorize") &&
          !!parsed.searchParams.get("client_id") &&
          !!parsed.searchParams.get("redirect_uri");

        if (!looksValid) {
          throw new Error(
            `Kick authorize_url looks invalid. Got: ${authorizeUrl}. Check client_id + redirect_uri in your Kick app settings.`
          );
        }
      } catch (e: any) {
        throw new Error(e?.message || `Invalid authorize_url: ${authorizeUrl}`);
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

  // Check if accounts are connected via OAuth
  const identities = user.identities || [];
  const twitchConnected = identities.some((i) => i.provider === "twitch");
  const discordConnected = identities.some((i) => i.provider === "discord");
  const kickConnected = !!profile?.kick_username;

  // Group achievements by category
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

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header with Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl overflow-hidden mb-6"
        >
          {/* Profile Header Banner */}
          <div className="h-28 bg-gradient-to-r from-primary/30 via-primary/20 to-accent/30 relative">
            <div className="absolute -bottom-10 left-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-background border-4 border-background overflow-hidden shadow-xl">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <User className="w-10 h-10 text-muted-foreground" />
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
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant={isEditing ? "outline" : "secondary"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="gap-2"
              >
                {isEditing ? (
                  <>Cancel</>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </>
                )}
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
          </div>

          {/* Profile Info */}
          <div className="pt-14 px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold">
                    {formData.display_name || formData.username || "Anonymous"}
                  </h1>
                  <Badge variant="outline" className={level.color}>
                    {level.name}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">@{formData.username || "username"} • {user.email}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{profile?.points || 0}</p>
                  <p className="text-xs text-muted-foreground">Points</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{unlockedCount}/{ACHIEVEMENTS.length}</p>
                  <p className="text-xs text-muted-foreground">Achievements</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{totalActivity}</p>
                  <p className="text-xs text-muted-foreground">Activities</p>
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
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="w-full justify-start mb-6 bg-secondary/30 p-1 rounded-xl">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="achievements" className="gap-2">
                <Award className="w-4 h-4" />
                Achievements
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Form */}
                <div className="lg:col-span-2 glass rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Profile Information</h3>
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Username</label>
                        <Input
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          disabled={!isEditing}
                          placeholder="username"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Display Name</label>
                        <Input
                          value={formData.display_name}
                          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Your display name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <label className="text-sm font-medium">Bio</label>
                      <Textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>

                    {isEditing && (
                      <Button type="submit" disabled={loading} className="w-full gap-2">
                        <Save className="w-4 h-4" />
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    )}
                  </form>
                </div>

                {/* Account Info Sidebar */}
                <div className="space-y-6">
                  <div className="glass rounded-2xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Account Info
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Member Since
                        </span>
                        <span className="text-sm font-medium">{memberSince}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="glass rounded-2xl p-6">
                    <h3 className="font-semibold mb-4">Quick Links</h3>
                    <div className="space-y-2">
                      <Link to="/giveaways">
                        <Button variant="ghost" className="w-full justify-start gap-2 h-9">
                          <Gift className="w-4 h-4" />
                          Browse Giveaways
                        </Button>
                      </Link>
                      <Link to="/leaderboard">
                        <Button variant="ghost" className="w-full justify-start gap-2 h-9">
                          <Trophy className="w-4 h-4" />
                          Leaderboard
                        </Button>
                      </Link>
                    </div>
                  </div>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleConnectTwitch}
                        disabled={connectingProvider === "twitch"}
                        className="h-8 text-xs"
                      >
                        {connectingProvider === "twitch" ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Connect"
                        )}
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleConnectDiscord}
                        disabled={connectingProvider === "discord"}
                        className="h-8 text-xs"
                      >
                        {connectingProvider === "discord" ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Connect"
                        )}
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
                          ) : (
                            "Not connected"
                          )}
                        </p>
                      </div>
                    </div>
                    {!kickConnected && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleConnectKick}
                        disabled={connectingProvider === "kick"}
                        className="h-8 text-xs"
                      >
                        {connectingProvider === "kick" ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent" />
                    Achievements ({unlockedCount}/{ACHIEVEMENTS.length})
                  </h3>
                </div>
                
                {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                      {categoryNames[category as keyof typeof categoryNames]}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryAchievements.map((achievement) => {
                        const { unlocked, progress, requirement } = getAchievementProgress(achievement.key);
                        const progressPercent = (progress / requirement) * 100;
                        
                        return (
                          <div
                            key={achievement.key}
                            className={`p-4 rounded-xl border transition-all ${
                              unlocked
                                ? `bg-${achievement.color}-500/10 border-${achievement.color}-500/30`
                                : "bg-secondary/20 border-border/50 opacity-60"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`text-2xl ${!unlocked ? "grayscale" : ""}`}>
                                {achievement.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={`font-medium text-sm ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                                    {achievement.name}
                                  </p>
                                  {unlocked && (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {achievement.description}
                                </p>
                                {!unlocked && (
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                      <span>Progress</span>
                                      <span>{progress}/{requirement}</span>
                                    </div>
                                    <Progress value={progressPercent} className="h-1.5" />
                                  </div>
                                )}
                              </div>
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
            <TabsContent value="activity">
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Activity Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-secondary/30 rounded-xl text-center hover:bg-secondary/50 transition-colors">
                    <Gift className="w-6 h-6 mx-auto mb-2 text-pink-500" />
                    <p className="text-2xl font-bold">{stats.giveawayEntries}</p>
                    <p className="text-sm text-muted-foreground">Giveaways Entered</p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-xl text-center hover:bg-secondary/50 transition-colors">
                    <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{stats.gtwGuesses}</p>
                    <p className="text-sm text-muted-foreground">GTW Guesses</p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-xl text-center hover:bg-secondary/50 transition-colors">
                    <MessageSquare className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{stats.comments}</p>
                    <p className="text-sm text-muted-foreground">Comments</p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-xl text-center hover:bg-secondary/50 transition-colors">
                    <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
                    <p className="text-2xl font-bold">{stats.articleLikes}</p>
                    <p className="text-sm text-muted-foreground">Article Likes</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <NotificationPreferences />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
