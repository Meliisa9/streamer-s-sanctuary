import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Heart, Eye, Clock, Share2, Send, Loader2, User, Shield, ShieldCheck, Pen, MessageCircle, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EmojiPicker } from "@/components/EmojiPicker";
import { processAndSanitizeContent } from "@/lib/sanitize";
import type { Tables } from "@/integrations/supabase/types";

type NewsArticle = Tables<"news_articles">;

interface AuthorProfile {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface UserRole {
  role: "user" | "moderator" | "admin" | "writer";
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  roles?: UserRole[];
  hasLiked?: boolean;
}

const getRoleBadge = (roles: UserRole[] | undefined) => {
  if (!roles || roles.length === 0) return null;
  
  const roleOrder = ["admin", "moderator", "writer"];
  const highestRole = roleOrder.find(r => roles.some(ur => ur.role === r));
  
  if (!highestRole || highestRole === "user") return null;
  
  const badgeConfig = {
    admin: { label: "Admin", variant: "destructive" as const, icon: ShieldCheck },
    moderator: { label: "Moderator", variant: "default" as const, icon: Shield },
    writer: { label: "Writer", variant: "secondary" as const, icon: Pen },
  };
  
  const config = badgeConfig[highestRole as keyof typeof badgeConfig];
  if (!config) return null;
  
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="text-xs gap-1">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

// Use the sanitized content processor from lib/sanitize

export default function NewsArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [hasLiked, setHasLiked] = useState(false);
  const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({});

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

      await supabase
        .from("news_articles")
        .update({ views: (data.views || 0) + 1 })
        .eq("id", data.id);

      return data as NewsArticle;
    },
    enabled: !!slug,
  });

  const { data: authorProfile } = useQuery({
    queryKey: ["author-profile", article?.author_id],
    queryFn: async () => {
      if (!article?.author_id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("user_id", article.author_id)
        .maybeSingle();

      if (error) return null;
      return data as AuthorProfile;
    },
    enabled: !!article?.author_id,
  });

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

      const userIds = [...new Set(data.map((c) => c.user_id))];
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", userIds),
        supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
      ]);

      const profileMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]));
      const rolesMap = new Map<string, UserRole[]>();
      rolesRes.data?.forEach((r) => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push({ role: r.role });
        rolesMap.set(r.user_id, existing);
      });

      // Check which comments the user has liked
      let userLikes: string[] = [];
      if (user) {
        const { data: likesData } = await supabase
          .from("comment_likes")
          .select("comment_id")
          .eq("user_id", user.id)
          .in("comment_id", data.map(c => c.id));
        userLikes = likesData?.map(l => l.comment_id) || [];
      }

      return data.map((comment) => ({
        ...comment,
        likes_count: comment.likes_count || 0,
        profile: profileMap.get(comment.user_id),
        roles: rolesMap.get(comment.user_id),
        hasLiked: userLikes.includes(comment.id),
      })) as Comment[];
    },
    enabled: !!article?.id,
  });

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

  // Update local comment likes state when comments change
  useEffect(() => {
    const likesState: Record<string, boolean> = {};
    comments.forEach(comment => {
      likesState[comment.id] = comment.hasLiked || false;
    });
    setCommentLikes(likesState);
  }, [comments]);

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

  const commentLikeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      const isLiked = commentLikes[commentId];
      
      // First get the current likes count from the database
      const { data: currentComment } = await supabase
        .from("news_comments")
        .select("likes_count")
        .eq("id", commentId)
        .single();
      
      const currentLikesCount = currentComment?.likes_count || 0;
      
      if (isLiked) {
        await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);

        await supabase
          .from("news_comments")
          .update({ likes_count: Math.max(0, currentLikesCount - 1) })
          .eq("id", commentId);
      } else {
        await supabase
          .from("comment_likes")
          .insert({ comment_id: commentId, user_id: user.id });

        await supabase
          .from("news_comments")
          .update({ likes_count: currentLikesCount + 1 })
          .eq("id", commentId);
      }
      
      return { commentId, wasLiked: isLiked };
    },
    onSuccess: ({ commentId, wasLiked }) => {
      setCommentLikes(prev => ({ ...prev, [commentId]: !wasLiked }));
      queryClient.invalidateQueries({ queryKey: ["article-comments", article?.id] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update like", variant: "destructive" });
    },
  });

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

  const handleEmojiSelect = (emoji: string) => {
    setCommentText(prev => prev + emoji);
  };

  const getReadTime = (content: string) => {
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
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

  const authorName = authorProfile?.display_name || authorProfile?.username || "Unknown Author";
  const processedContent = processAndSanitizeContent(article.content, article.content_html);

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
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {article.category}
            </Badge>
            {article.is_featured && (
              <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                Featured
              </Badge>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">{article.title}</h1>

          {/* Author & Meta Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-secondary/30 rounded-xl mb-6">
            <div className="flex items-center gap-3">
              {authorProfile?.avatar_url ? (
                <img src={authorProfile.avatar_url} alt={authorName} className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
              )}
              <div>
                <p className="font-semibold">{authorName}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(article.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 sm:ml-auto text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {getReadTime(article.content)}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {article.views || 0}
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className={`w-4 h-4 ${hasLiked ? "fill-red-500 text-red-500" : ""}`} />
                {article.likes_count || 0}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Featured Image */}
        {article.image_url && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-auto max-h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        )}

        {/* Article Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-8 mb-8">
          {article.excerpt && (
            <p className="text-xl text-foreground/80 mb-6 pb-6 border-b border-border font-medium leading-relaxed">
              {article.excerpt}
            </p>
          )}

          <div
            className="prose prose-invert max-w-none 
              prose-headings:text-foreground prose-headings:font-bold
              prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-6
              prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-5
              prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
              prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground prose-strong:font-semibold
              prose-em:text-foreground/90
              prose-img:rounded-xl prose-img:my-6
              prose-video:rounded-xl prose-video:my-6
              [&_video]:max-w-full [&_video]:rounded-xl [&_video]:my-6
              [&_img]:max-w-full [&_img]:h-auto
              [&_iframe]:w-full [&_iframe]:rounded-xl [&_iframe]:my-6"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        </motion.div>

        {/* Actions Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-center justify-between glass rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </motion.div>

        {/* Comments Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Comments ({comments.length})
          </h3>

          {/* Comment Form */}
          {user ? (
            <div className="mb-6 p-4 bg-secondary/30 rounded-xl">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment... 😊"
                rows={3}
                className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-colors"
              />
              <div className="flex items-center justify-between mt-3">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
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
            <div className="mb-6 p-4 bg-secondary/30 rounded-xl text-center">
              <p className="text-muted-foreground">
                <Link to="/auth" className="text-primary hover:underline font-medium">Login</Link> to leave a comment
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-secondary/20 rounded-xl border border-border/50 hover:border-border transition-colors">
                <div className="flex items-start gap-3">
                  <Link to={`/user/${comment.profile?.username}`} className="flex-shrink-0">
                    {comment.profile?.avatar_url ? (
                      <img src={comment.profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover ring-1 ring-border hover:ring-primary transition-colors cursor-pointer" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link to={`/user/${comment.profile?.username}`} className="font-semibold hover:text-primary transition-colors">
                        {comment.profile?.display_name || comment.profile?.username || "Anonymous"}
                      </Link>
                      {getRoleBadge(comment.roles)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                    
                    {/* Comment Like Button */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => user && commentLikeMutation.mutate(comment.id)}
                        disabled={!user || commentLikeMutation.isPending}
                        className={`flex items-center gap-1.5 text-sm transition-colors ${
                          commentLikes[comment.id]
                            ? "text-primary"
                            : "text-muted-foreground hover:text-primary"
                        } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${commentLikes[comment.id] ? "fill-current" : ""}`} />
                        <span>{comment.likes_count || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
