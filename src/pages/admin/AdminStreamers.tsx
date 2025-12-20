import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Users, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Streamers</h1>
          <p className="text-muted-foreground">Manage your streamers and team</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Add Streamer</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStreamer ? "Edit Streamer" : "Add New Streamer"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Profile Image</Label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center"><Users className="w-6 h-6 text-muted-foreground" /></div>
                  )}
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    <Button variant="outline" type="button" asChild><span><Upload className="w-4 h-4 mr-2" />Upload</span></Button>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Twitch URL</Label>
                  <Input value={formData.twitch_url} onChange={(e) => setFormData({ ...formData, twitch_url: e.target.value })} placeholder="https://twitch.tv/..." />
                </div>
                <div className="space-y-2">
                  <Label>Kick URL</Label>
                  <Input value={formData.kick_url} onChange={(e) => setFormData({ ...formData, kick_url: e.target.value })} placeholder="https://kick.com/..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>YouTube URL</Label>
                  <Input value={formData.youtube_url} onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Twitter URL</Label>
                  <Input value={formData.twitter_url} onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Instagram URL</Label>
                  <Input value={formData.instagram_url} onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Discord URL</Label>
                  <Input value={formData.discord_url} onChange={(e) => setFormData({ ...formData, discord_url: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
              
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.streamer_type} onValueChange={(v) => setFormData({ ...formData, streamer_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="streamer">Streamer</SelectItem>
                    <SelectItem value="team_member">Team Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Link to User Profile</Label>
                <Select 
                  value={formData.linked_user_id} 
                  onValueChange={(v) => setFormData({ ...formData, linked_user_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No linked user</SelectItem>
                    {users?.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.username || user.display_name || user.user_id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">When linked, clicking the avatar will redirect to the user profile.</p>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                  <Label>Active</Label>
                </div>
              </div>
              <Button type="submit" className="w-full">{editingStreamer ? "Update Streamer" : "Add Streamer"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
