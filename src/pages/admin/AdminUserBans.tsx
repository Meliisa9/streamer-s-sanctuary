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
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Ban, UserX, Shield, Search, Loader2, Globe, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function AdminUserBans() {
  const { isAdmin, isModerator } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banForm, setBanForm] = useState({
    reason: "",
    duration: "permanent",
    customDays: "7",
    ipBan: false,
    ipAddress: "",
  });

  const { data: bans, isLoading: bansLoading } = useQuery({
    queryKey: ["user-bans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_bans")
        .select("*")
        .is("unbanned_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ["all-users-for-ban"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .order("username", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const banMutation = useMutation({
    mutationFn: async (banData: {
      userId: string;
      reason: string;
      isPermanent: boolean;
      expiresAt?: string;
      isIpBan: boolean;
      ipAddress?: string;
      bannedBy: string;
    }) => {
      const { error } = await supabase.from("user_bans").insert({
        user_id: banData.userId,
        reason: banData.reason,
        is_permanent: banData.isPermanent,
        expires_at: banData.expiresAt || null,
        is_ip_ban: banData.isIpBan,
        ip_address: banData.ipAddress || null,
        banned_by: banData.bannedBy,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "User banned successfully" });
      queryClient.invalidateQueries({ queryKey: ["user-bans"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error banning user", description: error.message, variant: "destructive" });
    },
  });

  const unbanMutation = useMutation({
    mutationFn: async ({ banId, unbannedBy }: { banId: string; unbannedBy: string }) => {
      const { error } = await supabase
        .from("user_bans")
        .update({ unbanned_at: new Date().toISOString(), unbanned_by: unbannedBy })
        .eq("id", banId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "User unbanned successfully" });
      queryClient.invalidateQueries({ queryKey: ["user-bans"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error unbanning user", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setBanForm({
      reason: "",
      duration: "permanent",
      customDays: "7",
      ipBan: false,
      ipAddress: "",
    });
    setSelectedUser(null);
  };

  const handleBan = async () => {
    if (!selectedUser) {
      toast({ title: "Please select a user", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let expiresAt: string | undefined;
    if (banForm.duration !== "permanent") {
      const days = banForm.duration === "custom" ? parseInt(banForm.customDays) : parseInt(banForm.duration);
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + days);
      expiresAt = expDate.toISOString();
    }

    banMutation.mutate({
      userId: selectedUser.user_id,
      reason: banForm.reason,
      isPermanent: banForm.duration === "permanent",
      expiresAt,
      isIpBan: banForm.ipBan,
      ipAddress: banForm.ipBan ? banForm.ipAddress : undefined,
      bannedBy: user.id,
    });
  };

  const handleUnban = async (banId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    unbanMutation.mutate({ banId, unbannedBy: user.id });
  };

  const getUserInfo = (userId: string) => {
    return users?.find((u) => u.user_id === userId);
  };

  const filteredBans = bans?.filter((ban) => {
    const user = getUserInfo(ban.user_id);
    const searchLower = searchQuery.toLowerCase();
    return (
      user?.username?.toLowerCase().includes(searchLower) ||
      user?.display_name?.toLowerCase().includes(searchLower) ||
      ban.reason?.toLowerCase().includes(searchLower) ||
      ban.ip_address?.includes(searchQuery)
    );
  });

  if (!isAdmin && !isModerator) {
    return <div className="text-center py-20 text-muted-foreground">Access denied</div>;
  }

  return (
    <div>
      <AdminSettingsNav />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Ban className="w-6 h-6 text-destructive" />
            <h2 className="text-xl font-bold">User Bans Management</h2>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserX className="w-4 h-4" />
                Ban User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ban User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select User</label>
                  <Select
                    value={selectedUser?.user_id || ""}
                    onValueChange={(value) => {
                      const user = users?.find((u) => u.user_id === value);
                      setSelectedUser(user);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.display_name || user.username || "Anonymous"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason</label>
                  <Textarea
                    value={banForm.reason}
                    onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                    placeholder="Reason for ban..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration</label>
                  <Select
                    value={banForm.duration}
                    onValueChange={(value) => setBanForm({ ...banForm, duration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Day</SelectItem>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {banForm.duration === "custom" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Custom Days</label>
                    <Input
                      type="number"
                      value={banForm.customDays}
                      onChange={(e) => setBanForm({ ...banForm, customDays: e.target.value })}
                      min="1"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ipBan"
                    checked={banForm.ipBan}
                    onChange={(e) => setBanForm({ ...banForm, ipBan: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="ipBan" className="text-sm font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    IP Ban
                  </label>
                </div>

                {banForm.ipBan && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">IP Address</label>
                    <Input
                      value={banForm.ipAddress}
                      onChange={(e) => setBanForm({ ...banForm, ipAddress: e.target.value })}
                      placeholder="e.g., 192.168.1.1"
                    />
                  </div>
                )}

                <Button
                  onClick={handleBan}
                  disabled={banMutation.isPending}
                  className="w-full gap-2"
                  variant="destructive"
                >
                  {banMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )}
                  Ban User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search bans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Bans Table */}
        {bansLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filteredBans && filteredBans.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Banned On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBans.map((ban) => {
                  const user = getUserInfo(ban.user_id);
                  return (
                    <TableRow key={ban.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                              <UserX className="w-4 h-4" />
                            </div>
                          )}
                          <span className="font-medium">
                            {user?.display_name || user?.username || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {ban.reason || "No reason provided"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {ban.is_permanent && (
                            <Badge variant="destructive">Permanent</Badge>
                          )}
                          {ban.is_ip_ban && (
                            <Badge variant="secondary" className="gap-1">
                              <Globe className="w-3 h-3" />
                              IP
                            </Badge>
                          )}
                          {!ban.is_permanent && !ban.is_ip_ban && (
                            <Badge variant="outline">Temporary</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ban.is_permanent ? (
                          <span className="text-destructive">Never</span>
                        ) : ban.expires_at ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(ban.expires_at), "MMM d, yyyy")}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(ban.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnban(ban.id)}
                          disabled={unbanMutation.isPending}
                          className="gap-1"
                        >
                          <Shield className="w-3 h-3" />
                          Unban
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-50" />
            No active bans found
          </div>
        )}
      </motion.div>
    </div>
  );
}
