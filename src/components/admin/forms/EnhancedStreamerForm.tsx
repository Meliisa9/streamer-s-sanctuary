import { useState, useEffect } from "react";
import { Users, Upload, Link2, Eye, User, Instagram, MessageCircle, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EnhancedFormDialog, FormSection, FormField, FormRow, ToggleOption } from "./EnhancedFormDialog";

interface StreamerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingStreamer?: any;
  onSuccess: () => void;
  users?: { user_id: string; username: string | null; display_name: string | null }[];
}

export function EnhancedStreamerForm({ open, onOpenChange, editingStreamer, onSuccess, users = [] }: StreamerFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    twitch_url: "",
    kick_url: "",
    youtube_url: "",
    twitter_url: "",
    discord_url: "",
    instagram_url: "",
    is_main_streamer: false,
    is_active: true,
    sort_order: 0,
    linked_user_id: "",
    streamer_type: "streamer",
  });

  useEffect(() => {
    if (editingStreamer) {
      setFormData({
        name: editingStreamer.name,
        description: editingStreamer.description || "",
        twitch_url: editingStreamer.twitch_url || "",
        kick_url: editingStreamer.kick_url || "",
        youtube_url: editingStreamer.youtube_url || "",
        twitter_url: editingStreamer.twitter_url || "",
        discord_url: editingStreamer.discord_url || "",
        instagram_url: editingStreamer.instagram_url || "",
        is_main_streamer: editingStreamer.is_main_streamer ?? false,
        is_active: editingStreamer.is_active ?? true,
        sort_order: editingStreamer.sort_order || 0,
        linked_user_id: editingStreamer.linked_user_id || "",
        streamer_type: editingStreamer.streamer_type || "streamer",
      });
      setImagePreview(editingStreamer.image_url);
    } else {
      resetForm();
    }
  }, [editingStreamer, open]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      twitch_url: "",
      kick_url: "",
      youtube_url: "",
      twitter_url: "",
      discord_url: "",
      instagram_url: "",
      is_main_streamer: false,
      is_active: true,
      sort_order: 0,
      linked_user_id: "",
      streamer_type: "streamer",
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let imageUrl = editingStreamer?.image_url || null;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `streamer-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("media").upload(fileName, imageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const streamerData = {
        ...formData,
        image_url: imageUrl,
        linked_user_id: formData.linked_user_id || null,
      };

      if (editingStreamer) {
        const { error } = await supabase.from("streamers").update(streamerData).eq("id", editingStreamer.id);
        if (error) throw error;
        toast({ title: "Streamer updated" });
      } else {
        const { error } = await supabase.from("streamers").insert([streamerData]);
        if (error) throw error;
        toast({ title: "Streamer added" });
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EnhancedFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingStreamer ? "Edit Streamer" : "Add New Streamer"}
      subtitle="Add a streamer or team member"
      icon={<Users className="w-5 h-5 text-primary" />}
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
      submitText={isSaving ? "Saving..." : "Save Streamer"}
      submitIcon={<Users className="w-4 h-4" />}
      size="xl"
    >
      {/* Profile Section */}
      <FormSection title="Profile" icon={<User className="w-4 h-4" />}>
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <label className="cursor-pointer block">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <div className="w-24 h-24 rounded-2xl bg-secondary/50 border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-center text-muted-foreground mt-1">Upload</p>
            </label>
          </div>
          <div className="flex-1 space-y-4">
            <FormField label="Name" required>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Streamer Name"
                required
              />
            </FormField>
            <FormRow>
              <FormField label="Type">
                <select
                  value={formData.streamer_type}
                  onChange={(e) => setFormData({ ...formData, streamer_type: e.target.value })}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
                >
                  <option value="streamer">Streamer</option>
                  <option value="team_member">Team Member</option>
                </select>
              </FormField>
            </FormRow>
          </div>
        </div>

        <FormField label="Description">
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            placeholder="Short bio or description..."
          />
        </FormField>
      </FormSection>

      {/* Social Links */}
      <FormSection title="Social Links" icon={<Link2 className="w-4 h-4" />}>
        <FormRow>
          <FormField label="Twitch URL">
            <Input
              value={formData.twitch_url}
              onChange={(e) => setFormData({ ...formData, twitch_url: e.target.value })}
              placeholder="https://twitch.tv/..."
            />
          </FormField>
          <FormField label="Kick URL">
            <Input
              value={formData.kick_url}
              onChange={(e) => setFormData({ ...formData, kick_url: e.target.value })}
              placeholder="https://kick.com/..."
            />
          </FormField>
        </FormRow>
        <FormRow>
          <FormField label="YouTube URL">
            <Input
              value={formData.youtube_url}
              onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
              placeholder="https://youtube.com/..."
            />
          </FormField>
          <FormField label="Twitter URL">
            <Input
              value={formData.twitter_url}
              onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
              placeholder="https://twitter.com/..."
            />
          </FormField>
        </FormRow>
        <FormRow>
          <FormField label="Instagram URL">
            <Input
              value={formData.instagram_url}
              onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
              placeholder="https://instagram.com/..."
            />
          </FormField>
          <FormField label="Discord URL">
            <Input
              value={formData.discord_url}
              onChange={(e) => setFormData({ ...formData, discord_url: e.target.value })}
              placeholder="https://discord.gg/..."
            />
          </FormField>
        </FormRow>
      </FormSection>

      {/* Link to User */}
      {users.length > 0 && (
        <FormSection title="Link to User Account" icon={<User className="w-4 h-4" />}>
          <FormField label="User Profile" hint="Clicking streamer will redirect to user profile">
            <select
              value={formData.linked_user_id}
              onChange={(e) => setFormData({ ...formData, linked_user_id: e.target.value === "none" ? "" : e.target.value })}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary"
            >
              <option value="none">No linked user</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.username || user.display_name || user.user_id.slice(0, 8)}
                </option>
              ))}
            </select>
          </FormField>
        </FormSection>
      )}

      {/* Status */}
      <FormSection title="Status" icon={<Eye className="w-4 h-4" />}>
        <ToggleOption
          checked={formData.is_active}
          onChange={(checked) => setFormData({ ...formData, is_active: checked })}
          icon={<Eye className="w-4 h-4" />}
          label="Active"
          description="Show on public pages"
          color="green"
        />
      </FormSection>
    </EnhancedFormDialog>
  );
}
