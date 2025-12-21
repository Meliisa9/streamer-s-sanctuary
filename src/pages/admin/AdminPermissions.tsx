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

const permissionLabels: Record<string, { label: string; description: string }> = {
  create_articles: { label: "Create Articles", description: "Can create new news articles" },
  edit_own_articles: { label: "Edit Own Articles", description: "Can edit articles they authored" },
  delete_own_articles: { label: "Delete Own Articles", description: "Can delete articles they authored" },
  manage_videos: { label: "Manage Videos", description: "Can add, edit, and delete videos" },
  manage_bonuses: { label: "Manage Bonuses", description: "Can manage casino bonuses" },
  manage_giveaways: { label: "Manage Giveaways", description: "Can create and manage giveaways" },
  manage_events: { label: "Manage Events", description: "Can create and manage events" },
  manage_gtw: { label: "Manage Guess The Win", description: "Can manage GTW sessions" },
  manage_users: { label: "Manage Users", description: "Can manage user accounts and roles" },
  manage_settings: { label: "Manage Settings", description: "Can change site settings" },
  change_live_status: { label: "Change Live Status", description: "Can toggle stream live status" },
  manage_polls: { label: "Manage Polls", description: "Can create and manage polls" },
  bypass_maintenance: { label: "Bypass Maintenance Mode", description: "Can access the site during maintenance mode" },
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {permissions.map((perm) => {
                const info = permissionLabels[perm.permission] || { label: perm.permission, description: "" };
                return (
                  <div 
                    key={perm.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      perm.allowed 
                        ? "bg-primary/5 border-primary/20" 
                        : "bg-secondary/30 border-border/50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {perm.allowed ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="font-medium text-sm">{info.label}</span>
                      </div>
                      {info.description && (
                        <p className="text-xs text-muted-foreground mt-1 ml-6">{info.description}</p>
                      )}
                    </div>
                    <Switch
                      checked={perm.allowed}
                      onCheckedChange={(checked) => permissionMutation.mutate({ id: perm.id, allowed: checked })}
                      disabled={role === "admin"} // Admin always has all permissions
                    />
                  </div>
                );
              })}
            </div>
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
