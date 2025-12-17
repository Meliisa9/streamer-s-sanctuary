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
import { 
  User, Settings, Trophy, Gift, Target, Save, LogOut, 
  Calendar, Clock, Edit2, Camera, Shield, Star, TrendingUp,
  MessageSquare, Heart, Award, ExternalLink
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

interface UserStats {
  giveawayEntries: number;
  gtwGuesses: number;
  comments: number;
  articleLikes: number;
}

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UserStats>({ 
    giveawayEntries: 0, 
    gtwGuesses: 0,
    comments: 0,
    articleLikes: 0
  });
  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    bio: "",
    twitch_username: "",
    discord_tag: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        twitch_username: profile.twitch_username || "",
        discord_tag: profile.discord_tag || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    
    const [entriesResult, guessesResult, commentsResult, likesResult] = await Promise.all([
      supabase.from("giveaway_entries").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("gtw_guesses").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("news_comments").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("article_likes").select("id", { count: "exact" }).eq("user_id", user.id),
    ]);

    setStats({
      giveawayEntries: entriesResult.count || 0,
      gtwGuesses: guessesResult.count || 0,
      comments: commentsResult.count || 0,
      articleLikes: likesResult.count || 0,
    });
  };

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
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  const totalActivity = stats.giveawayEntries + stats.gtwGuesses + stats.comments + stats.articleLikes;
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }) : "Unknown";

  const getLevel = (points: number) => {
    if (points >= 10000) return { name: "Legend", color: "text-yellow-500", progress: 100 };
    if (points >= 5000) return { name: "Expert", color: "text-purple-500", progress: (points - 5000) / 50 };
    if (points >= 1000) return { name: "Pro", color: "text-blue-500", progress: (points - 1000) / 40 };
    if (points >= 100) return { name: "Member", color: "text-green-500", progress: (points - 100) / 9 };
    return { name: "Newbie", color: "text-muted-foreground", progress: points };
  };

  const level = getLevel(profile?.points || 0);

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            My <span className="gradient-text">Profile</span>
          </h1>
          <p className="text-muted-foreground">
            Manage your account and view your activity
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Main Profile Card */}
            <div className="glass rounded-2xl overflow-hidden">
              {/* Profile Header Banner */}
              <div className="h-32 bg-gradient-to-r from-primary/30 via-primary/20 to-accent/30 relative">
                <div className="absolute -bottom-12 left-6">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-2xl bg-background border-4 border-background overflow-hidden shadow-xl">
                      {formData.avatar_url ? (
                        <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <User className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="absolute top-4 right-4">
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
                        Edit Profile
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Profile Content */}
              <div className="pt-16 p-6">
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl font-bold">
                          {formData.display_name || formData.username || "Anonymous"}
                        </h2>
                        <Badge variant="outline" className={level.color}>
                          {level.name}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">@{formData.username || "username"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{profile?.points || 0}</p>
                        <p className="text-sm text-muted-foreground">Total Points</p>
                      </div>
                      <Trophy className="w-8 h-8 text-accent" />
                    </div>
                  </div>

                  {/* Level Progress */}
                  <div className="mb-6 p-4 bg-secondary/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Level Progress</span>
                      <span className="text-sm text-muted-foreground">{level.progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={level.progress} className="h-2" />
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

                  <div className="space-y-2 mb-6">
                    <label className="text-sm font-medium">Bio</label>
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>

                  {/* Social Links */}
                  <div className="border-t border-border pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-primary" />
                      Connected Accounts
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-purple-500/20 flex items-center justify-center">
                            <span className="text-[10px] text-purple-400">TV</span>
                          </div>
                          Twitch Username
                        </label>
                        <Input
                          value={formData.twitch_username}
                          onChange={(e) => setFormData({ ...formData, twitch_username: e.target.value })}
                          disabled={!isEditing}
                          placeholder="your_twitch_username"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-indigo-500/20 flex items-center justify-center">
                            <span className="text-[10px] text-indigo-400">D</span>
                          </div>
                          Discord Tag
                        </label>
                        <Input
                          value={formData.discord_tag}
                          onChange={(e) => setFormData({ ...formData, discord_tag: e.target.value })}
                          disabled={!isEditing}
                          placeholder="username#1234"
                        />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="border-t border-border pt-6 mt-6">
                      <div className="space-y-2 mb-4">
                        <label className="text-sm font-medium">Avatar URL</label>
                        <Input
                          value={formData.avatar_url}
                          onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <Button type="submit" disabled={loading} className="w-full gap-2">
                        <Save className="w-4 h-4" />
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Activity Overview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-secondary/30 rounded-xl text-center hover:bg-secondary/50 transition-colors">
                  <Gift className="w-6 h-6 mx-auto mb-2 text-pink-500" />
                  <p className="text-2xl font-bold">{stats.giveawayEntries}</p>
                  <p className="text-sm text-muted-foreground">Giveaways</p>
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
                  <p className="text-sm text-muted-foreground">Likes</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Account Info */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Account Info
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium truncate max-w-[150px]">{user.email}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </span>
                  <span className="text-sm font-medium">{memberSince}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Total Activity
                  </span>
                  <span className="text-sm font-medium">{totalActivity} actions</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-accent" />
                Achievements
              </h3>
              <div className="space-y-3">
                {stats.giveawayEntries >= 1 && (
                  <div className="flex items-center gap-3 p-3 bg-pink-500/10 rounded-xl border border-pink-500/20">
                    <Gift className="w-5 h-5 text-pink-500" />
                    <div>
                      <p className="text-sm font-medium">First Entry</p>
                      <p className="text-xs text-muted-foreground">Entered your first giveaway</p>
                    </div>
                  </div>
                )}
                {stats.gtwGuesses >= 5 && (
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                    <Target className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Predictor</p>
                      <p className="text-xs text-muted-foreground">Made 5+ GTW guesses</p>
                    </div>
                  </div>
                )}
                {(profile?.points || 0) >= 100 && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">Point Collector</p>
                      <p className="text-xs text-muted-foreground">Earned 100+ points</p>
                    </div>
                  </div>
                )}
                {totalActivity === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Start participating to earn achievements!
                  </p>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link to="/giveaways">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Gift className="w-4 h-4" />
                    Browse Giveaways
                  </Button>
                </Link>
                <Link to="/leaderboard">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Trophy className="w-4 h-4" />
                    Leaderboard
                  </Button>
                </Link>
                <Link to="/news">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Latest News
                  </Button>
                </Link>
              </div>
            </div>

            {/* Sign Out */}
            <Button 
              variant="outline" 
              className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10" 
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
