import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, CheckCircle, XCircle, Eye, Trash2, Loader2, 
  Clock, Filter, Search, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

interface BigWin {
  id: string;
  user_id: string;
  game_name: string;
  provider: string | null;
  bet_amount: number | null;
  win_amount: number;
  multiplier: number | null;
  image_url: string | null;
  video_url: string | null;
  description: string | null;
  is_verified: boolean;
  verification_badge: string | null;
  status: string;
  rejection_reason: string | null;
  likes_count: number;
  created_at: string;
  profile?: {
    username: string | null;
    display_name: string | null;
  } | null;
}

export default function AdminWinGallery() {
  const [wins, setWins] = useState<BigWin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWin, setSelectedWin] = useState<BigWin | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [verificationBadge, setVerificationBadge] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchWins();
  }, [statusFilter]);

  const fetchWins = async () => {
    setIsLoading(true);
    let query = supabase
      .from("big_wins")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (!error && data) {
      // Fetch profiles for each win
      const userIds = [...new Set(data.map(w => w.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, display_name")
        .in("user_id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const winsWithProfiles = data.map(win => ({
        ...win,
        profile: profileMap.get(win.user_id) || null
      }));
      
      setWins(winsWithProfiles as BigWin[]);
    }
    setIsLoading(false);
  };

  const approveWin = async (id: string, verified: boolean = false) => {
    const { error } = await supabase
      .from("big_wins")
      .update({
        status: "approved",
        is_verified: verified,
        verification_badge: verified ? verificationBadge || "Verified Win" : null,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (!error) {
      toast({ title: `Win ${verified ? "verified and " : ""}approved` });
      fetchWins();
      setSelectedWin(null);
      setVerificationBadge("");
    }
  };

  const rejectWin = async (id: string) => {
    if (!rejectionReason) {
      toast({ title: "Please provide a rejection reason", variant: "destructive" });
      return;
    }

    const win = wins.find((w) => w.id === id);

    const { error } = await supabase
      .from("big_wins")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (!error) {
      // Notify user
      if (win) {
        await supabase.from("user_notifications").insert({
          user_id: win.user_id,
          title: "Win submission rejected",
          message: `Your ${win.game_name} win was not approved. Reason: ${rejectionReason}`,
          type: "system",
        });
      }

      toast({ title: "Win rejected" });
      fetchWins();
      setSelectedWin(null);
      setRejectionReason("");
    }
  };

  const deleteWin = async (id: string) => {
    const { error } = await supabase.from("big_wins").delete().eq("id", id);
    if (!error) {
      toast({ title: "Win deleted" });
      fetchWins();
    }
  };

  const toggleVerification = async (id: string, currentlyVerified: boolean) => {
    const { error } = await supabase
      .from("big_wins")
      .update({
        is_verified: !currentlyVerified,
        verification_badge: !currentlyVerified ? "Verified Win" : null,
      })
      .eq("id", id);

    if (!error) {
      toast({ title: currentlyVerified ? "Verification removed" : "Win verified" });
      fetchWins();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredWins = wins.filter(
    (win) =>
      win.game_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      win.provider?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      win.profile?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = wins.filter((w) => w.status === "pending").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Win Gallery Moderation"
        description="Review and approve community-submitted wins"
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by game, provider, or username..."
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">
              Pending {pendingCount > 0 && `(${pendingCount})`}
            </SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredWins.length === 0 ? (
        <Card className="glass border-border/50">
          <CardContent className="p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Wins to Review</h3>
            <p className="text-muted-foreground mt-2">
              {statusFilter === "pending"
                ? "All submissions have been reviewed"
                : "No wins match your filter"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Game</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Win Amount</TableHead>
                  <TableHead>Multiplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWins.map((win) => (
                  <TableRow key={win.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{win.game_name}</p>
                        {win.provider && (
                          <p className="text-sm text-muted-foreground">{win.provider}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {win.profile?.display_name || win.profile?.username || "Unknown"}
                    </TableCell>
                    <TableCell className="text-green-400 font-bold">
                      {formatCurrency(win.win_amount)}
                    </TableCell>
                    <TableCell>
                      {win.multiplier ? (
                        <Badge className="bg-yellow-500/20 text-yellow-400">
                          {win.multiplier.toLocaleString()}x
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(win.status)}</TableCell>
                    <TableCell>
                      {win.is_verified ? (
                        <Badge className="bg-green-500/20 text-green-400 gap-1">
                          <Shield className="w-3 h-3" />
                          {win.verification_badge || "Verified"}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedWin(win)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {win.status === "approved" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleVerification(win.id, win.is_verified)}
                          >
                            <Shield className={`w-4 h-4 ${win.is_verified ? "text-green-400" : ""}`} />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteWin(win.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedWin} onOpenChange={() => setSelectedWin(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Win Submission</DialogTitle>
          </DialogHeader>
          {selectedWin && (
            <div className="space-y-6">
              {/* Image Preview */}
              {selectedWin.image_url && (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={selectedWin.image_url}
                    alt="Win screenshot"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Game</Label>
                  <p className="font-medium">{selectedWin.game_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Provider</Label>
                  <p className="font-medium">{selectedWin.provider || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Bet Amount</Label>
                  <p className="font-medium">
                    {selectedWin.bet_amount ? formatCurrency(selectedWin.bet_amount) : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Win Amount</Label>
                  <p className="font-medium text-green-400">
                    {formatCurrency(selectedWin.win_amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Multiplier</Label>
                  <p className="font-medium">
                    {selectedWin.multiplier ? `${selectedWin.multiplier}x` : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted By</Label>
                  <p className="font-medium">
                    {selectedWin.profile?.display_name || selectedWin.profile?.username}
                  </p>
                </div>
              </div>

              {selectedWin.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p>{selectedWin.description}</p>
                </div>
              )}

              {selectedWin.status === "pending" && (
                <>
                  <div>
                    <Label>Verification Badge (optional)</Label>
                    <Input
                      value={verificationBadge}
                      onChange={(e) => setVerificationBadge(e.target.value)}
                      placeholder="e.g., Verified Big Win, Mega Win"
                    />
                  </div>

                  <div>
                    <Label>Rejection Reason (if rejecting)</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide a reason for rejection..."
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => approveWin(selectedWin.id, true)}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Verify & Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => approveWin(selectedWin.id, false)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => rejectWin(selectedWin.id)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </>
              )}

              {selectedWin.status === "rejected" && selectedWin.rejection_reason && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Label className="text-red-400">Rejection Reason</Label>
                  <p>{selectedWin.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
