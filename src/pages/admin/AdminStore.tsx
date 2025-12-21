import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminStatsGrid } from "@/components/admin/AdminStatsGrid";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  Store, 
  Plus, 
  Pencil, 
  Trash2, 
  Package, 
  Tag, 
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
  Gift,
  Coins,
  FileText,
  CreditCard
} from "lucide-react";

interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

interface StoreItem {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  points_cost: number;
  item_type: string;
  item_data: Record<string, unknown>;
  stock_quantity: number | null;
  max_per_user: number | null;
  is_active: boolean;
  is_featured: boolean;
  available_from: string | null;
  available_until: string | null;
  created_at: string;
  category?: StoreCategory;
}

interface StoreRedemption {
  id: string;
  user_id: string;
  item_id: string;
  points_spent: number;
  quantity: number;
  status: string;
  fulfillment_data: Record<string, unknown>;
  notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  item?: StoreItem;
  profile?: { username: string | null; display_name: string | null; avatar_url: string | null };
}

const ITEM_TYPES = [
  { value: "merchandise", label: "Merchandise", icon: Package },
  { value: "giveaway_entry", label: "Giveaway Entry", icon: Gift },
  { value: "exclusive_content", label: "Exclusive Content", icon: FileText },
  { value: "casino_credit", label: "Casino Credit", icon: CreditCard },
  { value: "custom", label: "Custom", icon: Tag },
];

const REDEMPTION_STATUSES = ["pending", "processing", "completed", "cancelled", "refunded"];

export default function AdminStore() {
  const [activeTab, setActiveTab] = useState("items");
  const [searchQuery, setSearchQuery] = useState("");
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null);
  const queryClient = useQueryClient();

  // Form states
  const [itemForm, setItemForm] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    points_cost: 100,
    item_type: "merchandise",
    item_data: {} as Record<string, unknown>,
    stock_quantity: null as number | null,
    max_per_user: null as number | null,
    is_active: true,
    is_featured: false,
    category_id: null as string | null,
    available_from: "",
    available_until: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "Gift",
    is_active: true,
  });

  // Queries
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["store-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as StoreCategory[];
    },
  });

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ["store-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_items")
        .select("*, category:store_categories(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StoreItem[];
    },
  });

  const { data: redemptions = [], isLoading: loadingRedemptions } = useQuery({
    queryKey: ["store-redemptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_redemptions")
        .select("*, item:store_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set(data?.map(r => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      
      return (data || []).map(r => ({
        ...r,
        profile: profileMap.get(r.user_id),
      })) as StoreRedemption[];
    },
  });

  // Stats
  const stats = [
    { 
      label: "Total Items", 
      value: items.length, 
      icon: Package, 
      trendLabel: `${items.filter(i => i.is_active).length} active`
    },
    { 
      label: "Categories", 
      value: categories.length, 
      icon: Tag,
      trendLabel: `${categories.filter(c => c.is_active).length} active`
    },
    { 
      label: "Pending Orders", 
      value: redemptions.filter(r => r.status === "pending").length, 
      icon: Clock,
      trendLabel: `${redemptions.filter(r => r.status === "processing").length} processing`
    },
    { 
      label: "Points Redeemed", 
      value: redemptions.filter(r => r.status === "completed").reduce((acc, r) => acc + r.points_spent, 0).toLocaleString(), 
      icon: Coins,
    },
  ];

  // Mutations
  const createItemMutation = useMutation({
    mutationFn: async (data: typeof itemForm) => {
      const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const { error } = await supabase.from("store_items").insert({
        name: data.name,
        slug,
        description: data.description || null,
        image_url: data.image_url || null,
        points_cost: data.points_cost,
        item_type: data.item_type,
        item_data: data.item_data as unknown as Record<string, never>,
        stock_quantity: data.stock_quantity,
        max_per_user: data.max_per_user,
        is_active: data.is_active,
        is_featured: data.is_featured,
        category_id: data.category_id,
        available_from: data.available_from || null,
        available_until: data.available_until || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-items"] });
      setIsItemDialogOpen(false);
      resetItemForm();
      toast({ title: "Item created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating item", description: error.message, variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof itemForm }) => {
      const { error } = await supabase.from("store_items").update({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        image_url: data.image_url || null,
        points_cost: data.points_cost,
        item_type: data.item_type,
        item_data: data.item_data as unknown as Record<string, never>,
        stock_quantity: data.stock_quantity,
        max_per_user: data.max_per_user,
        is_active: data.is_active,
        is_featured: data.is_featured,
        category_id: data.category_id,
        available_from: data.available_from || null,
        available_until: data.available_until || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-items"] });
      setIsItemDialogOpen(false);
      setEditingItem(null);
      resetItemForm();
      toast({ title: "Item updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating item", description: error.message, variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-items"] });
      toast({ title: "Item deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting item", description: error.message, variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof categoryForm) => {
      const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const { error } = await supabase.from("store_categories").insert({ ...data, slug });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-categories"] });
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
      toast({ title: "Category created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating category", description: error.message, variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof categoryForm }) => {
      const { error } = await supabase.from("store_categories").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-categories"] });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      resetCategoryForm();
      toast({ title: "Category updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating category", description: error.message, variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-categories"] });
      toast({ title: "Category deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting category", description: error.message, variant: "destructive" });
    },
  });

  const updateRedemptionMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("store_redemptions").update({
        status,
        notes,
        processed_by: user?.id,
        processed_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-redemptions"] });
      toast({ title: "Redemption updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating redemption", description: error.message, variant: "destructive" });
    },
  });

  const resetItemForm = () => {
    setItemForm({
      name: "",
      slug: "",
      description: "",
      image_url: "",
      points_cost: 100,
      item_type: "merchandise",
      item_data: {},
      stock_quantity: null,
      max_per_user: null,
      is_active: true,
      is_featured: false,
      category_id: null,
      available_from: "",
      available_until: "",
    });
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: "",
      slug: "",
      description: "",
      icon: "Gift",
      is_active: true,
    });
  };

  const openEditItem = (item: StoreItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      slug: item.slug,
      description: item.description || "",
      image_url: item.image_url || "",
      points_cost: item.points_cost,
      item_type: item.item_type,
      item_data: item.item_data || {},
      stock_quantity: item.stock_quantity,
      max_per_user: item.max_per_user,
      is_active: item.is_active,
      is_featured: item.is_featured,
      category_id: item.category_id,
      available_from: item.available_from?.slice(0, 16) || "",
      available_until: item.available_until?.slice(0, 16) || "",
    });
    setIsItemDialogOpen(true);
  };

  const openEditCategory = (cat: StoreCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      icon: cat.icon || "Gift",
      is_active: cat.is_active,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleSubmitItem = () => {
    if (!itemForm.name || itemForm.points_cost <= 0) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: itemForm });
    } else {
      createItemMutation.mutate(itemForm);
    }
  };

  const handleSubmitCategory = () => {
    if (!categoryForm.name) {
      toast({ title: "Please enter a category name", variant: "destructive" });
      return;
    }
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryForm });
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRedemptions = redemptions.filter(r =>
    r.item?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.profile?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "pending": return "secondary";
      case "processing": return "outline";
      case "cancelled": return "destructive";
      case "refunded": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "processing": return <ShoppingCart className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      case "refunded": return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loadingItems || loadingCategories || loadingRedemptions) {
    return <AdminLoadingState message="Loading store data..." />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Points Store"
        description="Manage store items, categories, and redemptions"
        icon={Store}
      />

      <AdminStatsGrid stats={stats} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList>
            <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
            <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
            <TabsTrigger value="redemptions">
              Redemptions ({redemptions.filter(r => r.status === "pending").length} pending)
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <AdminSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search..."
            />
            {activeTab === "items" && (
              <Button onClick={() => { resetItemForm(); setEditingItem(null); setIsItemDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            )}
            {activeTab === "categories" && (
              <Button onClick={() => { resetCategoryForm(); setEditingCategory(null); setIsCategoryDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Category
              </Button>
            )}
          </div>
        </div>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          {filteredItems.length === 0 ? (
            <AdminEmptyState
              icon={Package}
              title="No store items"
              description="Create your first store item to get started"
              action={{ label: "Add Item", onClick: () => { resetItemForm(); setEditingItem(null); setIsItemDialogOpen(true); } }}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <AdminCard key={item.id} className="relative">
                  {item.is_featured && (
                    <Badge className="absolute top-2 right-2">Featured</Badge>
                  )}
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {item.description || "No description"}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">{item.item_type}</Badge>
                    {item.category?.name && (
                      <Badge variant="outline">{item.category.name}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">{item.points_cost.toLocaleString()} pts</span>
                    <span className="text-sm text-muted-foreground">
                      {item.stock_quantity !== null ? `${item.stock_quantity} in stock` : "Unlimited"}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => openEditItem(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => {
                        if (confirm("Delete this item?")) deleteItemMutation.mutate(item.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </AdminCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          {categories.length === 0 ? (
            <AdminEmptyState
              icon={Tag}
              title="No categories"
              description="Create categories to organize your store items"
              action={{ label: "Add Category", onClick: () => { resetCategoryForm(); setEditingCategory(null); setIsCategoryDialogOpen(true); } }}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <AdminCard key={cat.id}>
                  <div className="flex items-center gap-3 mb-2">
                    <Tag className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">{cat.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {cat.description || "No description"}
                  </p>
                  <Badge variant={cat.is_active ? "default" : "secondary"}>
                    {cat.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => openEditCategory(cat)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Delete this category?")) deleteCategoryMutation.mutate(cat.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </AdminCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Redemptions Tab */}
        <TabsContent value="redemptions" className="space-y-4">
          {filteredRedemptions.length === 0 ? (
            <AdminEmptyState
              icon={ShoppingCart}
              title="No redemptions"
              description="Redemptions will appear here when users redeem items"
            />
          ) : (
            <div className="space-y-4">
              {filteredRedemptions.map((redemption) => (
                <AdminCard key={redemption.id}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {redemption.profile?.avatar_url ? (
                        <img 
                          src={redemption.profile.avatar_url} 
                          alt="" 
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {redemption.profile?.display_name || redemption.profile?.username || "Unknown User"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {redemption.item?.name} × {redemption.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(redemption.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{redemption.points_spent.toLocaleString()} pts</span>
                      <Badge variant={getStatusColor(redemption.status)} className="gap-1">
                        {getStatusIcon(redemption.status)}
                        {redemption.status}
                      </Badge>
                      <Select
                        value={redemption.status}
                        onValueChange={(status) => updateRedemptionMutation.mutate({ id: redemption.id, status })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REDEMPTION_STATUSES.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {redemption.notes && (
                    <p className="text-sm text-muted-foreground mt-2 border-t pt-2">
                      Notes: {redemption.notes}
                    </p>
                  )}
                </AdminCard>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={itemForm.name}
                  onChange={(e) => setItemForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Item name"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={itemForm.slug}
                  onChange={(e) => setItemForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="auto-generated-from-name"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={itemForm.description}
                onChange={(e) => setItemForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Item description"
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={itemForm.image_url}
                onChange={(e) => setItemForm(f => ({ ...f, image_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points Cost *</Label>
                <Input
                  type="number"
                  value={itemForm.points_cost}
                  onChange={(e) => setItemForm(f => ({ ...f, points_cost: parseInt(e.target.value) || 0 }))}
                  min={1}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={itemForm.category_id || "none"}
                  onValueChange={(v) => setItemForm(f => ({ ...f, category_id: v === "none" ? null : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Item Type</Label>
              <Select
                value={itemForm.item_type}
                onValueChange={(v) => setItemForm(f => ({ ...f, item_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {itemForm.item_type === "casino_credit" && (
              <div>
                <Label>Casino Name</Label>
                <Input
                  value={(itemForm.item_data.casino_name as string) || ""}
                  onChange={(e) => setItemForm(f => ({ 
                    ...f, 
                    item_data: { ...f.item_data, casino_name: e.target.value } 
                  }))}
                  placeholder="e.g., Stake, Roobet"
                />
              </div>
            )}
            {itemForm.item_type === "exclusive_content" && (
              <div>
                <Label>Content URL</Label>
                <Input
                  value={(itemForm.item_data.content_url as string) || ""}
                  onChange={(e) => setItemForm(f => ({ 
                    ...f, 
                    item_data: { ...f.item_data, content_url: e.target.value } 
                  }))}
                  placeholder="https://..."
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stock Quantity (empty = unlimited)</Label>
                <Input
                  type="number"
                  value={itemForm.stock_quantity ?? ""}
                  onChange={(e) => setItemForm(f => ({ 
                    ...f, 
                    stock_quantity: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  min={0}
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <Label>Max Per User (empty = unlimited)</Label>
                <Input
                  type="number"
                  value={itemForm.max_per_user ?? ""}
                  onChange={(e) => setItemForm(f => ({ 
                    ...f, 
                    max_per_user: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  min={1}
                  placeholder="Unlimited"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Available From</Label>
                <Input
                  type="datetime-local"
                  value={itemForm.available_from}
                  onChange={(e) => setItemForm(f => ({ ...f, available_from: e.target.value }))}
                />
              </div>
              <div>
                <Label>Available Until</Label>
                <Input
                  type="datetime-local"
                  value={itemForm.available_until}
                  onChange={(e) => setItemForm(f => ({ ...f, available_until: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={itemForm.is_active}
                  onCheckedChange={(v) => setItemForm(f => ({ ...f, is_active: v }))}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={itemForm.is_featured}
                  onCheckedChange={(v) => setItemForm(f => ({ ...f, is_featured: v }))}
                />
                <Label>Featured</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitItem}>
                {editingItem ? "Update Item" : "Create Item"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Category name"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="auto-generated"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Category description"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={categoryForm.is_active}
                onCheckedChange={(v) => setCategoryForm(f => ({ ...f, is_active: v }))}
              />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitCategory}>
                {editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}