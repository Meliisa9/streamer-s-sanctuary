import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Flag, Check, X, Eye, Loader2, MessageSquare, BarChart, FileText, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function AdminModerationQueue() {
  const { isAdmin, isModerator, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFlag, setSelectedFlag] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");

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

      // If removing content, handle based on content type
      if (status === "removed" && selectedFlag) {
        if (selectedFlag.content_type === "comment") {
          await supabase
            .from("news_comments")
            .update({ is_approved: false })
            .eq("id", selectedFlag.content_id);
        } else if (selectedFlag.content_type === "profile_comment") {
          await supabase
            .from("profile_comments")
            .update({ is_approved: false })
            .eq("id", selectedFlag.content_id);
        }
      }
    },
    onSuccess: (_, variables) => {
      toast({ title: `Content ${variables.status === "removed" ? "removed" : variables.status}` });
      queryClient.invalidateQueries({ queryKey: ["content-flags"] });
      setSelectedFlag(null);
      setReviewNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Error reviewing flag", description: error.message, variant: "destructive" });
    },
  });

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

  const handleReview = (status: string) => {
    if (!selectedFlag) return;
    reviewMutation.mutate({
      flagId: selectedFlag.id,
      status,
      notes: reviewNotes,
    });
  };

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
        <div className="flex items-center gap-3 mb-6">
          <Flag className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-bold">Moderation Queue</h2>
          {flags && flags.length > 0 && (
            <Badge variant="destructive">{flags.length} pending</Badge>
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
                    <TableCell className="max-w-[200px] truncate">
                      {flag.reason}
                    </TableCell>
                    <TableCell>{getUserName(flag.flagged_by)}</TableCell>
                    <TableCell>
                      {format(new Date(flag.created_at), "MMM d, yyyy")}
                    </TableCell>
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
            <Check className="w-10 h-10 mx-auto mb-2 text-green-500" />
            No pending flags - all caught up!
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={!!selectedFlag} onOpenChange={() => setSelectedFlag(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Flagged Content</DialogTitle>
            </DialogHeader>
            {selectedFlag && (
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    {getContentTypeIcon(selectedFlag.content_type)}
                    <span className="font-medium capitalize">{selectedFlag.content_type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Content ID: {selectedFlag.content_id}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Reason for Flag</label>
                  <p className="mt-1 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
                    {selectedFlag.reason}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Flagged By</label>
                  <p className="mt-1 text-muted-foreground">
                    {getUserName(selectedFlag.flagged_by)} on{" "}
                    {format(new Date(selectedFlag.created_at), "MMM d, yyyy HH:mm")}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Review Notes (optional)</label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about your decision..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleReview("approved")}
                    disabled={reviewMutation.isPending}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <Check className="w-4 h-4 text-green-500" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReview("rejected")}
                    disabled={reviewMutation.isPending}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <X className="w-4 h-4 text-yellow-500" />
                    Dismiss
                  </Button>
                  <Button
                    onClick={() => handleReview("removed")}
                    disabled={reviewMutation.isPending}
                    variant="destructive"
                    className="flex-1 gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
