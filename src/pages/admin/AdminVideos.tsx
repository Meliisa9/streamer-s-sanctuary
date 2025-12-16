import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string;
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
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    video_url: "",
    thumbnail_url: "",
    duration: "",
    category_id: "",
    multiplier: "",
    is_featured: false,
    is_published: true,
  });

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

  const resetForm = () => {
    setFormData({
      title: "",
      video_url: "",
      thumbnail_url: "",
      duration: "",
      category_id: "",
      multiplier: "",
      is_featured: false,
      is_published: true,
    });
    setEditingVideo(null);
    setShowForm(false);
  };

  const handleEdit = (video: Video) => {
    setFormData({
      title: video.title,
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || "",
      duration: video.duration || "",
      category_id: video.category_id || "",
      multiplier: video.multiplier || "",
      is_featured: video.is_featured,
      is_published: video.is_published,
    });
    setEditingVideo(video);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const videoData = {
        ...formData,
        category_id: formData.category_id || null,
        created_by: user?.id,
      };

      if (editingVideo) {
        const { error } = await supabase
          .from("videos")
          .update(videoData)
          .eq("id", editingVideo.id);

        if (error) throw error;
        toast({ title: "Video updated successfully" });
      } else {
        const { error } = await supabase.from("videos").insert(videoData);
        if (error) throw error;
        toast({ title: "Video added successfully" });
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Videos</h2>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Video
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold mb-4">
            {editingVideo ? "Edit Video" : "Add New Video"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Video URL *</label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Thumbnail URL</label>
                <input
                  type="url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Duration</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="12:34"
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Multiplier</label>
                <input
                  type="text"
                  value={formData.multiplier}
                  onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                  placeholder="50,000x"
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Featured</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Published</span>
              </label>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Video"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Videos List */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left p-4 text-sm font-medium">Video</th>
              <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Category</th>
              <th className="text-center p-4 text-sm font-medium hidden md:table-cell">Views</th>
              <th className="text-center p-4 text-sm font-medium">Status</th>
              <th className="text-right p-4 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id} className="border-b border-border/50 last:border-0">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {video.thumbnail_url && (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-16 h-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium line-clamp-1">{video.title}</p>
                      <p className="text-xs text-muted-foreground">{video.duration}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {categories.find((c) => c.id === video.category_id)?.name || "-"}
                  </span>
                </td>
                <td className="p-4 text-center hidden md:table-cell">
                  <span className="text-sm">{video.views}</span>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => toggleFeatured(video)}
                      className={`p-1 rounded ${video.is_featured ? "text-accent" : "text-muted-foreground"}`}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => togglePublished(video)}
                      className={video.is_published ? "text-green-500" : "text-muted-foreground"}
                    >
                      {video.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(video)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(video.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {videos.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No videos found. Click "Add Video" to create your first video.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
