import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Shield, User as UserIcon, Loader2, Plus, Pencil, Save, X, UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [editingEmail, setEditingEmail] = useState<{ userId: string; email: string } | null>(null);
  const [editForm, setEditForm] = useState({
    username: "",
    display_name: "",
    bio: "",
    discord_tag: "",
    twitch_username: "",
    points: 0,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    password: "",
    username: "",
    display_name: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const { toast } = useToast();
  const { isAdmin, user: currentUser } = useAuth();
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});

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
    setEditForm({
      username: user.username || "",
      display_name: user.display_name || "",
      bio: user.bio || "",
      discord_tag: user.discord_tag || "",
      twitch_username: user.twitch_username || "",
      points: user.points || 0,
    });
  };

  const saveUserChanges = async () => {
    if (!editingUser || !isAdmin) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: editForm.username || null,
          display_name: editForm.display_name || null,
          bio: editForm.bio || null,
          discord_tag: editForm.discord_tag || null,
          twitch_username: editForm.twitch_username || null,
          points: editForm.points,
        })
        .eq("id", editingUser.id);

      if (error) throw error;

      toast({ title: "User updated successfully" });
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const updateUserEmail = async () => {
    if (!isAdmin || !editingEmail) return;
    
    setIsUpdatingEmail(true);

    try {
      const response = await supabase.functions.invoke("create-user", {
        body: {
          action: "update_email",
          user_id: editingEmail.userId,
          new_email: editingEmail.email,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to update email");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({ title: "Email updated successfully" });
      setEditingEmail(null);
      // Update local state
      setUserEmails(prev => ({ ...prev, [editingEmail.userId]: editingEmail.email }));
    } catch (error: any) {
      toast({ title: "Error updating email", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdatingEmail(false);
    }
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
      toast({ title: `Added ${amount} points` });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const createManualUser = async () => {
    if (!isAdmin) return;
    
    if (!newUserForm.email || !newUserForm.password) {
      toast({ title: "Email and password are required", variant: "destructive" });
      return;
    }

    if (newUserForm.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsCreatingUser(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await supabase.functions.invoke("create-user", {
        body: {
          email: newUserForm.email,
          password: newUserForm.password,
          username: newUserForm.username,
          display_name: newUserForm.display_name,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to create user");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({ title: "User created successfully" });
      setShowAddModal(false);
      setNewUserForm({ email: "", password: "", username: "", display_name: "" });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error creating user", description: error.message, variant: "destructive" });
    } finally {
      setIsCreatingUser(false);
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
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    placeholder="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input
                    value={newUserForm.display_name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, display_name: e.target.value })}
                    placeholder="Display Name"
                  />
                </div>
                <Button onClick={createManualUser} disabled={isCreatingUser} className="w-full gap-2">
                  {isCreatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Edit User</h3>
            <Button variant="ghost" size="sm" onClick={() => setEditingUser(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Username</label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <input
                type="text"
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Discord Tag</label>
              <input
                type="text"
                value={editForm.discord_tag}
                onChange={(e) => setEditForm({ ...editForm, discord_tag: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Twitch Username</label>
              <input
                type="text"
                value={editForm.twitch_username}
                onChange={(e) => setEditForm({ ...editForm, twitch_username: e.target.value })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Points</label>
              <input
                type="number"
                value={editForm.points}
                onChange={(e) => setEditForm({ ...editForm, points: parseInt(e.target.value) || 0 })}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="email"
                  value={editingEmail?.userId === editingUser.user_id ? editingEmail.email : (userEmails[editingUser.user_id] || "")}
                  onChange={(e) => setEditingEmail({ userId: editingUser.user_id, email: e.target.value })}
                  placeholder="Enter new email address"
                  className="flex-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
                <Button 
                  onClick={updateUserEmail} 
                  disabled={isUpdatingEmail || !editingEmail || editingEmail.userId !== editingUser.user_id || !editingEmail.email}
                  size="sm"
                  className="gap-2"
                >
                  {isUpdatingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Update
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Email changes require confirmation</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={3}
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={saveUserChanges} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
          </div>
        </motion.div>
      )}

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
