import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Shield, Users, Check, X, Loader2, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";

interface RolePermission {
  id: string;
  role: string;
  permission: string;
  allowed: boolean;
}

const allPermissions = [
  { key: "create_articles", label: "Create Articles", description: "Can create new news articles" },
  { key: "edit_own_articles", label: "Edit Own Articles", description: "Can edit articles they authored" },
  { key: "delete_own_articles", label: "Delete Own Articles", description: "Can delete articles they authored" },
  { key: "manage_videos", label: "Manage Videos", description: "Can add, edit, and delete videos" },
  { key: "manage_bonuses", label: "Manage Bonuses", description: "Can manage casino bonuses" },
  { key: "manage_giveaways", label: "Manage Giveaways", description: "Can create and manage giveaways" },
  { key: "manage_events", label: "Manage Events", description: "Can create and manage events" },
  { key: "manage_gtw", label: "Manage Guess The Win", description: "Can manage GTW sessions" },
  { key: "manage_users", label: "Manage Users", description: "Can manage user accounts and roles" },
  { key: "manage_settings", label: "Manage Settings", description: "Can change site settings" },
  { key: "change_live_status", label: "Change Live Status", description: "Can toggle stream live status" },
  { key: "manage_polls", label: "Manage Polls", description: "Can create and manage polls" },
  { key: "view_dev_diagnostics", label: "View Dev Diagnostics", description: "Can see the developer diagnostics overlay" },
];

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

export default function AdminRoles() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [newPermissions, setNewPermissions] = useState<Record<string, boolean>>({});

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

  const { data: userCounts = {} } = useQuery({
    queryKey: ["user-role-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((r) => {
        counts[r.role] = (counts[r.role] || 0) + 1;
      });
      return counts;
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ role, permission, allowed }: { role: string; permission: string; allowed: boolean }) => {
      // Check if permission exists
      const existing = rolePermissions.find(p => p.role === role && p.permission === permission);
      
      if (existing) {
        const { error } = await supabase
          .from("role_permissions")
          .update({ allowed })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("role_permissions")
          .insert({ role: role as "admin" | "moderator" | "writer" | "user", permission, allowed });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      toast({ title: "Permission updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ role, permissions }: { role: string; permissions: Record<string, boolean> }) => {
      for (const [permission, allowed] of Object.entries(permissions)) {
        const existing = rolePermissions.find(p => p.role === role && p.permission === permission);
        
        if (existing) {
          await supabase.from("role_permissions").update({ allowed }).eq("id", existing.id);
        } else {
          await supabase.from("role_permissions").insert({ role: role as "admin" | "moderator" | "writer" | "user", permission, allowed });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      toast({ title: "Permissions updated successfully" });
      setIsDialogOpen(false);
      setSelectedRole(null);
      setNewPermissions({});
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const permissionsByRole = rolePermissions.reduce((acc, perm) => {
    if (!acc[perm.role]) acc[perm.role] = {};
    acc[perm.role][perm.permission] = perm.allowed;
    return acc;
  }, {} as Record<string, Record<string, boolean>>);

  const getPermissionValue = (role: string, permission: string) => {
    return permissionsByRole[role]?.[permission] ?? false;
  };

  const handleEditRole = (role: string) => {
    setSelectedRole(role);
    const current: Record<string, boolean> = {};
    allPermissions.forEach(p => {
      current[p.key] = getPermissionValue(role, p.key);
    });
    setNewPermissions(current);
    setIsDialogOpen(true);
  };

  const handleSavePermissions = () => {
    if (selectedRole) {
      bulkUpdateMutation.mutate({ role: selectedRole, permissions: newPermissions });
    }
  };

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
        <p className="text-muted-foreground">Only admins can manage roles</p>
      </div>
    );
  }

  const roleOrder = ["admin", "moderator", "writer", "user"];

  return (
    <div className="space-y-6">
      <AdminSettingsNav />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Role Management</h2>
          <p className="text-muted-foreground">Configure roles and their permissions</p>
        </div>
      </div>

      <div className="glass rounded-xl p-4 flex items-start gap-3 border border-blue-500/20 bg-blue-500/5">
        <Info className="w-5 h-5 text-blue-500 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-500">About Roles</p>
          <p className="text-muted-foreground">
            Roles are predefined (admin, moderator, writer, user) and stored in the database enum. 
            You can customize what permissions each role has. Users are assigned roles in the User Management section.
          </p>
        </div>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roleOrder.map((role) => {
          const permissions = permissionsByRole[role] || {};
          const enabledCount = Object.values(permissions).filter(Boolean).length;
          const totalCount = allPermissions.length;
          
          return (
            <div key={role} className="glass rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${roleColors[role].replace('text-', 'bg-').replace('/10', '/20')}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold capitalize">{role}</h3>
                      <Badge variant="outline" className={roleColors[role]}>
                        {userCounts[role] || 0} users
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{roleDescriptions[role]}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-green-500" />
                    {enabledCount} enabled
                  </span>
                  <span className="flex items-center gap-1">
                    <X className="w-4 h-4 text-muted-foreground" />
                    {totalCount - enabledCount} disabled
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditRole(role)}
                  disabled={role === "admin"} // Admin always has all permissions
                >
                  {role === "admin" ? "View Permissions" : "Edit Permissions"}
                </Button>
              </div>
              
              {/* Quick permission preview */}
              <div className="mt-4 flex flex-wrap gap-1">
                {allPermissions.slice(0, 5).map((p) => (
                  <span
                    key={p.key}
                    className={`px-2 py-0.5 text-xs rounded ${
                      getPermissionValue(role, p.key)
                        ? "bg-green-500/10 text-green-500"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {p.label}
                  </span>
                ))}
                {allPermissions.length > 5 && (
                  <span className="px-2 py-0.5 text-xs rounded bg-secondary text-muted-foreground">
                    +{allPermissions.length - 5} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Permissions Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setSelectedRole(null); setNewPermissions({}); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="outline" className={roleColors[selectedRole || "user"]}>
                {selectedRole?.charAt(0).toUpperCase()}{selectedRole?.slice(1)}
              </Badge>
              Role Permissions
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {allPermissions.map((permission) => (
              <div
                key={permission.key}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  newPermissions[permission.key]
                    ? "bg-primary/5 border-primary/20"
                    : "bg-secondary/30 border-border/50"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {newPermissions[permission.key] ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-medium text-sm">{permission.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">{permission.description}</p>
                </div>
                <Switch
                  checked={newPermissions[permission.key] || false}
                  onCheckedChange={(checked) => setNewPermissions({ ...newPermissions, [permission.key]: checked })}
                  disabled={selectedRole === "admin"}
                />
              </div>
            ))}
          </div>

          {selectedRole !== "admin" && (
            <Button onClick={handleSavePermissions} className="w-full mt-4">
              Save Permissions
            </Button>
          )}
          
          {selectedRole === "admin" && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Admin role always has all permissions enabled
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
