import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Heart, Eye, User, Clock, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type NewsArticle = Tables<"news_articles">;

export default function NewsArticlePage() {
  const { slug } = useParams<{ slug: string }>();

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
      alert("Link copied to clipboard!");
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
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link to="/news">
            <Button variant="ghost" className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to News
            </Button>
          </Link>
        </motion.div>

        {/* Article Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
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

          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            {article.title}
          </h1>

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
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              {article.likes_count || 0} likes
            </span>
          </div>
        </motion.div>

        {/* Featured Image */}
        {article.image_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-auto max-h-[500px] object-cover rounded-2xl"
            />
          </motion.div>
        )}

        {/* Article Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-8 mb-8"
        >
          {article.excerpt && (
            <p className="text-xl text-muted-foreground mb-6 pb-6 border-b border-border">
              {article.excerpt}
            </p>
          )}

          {/* Render HTML content if available, otherwise plain text */}
          {article.content_html ? (
            <div
              className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: article.content_html }}
            />
          ) : (
            <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground">
              {article.content.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-4 text-muted-foreground leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </motion.div>

        {/* Share Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between glass rounded-2xl p-6"
        >
          <div>
            <p className="font-semibold">Enjoyed this article?</p>
            <p className="text-sm text-muted-foreground">Share it with your friends!</p>
          </div>
          <Button variant="glow" onClick={handleShare} className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
