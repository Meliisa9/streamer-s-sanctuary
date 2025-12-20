import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Shield, Plus, Save, Loader2, Settings, Users, 
  Crown, UserCog, PenTool, User, Trash2, Edit2,
  Check, X, AlertTriangle, Lock, ChevronDown, Sparkles, UserPlus, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface CustomRole {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
}

interface CustomRolePermission {
  id: string;
  custom_role_id: string;
  permission: string;
  allowed: boolean;
}

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

interface UserCustomRole {
  id: string;
  user_id: string;
  custom_role_id: string;
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

const roleConfig: Record<string, { icon: any; color: string; description: string; isBuiltIn: boolean }> = {
  admin: { icon: Crown, color: "bg-amber-500/10 text-amber-500 border-amber-500/30", description: "Full system access", isBuiltIn: true },
  moderator: { icon: Shield, color: "bg-blue-500/10 text-blue-500 border-blue-500/30", description: "Content moderation", isBuiltIn: true },
  writer: { icon: PenTool, color: "bg-green-500/10 text-green-500 border-green-500/30", description: "Content creation", isBuiltIn: true },
  user: { icon: User, color: "bg-gray-500/10 text-gray-500 border-gray-500/30", description: "Basic access", isBuiltIn: true },
};

const colorOptions = [
  { value: "#EF4444", label: "Red" },
  { value: "#F97316", label: "Orange" },
  { value: "#EAB308", label: "Yellow" },
  { value: "#22C55E", label: "Green" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#6B7280", label: "Gray" },
];

export default function AdminRoleManagement() {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("roles");
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newPermissions, setNewPermissions] = useState<Record<string, boolean>>({});
  const [expandedRoles, setExpandedRoles] = useState<string[]>(["admin", "moderator"]);
  
  // Custom role creation state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDisplayName, setNewRoleDisplayName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRoleColor, setNewRoleColor] = useState("#3B82F6");
  const [newRolePermissions, setNewRolePermissions] = useState<Record<string, boolean>>({});
  
  // Custom role editing state
  const [editingCustomRole, setEditingCustomRole] = useState<CustomRole | null>(null);
  const [editCustomRolePermissions, setEditCustomRolePermissions] = useState<Record<string, boolean>>({});

  // User assignment state
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigningRoleType, setAssigningRoleType] = useState<"builtin" | "custom">("builtin");
  const [assigningRoleName, setAssigningRoleName] = useState<string>("");
  const [assigningCustomRoleId, setAssigningCustomRoleId] = useState<string>("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Fetch role permissions (built-in roles)
  const { data: rolePermissions = [], isLoading } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("role_permissions").select("*").order("role");
      if (error) throw error;
      return data as RolePermission[];
    },
  });

  // Fetch custom roles
  const { data: customRoles = [] } = useQuery({
    queryKey: ["custom-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_roles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CustomRole[];
    },
  });

  // Fetch custom role permissions
  const { data: customRolePermissions = [] } = useQuery({
    queryKey: ["custom-role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_role_permissions").select("*");
      if (error) throw error;
      return data as CustomRolePermission[];
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

  // Fetch custom role user counts
  const { data: customRoleCounts = {} } = useQuery({
    queryKey: ["custom-role-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_custom_roles").select("custom_role_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((r) => { counts[r.custom_role_id] = (counts[r.custom_role_id] || 0) + 1; });
      return counts;
    },
  });

  // Fetch all users for assignment
  const { data: allUsers = [] } = useQuery({
    queryKey: ["all-users-for-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, username, display_name, avatar_url")
        .order("username");
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // Fetch user roles
  const { data: userRoles = [] } = useQuery({
    queryKey: ["user-roles-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data as UserRole[];
    },
  });

  // Fetch user custom roles
  const { data: userCustomRoles = [] } = useQuery({
    queryKey: ["user-custom-roles-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_custom_roles").select("*");
      if (error) throw error;
      return data as UserCustomRole[];
    },
  });

  // Create custom role mutation
  const createCustomRole = useMutation({
    mutationFn: async () => {
      const { data: roleData, error: roleError } = await supabase
        .from("custom_roles")
        .insert({
          name: newRoleName.toLowerCase().replace(/\s+/g, "_"),
          display_name: newRoleDisplayName,
          description: newRoleDescription || null,
          color: newRoleColor,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (roleError) throw roleError;

      const permissionsToInsert = Object.entries(newRolePermissions)
        .filter(([_, allowed]) => allowed)
        .map(([permission]) => ({
          custom_role_id: roleData.id,
          permission,
          allowed: true,
        }));

      if (permissionsToInsert.length > 0) {
        const { error: permError } = await supabase
          .from("custom_role_permissions")
          .insert(permissionsToInsert);
        if (permError) throw permError;
      }

      return roleData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-roles"] });
      queryClient.invalidateQueries({ queryKey: ["custom-role-permissions"] });
      setShowCreateDialog(false);
      resetCreateForm();
      toast({ title: "Custom role created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating role", description: error.message, variant: "destructive" });
    },
  });

  // Update custom role permissions mutation
  const updateCustomRolePermissions = useMutation({
    mutationFn: async ({ roleId, permissions }: { roleId: string; permissions: Record<string, boolean> }) => {
      await supabase.from("custom_role_permissions").delete().eq("custom_role_id", roleId);

      const permissionsToInsert = Object.entries(permissions)
        .filter(([_, allowed]) => allowed)
        .map(([permission]) => ({
          custom_role_id: roleId,
          permission,
          allowed: true,
        }));

      if (permissionsToInsert.length > 0) {
        const { error } = await supabase.from("custom_role_permissions").insert(permissionsToInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-role-permissions"] });
      setEditingCustomRole(null);
      toast({ title: "Role permissions updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating permissions", description: error.message, variant: "destructive" });
    },
  });

  // Delete custom role mutation
  const deleteCustomRole = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("custom_roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-roles"] });
      queryClient.invalidateQueries({ queryKey: ["custom-role-permissions"] });
      toast({ title: "Role deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting role", description: error.message, variant: "destructive" });
    },
  });

  // Assign built-in role to user
  const assignBuiltInRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: role as any }, { onConflict: "user_id,role" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles-list"] });
      queryClient.invalidateQueries({ queryKey: ["role-counts"] });
      toast({ title: "Role assigned successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error assigning role", description: error.message, variant: "destructive" });
    },
  });

  // Remove built-in role from user
  const removeBuiltInRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles-list"] });
      queryClient.invalidateQueries({ queryKey: ["role-counts"] });
      toast({ title: "Role removed successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error removing role", description: error.message, variant: "destructive" });
    },
  });

  // Assign custom role to user
  const assignCustomRole = useMutation({
    mutationFn: async ({ userId, customRoleId }: { userId: string; customRoleId: string }) => {
      const { error } = await supabase
        .from("user_custom_roles")
        .insert({ user_id: userId, custom_role_id: customRoleId, assigned_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-custom-roles-list"] });
      queryClient.invalidateQueries({ queryKey: ["custom-role-counts"] });
      toast({ title: "Custom role assigned successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error assigning role", description: error.message, variant: "destructive" });
    },
  });

  // Remove custom role from user
  const removeCustomRole = useMutation({
    mutationFn: async ({ userId, customRoleId }: { userId: string; customRoleId: string }) => {
      const { error } = await supabase
        .from("user_custom_roles")
        .delete()
        .eq("user_id", userId)
        .eq("custom_role_id", customRoleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-custom-roles-list"] });
      queryClient.invalidateQueries({ queryKey: ["custom-role-counts"] });
      toast({ title: "Custom role removed successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error removing role", description: error.message, variant: "destructive" });
    },
  });

  // Update built-in role permission mutation
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

  // Bulk update built-in role permissions
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

  const resetCreateForm = () => {
    setNewRoleName("");
    setNewRoleDisplayName("");
    setNewRoleDescription("");
    setNewRoleColor("#3B82F6");
    setNewRolePermissions({});
  };

  const startEditingRole = (role: string) => {
    const perms: Record<string, boolean> = {};
    allPermissions.forEach((p) => {
      const existing = rolePermissions.find((rp) => rp.role === role && rp.permission === p.key);
      perms[p.key] = existing?.allowed ?? false;
    });
    setNewPermissions(perms);
    setEditingRole(role);
  };

  const startEditingCustomRole = (role: CustomRole) => {
    const perms: Record<string, boolean> = {};
    allPermissions.forEach((p) => {
      const existing = customRolePermissions.find(
        (rp) => rp.custom_role_id === role.id && rp.permission === p.key
      );
      perms[p.key] = existing?.allowed ?? false;
    });
    setEditCustomRolePermissions(perms);
    setEditingCustomRole(role);
  };

  const openAssignDialog = (roleType: "builtin" | "custom", roleName: string, customRoleId?: string) => {
    setAssigningRoleType(roleType);
    setAssigningRoleName(roleName);
    setAssigningCustomRoleId(customRoleId || "");
    setUserSearchQuery("");
    setShowAssignDialog(true);
  };

  const getPermissionCount = (role: string) => {
    return rolePermissions.filter((rp) => rp.role === role && rp.allowed).length;
  };

  const getCustomRolePermissionCount = (roleId: string) => {
    return customRolePermissions.filter((rp) => rp.custom_role_id === roleId && rp.allowed).length;
  };

  const toggleRoleExpansion = (role: string) => {
    setExpandedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const userHasBuiltInRole = (userId: string, role: string) => {
    return userRoles.some((ur) => ur.user_id === userId && ur.role === role);
  };

  const userHasCustomRole = (userId: string, customRoleId: string) => {
    return userCustomRoles.some((ucr) => ucr.user_id === userId && ucr.custom_role_id === customRoleId);
  };

  const filteredUsers = allUsers.filter((u) => {
    const searchLower = userSearchQuery.toLowerCase();
    return (
      (u.username?.toLowerCase().includes(searchLower) || false) ||
      (u.display_name?.toLowerCase().includes(searchLower) || false)
    );
  });

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

  // Combine built-in and custom roles for unified view
  type RoleDisplay = {
    id: string;
    name: string;
    displayName: string;
    description: string;
    color: string;
    customColor?: string;
    icon: any;
    isBuiltIn: boolean;
    userCount: number;
    permCount: number;
    customRoleData?: CustomRole;
  };

  const allRolesForDisplay: RoleDisplay[] = [
    ...builtInRoles.map((role) => ({
      id: role,
      name: role,
      displayName: role.charAt(0).toUpperCase() + role.slice(1),
      description: roleConfig[role]?.description || "",
      color: roleConfig[role]?.color || "",
      icon: roleConfig[role]?.icon || User,
      isBuiltIn: true,
      userCount: roleCounts[role] || 0,
      permCount: role === "admin" ? allPermissions.length : getPermissionCount(role),
    })),
    ...customRoles.map((role) => ({
      id: role.id,
      name: role.name,
      displayName: role.display_name,
      description: role.description || "Custom role",
      color: "",
      customColor: role.color,
      icon: Sparkles,
      isBuiltIn: false,
      userCount: customRoleCounts[role.id] || 0,
      permCount: getCustomRolePermissionCount(role.id),
      customRoleData: role,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <AdminPageHeader
          title="Role Management"
          description="Manage user roles and their permissions"
          icon={Shield}
        />
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Role
        </Button>
      </div>

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
            Configure permissions for roles and assign them to users. Custom roles are marked with a sparkle icon.
          </p>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="roles" className="gap-2">
            <Users className="w-4 h-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="matrix" className="gap-2">
            <Settings className="w-4 h-4" />
            Permission Matrix
          </TabsTrigger>
        </TabsList>

        {/* Unified Roles Tab */}
        <TabsContent value="roles" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allRolesForDisplay.map((role, index) => {
              const Icon = role.icon;
              const isExpanded = expandedRoles.includes(role.id);

              return (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <Collapsible open={isExpanded} onOpenChange={() => toggleRoleExpansion(role.id)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div 
                                className={`p-2 rounded-xl ${role.isBuiltIn ? role.color : ""}`}
                                style={!role.isBuiltIn ? { backgroundColor: `${role.customColor}20`, color: role.customColor } : {}}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  {role.displayName}
                                  {role.name === "admin" && <Lock className="w-4 h-4 text-muted-foreground" />}
                                  {!role.isBuiltIn && (
                                    <Badge variant="outline" className="text-xs">Custom</Badge>
                                  )}
                                </CardTitle>
                                <CardDescription>{role.description}</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-lg font-bold">{role.userCount}</p>
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
                            <Badge variant="outline">{role.permCount} / {allPermissions.length}</Badge>
                          </div>

                          {role.name === "admin" && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                              <span className="text-sm text-amber-500">Admin role has all permissions</span>
                            </div>
                          )}

                          {/* Quick permission view */}
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Permissions</p>
                            <div className="flex flex-wrap gap-1.5">
                              {role.isBuiltIn ? (
                                role.name === "admin" ? (
                                  allPermissions.slice(0, 4).map((p) => (
                                    <Badge key={p.key} variant="secondary" className="text-xs">{p.label}</Badge>
                                  ))
                                ) : (
                                  rolePermissions
                                    .filter((rp) => rp.role === role.name && rp.allowed)
                                    .slice(0, 4)
                                    .map((rp) => (
                                      <Badge key={rp.permission} variant="secondary" className="text-xs">
                                        {allPermissions.find((p) => p.key === rp.permission)?.label || rp.permission}
                                      </Badge>
                                    ))
                                )
                              ) : (
                                customRolePermissions
                                  .filter((rp) => rp.custom_role_id === role.id && rp.allowed)
                                  .slice(0, 4)
                                  .map((rp) => (
                                    <Badge key={rp.permission} variant="secondary" className="text-xs">
                                      {allPermissions.find((p) => p.key === rp.permission)?.label || rp.permission}
                                    </Badge>
                                  ))
                              )}
                              {role.permCount > 4 && (
                                <Badge variant="outline" className="text-xs">+{role.permCount - 4} more</Badge>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            {role.name !== "admin" && (
                              <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={() => role.isBuiltIn ? startEditingRole(role.name) : startEditingCustomRole(role.customRoleData!)}
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit Permissions
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              className="flex-1 gap-2"
                              onClick={() => openAssignDialog(
                                role.isBuiltIn ? "builtin" : "custom",
                                role.displayName,
                                role.isBuiltIn ? role.name : role.id
                              )}
                            >
                              <UserPlus className="w-4 h-4" />
                              Assign Users
                            </Button>
                            {!role.isBuiltIn && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this role?")) {
                                    deleteCustomRole.mutate(role.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {customRoles.length === 0 && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Sparkles className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Create custom roles with specific permissions</p>
                <Button variant="outline" onClick={() => setShowCreateDialog(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Custom Role
                </Button>
              </CardContent>
            </Card>
          )}
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

      {/* Create Custom Role Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Create Custom Role
            </DialogTitle>
            <DialogDescription>
              Create a new role with custom permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role-name">Role Name (internal)</Label>
                  <Input
                    id="role-name"
                    placeholder="e.g., content_manager"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input
                    id="display-name"
                    placeholder="e.g., Content Manager"
                    value={newRoleDisplayName}
                    onChange={(e) => setNewRoleDisplayName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this role is for..."
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Role Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newRoleColor === color.value 
                          ? "border-foreground scale-110" 
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setNewRoleColor(color.value)}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Permissions</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const allEnabled = Object.values(newRolePermissions).every(Boolean);
                    const perms: Record<string, boolean> = {};
                    allPermissions.forEach((p) => { perms[p.key] = !allEnabled; });
                    setNewRolePermissions(perms);
                  }}
                >
                  Toggle All
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2">
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
                      checked={newRolePermissions[perm.key] ?? false}
                      onCheckedChange={(checked) =>
                        setNewRolePermissions((prev) => ({ ...prev, [perm.key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetCreateForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={() => createCustomRole.mutate()}
              disabled={!newRoleName || !newRoleDisplayName || createCustomRole.isPending}
              className="gap-2"
            >
              {createCustomRole.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Built-in Role Dialog */}
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

      {/* Edit Custom Role Dialog */}
      <Dialog open={!!editingCustomRole} onOpenChange={() => setEditingCustomRole(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Edit {editingCustomRole?.display_name} Permissions
            </DialogTitle>
            <DialogDescription>
              Configure which actions this custom role can perform
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
                  checked={editCustomRolePermissions[perm.key] ?? false}
                  onCheckedChange={(checked) =>
                    setEditCustomRolePermissions((prev) => ({ ...prev, [perm.key]: checked }))
                  }
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCustomRole(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => editingCustomRole && updateCustomRolePermissions.mutate({ 
                roleId: editingCustomRole.id, 
                permissions: editCustomRolePermissions 
              })}
              disabled={updateCustomRolePermissions.isPending}
              className="gap-2"
            >
              {updateCustomRolePermissions.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Users Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Assign {assigningRoleName} Role
            </DialogTitle>
            <DialogDescription>
              Toggle users to assign or remove this role
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* User List */}
            <ScrollArea className="h-80">
              <div className="space-y-2 pr-4">
                {filteredUsers.map((userProfile) => {
                  const hasRole = assigningRoleType === "builtin" 
                    ? userHasBuiltInRole(userProfile.user_id, assigningCustomRoleId)
                    : userHasCustomRole(userProfile.user_id, assigningCustomRoleId);

                  return (
                    <div
                      key={userProfile.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={userProfile.avatar_url || undefined} />
                          <AvatarFallback>
                            {(userProfile.username || userProfile.display_name || "U")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{userProfile.display_name || userProfile.username || "Unknown"}</p>
                          {userProfile.username && userProfile.display_name && (
                            <p className="text-xs text-muted-foreground">@{userProfile.username}</p>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={hasRole}
                        onCheckedChange={(checked) => {
                          if (assigningRoleType === "builtin") {
                            if (checked) {
                              assignBuiltInRole.mutate({ userId: userProfile.user_id, role: assigningCustomRoleId });
                            } else {
                              removeBuiltInRole.mutate({ userId: userProfile.user_id, role: assigningCustomRoleId });
                            }
                          } else {
                            if (checked) {
                              assignCustomRole.mutate({ userId: userProfile.user_id, customRoleId: assigningCustomRoleId });
                            } else {
                              removeCustomRole.mutate({ userId: userProfile.user_id, customRoleId: assigningCustomRoleId });
                            }
                          }
                        }}
                        disabled={assignBuiltInRole.isPending || removeBuiltInRole.isPending || assignCustomRole.isPending || removeCustomRole.isPending}
                      />
                    </div>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}