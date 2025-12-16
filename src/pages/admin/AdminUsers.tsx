import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Shield, User as UserIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  points: number;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: "user" | "moderator" | "admin";
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

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

  const updateUserRole = async (userId: string, role: "user" | "moderator" | "admin", action: "add" | "remove") => {
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Users</h2>
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
      </div>

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
                    <span className="text-primary font-semibold">{user.points.toLocaleString()}</span>
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
                      {!isUserAdmin && !isUserMod && (
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
                      <div className="flex items-center justify-end gap-2">
                        {!isUserMod ? (
                          <Button variant="ghost" size="sm" onClick={() => updateUserRole(user.user_id, "moderator", "add")}>
                            Make Mod
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => updateUserRole(user.user_id, "moderator", "remove")}>
                            Remove Mod
                          </Button>
                        )}
                        {!isUserAdmin ? (
                          <Button variant="ghost" size="sm" onClick={() => updateUserRole(user.user_id, "admin", "add")}>
                            Make Admin
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => updateUserRole(user.user_id, "admin", "remove")}>
                            Remove Admin
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
