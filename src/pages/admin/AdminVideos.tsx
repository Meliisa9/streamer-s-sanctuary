import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Loader2, Film, Search, RefreshCw, Filter, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedVideoForm } from "@/components/admin/forms";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string;
  video_file_url: string | null;
  is_external: boolean;
  duration: string | null;
  category_id: string | null;
  multiplier: string | null;
  views: number;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AdminVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: videosData }, { data: categoriesData }] = await Promise.all([
        supabase.from("videos").select("*").order("created_at", { ascending: false }),
        supabase.from("video_categories").select("*").order("sort_order"),
      ]);

      setVideos(videosData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const { error } = await supabase.from("videos").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Video deleted successfully" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleFeatured = async (video: Video) => {
    try {
      const { error } = await supabase
        .from("videos")
        .update({ is_featured: !video.is_featured })
        .eq("id", video.id);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const togglePublished = async (video: Video) => {
    try {
      const { error } = await supabase
        .from("videos")
        .update({ is_published: !video.is_published })
        .eq("id", video.id);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    return categories.find((c) => c.id === categoryId)?.name || "Unknown";
  };

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || video.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Stats
  const stats = {
    total: videos.length,
    published: videos.filter((v) => v.is_published).length,
    featured: videos.filter((v) => v.is_featured).length,
    totalViews: videos.reduce((acc, v) => acc + (v.views || 0), 0),
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
          <h1 className="text-3xl font-bold">Videos</h1>
          <p className="text-muted-foreground">Manage video content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => { setEditingVideo(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Video
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total Videos</p>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 border border-border rounded-lg p-1">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Enhanced Form Modal */}
      <EnhancedVideoForm
        open={showForm}
        onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingVideo(null); } else setShowForm(true); }}
        onSuccess={() => { setShowForm(false); setEditingVideo(null); fetchData(); }}
        editingVideo={editingVideo}
        categories={categories}
      />

      {/* Videos List/Grid */}
      {viewMode === "list" ? (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 text-sm font-medium">Video</th>
                <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Type</th>
                <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Category</th>
                <th className="text-center p-4 text-sm font-medium hidden md:table-cell">Views</th>
                <th className="text-center p-4 text-sm font-medium">Status</th>
                <th className="text-right p-4 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVideos.map((video) => (
                <tr key={video.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-16 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-16 h-10 rounded bg-secondary flex items-center justify-center">
                          <Film className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium line-clamp-1">{video.title}</p>
                        <p className="text-xs text-muted-foreground">{video.duration || "N/A"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <Badge variant="outline" className={video.is_external ? "border-blue-500/30 text-blue-400" : "border-green-500/30 text-green-400"}>
                      {video.is_external ? "External" : "Uploaded"}
                    </Badge>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">{getCategoryName(video.category_id)}</span>
                  </td>
                  <td className="p-4 text-center hidden md:table-cell">
                    <span className="text-sm">{video.views?.toLocaleString() || 0}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => toggleFeatured(video)}
                        className={`p-1 rounded transition-colors ${video.is_featured ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}`}
                      >
                        <Star className="w-4 h-4" fill={video.is_featured ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={() => togglePublished(video)}
                        className={`p-1 rounded transition-colors ${video.is_published ? "text-green-500" : "text-muted-foreground hover:text-green-500"}`}
                      >
                        {video.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(video)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(video.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredVideos.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No videos found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVideos.map((video) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl overflow-hidden group"
            >
              <div className="aspect-video relative">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <Film className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                {video.multiplier && (
                  <Badge className="absolute top-2 left-2 bg-primary">{video.multiplier}</Badge>
                )}
                {video.duration && (
                  <Badge variant="secondary" className="absolute bottom-2 right-2">{video.duration}</Badge>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" onClick={() => handleEdit(video)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => handleDelete(video.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <p className="font-medium line-clamp-1">{video.title}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{getCategoryName(video.category_id)}</span>
                  <span>{video.views?.toLocaleString() || 0} views</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => toggleFeatured(video)}
                    className={`p-1 rounded ${video.is_featured ? "text-yellow-500" : "text-muted-foreground"}`}
                  >
                    <Star className="w-4 h-4" fill={video.is_featured ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => togglePublished(video)}
                    className={`p-1 rounded ${video.is_published ? "text-green-500" : "text-muted-foreground"}`}
                  >
                    {video.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
