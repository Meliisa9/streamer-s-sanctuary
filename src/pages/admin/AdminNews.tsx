import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Search, RefreshCw, Loader2, Newspaper } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedNewsForm } from "@/components/admin/forms";

type NewsArticle = Tables<"news_articles">;

export default function AdminNews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);

  const { data: articles, isLoading, refetch } = useQuery({
    queryKey: ["admin-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as NewsArticle[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news_articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast({ title: "Article deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting article", description: error.message, variant: "destructive" });
    },
  });

  const togglePublished = async (article: NewsArticle) => {
    try {
      const { error } = await supabase
        .from("news_articles")
        .update({ is_published: !article.is_published })
        .eq("id", article.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleFeatured = async (article: NewsArticle) => {
    try {
      const { error } = await supabase
        .from("news_articles")
        .update({ is_featured: !article.is_featured })
        .eq("id", article.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setShowForm(true);
  };

  const filteredArticles = articles?.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: articles?.length || 0,
    published: articles?.filter((a) => a.is_published).length || 0,
    featured: articles?.filter((a) => a.is_featured).length || 0,
    totalViews: articles?.reduce((acc, a) => acc + (a.views || 0), 0) || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">News Articles</h1>
          <p className="text-muted-foreground">Manage news and announcements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => { setEditingArticle(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Article
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total Articles</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{stats.published}</p>
          <p className="text-sm text-muted-foreground">Published</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{stats.featured}</p>
          <p className="text-sm text-muted-foreground">Featured</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-accent">{stats.totalViews.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Total Views</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Enhanced Form Modal */}
      <EnhancedNewsForm
        open={showForm}
        onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingArticle(null); } else setShowForm(true); }}
        onSuccess={() => { setShowForm(false); setEditingArticle(null); refetch(); }}
        editingArticle={editingArticle}
      />

      {/* Articles List */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left p-4 text-sm font-medium">Article</th>
              <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Category</th>
              <th className="text-center p-4 text-sm font-medium hidden md:table-cell">Views</th>
              <th className="text-center p-4 text-sm font-medium">Status</th>
              <th className="text-right p-4 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredArticles?.map((article) => (
              <tr key={article.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {article.image_url ? (
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-14 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-14 h-10 rounded bg-secondary flex items-center justify-center">
                        <Newspaper className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium line-clamp-1">{article.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(article.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <Badge variant="outline">{article.category}</Badge>
                </td>
                <td className="p-4 text-center hidden md:table-cell">
                  <span className="text-sm">{article.views?.toLocaleString() || 0}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => toggleFeatured(article)}
                      className={`p-1 rounded transition-colors ${article.is_featured ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}`}
                    >
                      <Star className="w-4 h-4" fill={article.is_featured ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={() => togglePublished(article)}
                      className={`p-1 rounded transition-colors ${article.is_published ? "text-green-500" : "text-muted-foreground hover:text-green-500"}`}
                    >
                      {article.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(article)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        if (confirm("Delete this article?")) {
                          deleteMutation.mutate(article.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredArticles?.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No articles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
