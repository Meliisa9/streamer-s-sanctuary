import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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

const permissionLabels: Record<string, string> = {
  create_articles: "Create Articles",
  edit_own_articles: "Edit Own Articles",
  delete_own_articles: "Delete Own Articles",
  manage_videos: "Manage Videos",
  manage_bonuses: "Manage Bonuses",
  manage_giveaways: "Manage Giveaways",
  manage_events: "Manage Events",
  manage_gtw: "Manage Guess The Win",
  manage_users: "Manage Users",
  manage_settings: "Manage Settings",
  change_live_status: "Change Live Status",
  manage_polls: "Manage Polls",
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

  return (
    <div className="space-y-6">
      <AdminSettingsNav />
      
      <div>
        <h2 className="text-2xl font-bold">Role Permissions</h2>
        <p className="text-muted-foreground">Configure what each role can do</p>
      </div>

      {Object.entries(permissionsByRole).map(([role, permissions]) => (
        <motion.div
          key={role}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 capitalize">
            <Shield className="w-5 h-5 text-primary" />
            {role} Role
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissions.map((perm) => (
              <div key={perm.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                <span className="text-sm">{permissionLabels[perm.permission] || perm.permission}</span>
                <Switch
                  checked={perm.allowed}
                  onCheckedChange={(checked) => permissionMutation.mutate({ id: perm.id, allowed: checked })}
                />
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {Object.keys(permissionsByRole).length === 0 && (
        <div className="glass rounded-2xl p-6 text-center text-muted-foreground">
          No role permissions configured yet. They will be created automatically when roles are assigned.
        </div>
      )}
    </div>
  );
}
