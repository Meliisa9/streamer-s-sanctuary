import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Plus, Save, Loader2, Settings, Users, 
  Crown, UserCog, PenTool, User, Trash2, Edit2,
  Check, X, AlertTriangle, Lock, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AdminPageHeader } from "@/components/admin";

interface RolePermission {
  id: string;
  role: string;
  permission: string;
  allowed: boolean;
}

const allPermissions = [
  { key: "manage_videos", label: "Manage Videos", description: "Create, edit, delete videos" },
  { key: "manage_articles", label: "Manage Articles", description: "Create, edit, delete news articles" },
  { key: "manage_giveaways", label: "Manage Giveaways", description: "Create and manage giveaways" },
  { key: "manage_events", label: "Manage Events", description: "Create and manage events" },
  { key: "manage_polls", label: "Manage Polls", description: "Create and manage polls" },
  { key: "manage_bonuses", label: "Manage Bonuses", description: "Create and manage casino bonuses" },
  { key: "manage_users", label: "Manage Users", description: "View and moderate user accounts" },
  { key: "manage_settings", label: "Manage Settings", description: "Access site settings" },
  { key: "manage_streamers", label: "Manage Streamers", description: "Manage streamer profiles" },
  { key: "view_analytics", label: "View Analytics", description: "Access analytics dashboard" },
  { key: "view_audit_log", label: "View Audit Log", description: "View audit log entries" },
  { key: "send_notifications", label: "Send Notifications", description: "Send notifications to users" },
  { key: "moderate_content", label: "Moderate Content", description: "Review and moderate content" },
  { key: "manage_bans", label: "Manage Bans", description: "Ban and unban users" },
  { key: "view_dev_diagnostics", label: "View Dev Diagnostics", description: "Access developer diagnostics overlay" },
  { key: "manage_webhooks", label: "Manage Webhooks", description: "Configure webhook notifications" },
];

const builtInRoles = ["admin", "moderator", "writer", "user"];

const roleConfig: Record<string, { icon: any; color: string; description: string }> = {
  admin: { icon: Crown, color: "bg-amber-500/10 text-amber-500 border-amber-500/30", description: "Full system access" },
  moderator: { icon: Shield, color: "bg-blue-500/10 text-blue-500 border-blue-500/30", description: "Content moderation" },
  writer: { icon: PenTool, color: "bg-green-500/10 text-green-500 border-green-500/30", description: "Content creation" },
  user: { icon: User, color: "bg-gray-500/10 text-gray-500 border-gray-500/30", description: "Basic access" },
};

export default function AdminRoleManagement() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("roles");
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newPermissions, setNewPermissions] = useState<Record<string, boolean>>({});
  const [expandedRoles, setExpandedRoles] = useState<string[]>(["admin", "moderator"]);

  // Fetch role permissions
  const { data: rolePermissions = [], isLoading } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("role_permissions").select("*").order("role");
      if (error) throw error;
      return data as RolePermission[];
    },
  });

  // Fetch user counts by role
  const { data: roleCounts = {} } = useQuery({
    queryKey: ["role-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((r) => { counts[r.role] = (counts[r.role] || 0) + 1; });
      return counts;
    },
  });

  // Update permission mutation
  const updatePermission = useMutation({
    mutationFn: async ({ role, permission, allowed }: { role: string; permission: string; allowed: boolean }) => {
      const { error } = await supabase
        .from("role_permissions")
        .upsert({ role: role as any, permission, allowed }, { onConflict: "role,permission" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      toast({ title: "Permission updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Bulk update permissions
  const bulkUpdatePermissions = useMutation({
    mutationFn: async ({ role, permissions }: { role: string; permissions: Record<string, boolean> }) => {
      for (const [permission, allowed] of Object.entries(permissions)) {
        const { error } = await supabase
          .from("role_permissions")
          .upsert({ role: role as any, permission, allowed }, { onConflict: "role,permission" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      setEditingRole(null);
      setNewPermissions({});
      toast({ title: "Role permissions updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const startEditingRole = (role: string) => {
    const perms: Record<string, boolean> = {};
    allPermissions.forEach((p) => {
      const existing = rolePermissions.find((rp) => rp.role === role && rp.permission === p.key);
      perms[p.key] = existing?.allowed ?? false;
    });
    setNewPermissions(perms);
    setEditingRole(role);
  };

  const getPermissionCount = (role: string) => {
    return rolePermissions.filter((rp) => rp.role === role && rp.allowed).length;
  };

  const toggleRoleExpansion = (role: string) => {
    setExpandedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Role Management"
        description="Manage user roles and their permissions"
        icon={Shield}
      />

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
      >
        <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
        <div>
          <p className="font-medium text-blue-500">Role-Based Access Control</p>
          <p className="text-sm text-muted-foreground">
            Configure permissions for each role. Admin role always has full access.
          </p>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="roles" className="gap-2">
            <Users className="w-4 h-4" />
            Roles Overview
          </TabsTrigger>
          <TabsTrigger value="matrix" className="gap-2">
            <Settings className="w-4 h-4" />
            Permission Matrix
          </TabsTrigger>
        </TabsList>

        {/* Roles Overview Tab */}
        <TabsContent value="roles" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {builtInRoles.map((role, index) => {
              const config = roleConfig[role] || roleConfig.user;
              const Icon = config.icon;
              const permCount = getPermissionCount(role);
              const userCount = roleCounts[role] || 0;
              const isExpanded = expandedRoles.includes(role);

              return (
                <motion.div
                  key={role}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <Collapsible open={isExpanded} onOpenChange={() => toggleRoleExpansion(role)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${config.color}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <CardTitle className="text-lg capitalize flex items-center gap-2">
                                  {role}
                                  {role === "admin" && <Lock className="w-4 h-4 text-muted-foreground" />}
                                </CardTitle>
                                <CardDescription>{config.description}</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-lg font-bold">{userCount}</p>
                                <p className="text-xs text-muted-foreground">users</p>
                              </div>
                              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                            <span className="text-sm font-medium">Permissions Enabled</span>
                            <Badge variant="outline">{role === "admin" ? allPermissions.length : permCount} / {allPermissions.length}</Badge>
                          </div>
                          
                          {role !== "admin" && (
                            <Button
                              variant="outline"
                              className="w-full gap-2"
                              onClick={() => startEditingRole(role)}
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit Permissions
                            </Button>
                          )}

                          {role === "admin" && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                              <span className="text-sm text-amber-500">Admin role has all permissions</span>
                            </div>
                          )}

                          {/* Quick permission view */}
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Permissions</p>
                            <div className="flex flex-wrap gap-1.5">
                              {role === "admin" ? (
                                allPermissions.slice(0, 6).map((p) => (
                                  <Badge key={p.key} variant="secondary" className="text-xs">{p.label}</Badge>
                                ))
                              ) : (
                                rolePermissions
                                  .filter((rp) => rp.role === role && rp.allowed)
                                  .slice(0, 6)
                                  .map((rp) => (
                                    <Badge key={rp.permission} variant="secondary" className="text-xs">
                                      {allPermissions.find((p) => p.key === rp.permission)?.label || rp.permission}
                                    </Badge>
                                  ))
                              )}
                              {(role === "admin" ? allPermissions.length > 6 : permCount > 6) && (
                                <Badge variant="outline" className="text-xs">
                                  +{(role === "admin" ? allPermissions.length : permCount) - 6} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Permission Matrix Tab */}
        <TabsContent value="matrix" className="mt-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-secondary/30">
                      <th className="text-left p-4 font-semibold">Permission</th>
                      {builtInRoles.map((role) => (
                        <th key={role} className="text-center p-4 font-semibold capitalize w-24">
                          {role}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allPermissions.map((perm, index) => (
                      <motion.tr
                        key={perm.key}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-border/30 hover:bg-secondary/20 transition-colors"
                      >
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-sm">{perm.label}</p>
                            <p className="text-xs text-muted-foreground">{perm.description}</p>
                          </div>
                        </td>
                        {builtInRoles.map((role) => {
                          const isAllowed = role === "admin" ? true : rolePermissions.find((rp) => rp.role === role && rp.permission === perm.key)?.allowed ?? false;
                          
                          return (
                            <td key={role} className="text-center p-4">
                              {role === "admin" ? (
                                <div className="flex justify-center">
                                  <div className="p-1 rounded-full bg-green-500/20">
                                    <Check className="w-4 h-4 text-green-500" />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <Switch
                                    checked={isAllowed}
                                    onCheckedChange={(checked) =>
                                      updatePermission.mutate({ role, permission: perm.key, allowed: checked })
                                    }
                                    disabled={updatePermission.isPending}
                                  />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 capitalize">
              <Shield className="w-5 h-5 text-primary" />
              Edit {editingRole} Permissions
            </DialogTitle>
            <DialogDescription>
              Configure which actions this role can perform
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {allPermissions.map((perm) => (
              <div
                key={perm.key}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{perm.label}</p>
                  <p className="text-xs text-muted-foreground">{perm.description}</p>
                </div>
                <Switch
                  checked={newPermissions[perm.key] ?? false}
                  onCheckedChange={(checked) =>
                    setNewPermissions((prev) => ({ ...prev, [perm.key]: checked }))
                  }
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRole(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => editingRole && bulkUpdatePermissions.mutate({ role: editingRole, permissions: newPermissions })}
              disabled={bulkUpdatePermissions.isPending}
              className="gap-2"
            >
              {bulkUpdatePermissions.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
