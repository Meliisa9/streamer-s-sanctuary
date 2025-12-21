import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical, Loader2, Flame, Crown, Video, Star, Zap, Film } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface VideoCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number | null;
  is_default: boolean | null;
  display_title: string | null;
  icon: string | null;
}

const iconOptions = [
  { value: "Video", label: "Video", icon: Video },
  { value: "Flame", label: "Flame (Big Wins)", icon: Flame },
  { value: "Crown", label: "Crown (Max Wins)", icon: Crown },
  { value: "Star", label: "Star", icon: Star },
  { value: "Zap", label: "Zap", icon: Zap },
  { value: "Film", label: "Film", icon: Film },
];

const getIconComponent = (iconName: string | null) => {
  const found = iconOptions.find(i => i.value === iconName);
  return found?.icon || Video;
};

function SortableCategory({ 
  category, 
  onEdit, 
  onDelete 
}: { 
  category: VideoCategory; 
  onEdit: (cat: VideoCategory) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const IconComponent = getIconComponent(category.icon);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 glass rounded-xl"
    >
      <button {...attributes} {...listeners} className="cursor-grab hover:text-primary">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </button>
      
      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
        <IconComponent className="w-5 h-5 text-primary" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{category.display_title || category.name}</h3>
          {category.is_default && (
            <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded">Default</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Slug: {category.slug}</p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(category)}>
          <Pencil className="w-4 h-4" />
        </Button>
        {!category.is_default && (
          <Button variant="outline" size="sm" onClick={() => onDelete(category.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AdminVideoCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<VideoCategory | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    display_title: "",
    icon: "Video",
    is_default: false,
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-video-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as VideoCategory[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      
      // Check if slug already exists
      const { data: existing } = await supabase
        .from("video_categories")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      
      if (existing) {
        throw new Error(`A category with slug "${slug}" already exists. Please use a different name or slug.`);
      }
      
      // Auto-calculate sort_order
      const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order || 0), 0);
      
      const { error } = await supabase.from("video_categories").insert({
        name: data.name,
        slug,
        description: data.description || null,
        display_title: data.display_title || data.name,
        icon: data.icon,
        is_default: false,
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-categories"] });
      queryClient.invalidateQueries({ queryKey: ["video-categories"] });
      toast({ title: "Category created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase.from("video_categories").update({
        name: data.name,
        description: data.description || null,
        display_title: data.display_title || data.name,
        icon: data.icon,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-categories"] });
      queryClient.invalidateQueries({ queryKey: ["video-categories"] });
      toast({ title: "Category updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("video_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-categories"] });
      queryClient.invalidateQueries({ queryKey: ["video-categories"] });
      toast({ title: "Category deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({ id, sort_order: index }));
      for (const update of updates) {
        await supabase.from("video_categories").update({ sort_order: update.sort_order }).eq("id", update.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-categories"] });
      queryClient.invalidateQueries({ queryKey: ["video-categories"] });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", slug: "", description: "", display_title: "", icon: "Video", is_default: false });
    setEditingCategory(null);
  };

  const handleEdit = (category: VideoCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      display_title: category.display_title || "",
      icon: category.icon || "Video",
      is_default: category.is_default || false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex(c => c.id === active.id);
      const newIndex = categories.findIndex(c => c.id === over.id);
      const newOrder = arrayMove(categories, oldIndex, newIndex);
      reorderMutation.mutate(newOrder.map(c => c.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
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
        <div>
          <h1 className="text-3xl font-bold">Video Categories</h1>
          <p className="text-muted-foreground">Manage and configure video categories displayed on the Videos page</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Bonus Buys"
                  required
                  disabled={editingCategory?.is_default || false}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Display Title (shown on page)</Label>
                <Input
                  value={formData.display_title}
                  onChange={(e) => setFormData({ ...formData, display_title: e.target.value })}
                  placeholder="e.g., 🔥 Big Wins"
                />
                <p className="text-xs text-muted-foreground">Leave empty to use the name</p>
              </div>

              {!editingCategory && (
                <div className="space-y-2">
                  <Label>Slug (URL-friendly)</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Auto-generated from name if empty"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="w-4 h-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>

              <Button type="submit" className="w-full">
                {editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Drag to reorder categories. Default categories cannot be deleted.</p>
        
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {categories.map((category) => (
                <SortableCategory
                  key={category.id}
                  category={category}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {categories.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Video className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No categories yet. Add your first category to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
