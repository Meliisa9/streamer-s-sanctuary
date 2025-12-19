import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Flag, Check, X, Eye, Loader2, MessageSquare, BarChart, FileText, 
  AlertTriangle, Ban, ShieldAlert, Clock, UserX, Bell
} from "lucide-react";
import { format } from "date-fns";

type RestrictionType = 'restrict_comments' | 'restrict_polls' | 'restrict_giveaways' | 'restrict_bonushunt';

const restrictionOptions: { value: RestrictionType; label: string }[] = [
  { value: 'restrict_comments', label: 'Restrict Comments' },
  { value: 'restrict_polls', label: 'Restrict Polls' },
  { value: 'restrict_giveaways', label: 'Restrict Giveaways' },
  { value: 'restrict_bonushunt', label: 'Restrict Bonus Hunt' },
];

export default function AdminModerationQueue() {
  const { isAdmin, isModerator, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFlag, setSelectedFlag] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionType, setActionType] = useState<"review" | "warn" | "ban" | "restrict">("review");
  const [warningMessage, setWarningMessage] = useState("");
  const [banDuration, setBanDuration] = useState("");
  const [banReason, setBanReason] = useState("");
  const [selectedRestrictions, setSelectedRestrictions] = useState<RestrictionType[]>([]);
  const [restrictionDuration, setRestrictionDuration] = useState("");

  const { data: flags, isLoading } = useQuery({
    queryKey: ["content-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_flags")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, display_name");
      if (error) throw error;
      return data;
    },
  });

  // Get content owner for actions
  const getContentOwner = async (contentType: string, contentId: string) => {
    if (contentType === "comment" || contentType === "news_comment") {
      const { data } = await supabase.from("news_comments").select("user_id").eq("id", contentId).single();
      return data?.user_id;
    } else if (contentType === "profile_comment") {
      const { data } = await supabase.from("profile_comments").select("author_id").eq("id", contentId).single();
      return data?.author_id;
    } else if (contentType === "profile") {
      return contentId;
    }
    return null;
  };

  const reviewMutation = useMutation({
    mutationFn: async ({ flagId, status, notes }: { flagId: string; status: string; notes: string }) => {
      const { error } = await supabase
        .from("content_flags")
        .update({
          status,
          notes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", flagId);
      if (error) throw error;

      if (status === "removed" && selectedFlag) {
        if (selectedFlag.content_type === "comment") {
          await supabase.from("news_comments").update({ is_approved: false }).eq("id", selectedFlag.content_id);
        } else if (selectedFlag.content_type === "profile_comment") {
          await supabase.from("profile_comments").update({ is_approved: false }).eq("id", selectedFlag.content_id);
        }
      }
    },
    onSuccess: (_, variables) => {
      toast({ title: `Content ${variables.status === "removed" ? "removed" : variables.status}` });
      queryClient.invalidateQueries({ queryKey: ["content-flags"] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error reviewing flag", description: error.message, variant: "destructive" });
    },
  });

  const warnMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      // Add warning to log
      const { error: warnError } = await supabase.from("user_warnings").insert({
        user_id: userId,
        warned_by: user?.id,
        reason,
      });
      if (warnError) throw warnError;

      // Send notification to user
      await supabase.from("user_notifications").insert({
        user_id: userId,
        type: "warning",
        title: "⚠️ Warning from Moderators",
        message: reason,
      });
    },
    onSuccess: () => {
      toast({ title: "Warning sent to user" });
      queryClient.invalidateQueries({ queryKey: ["content-flags"] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error sending warning", description: error.message, variant: "destructive" });
    },
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, reason, duration }: { userId: string; reason: string; duration: string }) => {
      const expiresAt = duration === "permanent" ? null : 
        new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from("user_bans").insert({
        user_id: userId,
        banned_by: user?.id!,
        reason,
        is_permanent: duration === "permanent",
        expires_at: expiresAt,
      });
      if (error) throw error;

      // Send notification
      await supabase.from("user_notifications").insert({
        user_id: userId,
        type: "ban",
        title: "🚫 Account Suspended",
        message: `Your account has been suspended. Reason: ${reason}`,
      });
    },
    onSuccess: () => {
      toast({ title: "User banned successfully" });
      queryClient.invalidateQueries({ queryKey: ["content-flags"] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error banning user", description: error.message, variant: "destructive" });
    },
  });

  const restrictMutation = useMutation({
    mutationFn: async ({ userId, restrictions, duration }: { userId: string; restrictions: RestrictionType[]; duration: string }) => {
      const expiresAt = duration === "permanent" ? null : 
        new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toISOString();

      for (const restriction of restrictions) {
        const { error } = await supabase.from("user_restrictions").insert({
          user_id: userId,
          restriction_type: restriction,
          created_by: user?.id!,
          expires_at: expiresAt,
          is_active: true,
        });
        if (error) throw error;
      }

      // Send notification
      await supabase.from("user_notifications").insert({
        user_id: userId,
        type: "restriction",
        title: "⚠️ Account Restrictions Applied",
        message: `Restrictions have been applied to your account: ${restrictions.join(", ")}`,
      });
    },
    onSuccess: () => {
      toast({ title: "Restrictions applied successfully" });
      queryClient.invalidateQueries({ queryKey: ["content-flags"] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error applying restrictions", description: error.message, variant: "destructive" });
    },
  });

  const closeDialog = () => {
    setSelectedFlag(null);
    setReviewNotes("");
    setActionType("review");
    setWarningMessage("");
    setBanDuration("");
    setBanReason("");
    setSelectedRestrictions([]);
    setRestrictionDuration("");
  };

  const getUserName = (userId: string) => {
    const profile = profiles?.find((p) => p.user_id === userId);
    return profile?.display_name || profile?.username || "Unknown";
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "comment":
      case "profile_comment":
        return <MessageSquare className="w-4 h-4" />;
      case "poll":
        return <BarChart className="w-4 h-4" />;
      case "article":
        return <FileText className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  const handleAction = async () => {
    if (!selectedFlag) return;

    const userId = await getContentOwner(selectedFlag.content_type, selectedFlag.content_id);
    if (!userId && actionType !== "review") {
      toast({ title: "Could not identify content owner", variant: "destructive" });
      return;
    }

    switch (actionType) {
      case "review":
        // Will be handled by the individual buttons
        break;
      case "warn":
        if (!warningMessage) {
          toast({ title: "Please enter a warning message", variant: "destructive" });
          return;
        }
        warnMutation.mutate({ userId: userId!, reason: warningMessage });
        reviewMutation.mutate({ flagId: selectedFlag.id, status: "resolved", notes: `Warned: ${warningMessage}` });
        break;
      case "ban":
        if (!banReason || !banDuration) {
          toast({ title: "Please enter ban reason and duration", variant: "destructive" });
          return;
        }
        banMutation.mutate({ userId: userId!, reason: banReason, duration: banDuration });
        reviewMutation.mutate({ flagId: selectedFlag.id, status: "resolved", notes: `Banned: ${banReason}` });
        break;
      case "restrict":
        if (selectedRestrictions.length === 0 || !restrictionDuration) {
          toast({ title: "Please select restrictions and duration", variant: "destructive" });
          return;
        }
        restrictMutation.mutate({ userId: userId!, restrictions: selectedRestrictions, duration: restrictionDuration });
        reviewMutation.mutate({ flagId: selectedFlag.id, status: "resolved", notes: `Restricted: ${selectedRestrictions.join(", ")}` });
        break;
    }
  };

  if (!isAdmin && !isModerator) {
    return <div className="text-center py-20 text-muted-foreground">Access denied</div>;
  }

  const isProcessing = reviewMutation.isPending || warnMutation.isPending || banMutation.isPending || restrictMutation.isPending;

  return (
    <div className="space-y-6">
      <AdminSettingsNav />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-yellow-500/10">
            <Flag className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Moderation Queue</h2>
            <p className="text-sm text-muted-foreground">Review flagged content and take action</p>
          </div>
          {flags && flags.length > 0 && (
            <Badge variant="destructive" className="ml-auto">{flags.length} pending</Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : flags && flags.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Flagged By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {getContentTypeIcon(flag.content_type)}
                        {flag.content_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{flag.reason}</TableCell>
                    <TableCell>{getUserName(flag.flagged_by)}</TableCell>
                    <TableCell>{format(new Date(flag.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedFlag(flag)}
                        className="gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <Check className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">No pending flags to review</p>
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={!!selectedFlag} onOpenChange={() => closeDialog()}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Flagged Content</DialogTitle>
            </DialogHeader>
            {selectedFlag && (
              <div className="space-y-4 mt-4">
                {/* Content Info */}
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    {getContentTypeIcon(selectedFlag.content_type)}
                    <span className="font-medium capitalize">{selectedFlag.content_type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Content ID: {selectedFlag.content_id}</p>
                </div>

                {/* Reason */}
                <div>
                  <label className="text-sm font-medium">Reason for Flag</label>
                  <p className="mt-1 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
                    {selectedFlag.reason}
                  </p>
                </div>

                {/* Flagged By */}
                <div>
                  <label className="text-sm font-medium">Flagged By</label>
                  <p className="mt-1 text-muted-foreground">
                    {getUserName(selectedFlag.flagged_by)} on{" "}
                    {format(new Date(selectedFlag.created_at), "MMM d, yyyy HH:mm")}
                  </p>
                </div>

                {/* Action Type Selector */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Action Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant={actionType === "review" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActionType("review")}
                      className="gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Review
                    </Button>
                    <Button
                      variant={actionType === "warn" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActionType("warn")}
                      className="gap-1"
                    >
                      <Bell className="w-3 h-3" />
                      Warn
                    </Button>
                    <Button
                      variant={actionType === "restrict" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActionType("restrict")}
                      className="gap-1"
                    >
                      <ShieldAlert className="w-3 h-3" />
                      Restrict
                    </Button>
                    <Button
                      variant={actionType === "ban" ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => setActionType("ban")}
                      className="gap-1"
                    >
                      <Ban className="w-3 h-3" />
                      Ban
                    </Button>
                  </div>
                </div>

                {/* Action-specific fields */}
                {actionType === "review" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Review Notes (optional)</label>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes about your decision..."
                      rows={3}
                    />
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => reviewMutation.mutate({ flagId: selectedFlag.id, status: "approved", notes: reviewNotes })}
                        disabled={isProcessing}
                        variant="outline"
                        className="flex-1 gap-2"
                      >
                        <Check className="w-4 h-4 text-green-500" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => reviewMutation.mutate({ flagId: selectedFlag.id, status: "rejected", notes: reviewNotes })}
                        disabled={isProcessing}
                        variant="outline"
                        className="flex-1 gap-2"
                      >
                        <X className="w-4 h-4 text-yellow-500" />
                        Dismiss
                      </Button>
                      <Button
                        onClick={() => reviewMutation.mutate({ flagId: selectedFlag.id, status: "removed", notes: reviewNotes })}
                        disabled={isProcessing}
                        variant="destructive"
                        className="flex-1 gap-2"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}

                {actionType === "warn" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Warning Message</label>
                      <Textarea
                        value={warningMessage}
                        onChange={(e) => setWarningMessage(e.target.value)}
                        placeholder="Enter warning message to send to user..."
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleAction} disabled={isProcessing} className="w-full gap-2">
                      {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                      <Bell className="w-4 h-4" />
                      Send Warning
                    </Button>
                  </div>
                )}

                {actionType === "restrict" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Restrictions</label>
                      <div className="grid grid-cols-2 gap-2">
                        {restrictionOptions.map((opt) => (
                          <Button
                            key={opt.value}
                            variant={selectedRestrictions.includes(opt.value) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              if (selectedRestrictions.includes(opt.value)) {
                                setSelectedRestrictions(selectedRestrictions.filter(r => r !== opt.value));
                              } else {
                                setSelectedRestrictions([...selectedRestrictions, opt.value]);
                              }
                            }}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Duration</label>
                      <Select value={restrictionDuration} onValueChange={setRestrictionDuration}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Day</SelectItem>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="permanent">Permanent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAction} disabled={isProcessing} className="w-full gap-2">
                      {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                      <ShieldAlert className="w-4 h-4" />
                      Apply Restrictions
                    </Button>
                  </div>
                )}

                {actionType === "ban" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Ban Reason</label>
                      <Textarea
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder="Enter reason for ban..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Duration</label>
                      <Select value={banDuration} onValueChange={setBanDuration}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ban duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Day</SelectItem>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="90">90 Days</SelectItem>
                          <SelectItem value="permanent">Permanent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAction} disabled={isProcessing} variant="destructive" className="w-full gap-2">
                      {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                      <Ban className="w-4 h-4" />
                      Ban User
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}