import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Loader2, Upload, ExternalLink, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    video_url: "",
    video_file_url: "",
    is_external: true,
    thumbnail_url: "",
    duration: "",
    category_id: "",
    multiplier: "",
    is_featured: false,
    is_published: true,
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

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
      video_file_url: "",
      is_external: true,
      thumbnail_url: "",
      duration: "",
      category_id: "",
      multiplier: "",
      is_featured: false,
      is_published: true,
    });
    setEditingVideo(null);
    setShowForm(false);
    setVideoFile(null);
    setThumbnailFile(null);
  };

  const handleEdit = (video: Video) => {
    setFormData({
      title: video.title,
      video_url: video.video_url,
      video_file_url: video.video_file_url || "",
      is_external: video.is_external ?? true,
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

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
    }
  };

  const uploadFile = async (file: File, bucket: string, folder: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let videoFileUrl = formData.video_file_url;
      let thumbnailUrl = formData.thumbnail_url;

      // Upload video file if provided
      if (videoFile && !formData.is_external) {
        setIsUploading(true);
        videoFileUrl = await uploadFile(videoFile, "videos", "uploads");
        setIsUploading(false);
      }

      // Upload thumbnail if provided
      if (thumbnailFile) {
        thumbnailUrl = await uploadFile(thumbnailFile, "media", "thumbnails");
      }

      const videoData = {
        title: formData.title,
        video_url: formData.is_external ? formData.video_url : (videoFileUrl || formData.video_url),
        video_file_url: formData.is_external ? null : videoFileUrl,
        is_external: formData.is_external,
        thumbnail_url: thumbnailUrl || null,
        duration: formData.duration || null,
        category_id: formData.category_id || null,
        multiplier: formData.multiplier || null,
        is_featured: formData.is_featured,
        is_published: formData.is_published,
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
      setIsUploading(false);
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
            {/* Video Type Toggle */}
            <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm font-medium">External Link (YouTube, etc.)</span>
              </div>
              <Switch
                checked={!formData.is_external}
                onCheckedChange={(checked) => setFormData({ ...formData, is_external: !checked })}
              />
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4" />
                <span className="text-sm font-medium">Upload Video File</span>
              </div>
            </div>

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

              {formData.is_external ? (
                <div>
                  <label className="text-sm font-medium mb-1 block">Video URL (YouTube, Twitch, Kick) *</label>
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    required
                    placeholder="https://youtube.com/watch?v=... or https://twitch.tv/videos/... or https://kick.com/video/..."
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Supports YouTube, Twitch VODs, and Kick VODs</p>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium mb-1 block">Upload Video File *</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoFileChange}
                        className="hidden"
                      />
                      <div className="w-full px-4 py-2 bg-secondary border border-border rounded-xl flex items-center gap-2 hover:border-primary transition-colors">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm truncate">
                          {videoFile ? videoFile.name : "Choose video file..."}
                        </span>
                      </div>
                    </label>
                  </div>
                  {formData.video_file_url && !videoFile && (
                    <p className="text-xs text-muted-foreground mt-1">Current: {formData.video_file_url.split("/").pop()}</p>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1 block">Thumbnail</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="URL or upload below"
                    className="flex-1 px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleThumbnailFileChange} className="hidden" />
                    <Button variant="outline" type="button" asChild>
                      <span><Upload className="w-4 h-4" /></span>
                    </Button>
                  </label>
                </div>
                {thumbnailFile && <p className="text-xs text-muted-foreground mt-1">Selected: {thumbnailFile.name}</p>}
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
              <Button type="submit" disabled={isSaving || isUploading}>
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading...</>
                ) : isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save Video"
                )}
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
              <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Type</th>
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
                  <span className={`text-xs px-2 py-1 rounded ${video.is_external ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}>
                    {video.is_external ? "External" : "Uploaded"}
                  </span>
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
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
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