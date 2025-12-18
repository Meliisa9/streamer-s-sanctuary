import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Star, Bell, Search, Loader2, CheckCircle2, Award } from "lucide-react";

export default function AdminBulkActions() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [action, setAction] = useState<"xp" | "notification" | "badge">("xp");
  const [xpAmount, setXpAmount] = useState("100");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [badgeName, setBadgeName] = useState("");
  const [badgeKey, setBadgeKey] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["all-users-bulk"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, points")
        .order("username", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const bulkXpMutation = useMutation({
    mutationFn: async ({ userIds, amount }: { userIds: string[]; amount: number }) => {
      for (const userId of userIds) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("points")
          .eq("user_id", userId)
          .single();
        
        const newPoints = (profile?.points || 0) + amount;
        const { error } = await supabase
          .from("profiles")
          .update({ points: newPoints })
          .eq("user_id", userId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: `XP awarded to ${selectedUsers.length} users` });
      queryClient.invalidateQueries({ queryKey: ["all-users-bulk"] });
      setSelectedUsers([]);
    },
    onError: (error: Error) => {
      toast({ title: "Error awarding XP", description: error.message, variant: "destructive" });
    },
  });

  const bulkNotificationMutation = useMutation({
    mutationFn: async ({ userIds, title, message }: { userIds: string[]; title: string; message: string }) => {
      const notifications = userIds.map((userId) => ({
        user_id: userId,
        title,
        message,
        type: "system",
      }));
      const { error } = await supabase.from("user_notifications").insert(notifications);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: `Notification sent to ${selectedUsers.length} users` });
      setSelectedUsers([]);
      setNotificationTitle("");
      setNotificationMessage("");
    },
    onError: (error: Error) => {
      toast({ title: "Error sending notifications", description: error.message, variant: "destructive" });
    },
  });

  const bulkBadgeMutation = useMutation({
    mutationFn: async ({ userIds, name, key }: { userIds: string[]; name: string; key: string }) => {
      const badges = userIds.map((userId) => ({
        user_id: userId,
        badge_name: name,
        badge_key: key,
      }));
      const { error } = await supabase.from("user_badges").insert(badges);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: `Badge awarded to ${selectedUsers.length} users` });
      setSelectedUsers([]);
      setBadgeName("");
      setBadgeKey("");
    },
    onError: (error: Error) => {
      toast({ title: "Error awarding badges", description: error.message, variant: "destructive" });
    },
  });

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers?.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers?.map((u) => u.user_id) || []);
    }
  };

  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleExecuteAction = () => {
    if (selectedUsers.length === 0) {
      toast({ title: "Please select at least one user", variant: "destructive" });
      return;
    }

    switch (action) {
      case "xp":
        if (!xpAmount || parseInt(xpAmount) === 0) {
          toast({ title: "Please enter an XP amount", variant: "destructive" });
          return;
        }
        bulkXpMutation.mutate({ userIds: selectedUsers, amount: parseInt(xpAmount) });
        break;
      case "notification":
        if (!notificationTitle) {
          toast({ title: "Please enter a notification title", variant: "destructive" });
          return;
        }
        bulkNotificationMutation.mutate({
          userIds: selectedUsers,
          title: notificationTitle,
          message: notificationMessage,
        });
        break;
      case "badge":
        if (!badgeName || !badgeKey) {
          toast({ title: "Please enter badge details", variant: "destructive" });
          return;
        }
        bulkBadgeMutation.mutate({
          userIds: selectedUsers,
          name: badgeName,
          key: badgeKey,
        });
        break;
    }
  };

  const filteredUsers = users?.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.display_name?.toLowerCase().includes(searchLower)
    );
  });

  const isExecuting = bulkXpMutation.isPending || bulkNotificationMutation.isPending || bulkBadgeMutation.isPending;

  if (!isAdmin) {
    return <div className="text-center py-20 text-muted-foreground">Access denied - Admin only</div>;
  }

  return (
    <div>
      <AdminSettingsNav />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Bulk User Actions</h2>
          {selectedUsers.length > 0 && (
            <Badge>{selectedUsers.length} selected</Badge>
          )}
        </div>

        {/* Action Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-secondary/30 rounded-xl">
          <div className="space-y-2">
            <label className="text-sm font-medium">Action Type</label>
            <Select value={action} onValueChange={(v: any) => setAction(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xp">
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Award XP
                  </span>
                </SelectItem>
                <SelectItem value="notification">
                  <span className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-500" />
                    Send Notification
                  </span>
                </SelectItem>
                <SelectItem value="badge">
                  <span className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-500" />
                    Award Badge
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {action === "xp" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">XP Amount</label>
              <Input
                type="number"
                value={xpAmount}
                onChange={(e) => setXpAmount(e.target.value)}
                placeholder="Enter XP amount..."
              />
            </div>
          )}

          {action === "notification" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="Notification title..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Notification message..."
                  rows={2}
                />
              </div>
            </>
          )}

          {action === "badge" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Badge Name</label>
                <Input
                  value={badgeName}
                  onChange={(e) => setBadgeName(e.target.value)}
                  placeholder="e.g., Event Participant"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Badge Key</label>
                <Input
                  value={badgeKey}
                  onChange={(e) => setBadgeKey(e.target.value)}
                  placeholder="e.g., event_participant"
                />
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <Button
              onClick={handleExecuteAction}
              disabled={isExecuting || selectedUsers.length === 0}
              className="w-full gap-2"
            >
              {isExecuting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Execute for {selectedUsers.length} Users
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.length === filteredUsers?.length && filteredUsers?.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.user_id)}
                        onCheckedChange={() => handleSelectUser(user.user_id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                            <Users className="w-4 h-4" />
                          </div>
                        )}
                        <span className="font-medium">
                          {user.display_name || user.username || "Anonymous"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.points || 0} XP</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
