import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Trash2, Flag, Loader2, User, Heart } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { notifyComment } from "@/hooks/useSocialNotifications";
import { ReportDialog } from "@/components/ReportDialog";
import { EmojiPicker } from "@/components/EmojiPicker";
import { UserAvatarLink } from "@/components/UserAvatarLink";

interface ProfileCommentsProps {
  profileUserId: string;
}

export function ProfileComments({ profileUserId }: ProfileCommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);

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

  // Fetch user's likes
  const { data: userLikes = [] } = useQuery({
    queryKey: ["profile-comment-likes", user?.id, comments?.map(c => c.id)],
    queryFn: async () => {
      if (!user || !comments || comments.length === 0) return [];
      const { data, error } = await supabase
        .from("profile_comment_likes")
        .select("comment_id")
        .eq("user_id", user.id)
        .in("comment_id", comments.map(c => c.id));
      if (error) throw error;
      return data.map(l => l.comment_id);
    },
    enabled: !!user && !!comments && comments.length > 0,
  });

  // Fetch like counts
  const { data: likeCounts = {} } = useQuery({
    queryKey: ["profile-comment-like-counts", comments?.map(c => c.id)],
    queryFn: async () => {
      if (!comments || comments.length === 0) return {};
      const counts: Record<string, number> = {};
      for (const comment of comments) {
        const { count, error } = await supabase
          .from("profile_comment_likes")
          .select("*", { count: "exact", head: true })
          .eq("comment_id", comment.id);
        if (!error) counts[comment.id] = count || 0;
      }
      return counts;
    },
    enabled: !!comments && comments.length > 0,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Must be logged in");
      const { data, error } = await supabase.from("profile_comments").insert({
        profile_user_id: profileUserId,
        author_id: user.id,
        content,
      }).select('id').single();
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
        await notifyComment(profileUserId, commenterName, profileOwner?.username || profileUserId, data?.id);
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

  const likeCommentMutation = useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: string; isLiked: boolean }) => {
      if (!user) throw new Error("Must be logged in");
      
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("profile_comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from("profile_comment_likes")
          .insert({ comment_id: commentId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-comment-likes"] });
      queryClient.invalidateQueries({ queryKey: ["profile-comment-like-counts"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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

  const handleEmojiSelect = (emoji: string) => {
    setNewComment(prev => prev + emoji);
  };

  const handleReportClick = (commentId: string) => {
    setReportingCommentId(commentId);
    setReportDialogOpen(true);
  };

  const canDelete = (comment: any) => {
    return user && (user.id === comment.author_id || user.id === profileUserId);
  };

  const isLiked = (commentId: string) => userLikes.includes(commentId);
  const getLikeCount = (commentId: string) => likeCounts[commentId] || 0;

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
            <div className="flex items-center gap-2">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              <span className="text-xs text-muted-foreground">{newComment.length}/500</span>
            </div>
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
            const liked = isLiked(comment.id);
            const likeCount = getLikeCount(comment.id);
            
            return (
              <motion.div
                key={comment.id}
                id={`comment-${comment.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-3 p-3 bg-secondary/30 rounded-xl scroll-mt-20"
              >
                <UserAvatarLink
                  userId={comment.author_id}
                  username={author?.username}
                  avatarUrl={author?.avatar_url}
                  size="md"
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <UserAvatarLink
                      userId={comment.author_id}
                      username={author?.username}
                      avatarUrl={author?.avatar_url}
                      displayName={author?.display_name}
                      className="font-medium text-sm truncate hover:text-primary transition-colors"
                    >
                      {author?.display_name || author?.username || "Anonymous"}
                    </UserAvatarLink>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {format(new Date(comment.created_at), "MMM d")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground break-words">{comment.content}</p>
                  <div className="flex gap-2 mt-2">
                    {/* Like Button */}
                    {user && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => likeCommentMutation.mutate({ commentId: comment.id, isLiked: liked })}
                        disabled={likeCommentMutation.isPending}
                        className={`h-6 px-2 text-xs gap-1 ${liked ? "text-red-500" : "text-muted-foreground"}`}
                      >
                        <Heart className={`w-3 h-3 ${liked ? "fill-red-500" : ""}`} />
                        {likeCount > 0 && likeCount}
                      </Button>
                    )}
                    {!user && likeCount > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {likeCount}
                      </span>
                    )}
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
                        onClick={() => handleReportClick(comment.id)}
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

      {/* Report Dialog */}
      {reportingCommentId && (
        <ReportDialog
          open={reportDialogOpen}
          onOpenChange={(open) => {
            setReportDialogOpen(open);
            if (!open) setReportingCommentId(null);
          }}
          contentType="profile_comment"
          contentId={reportingCommentId}
        />
      )}
    </div>
  );
}