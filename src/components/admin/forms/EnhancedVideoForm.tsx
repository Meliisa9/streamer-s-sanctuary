import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Video, Upload, ExternalLink, Film, Star, Eye, Clock, Folder, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedFormDialog, FormSection, FormField, FormRow, ToggleOption } from "./EnhancedFormDialog";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface VideoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingVideo?: any;
  onSuccess: () => void;
  categories: Category[];
}

export function EnhancedVideoForm({ open, onOpenChange, editingVideo, onSuccess, categories }: VideoFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

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

  useEffect(() => {
    if (editingVideo) {
      setFormData({
        title: editingVideo.title,
        video_url: editingVideo.video_url,
        video_file_url: editingVideo.video_file_url || "",
        is_external: editingVideo.is_external ?? true,
        thumbnail_url: editingVideo.thumbnail_url || "",
        duration: editingVideo.duration || "",
        category_id: editingVideo.category_id || "",
        multiplier: editingVideo.multiplier || "",
        is_featured: editingVideo.is_featured,
        is_published: editingVideo.is_published,
      });
    } else {
      resetForm();
    }
  }, [editingVideo, open]);

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
    setVideoFile(null);
    setThumbnailFile(null);
  };

  const uploadFile = async (file: File, bucket: string, folder: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
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

      if (videoFile && !formData.is_external) {
        setIsUploading(true);
        videoFileUrl = await uploadFile(videoFile, "videos", "uploads");
        setIsUploading(false);
      }

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
        const { error } = await supabase.from("videos").update(videoData).eq("id", editingVideo.id);
        if (error) throw error;
        toast({ title: "Video updated successfully" });
      } else {
        const { error } = await supabase.from("videos").insert(videoData);
        if (error) throw error;
        toast({ title: "Video added successfully" });
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  return (
    <EnhancedFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingVideo ? "Edit Video" : "Add New Video"}
      subtitle="Upload or link a video to your collection"
      icon={<Video className="w-5 h-5 text-primary" />}
      onSubmit={handleSubmit}
      isSubmitting={isSaving || isUploading}
      submitText={isUploading ? "Uploading..." : isSaving ? "Saving..." : "Save Video"}
      submitIcon={<Film className="w-4 h-4" />}
      size="xl"
    >
      {/* Video Source Section */}
      <FormSection title="Video Source" icon={<ExternalLink className="w-4 h-4" />}>
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-border/50">
          <ToggleOption
            checked={formData.is_external}
            onChange={(checked) => setFormData({ ...formData, is_external: checked })}
            icon={<ExternalLink className="w-4 h-4" />}
            label="External Link"
            description="YouTube, Twitch, Kick VODs"
            color="primary"
          />
          <ToggleOption
            checked={!formData.is_external}
            onChange={(checked) => setFormData({ ...formData, is_external: !checked })}
            icon={<Upload className="w-4 h-4" />}
            label="Upload Video"
            description="Upload directly to server"
            color="green"
          />
        </div>

        {formData.is_external ? (
          <FormField label="Video URL" required hint="YouTube, Twitch, or Kick video link">
            <Input
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=... or https://kick.com/video/..."
              required
            />
          </FormField>
        ) : (
          <FormField label="Upload Video" required>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="w-full px-4 py-8 bg-secondary/50 border-2 border-dashed border-border rounded-xl flex flex-col items-center gap-2 hover:border-primary/50 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {videoFile ? videoFile.name : "Click to select video file"}
                </span>
              </div>
            </label>
          </FormField>
        )}
      </FormSection>

      {/* Video Details Section */}
      <FormSection title="Video Details" icon={<Film className="w-4 h-4" />}>
        <FormField label="Title" required>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Epic Win Compilation"
            required
          />
        </FormField>

        <FormRow>
          <FormField label="Duration" hint="Format: MM:SS">
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="12:34"
                className="pl-10"
              />
            </div>
          </FormField>
          <FormField label="Multiplier" hint="e.g., 50,000x">
            <div className="relative">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={formData.multiplier}
                onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                placeholder="50,000x"
                className="pl-10"
              />
            </div>
          </FormField>
        </FormRow>

        <FormField label="Category">
          <div className="relative">
            <Folder className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary appearance-none"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </FormField>
      </FormSection>

      {/* Thumbnail Section */}
      <FormSection title="Thumbnail" icon={<Upload className="w-4 h-4" />}>
        <FormRow>
          <FormField label="Thumbnail URL">
            <Input
              type="url"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              placeholder="https://..."
            />
          </FormField>
          <FormField label="Or Upload">
            <label className="cursor-pointer block">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="w-full px-4 py-2 bg-secondary border border-border rounded-xl flex items-center gap-2 hover:border-primary/50 transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-sm truncate">
                  {thumbnailFile ? thumbnailFile.name : "Choose file..."}
                </span>
              </div>
            </label>
          </FormField>
        </FormRow>
      </FormSection>

      {/* Status Section */}
      <FormSection title="Visibility" icon={<Eye className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <ToggleOption
            checked={formData.is_featured}
            onChange={(checked) => setFormData({ ...formData, is_featured: checked })}
            icon={<Star className="w-4 h-4" />}
            label="Featured"
            description="Show in featured section"
            color="amber"
          />
          <ToggleOption
            checked={formData.is_published}
            onChange={(checked) => setFormData({ ...formData, is_published: checked })}
            icon={<Eye className="w-4 h-4" />}
            label="Published"
            description="Visible to everyone"
            color="green"
          />
        </div>
      </FormSection>
    </EnhancedFormDialog>
  );
}
