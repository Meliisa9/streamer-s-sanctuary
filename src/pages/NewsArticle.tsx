import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Heart, Eye, Clock, Share2, Send, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type NewsArticle = Tables<"news_articles">;

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function NewsArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [hasLiked, setHasLiked] = useState(false);

  const { data: article, isLoading, error } = useQuery({
    queryKey: ["news-article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Article not found");

      // Increment view count
      await supabase
        .from("news_articles")
        .update({ views: (data.views || 0) + 1 })
        .eq("id", data.id);

      return data as NewsArticle;
    },
    enabled: !!slug,
  });

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ["article-comments", article?.id],
    queryFn: async () => {
      if (!article) return [];
      
      const { data, error } = await supabase
        .from("news_comments")
        .select("*")
        .eq("article_id", article.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for comments
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

      return data.map((comment) => ({
        ...comment,
        profile: profileMap.get(comment.user_id),
      })) as Comment[];
    },
    enabled: !!article?.id,
  });

  // Check if user has liked
  useEffect(() => {
    if (!user || !article) return;

    const checkLike = async () => {
      const { data } = await supabase
        .from("article_likes")
        .select("id")
        .eq("article_id", article.id)
        .eq("user_id", user.id)
        .maybeSingle();

      setHasLiked(!!data);
    };

    checkLike();
  }, [user, article]);

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !article) throw new Error("Not authenticated");

      if (hasLiked) {
        await supabase
          .from("article_likes")
          .delete()
          .eq("article_id", article.id)
          .eq("user_id", user.id);

        await supabase
          .from("news_articles")
          .update({ likes_count: Math.max(0, (article.likes_count || 0) - 1) })
          .eq("id", article.id);
      } else {
        await supabase
          .from("article_likes")
          .insert({ article_id: article.id, user_id: user.id });

        await supabase
          .from("news_articles")
          .update({ likes_count: (article.likes_count || 0) + 1 })
          .eq("id", article.id);
      }
    },
    onSuccess: () => {
      setHasLiked(!hasLiked);
      queryClient.invalidateQueries({ queryKey: ["news-article", slug] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update like", variant: "destructive" });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !article) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("news_comments")
        .insert({ article_id: article.id, user_id: user.id, content });

      if (error) throw error;
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["article-comments", article?.id] });
      toast({ title: "Comment added" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
    },
  });

  const getReadTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: article?.title,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-3/4" />
            <div className="h-64 bg-secondary rounded-2xl" />
            <div className="space-y-2">
              <div className="h-4 bg-secondary rounded" />
              <div className="h-4 bg-secondary rounded" />
              <div className="h-4 bg-secondary rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen py-8 px-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist or has been removed.</p>
          <Link to="/news">
            <Button variant="glow">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to News
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link to="/news">
            <Button variant="ghost" className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to News
            </Button>
          </Link>
        </motion.div>

        {/* Article Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full">
              {article.category}
            </span>
            {article.is_featured && (
              <span className="px-3 py-1 bg-accent/20 text-accent text-sm font-medium rounded-full">
                Featured
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">{article.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(article.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {getReadTime(article.content)}
            </span>
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {article.views || 0} views
            </span>
            <button
              onClick={() => user && likeMutation.mutate()}
              className={`flex items-center gap-2 transition-colors ${hasLiked ? "text-red-500" : "hover:text-red-500"}`}
              disabled={!user}
            >
              <Heart className={`w-4 h-4 ${hasLiked ? "fill-current" : ""}`} />
              {article.likes_count || 0} likes
            </button>
          </div>
        </motion.div>

        {/* Featured Image */}
        {article.image_url && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-auto max-h-[500px] object-cover rounded-2xl"
            />
          </motion.div>
        )}

        {/* Article Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-8 mb-8">
          {article.excerpt && (
            <p className="text-xl text-muted-foreground mb-6 pb-6 border-b border-border">{article.excerpt}</p>
          )}

          {article.content_html ? (
            <div
              className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: article.content_html }}
            />
          ) : (
            <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground">
              {article.content.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-4 text-muted-foreground leading-relaxed">{paragraph}</p>
              ))}
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-center justify-between glass rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant={hasLiked ? "default" : "outline"}
              onClick={() => user && likeMutation.mutate()}
              disabled={!user || likeMutation.isPending}
              className="gap-2"
            >
              <Heart className={`w-4 h-4 ${hasLiked ? "fill-current" : ""}`} />
              {hasLiked ? "Liked" : "Like"}
            </Button>
            {!user && <span className="text-sm text-muted-foreground">Login to like</span>}
          </div>
          <Button variant="glow" onClick={handleShare} className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </motion.div>

        {/* Comments Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-6">Comments ({comments.length})</h3>

          {/* Comment Form */}
          {user ? (
            <div className="mb-6">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary resize-none"
              />
              <div className="flex justify-end mt-2">
                <Button
                  onClick={() => commentText.trim() && commentMutation.mutate(commentText)}
                  disabled={!commentText.trim() || commentMutation.isPending}
                  className="gap-2"
                >
                  {commentMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Post Comment
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-secondary/50 rounded-xl text-center">
              <p className="text-muted-foreground">
                <Link to="/auth" className="text-primary hover:underline">Login</Link> to leave a comment
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-secondary/30 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  {comment.profile?.avatar_url ? (
                    <img src={comment.profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">
                      {comment.profile?.display_name || comment.profile?.username || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground">{comment.content}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}