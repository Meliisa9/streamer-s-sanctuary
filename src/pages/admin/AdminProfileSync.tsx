import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Users, Check, AlertCircle, Loader2 } from "lucide-react";
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
}

export default function AdminProfileSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const handleSync = async () => {
    if (!isAdmin) {
      toast({ title: "Access denied", variant: "destructive" });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, twitch_username, discord_tag");

      if (profilesError) throw profilesError;

      let syncedCount = 0;
      const errors: string[] = [];

      // For each profile, check if it needs syncing
      for (const profile of profiles || []) {
        try {
          // Check if user has roles
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.user_id);

          // If no roles exist, add default user role
          if (!roles || roles.length === 0) {
            await supabase.from("user_roles").insert({
              user_id: profile.user_id,
              role: "user",
            });
            syncedCount++;
          }
        } catch (err: any) {
          // Ignore duplicate key errors
          if (!err.message?.includes("duplicate")) {
            errors.push(`User ${profile.user_id}: ${err.message}`);
          }
        }
      }

      setSyncResult({
        total: profiles?.length || 0,
        synced: syncedCount,
        errors,
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
    }
  };

  const handleSyncFromOAuth = async () => {
    if (!isAdmin) {
      toast({ title: "Access denied", variant: "destructive" });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      // This will trigger a refresh for all users who have incomplete profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .or("username.is.null,display_name.is.null");

      if (error) throw error;

      toast({
        title: "Scan complete",
        description: `Found ${profiles?.length || 0} profiles with missing data. Users will be prompted to complete their profiles on next login.`,
      });

      setSyncResult({
        total: profiles?.length || 0,
        synced: 0,
        errors: [],
      });
    } catch (error: any) {
      toast({
        title: "Scan failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
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
          Synchronize user profiles and fix missing data
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Sync Roles Card */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Sync User Roles
              </CardTitle>
              <CardDescription>
                Ensures all users have at least the default "user" role assigned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full gap-2"
              >
                {isSyncing ? (
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
                <AlertCircle className="w-5 h-5 text-accent" />
                Scan Incomplete Profiles
              </CardTitle>
              <CardDescription>
                Find profiles with missing username or display name data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSyncFromOAuth}
                disabled={isSyncing}
                variant="outline"
                className="w-full gap-2"
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Scan Profiles
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
                  Sync Results
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
                    <p className="text-sm text-muted-foreground">Errors</p>
                  </div>
                </div>

                {syncResult.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Errors:</p>
                    <div className="max-h-32 overflow-y-auto bg-secondary/30 rounded-lg p-3">
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
