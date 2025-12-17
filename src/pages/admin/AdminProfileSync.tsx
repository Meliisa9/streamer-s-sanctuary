import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Users, Check, AlertCircle, Loader2, Database, Shield, UserX, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";

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
      // Check for duplicate usernames
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
      // Get profiles and check various integrity issues
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, points");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id");

      if (rolesError) throw rolesError;

      // Find profiles without roles
      const profileUserIds = new Set(profiles?.map(p => p.user_id) || []);
      const roleUserIds = new Set(roles?.map(r => r.user_id) || []);
      
      const profilesWithoutRoles = Array.from(profileUserIds).filter(id => !roleUserIds.has(id));
      const orphanedRoles = Array.from(roleUserIds).filter(id => !profileUserIds.has(id));

      // Check for negative points
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

  return (
    <div className="space-y-6">
      <AdminSettingsNav />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold mb-2">Profile Sync Tool</h2>
        <p className="text-muted-foreground mb-6">
          Synchronize user profiles, fix missing data, and verify database integrity
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Sync Roles Card */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Sync User Roles
              </CardTitle>
              <CardDescription>
                Ensures all users have at least the default "user" role assigned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSyncRoles}
                disabled={isSyncing}
                className="w-full gap-2"
              >
                {isSyncing && activeOperation === "roles" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Sync User Roles
              </Button>
            </CardContent>
          </Card>

          {/* Scan Incomplete Profiles Card */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-yellow-500" />
                Scan Incomplete Profiles
              </CardTitle>
              <CardDescription>
                Find profiles with missing username or display name data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleScanIncomplete}
                disabled={isSyncing}
                variant="outline"
                className="w-full gap-2"
              >
                {isSyncing && activeOperation === "incomplete" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                Scan Profiles
              </Button>
            </CardContent>
          </Card>

          {/* Check Duplicates Card */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                Check for Duplicates
              </CardTitle>
              <CardDescription>
                Find duplicate usernames, display names, Twitch usernames, and Discord tags
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleCheckDuplicates}
                disabled={isSyncing}
                variant="outline"
                className="w-full gap-2"
              >
                {isSyncing && activeOperation === "duplicates" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
                Check Duplicates
              </Button>
            </CardContent>
          </Card>

          {/* Database Integrity Check */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-green-500" />
                Verify Database Integrity
              </CardTitle>
              <CardDescription>
                Check for orphaned records, missing relationships, and data anomalies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleVerifyIntegrity}
                disabled={isSyncing}
                variant="outline"
                className="w-full gap-2"
              >
                {isSyncing && activeOperation === "integrity" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                Verify Integrity
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {syncResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-secondary/50 rounded-lg">
                    <p className="text-2xl font-bold">{syncResult.total}</p>
                    <p className="text-sm text-muted-foreground">Total Profiles</p>
                  </div>
                  <div className="text-center p-4 bg-green-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-green-500">{syncResult.synced}</p>
                    <p className="text-sm text-muted-foreground">Synced</p>
                  </div>
                  <div className="text-center p-4 bg-destructive/10 rounded-lg">
                    <p className="text-2xl font-bold text-destructive">{syncResult.errors.length}</p>
                    <p className="text-sm text-muted-foreground">Issues</p>
                  </div>
                </div>

                {syncResult.details && (
                  <div className="p-4 bg-secondary/30 rounded-lg mb-4">
                    <p className="text-sm">{syncResult.details}</p>
                  </div>
                )}

                {syncResult.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Issues Found:</p>
                    <div className="max-h-32 overflow-y-auto bg-secondary/30 rounded-lg p-3 space-y-1">
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
      </motion.div>
    </div>
  );
}
