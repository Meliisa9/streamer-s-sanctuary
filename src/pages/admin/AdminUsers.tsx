import { useState, useEffect } from "react";
import { Search, Shield, User as UserIcon, Loader2, UserPlus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EnhancedAddUserModal, EnhancedEditUserModal } from "@/components/admin/EnhancedUserModal";

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  points: number;
  bio: string | null;
  discord_tag: string | null;
  twitch_username: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: "user" | "moderator" | "admin" | "writer";
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const { toast } = useToast();
  const { isAdmin, user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      setUsers(profilesData || []);

      // Fetch roles
      const { data: rolesData } = await supabase.from("user_roles").select("*");
      
      const rolesByUser: Record<string, string[]> = {};
      rolesData?.forEach((r: UserRole) => {
        if (!rolesByUser[r.user_id]) rolesByUser[r.user_id] = [];
        rolesByUser[r.user_id].push(r.role);
      });
      setRoles(rolesByUser);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: "user" | "moderator" | "admin" | "writer", action: "add" | "remove") => {
    if (!isAdmin) {
      toast({ title: "Access denied", description: "Only admins can manage roles", variant: "destructive" });
      return;
    }

    try {
      if (action === "add") {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      }
      toast({ title: `Role ${action === "add" ? "added" : "removed"}` });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const startEditing = (user: UserProfile) => {
    setEditingUser(user);
  };

  const addPoints = async (userId: string, amount: number) => {
    if (!isAdmin) return;

    const user = users.find((u) => u.user_id === userId);
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ points: (user.points || 0) + amount })
        .eq("user_id", userId);

      if (error) throw error;
      toast({ title: `${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} points` });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteUser = async () => {
    if (!isAdmin || !userToDelete) return;

    // Prevent deleting yourself
    if (userToDelete.user_id === currentUser?.id) {
      toast({ title: "Cannot delete yourself", variant: "destructive" });
      setUserToDelete(null);
      return;
    }

    setIsDeletingUser(true);

    try {
      const response = await supabase.functions.invoke("create-user", {
        body: {
          action: "delete",
          user_id: userToDelete.user_id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to delete user");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({ title: "User deleted successfully" });
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error deleting user", description: error.message, variant: "destructive" });
    } finally {
      setIsDeletingUser(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    (user.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.display_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Manage Users</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="pl-9 pr-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary w-64"
            />
          </div>
          <Button className="gap-2" onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Enhanced Add User Modal */}
      <EnhancedAddUserModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={fetchUsers}
      />

      {/* Enhanced Edit User Modal */}
      <EnhancedEditUserModal
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        user={editingUser}
        userRoles={editingUser ? (roles[editingUser.user_id] || ["user"]) : []}
        onSuccess={fetchUsers}
        onUpdateRole={updateUserRole}
      />

      {/* Delete User Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.display_name || userToDelete?.username || "this user"}? 
              This action cannot be undone and will permanently remove all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteUser} 
              disabled={isDeletingUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingUser ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Users Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left p-4 text-sm font-medium">User</th>
              <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Points</th>
              <th className="text-left p-4 text-sm font-medium">Roles</th>
              <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Joined</th>
              {isAdmin && <th className="text-right p-4 text-sm font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const userRoles = roles[user.user_id] || ["user"];
              const isUserAdmin = userRoles.includes("admin");
              const isUserMod = userRoles.includes("moderator");
              const isUserWriter = userRoles.includes("writer");

              return (
                <tr key={user.id} className="border-b border-border/50 last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{user.display_name || user.username || "Anonymous"}</p>
                        {user.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <span className="text-primary font-semibold">{(user.points || 0).toLocaleString()}</span>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => addPoints(user.user_id, 100)}
                            className="p-1 hover:bg-secondary rounded text-xs text-green-500"
                            title="Add 100 points"
                          >
                            +100
                          </button>
                          <button
                            onClick={() => addPoints(user.user_id, -100)}
                            className="p-1 hover:bg-secondary rounded text-xs text-red-500"
                            title="Remove 100 points"
                          >
                            -100
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {isUserAdmin && (
                        <span className="px-2 py-0.5 text-xs bg-destructive/20 text-destructive rounded-full flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      )}
                      {isUserMod && (
                        <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                          Moderator
                        </span>
                      )}
                      {isUserWriter && (
                        <span className="px-2 py-0.5 text-xs bg-accent/20 text-accent rounded-full">
                          Writer
                        </span>
                      )}
                      {!isUserAdmin && !isUserMod && !isUserWriter && (
                        <span className="px-2 py-0.5 text-xs bg-secondary text-muted-foreground rounded-full">
                          User
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <Button variant="ghost" size="sm" onClick={() => startEditing(user)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setUserToDelete(user)}
                          disabled={user.user_id === currentUser?.id}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        {!isUserWriter ? (
                          <Button variant="ghost" size="sm" onClick={() => updateUserRole(user.user_id, "writer", "add")}>
                            +Writer
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => updateUserRole(user.user_id, "writer", "remove")}>
                            -Writer
                          </Button>
                        )}
                        {!isUserMod ? (
                          <Button variant="ghost" size="sm" onClick={() => updateUserRole(user.user_id, "moderator", "add")}>
                            +Mod
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => updateUserRole(user.user_id, "moderator", "remove")}>
                            -Mod
                          </Button>
                        )}
                        {!isUserAdmin ? (
                          <Button variant="ghost" size="sm" onClick={() => updateUserRole(user.user_id, "admin", "add")}>
                            +Admin
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => updateUserRole(user.user_id, "admin", "remove")}>
                            -Admin
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
