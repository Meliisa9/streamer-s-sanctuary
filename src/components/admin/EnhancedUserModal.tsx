import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, Mail, Lock, Shield, Award, MessageCircle, Loader2, 
  AtSign, Twitch, Globe, Camera, Calendar, TrendingUp, Sparkles,
  Copy, Check, Eye, EyeOff, Ban, Clock, Hash
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { format } from "date-fns";

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EnhancedAddUserModal({ open, onOpenChange, onSuccess }: AddUserModalProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(formData.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setFormData({ email: "", password: "", username: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast({ title: "Email and password are required", variant: "destructive" });
      return;
    }

    if (formData.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      const response = await supabase.functions.invoke("create-user", {
        body: {
          email: formData.email,
          password: formData.password,
          username: formData.username,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: "User created successfully" });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 border-b border-border">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Create New User</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Add a new user to the platform</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Account Credentials */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span>Account Credentials</span>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Password <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      required
                      className="h-11 pr-20"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      {formData.password && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={copyPassword}
                        >
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                  </div>
                  <Button type="button" variant="outline" onClick={generatePassword} className="h-11 gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Use the generate button for a secure password</p>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Profile Information</span>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <AtSign className="w-4 h-4 text-muted-foreground" />
                Username
              </label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="username"
                className="h-11"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="flex-1 gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
              {isSaving ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  userRoles: string[];
  onSuccess: () => void;
  onUpdateRole: (userId: string, role: "user" | "moderator" | "admin" | "writer", action: "add" | "remove") => void;
}

export function EnhancedEditUserModal({ 
  open, 
  onOpenChange, 
  user, 
  userRoles,
  onSuccess,
  onUpdateRole
}: EditUserModalProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    discord_tag: "",
    twitch_username: "",
    kick_username: "",
    points: 0,
    email: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        bio: user.bio || "",
        discord_tag: user.discord_tag || "",
        twitch_username: user.twitch_username || "",
        kick_username: user.kick_username || "",
        points: user.points || 0,
        email: "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: formData.username || null,
          bio: formData.bio || null,
          discord_tag: formData.discord_tag || null,
          twitch_username: formData.twitch_username || null,
          kick_username: formData.kick_username || null,
          points: formData.points,
        })
        .eq("user_id", user.user_id);

      if (error) throw error;

      toast({ title: "User updated successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const updateEmail = async () => {
    if (!user || !formData.email) return;
    
    setIsUpdatingEmail(true);

    try {
      const response = await supabase.functions.invoke("create-user", {
        body: {
          action: "update_email",
          user_id: user.user_id,
          new_email: formData.email,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: "Email updated successfully" });
      setFormData({ ...formData, email: "" });
    } catch (error: any) {
      toast({ title: "Error updating email", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const addPoints = async (amount: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ points: (formData.points || 0) + amount })
        .eq("user_id", user.user_id);

      if (error) throw error;
      setFormData({ ...formData, points: (formData.points || 0) + amount });
      toast({ title: `${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} points` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  const isAdmin = userRoles.includes("admin");
  const isMod = userRoles.includes("moderator");
  const isWriter = userRoles.includes("writer");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header with User Info */}
        <div className="relative bg-gradient-to-br from-primary/20 via-accent/10 to-transparent p-6 border-b border-border">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/30">
              <AvatarImage src={user.avatar_url || ''} />
              <AvatarFallback className="bg-primary/20 text-xl">
                {(user.display_name || user.username || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {user.display_name || user.username || "Anonymous User"}
                {isAdmin && <Badge variant="destructive" className="text-xs">Admin</Badge>}
                {isMod && <Badge className="text-xs bg-primary/20 text-primary">Mod</Badge>}
                {isWriter && <Badge variant="secondary" className="text-xs">Writer</Badge>}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {user.username ? `@${user.username}` : 'No username set'} • 
                Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{(formData.points || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-border px-6">
            <TabsList className="h-12 bg-transparent gap-4 -mb-px">
              <TabsTrigger value="profile" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="social" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <MessageCircle className="w-4 h-4 mr-2" />
                Social
              </TabsTrigger>
              <TabsTrigger value="roles" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <Shield className="w-4 h-4 mr-2" />
                Roles & Permissions
              </TabsTrigger>
              <TabsTrigger value="account" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <Lock className="w-4 h-4 mr-2" />
                Account
              </TabsTrigger>
            </TabsList>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-0 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <AtSign className="w-4 h-4 text-muted-foreground" />
                  Username
                </label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="username"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  placeholder="User bio..."
                />
              </div>

              {/* Points Management */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Points Balance</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{formData.points.toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => addPoints(100)} className="text-green-500">
                    +100
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addPoints(500)} className="text-green-500">
                    +500
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addPoints(-100)} className="text-red-500">
                    -100
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Social Tab */}
            <TabsContent value="social" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#5865F2]" />
                    Discord Tag
                  </label>
                  <Input
                    value={formData.discord_tag}
                    onChange={(e) => setFormData({ ...formData, discord_tag: e.target.value })}
                    placeholder="username#0000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Twitch className="w-4 h-4 text-[#9146FF]" />
                    Twitch Username
                  </label>
                  <Input
                    value={formData.twitch_username}
                    onChange={(e) => setFormData({ ...formData, twitch_username: e.target.value })}
                    placeholder="twitch_user"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#53fc19]" />
                  Kick Username
                </label>
                <Input
                  value={formData.kick_username}
                  onChange={(e) => setFormData({ ...formData, kick_username: e.target.value })}
                  placeholder="kick_user"
                />
              </div>
            </TabsContent>

            {/* Roles Tab */}
            <TabsContent value="roles" className="mt-0 space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Manage this user's roles and permissions. Changes take effect immediately.
              </p>
              
              <div className="space-y-3">
                {/* Admin Role */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-semibold">Administrator</p>
                      <p className="text-xs text-muted-foreground">Full access to all features</p>
                    </div>
                  </div>
                  <Button 
                    type="button"
                    variant={isAdmin ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => onUpdateRole(user.user_id, "admin", isAdmin ? "remove" : "add")}
                  >
                    {isAdmin ? "Remove" : "Grant"}
                  </Button>
                </div>

                {/* Moderator Role */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Moderator</p>
                      <p className="text-xs text-muted-foreground">Can moderate content and users</p>
                    </div>
                  </div>
                  <Button 
                    type="button"
                    variant={isMod ? "default" : "outline"}
                    size="sm"
                    onClick={() => onUpdateRole(user.user_id, "moderator", isMod ? "remove" : "add")}
                  >
                    {isMod ? "Remove" : "Grant"}
                  </Button>
                </div>

                {/* Writer Role */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-accent/10 border border-accent/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                      <Hash className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">Writer</p>
                      <p className="text-xs text-muted-foreground">Can create and edit content</p>
                    </div>
                  </div>
                  <Button 
                    type="button"
                    variant={isWriter ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => onUpdateRole(user.user_id, "writer", isWriter ? "remove" : "add")}
                  >
                    {isWriter ? "Remove" : "Grant"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="mt-0 space-y-4">
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold">Update Email Address</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter new email address"
                    className="flex-1"
                  />
                  <Button 
                    type="button"
                    onClick={updateEmail}
                    disabled={isUpdatingEmail || !formData.email}
                    className="gap-2"
                  >
                    {isUpdatingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    Update
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">The user will need to verify the new email address</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span className="font-semibold text-amber-200">Account Information</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">User ID</p>
                    <p className="font-mono text-xs">{user.user_id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p>{format(new Date(user.created_at), 'PPpp')}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Actions */}
            <div className="flex gap-3 pt-6 mt-6 border-t border-border">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="flex-1 gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
