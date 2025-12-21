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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  CreditCard,
  Image,
  Settings,
  Calendar,
  Sparkles,
  Box,
  Users,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  Star,
  Link2,
  DollarSign,
  Layers,
  Infinity
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
  { value: "merchandise", label: "Merchandise", icon: Package, description: "Physical products shipped to users" },
  { value: "giveaway_entry", label: "Giveaway Entry", icon: Gift, description: "Entry tickets for exclusive giveaways" },
  { value: "exclusive_content", label: "Exclusive Content", icon: FileText, description: "Digital content, videos, or downloads" },
  { value: "casino_credit", label: "Casino Credit", icon: CreditCard, description: "Credits for partner casinos" },
  { value: "custom", label: "Custom", icon: Tag, description: "Custom reward type" },
];

const REDEMPTION_STATUSES = ["pending", "processing", "completed", "cancelled", "refunded"];

// Stock mode type for clarity
type StockMode = "unlimited" | "limited" | "until_out";

export default function AdminStore() {
  const [activeTab, setActiveTab] = useState("items");
  const [searchQuery, setSearchQuery] = useState("");
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null);
  const [dialogStep, setDialogStep] = useState<"basic" | "details" | "availability">("basic");
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
    // New: stock mode for "available until out of stock"
    stock_mode: "unlimited" as StockMode,
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
      
      // Determine stock quantity based on stock mode
      let stockQty: number | null = null;
      if (data.stock_mode === "limited") {
        stockQty = data.stock_quantity;
      } else if (data.stock_mode === "until_out") {
        // For "until out of stock", we need a stock quantity - default to 1 if not set
        stockQty = data.stock_quantity || 1;
      }
      // If "unlimited", stockQty stays null
      
      const { error } = await supabase.from("store_items").insert({
        name: data.name,
        slug,
        description: data.description || null,
        image_url: data.image_url || null,
        points_cost: data.points_cost,
        item_type: data.item_type,
        item_data: data.item_data as unknown as Record<string, never>,
        stock_quantity: stockQty,
        max_per_user: data.max_per_user,
        is_active: data.is_active,
        is_featured: data.is_featured,
        category_id: data.category_id,
        available_from: data.available_from || null,
        // For "until_out" mode, we don't set available_until (item is available until stock runs out)
        available_until: data.stock_mode === "until_out" ? null : (data.available_until || null),
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
      // Determine stock quantity based on stock mode
      let stockQty: number | null = null;
      if (data.stock_mode === "limited") {
        stockQty = data.stock_quantity;
      } else if (data.stock_mode === "until_out") {
        stockQty = data.stock_quantity || 1;
      }
      
      const { error } = await supabase.from("store_items").update({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        image_url: data.image_url || null,
        points_cost: data.points_cost,
        item_type: data.item_type,
        item_data: data.item_data as unknown as Record<string, never>,
        stock_quantity: stockQty,
        max_per_user: data.max_per_user,
        is_active: data.is_active,
        is_featured: data.is_featured,
        category_id: data.category_id,
        available_from: data.available_from || null,
        available_until: data.stock_mode === "until_out" ? null : (data.available_until || null),
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
      stock_mode: "unlimited",
    });
    setDialogStep("basic");
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
    
    // Determine stock mode from existing data
    let stockMode: StockMode = "unlimited";
    if (item.stock_quantity !== null) {
      // If has stock quantity but no available_until, it's "until out of stock"
      if (!item.available_until) {
        stockMode = "until_out";
      } else {
        stockMode = "limited";
      }
    }
    
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
      stock_mode: stockMode,
    });
    setDialogStep("basic");
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

  const selectedItemType = ITEM_TYPES.find(t => t.value === itemForm.item_type);

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

      {/* Enhanced Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={(open) => {
        setIsItemDialogOpen(open);
        if (!open) {
          setDialogStep("basic");
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedItemType && (
                  <div className="p-2 rounded-lg bg-primary/10">
                    <selectedItemType.icon className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div>
                  <DialogTitle className="text-xl">
                    {editingItem ? "Edit Store Item" : "Create New Store Item"}
                  </DialogTitle>
                  <DialogDescription className="mt-0.5">
                    {editingItem ? "Update the item details below" : "Configure your new store item with all options"}
                  </DialogDescription>
                </div>
              </div>
              {itemForm.name && (
                <Badge variant="outline" className="text-sm">
                  {itemForm.points_cost.toLocaleString()} pts
                </Badge>
              )}
            </div>
          </DialogHeader>

          {/* Step Navigation */}
          <div className="flex border-b bg-background">
            <button
              onClick={() => setDialogStep("basic")}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${
                dialogStep === "basic" 
                  ? "border-primary text-primary bg-primary/5" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Box className="w-4 h-4" />
              Basic Info
            </button>
            <button
              onClick={() => setDialogStep("details")}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${
                dialogStep === "details" 
                  ? "border-primary text-primary bg-primary/5" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Settings className="w-4 h-4" />
              Details & Type
            </button>
            <button
              onClick={() => setDialogStep("availability")}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${
                dialogStep === "availability" 
                  ? "border-primary text-primary bg-primary/5" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Stock & Availability
            </button>
          </div>

          <ScrollArea className="flex-1 max-h-[calc(95vh-220px)]">
            <div className="p-6">
              {/* Step 1: Basic Info */}
              {dialogStep === "basic" && (
                <div className="space-y-6">
                  {/* Name & Slug */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        Item Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={itemForm.name}
                        onChange={(e) => setItemForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g., $100 Casino Credit"
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        This will be displayed to users in the store
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-muted-foreground" />
                        URL Slug
                      </Label>
                      <Input
                        value={itemForm.slug}
                        onChange={(e) => setItemForm(f => ({ ...f, slug: e.target.value }))}
                        placeholder="auto-generated-from-name"
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty to auto-generate from name
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Description
                    </Label>
                    <Textarea
                      value={itemForm.description}
                      onChange={(e) => setItemForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe what users will receive when they redeem this item..."
                      className="min-h-[100px] resize-none"
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-muted-foreground" />
                      Item Image
                    </Label>
                    <Tabs defaultValue="url" className="w-full">
                      <TabsList className="w-full">
                        <TabsTrigger value="url" className="flex-1">URL</TabsTrigger>
                        <TabsTrigger value="upload" className="flex-1">Upload</TabsTrigger>
                      </TabsList>
                      <TabsContent value="url" className="mt-3">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <Input
                              value={itemForm.image_url}
                              onChange={(e) => setItemForm(f => ({ ...f, image_url: e.target.value }))}
                              placeholder="https://example.com/image.jpg"
                              className="h-11"
                            />
                          </div>
                          {itemForm.image_url && (
                            <div className="w-24 h-24 rounded-lg border bg-muted overflow-hidden flex-shrink-0">
                              <img 
                                src={itemForm.image_url} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="upload" className="mt-3">
                        <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const fileExt = file.name.split(".").pop();
                                const fileName = `store-items/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                                const { error: uploadError } = await supabase.storage.from("media").upload(fileName, file, { upsert: true });
                                if (uploadError) throw uploadError;
                                const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fileName);
                                setItemForm(f => ({ ...f, image_url: publicUrl }));
                                toast({ title: "Image uploaded!" });
                              } catch (error: any) {
                                toast({ title: "Upload failed", description: error.message, variant: "destructive" });
                              }
                            }}
                            className="hidden"
                            id="store-image-upload"
                          />
                          <label htmlFor="store-image-upload" className="cursor-pointer">
                            <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Click to upload image</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                          </label>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Points Cost & Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        Points Cost <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={itemForm.points_cost}
                          onChange={(e) => setItemForm(f => ({ ...f, points_cost: parseInt(e.target.value) || 0 }))}
                          min={1}
                          className="h-11 pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          pts
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-muted-foreground" />
                        Category
                      </Label>
                      <Select
                        value={itemForm.category_id || "none"}
                        onValueChange={(v) => setItemForm(f => ({ ...f, category_id: v === "none" ? null : v }))}
                      >
                        <SelectTrigger className="h-11">
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

                  {/* Visibility Toggles */}
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Visibility Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                        <div className="flex items-center gap-3">
                          {itemForm.is_active ? (
                            <Eye className="w-5 h-5 text-green-500" />
                          ) : (
                            <EyeOff className="w-5 h-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium text-sm">Active</p>
                            <p className="text-xs text-muted-foreground">Show in store</p>
                          </div>
                        </div>
                        <Switch
                          checked={itemForm.is_active}
                          onCheckedChange={(v) => setItemForm(f => ({ ...f, is_active: v }))}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                        <div className="flex items-center gap-3">
                          <Star className={`w-5 h-5 ${itemForm.is_featured ? "text-yellow-500" : "text-muted-foreground"}`} />
                          <div>
                            <p className="font-medium text-sm">Featured</p>
                            <p className="text-xs text-muted-foreground">Highlight item</p>
                          </div>
                        </div>
                        <Switch
                          checked={itemForm.is_featured}
                          onCheckedChange={(v) => setItemForm(f => ({ ...f, is_featured: v }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Details & Type */}
              {dialogStep === "details" && (
                <div className="space-y-6">
                  {/* Item Type Selection */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      Item Type <span className="text-destructive">*</span>
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {ITEM_TYPES.map((type) => {
                        const isSelected = itemForm.item_type === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setItemForm(f => ({ ...f, item_type: type.value }))}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                              isSelected 
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                <type.icon className="w-5 h-5" />
                              </div>
                              <span className="font-medium">{type.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{type.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Type-specific fields */}
                  {itemForm.item_type === "casino_credit" && (
                    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                      <h4 className="font-medium flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Casino Credit Settings
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Casino Name</Label>
                          <Input
                            value={(itemForm.item_data.casino_name as string) || ""}
                            onChange={(e) => setItemForm(f => ({ 
                              ...f, 
                              item_data: { ...f.item_data, casino_name: e.target.value } 
                            }))}
                            placeholder="e.g., Stake, Roobet"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Credit Amount</Label>
                          <Input
                            value={(itemForm.item_data.credit_amount as string) || ""}
                            onChange={(e) => setItemForm(f => ({ 
                              ...f, 
                              item_data: { ...f.item_data, credit_amount: e.target.value } 
                            }))}
                            placeholder="e.g., $100"
                            className="h-11"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {itemForm.item_type === "exclusive_content" && (
                    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Exclusive Content Settings
                      </h4>
                      <div className="space-y-2">
                        <Label>Content URL / Download Link</Label>
                        <Input
                          value={(itemForm.item_data.content_url as string) || ""}
                          onChange={(e) => setItemForm(f => ({ 
                            ...f, 
                            item_data: { ...f.item_data, content_url: e.target.value } 
                          }))}
                          placeholder="https://..."
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Content Type</Label>
                        <Select
                          value={(itemForm.item_data.content_type as string) || "video"}
                          onValueChange={(v) => setItemForm(f => ({ 
                            ...f, 
                            item_data: { ...f.item_data, content_type: v } 
                          }))}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="download">Downloadable File</SelectItem>
                            <SelectItem value="access">Access Link</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {itemForm.item_type === "merchandise" && (
                    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                      <h4 className="font-medium flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Merchandise Settings
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Size Options (comma-separated)</Label>
                          <Input
                            value={(itemForm.item_data.sizes as string) || ""}
                            onChange={(e) => setItemForm(f => ({ 
                              ...f, 
                              item_data: { ...f.item_data, sizes: e.target.value } 
                            }))}
                            placeholder="S, M, L, XL"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Color Options (comma-separated)</Label>
                          <Input
                            value={(itemForm.item_data.colors as string) || ""}
                            onChange={(e) => setItemForm(f => ({ 
                              ...f, 
                              item_data: { ...f.item_data, colors: e.target.value } 
                            }))}
                            placeholder="Black, White, Red"
                            className="h-11"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          Physical items require manual fulfillment after redemption
                        </p>
                      </div>
                    </div>
                  )}

                  {itemForm.item_type === "giveaway_entry" && (
                    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                      <h4 className="font-medium flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        Giveaway Entry Settings
                      </h4>
                      <div className="space-y-2">
                        <Label>Linked Giveaway (optional)</Label>
                        <Input
                          value={(itemForm.item_data.giveaway_id as string) || ""}
                          onChange={(e) => setItemForm(f => ({ 
                            ...f, 
                            item_data: { ...f.item_data, giveaway_id: e.target.value } 
                          }))}
                          placeholder="Giveaway ID or leave empty"
                          className="h-11"
                        />
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Each redemption counts as one entry into the giveaway
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Max Per User */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      Max Redemptions Per User
                    </Label>
                    <Input
                      type="number"
                      value={itemForm.max_per_user ?? ""}
                      onChange={(e) => setItemForm(f => ({ 
                        ...f, 
                        max_per_user: e.target.value ? parseInt(e.target.value) : null 
                      }))}
                      min={1}
                      placeholder="Unlimited"
                      className="h-11 max-w-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty for unlimited redemptions per user
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Stock & Availability */}
              {dialogStep === "availability" && (
                <div className="space-y-6">
                  {/* Stock Mode Selection */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-muted-foreground" />
                      Stock Management
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setItemForm(f => ({ ...f, stock_mode: "unlimited" }))}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          itemForm.stock_mode === "unlimited" 
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Infinity className="w-5 h-5 text-primary" />
                          <span className="font-medium">Unlimited</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          No stock limit, always available
                        </p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setItemForm(f => ({ ...f, stock_mode: "limited" }))}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          itemForm.stock_mode === "limited" 
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="w-5 h-5 text-primary" />
                          <span className="font-medium">Limited Stock</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Set a specific quantity
                        </p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setItemForm(f => ({ ...f, stock_mode: "until_out" }))}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          itemForm.stock_mode === "until_out" 
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className="w-5 h-5 text-orange-500" />
                          <span className="font-medium">Until Out of Stock</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Available until stock depletes, no end date
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Stock Quantity (for limited or until_out modes) */}
                  {(itemForm.stock_mode === "limited" || itemForm.stock_mode === "until_out") && (
                    <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          Stock Quantity
                        </Label>
                        <Input
                          type="number"
                          value={itemForm.stock_quantity ?? ""}
                          onChange={(e) => setItemForm(f => ({ 
                            ...f, 
                            stock_quantity: e.target.value ? parseInt(e.target.value) : null 
                          }))}
                          min={1}
                          placeholder="Enter quantity"
                          className="h-11 max-w-xs"
                        />
                        {itemForm.stock_mode === "until_out" && (
                          <p className="text-xs text-muted-foreground">
                            Item will remain available until this stock is depleted
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Date Range Availability */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        Availability Schedule
                      </Label>
                      {itemForm.stock_mode === "until_out" && (
                        <Badge variant="outline" className="text-orange-500 border-orange-500/50">
                          End date disabled (stock-based)
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Available From</Label>
                        <Input
                          type="datetime-local"
                          value={itemForm.available_from}
                          onChange={(e) => setItemForm(f => ({ ...f, available_from: e.target.value }))}
                          className="h-11"
                        />
                        <p className="text-xs text-muted-foreground">
                          Leave empty to be available immediately
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Available Until</Label>
                        <Input
                          type="datetime-local"
                          value={itemForm.available_until}
                          onChange={(e) => setItemForm(f => ({ ...f, available_until: e.target.value }))}
                          className="h-11"
                          disabled={itemForm.stock_mode === "until_out"}
                        />
                        <p className="text-xs text-muted-foreground">
                          {itemForm.stock_mode === "until_out" 
                            ? "Availability based on stock, not date" 
                            : "Leave empty for no end date"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 rounded-lg border bg-primary/5 border-primary/20">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Item Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium">{itemForm.is_active ? "Active" : "Inactive"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Stock</p>
                        <p className="font-medium">
                          {itemForm.stock_mode === "unlimited" ? "Unlimited" : 
                           itemForm.stock_mode === "until_out" ? `${itemForm.stock_quantity || 0} (until depleted)` :
                           `${itemForm.stock_quantity || 0} units`}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">{itemForm.item_type.replace("_", " ")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cost</p>
                        <p className="font-medium">{itemForm.points_cost.toLocaleString()} pts</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-t bg-muted/30">
            <div className="flex gap-2">
              {dialogStep !== "basic" && (
                <Button
                  variant="ghost"
                  onClick={() => setDialogStep(dialogStep === "availability" ? "details" : "basic")}
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
                Cancel
              </Button>
              {dialogStep !== "availability" ? (
                <Button onClick={() => setDialogStep(dialogStep === "basic" ? "details" : "availability")}>
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmitItem}
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                >
                  {createItemMutation.isPending || updateItemMutation.isPending ? (
                    "Saving..."
                  ) : editingItem ? (
                    "Update Item"
                  ) : (
                    "Create Item"
                  )}
                </Button>
              )}
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