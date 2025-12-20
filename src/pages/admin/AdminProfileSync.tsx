import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Users, Check, AlertCircle, Loader2, Database, Shield, UserX, UserCheck, Wrench, Activity, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface SyncResult {
  total: number;
  synced: number;
  errors: string[];
  details?: string;
}

export default function AdminProfileSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [activeOperation, setActiveOperation] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const handleSyncRoles = async () => {
    if (!isAdmin) {
      toast({ title: "Access denied", variant: "destructive" });
      return;
    }

    setIsSyncing(true);
    setActiveOperation("roles");
    setSyncResult(null);

    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, display_name");

      if (profilesError) throw profilesError;

      let syncedCount = 0;
      const errors: string[] = [];

      for (const profile of profiles || []) {
        try {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.user_id);

          if (!roles || roles.length === 0) {
            await supabase.from("user_roles").insert({
              user_id: profile.user_id,
              role: "user",
            });
            syncedCount++;
          }
        } catch (err: any) {
          if (!err.message?.includes("duplicate")) {
            errors.push(`User ${profile.username || profile.user_id}: ${err.message}`);
          }
        }
      }

      setSyncResult({
        total: profiles?.length || 0,
        synced: syncedCount,
        errors,
        details: `Assigned default "user" role to ${syncedCount} profiles`,
      });

      toast({
        title: "Sync complete",
        description: `Checked ${profiles?.length || 0} profiles, synced ${syncedCount} missing roles`,
      });
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setActiveOperation(null);
    }
  };

  const handleScanIncomplete = async () => {
    if (!isAdmin) {
      toast({ title: "Access denied", variant: "destructive" });
      return;
    }

    setIsSyncing(true);
    setActiveOperation("incomplete");
    setSyncResult(null);

    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .or("username.is.null,display_name.is.null");

      if (error) throw error;

      const incompleteList = profiles?.map(p => 
        p.username || p.display_name || p.user_id.substring(0, 8)
      ).join(", ") || "None";

      toast({
        title: "Scan complete",
        description: `Found ${profiles?.length || 0} profiles with missing data`,
      });

      setSyncResult({
        total: profiles?.length || 0,
        synced: 0,
        errors: [],
        details: profiles && profiles.length > 0 
          ? `Incomplete profiles: ${incompleteList}` 
          : "All profiles have username and display name",
      });
    } catch (error: any) {
      toast({
        title: "Scan failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setActiveOperation(null);
    }
  };

  const handleCheckDuplicates = async () => {
    if (!isAdmin) {
      toast({ title: "Access denied", variant: "destructive" });
      return;
    }

    setIsSyncing(true);
    setActiveOperation("duplicates");
    setSyncResult(null);

    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("username, display_name, twitch_username, discord_tag");

      if (error) throw error;

      const usernames = profiles?.map(p => p.username?.toLowerCase()).filter(Boolean) || [];
      const displayNames = profiles?.map(p => p.display_name?.toLowerCase()).filter(Boolean) || [];
      const twitchNames = profiles?.map(p => p.twitch_username?.toLowerCase()).filter(Boolean) || [];
      const discordTags = profiles?.map(p => p.discord_tag?.toLowerCase()).filter(Boolean) || [];

      const findDuplicates = (arr: string[]) => {
        const seen = new Set<string>();
        const duplicates = new Set<string>();
        arr.forEach(item => {
          if (seen.has(item)) duplicates.add(item);
          seen.add(item);
        });
        return Array.from(duplicates);
      };

      const dupUsernames = findDuplicates(usernames);
      const dupDisplayNames = findDuplicates(displayNames);
      const dupTwitch = findDuplicates(twitchNames);
      const dupDiscord = findDuplicates(discordTags);

      const totalDuplicates = dupUsernames.length + dupDisplayNames.length + dupTwitch.length + dupDiscord.length;
      const errors: string[] = [];
      
      if (dupUsernames.length > 0) errors.push(`Duplicate usernames: ${dupUsernames.join(", ")}`);
      if (dupDisplayNames.length > 0) errors.push(`Duplicate display names: ${dupDisplayNames.join(", ")}`);
      if (dupTwitch.length > 0) errors.push(`Duplicate Twitch usernames: ${dupTwitch.join(", ")}`);
      if (dupDiscord.length > 0) errors.push(`Duplicate Discord tags: ${dupDiscord.join(", ")}`);

      toast({
        title: totalDuplicates > 0 ? "Duplicates found" : "No duplicates",
        description: totalDuplicates > 0 
          ? `Found ${totalDuplicates} duplicate entries` 
          : "All profile fields are unique",
        variant: totalDuplicates > 0 ? "destructive" : "default",
      });

      setSyncResult({
        total: profiles?.length || 0,
        synced: 0,
        errors,
        details: totalDuplicates > 0 
          ? `Found ${totalDuplicates} total duplicate entries that need manual review`
          : "All usernames, display names, Twitch usernames, and Discord tags are unique",
      });
    } catch (error: any) {
      toast({
        title: "Check failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setActiveOperation(null);
    }
  };

  const handleVerifyIntegrity = async () => {
    if (!isAdmin) {
      toast({ title: "Access denied", variant: "destructive" });
      return;
    }

    setIsSyncing(true);
    setActiveOperation("integrity");
    setSyncResult(null);

    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, points");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id");

      if (rolesError) throw rolesError;

      const profileUserIds = new Set(profiles?.map(p => p.user_id) || []);
      const roleUserIds = new Set(roles?.map(r => r.user_id) || []);
      
      const profilesWithoutRoles = Array.from(profileUserIds).filter(id => !roleUserIds.has(id));
      const orphanedRoles = Array.from(roleUserIds).filter(id => !profileUserIds.has(id));
      const negativePoints = profiles?.filter(p => (p.points || 0) < 0) || [];

      const errors: string[] = [];
      if (profilesWithoutRoles.length > 0) {
        errors.push(`${profilesWithoutRoles.length} profiles without roles`);
      }
      if (orphanedRoles.length > 0) {
        errors.push(`${orphanedRoles.length} orphaned role entries`);
      }
      if (negativePoints.length > 0) {
        errors.push(`${negativePoints.length} profiles with negative points`);
      }

      const totalIssues = profilesWithoutRoles.length + orphanedRoles.length + negativePoints.length;

      toast({
        title: totalIssues > 0 ? "Issues found" : "Database healthy",
        description: totalIssues > 0 
          ? `Found ${totalIssues} integrity issues` 
          : "No integrity issues detected",
        variant: totalIssues > 0 ? "destructive" : "default",
      });

      setSyncResult({
        total: profiles?.length || 0,
        synced: 0,
        errors,
        details: totalIssues > 0 
          ? `Found ${totalIssues} issues that may need attention`
          : "Database integrity check passed - all profiles have roles and valid data",
      });
    } catch (error: any) {
      toast({
        title: "Check failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setActiveOperation(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  const syncTools = [
    {
      id: "roles",
      icon: Shield,
      color: "primary",
      title: "Sync User Roles",
      description: "Ensures all users have at least the default 'user' role assigned",
      action: handleSyncRoles,
      buttonText: "Sync Roles",
      buttonIcon: RefreshCw,
    },
    {
      id: "incomplete",
      icon: UserX,
      color: "amber",
      title: "Scan Incomplete Profiles",
      description: "Find profiles with missing username or display name data",
      action: handleScanIncomplete,
      buttonText: "Scan Profiles",
      buttonIcon: AlertCircle,
    },
    {
      id: "duplicates",
      icon: Users,
      color: "blue",
      title: "Check for Duplicates",
      description: "Find duplicate usernames, display names, and social accounts",
      action: handleCheckDuplicates,
      buttonText: "Check Duplicates",
      buttonIcon: UserCheck,
    },
    {
      id: "integrity",
      icon: Database,
      color: "green",
      title: "Verify Database Integrity",
      description: "Check for orphaned records, missing relationships, and anomalies",
      action: handleVerifyIntegrity,
      buttonText: "Verify Integrity",
      buttonIcon: Database,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      primary: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
      amber: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
      blue: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
      green: { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/20" },
    };
    return colors[color] || colors.primary;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
            <Wrench className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Profile Sync Tool</h2>
            <p className="text-muted-foreground">
              Synchronize user profiles, fix missing data, and verify database integrity
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <Activity className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-green-500">System Healthy</span>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {syncTools.map((tool, index) => {
          const colors = getColorClasses(tool.color);
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-xl p-4 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <tool.icon className={`w-4 h-4 ${colors.text}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tool</p>
                  <p className="text-sm font-semibold">{tool.title.split(" ").slice(0, 2).join(" ")}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sync Tools Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {syncTools.map((tool, index) => {
          const colors = getColorClasses(tool.color);
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass border-border/50 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${colors.bg} border ${colors.border}`}>
                      <tool.icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{tool.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {tool.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={tool.action}
                    disabled={isSyncing}
                    variant={tool.id === "roles" ? "glow" : "outline"}
                    className="w-full gap-2"
                  >
                    {isSyncing && activeOperation === tool.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <tool.buttonIcon className="w-4 h-4" />
                    )}
                    {tool.buttonText}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Results */}
      {syncResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass border-border/50 overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-accent/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <CardTitle>Sync Results</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-secondary/50 rounded-xl border border-border/50">
                  <p className="text-3xl font-bold">{syncResult.total}</p>
                  <p className="text-sm text-muted-foreground">Total Profiles</p>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                  <p className="text-3xl font-bold text-green-500">{syncResult.synced}</p>
                  <p className="text-sm text-muted-foreground">Synced</p>
                </div>
                <div className="text-center p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                  <p className="text-3xl font-bold text-destructive">{syncResult.errors.length}</p>
                  <p className="text-sm text-muted-foreground">Issues</p>
                </div>
              </div>

              {syncResult.details && (
                <div className="p-4 bg-secondary/30 rounded-xl mb-4 border border-border/50">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                    <p className="text-sm">{syncResult.details}</p>
                  </div>
                </div>
              )}

              {syncResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    Issues Found
                  </p>
                  <div className="max-h-32 overflow-y-auto bg-secondary/30 rounded-xl p-4 space-y-2 border border-border/50">
                    {syncResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive">{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}