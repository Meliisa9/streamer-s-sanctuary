import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MessageCircle, User, Clock, Search, Tag, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

type NewsArticle = Tables<"news_articles">;

const categories = ["All", "Updates", "Giveaways", "Tutorials", "Reviews", "Community"];

export default function News() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: articles, isLoading } = useQuery({
    queryKey: ["news-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as NewsArticle[];
    },
  });

  const filteredArticles = articles?.filter((article) => {
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredArticles = filteredArticles?.filter((a) => a.is_featured);
  const regularArticles = filteredArticles?.filter((a) => !a.is_featured);

  const getReadTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Latest <span className="gradient-text">News</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Stay updated with announcements, guides, and community highlights
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-10"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {isLoading ? (
          <div className="text-center py-20">Loading articles...</div>
        ) : (
          <>
            {/* Featured Articles */}
            {featuredArticles && featuredArticles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-12"
              >
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-accent" />
                  Featured
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {featuredArticles.map((article) => (
                    <Link to={`/news/${article.slug}`} key={article.id}>
                      <div className="glass rounded-2xl overflow-hidden card-hover neon-border group cursor-pointer h-full">
                        <div className="relative h-48 overflow-hidden">
                          {article.image_url ? (
                            <img
                              src={article.image_url}
                              alt={article.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-secondary" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                          <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                            {article.category}
                          </span>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-muted-foreground mb-4 line-clamp-2">{article.excerpt}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(article.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                {article.likes_count || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Regular Articles */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Posts
              </h2>
              {regularArticles && regularArticles.length > 0 ? (
                <div className="space-y-6">
                  {regularArticles.map((article, index) => (
                    <Link to={`/news/${article.slug}`} key={article.id}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="glass rounded-2xl overflow-hidden card-hover group cursor-pointer"
                      >
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-64 h-48 md:h-auto overflow-hidden flex-shrink-0">
                            {article.image_url ? (
                              <img
                                src={article.image_url}
                                alt={article.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-secondary" />
                            )}
                          </div>
                          <div className="flex-1 p-6">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="px-3 py-1 bg-secondary text-xs font-medium rounded-full">
                                {article.category}
                              </span>
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {getReadTime(article.content)}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                              {article.title}
                            </h3>
                            <p className="text-muted-foreground mb-4 line-clamp-2">{article.excerpt}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{new Date(article.created_at).toLocaleDateString()}</span>
                                <span>{article.views || 0} views</span>
                              </div>
                              <Button variant="ghost" size="sm" className="group/btn">
                                Read More
                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  No articles found. Check back later!
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
