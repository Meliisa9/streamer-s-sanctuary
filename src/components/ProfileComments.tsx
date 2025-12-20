import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Trash2, Flag, Loader2, Heart } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { notifyComment, notifyMention } from "@/hooks/useSocialNotifications";
import { ReportDialog } from "@/components/ReportDialog";
import { EmojiPicker } from "@/components/EmojiPicker";
import { UserAvatarLink } from "@/components/UserAvatarLink";
import { MentionInput, parseMentions } from "@/components/MentionInput";

interface ProfileCommentsProps {
  profileUserId: string;
}

function getHashCommentId(hash: string): string | null {
  const match = hash.match(/^#comment-([a-zA-Z0-9-]+)$/);
  return match ? match[1] : null;
}

export function ProfileComments({ profileUserId }: ProfileCommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  const requestedScrollCommentId = useMemo(() => getHashCommentId(window.location.hash), []);

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

  useEffect(() => {
    if (!requestedScrollCommentId) return;
    if (!comments || comments.length === 0) return;

    requestAnimationFrame(() => {
      const el = document.getElementById(`comment-${requestedScrollCommentId}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setHighlightedCommentId(requestedScrollCommentId);
      window.setTimeout(() => setHighlightedCommentId(null), 2500);
    });
  }, [requestedScrollCommentId, comments]);

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

  const { data: userLikes = [] } = useQuery({
    queryKey: ["profile-comment-likes", user?.id, comments?.map((c) => c.id)],
    queryFn: async () => {
      if (!user || !comments || comments.length === 0) return [];
      const { data, error } = await supabase
        .from("profile_comment_likes")
        .select("comment_id")
        .eq("user_id", user.id)
        .in("comment_id", comments.map((c) => c.id));
      if (error) throw error;
      return data.map((l) => l.comment_id);
    },
    enabled: !!user && !!comments && comments.length > 0,
  });

  const { data: likeCounts = {} } = useQuery({
    queryKey: ["profile-comment-like-counts", comments?.map((c) => c.id)],
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

      const { data, error } = await supabase
        .from("profile_comments")
        .insert({
          profile_user_id: profileUserId,
          author_id: user.id,
          content,
        })
        .select("id")
        .single();

      if (error) throw error;

      const { data: commenterProfile } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const commenterName = commenterProfile?.display_name || commenterProfile?.username || "Someone";

      if (user.id !== profileUserId) {
        const { data: profileOwner } = await supabase
          .from("profiles")
          .select("username")
          .eq("user_id", profileUserId)
          .maybeSingle();

        await notifyComment(profileUserId, commenterName, profileOwner?.username || profileUserId, data?.id);
      }

      const mentionRegex = /@(\w+)/g;
      const mentions = content.match(mentionRegex);
      if (mentions) {
        const uniqueUsernames = [...new Set(mentions.map((m) => m.slice(1)))];

        for (const username of uniqueUsernames) {
          const { data: mentionedUser } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("username", username)
            .maybeSingle();

          if (mentionedUser && mentionedUser.user_id !== user.id && mentionedUser.user_id !== profileUserId) {
            const { data: profileOwnerData } = await supabase
              .from("profiles")
              .select("username")
              .eq("user_id", profileUserId)
              .maybeSingle();

            await notifyMention(
              mentionedUser.user_id,
              commenterName,
              "a profile comment",
              `/profile#comment-${data?.id}`,
              profileOwnerData?.username
            );
          }
        }
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
      const { error } = await supabase.from("profile_comments").delete().eq("id", commentId);
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
        const { error } = await supabase
          .from("profile_comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("profile_comment_likes").insert({ comment_id: commentId, user_id: user.id });
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
    setNewComment((prev) => prev + emoji);
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          Profile Comments
          {comments && comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          )}
        </h3>
      </div>

      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
          <MentionInput 
            value={newComment} 
            onChange={setNewComment} 
            placeholder="Write a comment... Use @ to mention users" 
            rows={3} 
            maxLength={500} 
          />
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              <span className="text-xs text-muted-foreground">
                {newComment.length}<span className="text-muted-foreground/50">/500</span>
              </span>
            </div>
            <Button 
              type="submit" 
              size="sm" 
              disabled={!newComment.trim() || addCommentMutation.isPending} 
              className="gap-2 px-4"
            >
              {addCommentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post Comment
            </Button>
          </div>
        </form>
      )}

      {!user && (
        <div className="text-center py-4 px-6 rounded-xl bg-secondary/20 border border-dashed border-border">
          <p className="text-sm text-muted-foreground">Sign in to leave a comment</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
          {comments.map((comment, index) => {
            const author = commentAuthors?.[comment.author_id];
            const liked = isLiked(comment.id);
            const likeCount = getLikeCount(comment.id);
            const isHighlighted = highlightedCommentId === comment.id;

            return (
              <motion.div
                key={comment.id}
                id={`comment-${comment.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
                className={`relative group rounded-xl scroll-mt-20 transition-all duration-500 overflow-hidden ${
                  isHighlighted
                    ? "ring-2 ring-primary shadow-lg shadow-primary/20"
                    : "hover:shadow-md"
                }`}
              >
                {/* Highlighted background glow */}
                {isHighlighted && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20"
                  />
                )}
                
                <div className={`relative flex gap-3 p-4 ${
                  isHighlighted 
                    ? "bg-primary/5" 
                    : "bg-secondary/40 hover:bg-secondary/60"
                } transition-colors`}>
                  <UserAvatarLink 
                    userId={comment.author_id} 
                    username={author?.username} 
                    avatarUrl={author?.avatar_url} 
                    size="md" 
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatarLink
                          userId={comment.author_id}
                          username={author?.username}
                          avatarUrl={author?.avatar_url}
                          displayName={author?.display_name}
                          className="font-semibold text-sm truncate hover:text-primary transition-colors"
                        >
                          {author?.display_name || author?.username || "Anonymous"}
                        </UserAvatarLink>
                        <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">•</span>
                        <span className="text-xs text-muted-foreground/70 flex-shrink-0">
                          {format(new Date(comment.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-foreground/90 break-words leading-relaxed">
                      {parseMentions(comment.content)}
                    </p>

                    {/* Actions Row */}
                    <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/30">
                      {user && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => likeCommentMutation.mutate({ commentId: comment.id, isLiked: liked })}
                          disabled={likeCommentMutation.isPending}
                          className={`h-7 px-2.5 text-xs gap-1.5 rounded-lg transition-all ${
                            liked 
                              ? "text-red-500 bg-red-500/10 hover:bg-red-500/20" 
                              : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
                          {likeCount > 0 && <span>{likeCount}</span>}
                        </Button>
                      )}

                      {!user && likeCount > 0 && (
                        <span className="h-7 px-2.5 text-xs text-muted-foreground flex items-center gap-1.5 bg-secondary/50 rounded-lg">
                          <Heart className="w-3.5 h-3.5" />
                          {likeCount}
                        </span>
                      )}

                      {canDelete(comment) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                          disabled={deleteCommentMutation.isPending}
                          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      )}

                      {user && user.id !== comment.author_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReportClick(comment.id)}
                          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-lg gap-1.5 ml-auto"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          Report
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 px-6 rounded-xl bg-secondary/20 border border-dashed border-border">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground font-medium">No comments yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Be the first to share your thoughts!</p>
        </div>
      )}

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
