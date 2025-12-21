import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Loader2, Users, Check, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";

interface RolePermission {
  id: string;
  role: string;
  permission: string;
  allowed: boolean;
}

const permissionLabels: Record<string, { label: string; description: string; category: string }> = {
  // Content Management
  create_articles: { label: "Create Articles", description: "Can create new news articles", category: "Content" },
  edit_own_articles: { label: "Edit Own Articles", description: "Can edit articles they authored", category: "Content" },
  delete_own_articles: { label: "Delete Own Articles", description: "Can delete articles they authored", category: "Content" },
  manage_videos: { label: "Manage Videos", description: "Can add, edit, and delete videos", category: "Content" },
  manage_bonuses: { label: "Manage Bonuses", description: "Can manage casino bonuses", category: "Content" },
  moderate_comments: { label: "Moderate Comments", description: "Can moderate user comments", category: "Content" },
  manage_content_flags: { label: "Manage Content Flags", description: "Can review and resolve flagged content", category: "Content" },
  
  // Community & Engagement
  manage_giveaways: { label: "Manage Giveaways", description: "Can create and manage giveaways", category: "Community" },
  manage_events: { label: "Manage Events", description: "Can create and manage events", category: "Community" },
  manage_gtw: { label: "Manage Guess The Win", description: "Can manage GTW sessions", category: "Community" },
  manage_polls: { label: "Manage Polls", description: "Can create and manage polls", category: "Community" },
  manage_bonus_hunt: { label: "Manage Bonus Hunt", description: "Can manage bonus hunt sessions", category: "Community" },
  send_notifications: { label: "Send Notifications", description: "Can send notifications to users", category: "Community" },
  
  // Stream & Streamers
  change_live_status: { label: "Change Live Status", description: "Can toggle stream live status", category: "Streaming" },
  manage_streamers: { label: "Manage Streamers", description: "Can manage streamer profiles and stats", category: "Streaming" },
  
  // User Management
  manage_users: { label: "Manage Users", description: "Can manage user accounts and roles", category: "Users" },
  view_user_details: { label: "View User Details", description: "Can view detailed user information", category: "Users" },
  
  // System & Settings
  manage_settings: { label: "Manage Settings", description: "Can change site settings", category: "System" },
  manage_branding: { label: "Manage Branding", description: "Can configure white-label branding", category: "System" },
  manage_legal_pages: { label: "Manage Legal Pages", description: "Can edit legal pages and policies", category: "System" },
  manage_webhooks: { label: "Manage Webhooks", description: "Can configure webhook integrations", category: "System" },
  bulk_actions: { label: "Bulk Actions", description: "Can perform bulk operations on content", category: "System" },
  
  // Analytics & Monitoring
  view_audit_logs: { label: "View Audit Logs", description: "Can view system audit logs", category: "Analytics" },
  view_own_analytics: { label: "View Own Analytics", description: "Can view their own content analytics", category: "Analytics" },
  view_dev_diagnostics: { label: "View Dev Diagnostics", description: "Can access developer diagnostics overlay", category: "Analytics" },
  
  // Access Control
  bypass_maintenance: { label: "Bypass Maintenance Mode", description: "Can access the site during maintenance mode", category: "Access" },
};

const roleColors: Record<string, string> = {
  admin: "bg-red-500/10 text-red-500 border-red-500/20",
  moderator: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  writer: "bg-green-500/10 text-green-500 border-green-500/20",
  user: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const roleDescriptions: Record<string, string> = {
  admin: "Full access to all features and settings",
  moderator: "Can moderate content and manage most features",
  writer: "Can create and manage their own content",
  user: "Standard user with basic permissions",
};

export default function AdminPermissions() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: rolePermissions = [], isLoading } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*")
        .order("role", { ascending: true });
      if (error) throw error;
      return data as RolePermission[];
    },
  });

  const permissionMutation = useMutation({
    mutationFn: async ({ id, allowed }: { id: string; allowed: boolean }) => {
      const { error } = await supabase
        .from("role_permissions")
        .update({ allowed })
        .eq("id", id);
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

  const permissionsByRole = rolePermissions.reduce((acc, perm) => {
    if (!acc[perm.role]) acc[perm.role] = [];
    acc[perm.role].push(perm);
    return acc;
  }, {} as Record<string, RolePermission[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Only admins can manage permissions</p>
      </div>
    );
  }

  const roleOrder = ["admin", "moderator", "writer", "user"];
  const sortedRoles = Object.keys(permissionsByRole).sort(
    (a, b) => roleOrder.indexOf(a) - roleOrder.indexOf(b)
  );

  return (
    <div className="space-y-6">
      <AdminSettingsNav />
      
      <div>
        <h2 className="text-2xl font-bold">Role Permissions</h2>
        <p className="text-muted-foreground">Configure what each role can do in the system</p>
      </div>

      {/* Role Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {roleOrder.map((role) => {
          const permissions = permissionsByRole[role] || [];
          const enabledCount = permissions.filter(p => p.allowed).length;
          return (
            <div key={role} className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={roleColors[role]}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{roleDescriptions[role]}</p>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span>{enabledCount} enabled</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission Tables by Role */}
      {sortedRoles.map((role, index) => {
        const permissions = permissionsByRole[role] || [];
        return (
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${roleColors[role].replace('text-', 'bg-').replace('/10', '/20')}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold capitalize">{role} Role</h3>
                  <p className="text-sm text-muted-foreground">{roleDescriptions[role]}</p>
                </div>
              </div>
              <Badge variant="outline" className={roleColors[role]}>
                {permissions.filter(p => p.allowed).length}/{permissions.length} enabled
              </Badge>
            </div>
            
            {/* Group permissions by category */}
            {(() => {
              const categories = permissions.reduce((acc, perm) => {
                const info = permissionLabels[perm.permission] || { label: perm.permission, description: "", category: "Other" };
                const cat = info.category || "Other";
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push({ ...perm, info });
                return acc;
              }, {} as Record<string, Array<typeof permissions[0] & { info: typeof permissionLabels[string] }>>);

              const categoryOrder = ["Content", "Community", "Streaming", "Users", "System", "Analytics", "Access", "Other"];
              const sortedCategories = Object.keys(categories).sort(
                (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
              );

              return sortedCategories.map((category) => (
                <div key={category} className="mb-4 last:mb-0">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {categories[category].map((perm) => (
                      <div 
                        key={perm.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          perm.allowed 
                            ? "bg-primary/5 border-primary/20" 
                            : "bg-secondary/30 border-border/50"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {perm.allowed ? (
                              <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="font-medium text-sm">{perm.info.label}</span>
                          </div>
                          {perm.info.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 ml-5 line-clamp-1">{perm.info.description}</p>
                          )}
                        </div>
                        <Switch
                          checked={perm.allowed}
                          onCheckedChange={(checked) => permissionMutation.mutate({ id: perm.id, allowed: checked })}
                          disabled={role === "admin"}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </motion.div>
        );
      })}

      {Object.keys(permissionsByRole).length === 0 && (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-2">No permissions configured</p>
          <p className="text-sm">Permissions will be created automatically when roles are assigned to users.</p>
        </div>
      )}
    </div>
  );
}
