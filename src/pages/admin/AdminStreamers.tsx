import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Users, RefreshCw, Star, Radio } from "lucide-react";
import { EnhancedStreamerForm } from "@/components/admin/forms";
import { Badge } from "@/components/ui/badge";

interface Streamer {
  id: string;
  name: string;
  image_url: string | null;
  description: string | null;
  twitch_url: string | null;
  kick_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  discord_url: string | null;
  instagram_url: string | null;
  is_main_streamer: boolean;
  is_active: boolean;
  sort_order: number;
  linked_user_id: string | null;
  streamer_type: string;
}

interface UserProfile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export default function AdminStreamers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStreamer, setEditingStreamer] = useState<Streamer | null>(null);
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

  const { data: streamers, isLoading } = useQuery({
    queryKey: ["admin-streamers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("streamers").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Streamer[];
    },
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users-for-linking"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, username, display_name, avatar_url").order("username");
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { image_url?: string }) => {
      const { error } = await supabase.from("streamers").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-streamers"] });
      toast({ title: "Streamer added successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> & { image_url?: string } }) => {
      const { error } = await supabase.from("streamers").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-streamers"] });
      toast({ title: "Streamer updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("streamers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-streamers"] });
      toast({ title: "Streamer deleted" });
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

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
    setEditingStreamer(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleEdit = (streamer: Streamer) => {
    setEditingStreamer(streamer);
    setFormData({
      name: streamer.name,
      description: streamer.description || "",
      twitch_url: streamer.twitch_url || "",
      kick_url: streamer.kick_url || "",
      youtube_url: streamer.youtube_url || "",
      twitter_url: streamer.twitter_url || "",
      discord_url: streamer.discord_url || "",
      instagram_url: streamer.instagram_url || "",
      is_main_streamer: streamer.is_main_streamer,
      is_active: streamer.is_active,
      sort_order: streamer.sort_order,
      linked_user_id: streamer.linked_user_id || "",
      streamer_type: streamer.streamer_type || "streamer",
    });
    setImagePreview(streamer.image_url);
    setIsDialogOpen(true);
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
    let imageUrl = editingStreamer?.image_url || null;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `streamer-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("media").upload(fileName, imageFile, { upsert: true });
      if (uploadError) {
        toast({ title: "Error uploading image", variant: "destructive" });
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fileName);
      imageUrl = publicUrl;
    }

    const dataToSave = { 
      ...formData, 
      image_url: imageUrl,
      linked_user_id: formData.linked_user_id || null,
    };

    if (editingStreamer) {
      updateMutation.mutate({ id: editingStreamer.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const filteredStreamers = streamers?.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Streamers</h1>
          <p className="text-muted-foreground">Manage your streamers and team</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-streamers"] })}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Streamer
          </Button>
        </div>
      </div>

      <EnhancedStreamerForm
        open={isDialogOpen}
        onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}
        editingStreamer={editingStreamer}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-streamers"] });
          setIsDialogOpen(false);
          resetForm();
        }}
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search streamers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {filteredStreamers?.map((streamer) => (
            <div key={streamer.id} className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                {streamer.image_url ? (
                  <img src={streamer.image_url} alt={streamer.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{streamer.name}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded ${streamer.streamer_type === 'team_member' ? 'bg-blue-500/20 text-blue-400' : 'bg-primary/20 text-primary'}`}>
                    {streamer.streamer_type === 'team_member' ? 'Team Member' : 'Streamer'}
                  </span>
                  {!streamer.is_active && <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded">Inactive</span>}
                </div>
                <p className="text-sm text-muted-foreground truncate">{streamer.description || "No description"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(streamer)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this streamer?")) deleteMutation.mutate(streamer.id); }}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {filteredStreamers?.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">No streamers found</div>
          )}
        </div>
      )}
    </div>
  );
}
