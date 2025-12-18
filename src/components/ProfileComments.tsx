import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Trash2, Flag, Loader2, User } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { notifyComment } from "@/hooks/useSocialNotifications";

interface ProfileCommentsProps {
  profileUserId: string;
}

export function ProfileComments({ profileUserId }: ProfileCommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["profile-comments", profileUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_comments")
        .select("*")
        .eq("profile_user_id", profileUserId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: commentAuthors } = useQuery({
    queryKey: ["comment-authors", comments?.map((c) => c.author_id)],
    queryFn: async () => {
      if (!comments || comments.length === 0) return {};
      const authorIds = [...new Set(comments.map((c) => c.author_id))];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", authorIds);
      if (error) throw error;
      return data.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);
    },
    enabled: !!comments && comments.length > 0,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase.from("profile_comments").insert({
        profile_user_id: profileUserId,
        author_id: user.id,
        content,
      });
      if (error) throw error;
      
      // Send notification if commenting on someone else's profile
      if (user.id !== profileUserId) {
        const { data: commenterProfile } = await supabase
          .from("profiles")
          .select("username, display_name")
          .eq("user_id", user.id)
          .maybeSingle();
        
        const { data: profileOwner } = await supabase
          .from("profiles")
          .select("username")
          .eq("user_id", profileUserId)
          .maybeSingle();
        
        const commenterName = commenterProfile?.display_name || commenterProfile?.username || "Someone";
        await notifyComment(profileUserId, commenterName, profileOwner?.username || profileUserId);
      }
    },
    onSuccess: () => {
      toast({ title: "Comment posted!" });
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["profile-comments", profileUserId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error posting comment", description: error.message, variant: "destructive" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("profile_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Comment deleted" });
      queryClient.invalidateQueries({ queryKey: ["profile-comments", profileUserId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting comment", description: error.message, variant: "destructive" });
    },
  });

  const flagCommentMutation = useMutation({
    mutationFn: async ({ commentId, reason }: { commentId: string; reason: string }) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase.from("content_flags").insert({
        content_type: "profile_comment",
        content_id: commentId,
        flagged_by: user.id,
        reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Comment reported to moderators" });
    },
    onError: (error: Error) => {
      toast({ title: "Error reporting comment", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      toast({ title: "Please sign in to comment" });
      return;
    }
    addCommentMutation.mutate(newComment.trim());
  };

  const canDelete = (comment: any) => {
    return user && (user.id === comment.author_id || user.id === profileUserId);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Profile Comments
        {comments && comments.length > 0 && (
          <span className="text-sm text-muted-foreground">({comments.length})</span>
        )}
      </h3>

      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Leave a comment..."
            rows={2}
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{newComment.length}/500</span>
            <Button
              type="submit"
              size="sm"
              disabled={!newComment.trim() || addCommentMutation.isPending}
              className="gap-2"
            >
              {addCommentMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Post
            </Button>
          </div>
        </form>
      )}

      {!user && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Sign in to leave a comment
        </p>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {comments.map((comment, index) => {
            const author = commentAuthors?.[comment.author_id];
            return (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-3 p-3 bg-secondary/30 rounded-xl"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={author?.avatar_url} />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {author?.display_name || author?.username || "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {format(new Date(comment.created_at), "MMM d")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground break-words">{comment.content}</p>
                  <div className="flex gap-2 mt-2">
                    {canDelete(comment) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                        disabled={deleteCommentMutation.isPending}
                        className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    )}
                    {user && user.id !== comment.author_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          flagCommentMutation.mutate({
                            commentId: comment.id,
                            reason: "Inappropriate content",
                          })
                        }
                        disabled={flagCommentMutation.isPending}
                        className="h-6 px-2 text-xs text-muted-foreground"
                      >
                        <Flag className="w-3 h-3 mr-1" />
                        Report
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Be the first!
        </p>
      )}
    </div>
  );
}
