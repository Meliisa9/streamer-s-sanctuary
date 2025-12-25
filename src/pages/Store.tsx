import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useChannelPoints } from "@/hooks/useChannelPoints";
import { ChannelPointsDisplay } from "@/components/ChannelPointsDisplay";
import { StoreItemCard } from "@/components/store/StoreItemCard";
import { StoreQuickViewModal } from "@/components/store/StoreQuickViewModal";
import { StoreRedemptionHistory } from "@/components/store/StoreRedemptionHistory";
import { StoreLoadingSkeleton } from "@/components/store/StoreLoadingSkeleton";
import { 
  Store as StoreIcon, Search, Coins, ShoppingCart, Package, Gift, FileText, CreditCard, Tag, Sparkles, Clock, History, Loader2, ExternalLink, Wallet, LayoutGrid, List, ArrowUpDown, TrendingUp, Award, Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
}

interface StoreItem {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  points_cost: number;
  twitch_points_cost: number | null;
  kick_points_cost: number | null;
  accepted_currencies: string[];
  item_type: string;
  item_data: Record<string, unknown>;
  stock_quantity: number | null;
  max_per_user: number | null;
  is_active: boolean;
  is_featured: boolean;
  available_from: string | null;
  available_until: string | null;
  category?: StoreCategory;
}

interface StoreRedemption {
  id: string;
  item_id: string;
  points_spent: number;
  platform_points_spent: number;
  currency: string;
  quantity: number;
  status: string;
  created_at: string;
  item?: StoreItem;
}

type Currency = "site" | "twitch" | "kick";
type SortOption = "featured" | "price-low" | "price-high" | "newest" | "name";
type ViewMode = "grid" | "list";

export default function Store() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { points: channelPoints, isLoading: loadingPoints, isConnected } = useChannelPoints();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [quickViewItem, setQuickViewItem] = useState<StoreItem | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("site");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("featured");

  // Fetch categories
  const { data: categories = [], isError: categoriesError, refetch: refetchCategories } = useQuery({
    queryKey: ["store-categories-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as StoreCategory[];
    },
    retry: 3,
  });

  // Fetch items
  const { data: items = [], isLoading: loadingItems, isError: itemsError, refetch: refetchItems } = useQuery({
    queryKey: ["store-items-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_items")
        .select("*, category:store_categories(*)")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("points_cost");
      if (error) throw error;
      return data as StoreItem[];
    },
    retry: 3,
  });

  // Fetch user's redemptions
  const { data: myRedemptions = [], isLoading: loadingRedemptions } = useQuery({
    queryKey: ["my-redemptions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("store_redemptions")
        .select("*, item:store_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StoreRedemption[];
    },
    enabled: !!user,
  });

  // Fetch Store FAQ
  const { data: storeFaq = [] } = useQuery({
    queryKey: ["store-faq"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "store_terms_faq")
        .maybeSingle();
      if (error) throw error;
      return (data?.value as Array<{ question: string; answer: string }>) || [];
    },
  });

  // Redeem mutation
  const redeemMutation = useMutation({
    mutationFn: async ({ itemId, currency }: { itemId: string; currency: Currency }) => {
      const { data, error } = await supabase.rpc("redeem_store_item_with_currency", {
        p_item_id: itemId,
        p_quantity: 1,
        p_currency: currency,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; new_balance?: number; currency?: string };
      if (!result.success) throw new Error(result.error || "Redemption failed");
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["store-items-public"] });
      queryClient.invalidateQueries({ queryKey: ["my-redemptions"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["channel-points"] });
      setIsConfirmOpen(false);
      setSelectedItem(null);
      toast({ title: "Redemption Successful!", description: `Your new balance: ${data.new_balance?.toLocaleString()} pts` });
    },
    onError: (error: Error) => {
      toast({ title: "Redemption Failed", description: error.message, variant: "destructive" });
    },
  });

  // Helper functions
  const getPointsForCurrency = useCallback((currency: Currency): number => {
    switch (currency) {
      case "site": return profile?.points || 0;
      case "twitch": return channelPoints.twitch;
      case "kick": return channelPoints.kick;
      default: return 0;
    }
  }, [profile?.points, channelPoints]);

  const getItemCost = (item: StoreItem, currency: Currency): number | null => {
    switch (currency) {
      case "site": return item.points_cost;
      case "twitch": return item.twitch_points_cost;
      case "kick": return item.kick_points_cost;
      default: return null;
    }
  };

  const isCurrencyAccepted = (item: StoreItem, currency: Currency): boolean => {
    return item.accepted_currencies?.includes(currency) ?? (currency === "site");
  };

  const getAvailableCurrencies = (item: StoreItem): Currency[] => {
    const currencies: Currency[] = [];
    if (isCurrencyAccepted(item, "site")) currencies.push("site");
    if (isCurrencyAccepted(item, "twitch") && item.twitch_points_cost) currencies.push("twitch");
    if (isCurrencyAccepted(item, "kick") && item.kick_points_cost) currencies.push("kick");
    return currencies;
  };

  const canRedeem = (item: StoreItem, currency: Currency = "site") => {
    if (!user) return false;
    if (item.stock_quantity !== null && item.stock_quantity <= 0) return false;
    const cost = getItemCost(item, currency);
    if (cost === null) return false;
    return getPointsForCurrency(currency) >= cost;
  };

  const canRedeemAny = (item: StoreItem) => {
    if (!user) return false;
    if (item.stock_quantity !== null && item.stock_quantity <= 0) return false;
    return getAvailableCurrencies(item).some(c => canRedeem(item, c));
  };

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    switch (sortBy) {
      case "price-low": result.sort((a, b) => a.points_cost - b.points_cost); break;
      case "price-high": result.sort((a, b) => b.points_cost - a.points_cost); break;
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "featured": result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)); break;
      default: break;
    }
    return result;
  }, [items, searchQuery, selectedCategory, sortBy]);

  const featuredItems = filteredItems.filter((item) => item.is_featured);
  const regularItems = filteredItems.filter((item) => !item.is_featured);

  const handleRedeem = (item: StoreItem) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to redeem items.", variant: "destructive" });
      return;
    }
    setSelectedItem(item);
    const currencies = getAvailableCurrencies(item);
    setSelectedCurrency(currencies.find(c => canRedeem(item, c)) || currencies[0] || "site");
    setIsConfirmOpen(true);
  };

  const confirmRedeem = () => {
    if (selectedItem) redeemMutation.mutate({ itemId: selectedItem.id, currency: selectedCurrency });
  };

  // Stats
  const totalItems = items.length;
  const featuredCount = items.filter(i => i.is_featured).length;

  useEffect(() => { document.title = "Points Store | Redeem Your Points"; }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-primary/10" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="container relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
            <Badge variant="outline" className="gap-2 px-4 py-2 mb-6 border-primary/30 bg-primary/5">
              <StoreIcon className="w-4 h-4" /> Points Store
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Redeem Your Points
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Turn your hard-earned points into exclusive merchandise, giveaway entries, and more!
            </p>
            {user && <ChannelPointsDisplay variant="compact" showConnectButtons />}
          </motion.div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="container py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Package, label: "Total Items", value: totalItems, color: "text-primary" },
            { icon: Sparkles, label: "Featured", value: featuredCount, color: "text-yellow-500" },
            { icon: Award, label: "Categories", value: categories.length, color: "text-purple-500" },
            { icon: ShoppingCart, label: "My Orders", value: myRedemptions.length, color: "text-green-500" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", stat.color)}><stat.icon className="w-5 h-5" /></div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col lg:flex-row justify-between gap-4 mb-8">
            <TabsList className="w-fit">
              <TabsTrigger value="browse" className="gap-2"><ShoppingCart className="w-4 h-4" /> Browse Store</TabsTrigger>
              {user && <TabsTrigger value="history" className="gap-2"><History className="w-4 h-4" /> My Redemptions</TabsTrigger>}
            </TabsList>

            {activeTab === "browse" && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search items..." className="pl-10" />
                </div>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[160px]"><ArrowUpDown className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low">Price: Low-High</SelectItem>
                    <SelectItem value="price-high">Price: High-Low</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border rounded-lg overflow-hidden">
                  <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("grid")}><LayoutGrid className="w-4 h-4" /></Button>
                  <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </div>

          <TabsContent value="browse">
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                <Button variant={!selectedCategory ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(null)}>All Items</Button>
                {categories.map((cat) => (
                  <Button key={cat.id} variant={selectedCategory === cat.id ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat.id)}>{cat.name}</Button>
                ))}
              </div>
            )}

            {loadingItems ? (
              <StoreLoadingSkeleton count={8} viewMode={viewMode} />
            ) : itemsError ? (
              <div className="text-center py-20">
                <Package className="w-16 h-16 mx-auto text-destructive mb-4" />
                <h3 className="text-xl font-semibold mb-2">Failed to Load Items</h3>
                <p className="text-muted-foreground mb-4">Something went wrong.</p>
                <Button onClick={() => refetchItems()}>Try Again</Button>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Items Found</h3>
                <p className="text-muted-foreground">{searchQuery ? "Try a different search term" : "Check back later!"}</p>
              </div>
            ) : (
              <div className="space-y-12">
                {featuredItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-6"><Sparkles className="w-5 h-5 text-yellow-500" /><h2 className="text-2xl font-bold">Featured Items</h2></div>
                    <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
                      <AnimatePresence>
                        {featuredItems.map((item, index) => (
                          <StoreItemCard key={item.id} item={item} index={index} channelPoints={channelPoints} canRedeem={canRedeemAny(item)} onRedeem={handleRedeem} onQuickView={setQuickViewItem} isFeatured viewMode={viewMode} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
                {regularItems.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">All Items</h2>
                    <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-4"}>
                      <AnimatePresence>
                        {regularItems.map((item, index) => (
                          <StoreItemCard key={item.id} item={item} index={index} channelPoints={channelPoints} canRedeem={canRedeemAny(item)} onRedeem={handleRedeem} onQuickView={setQuickViewItem} viewMode={viewMode} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <StoreRedemptionHistory redemptions={myRedemptions} isLoading={loadingRedemptions} onBrowse={() => setActiveTab("browse")} />
          </TabsContent>
        </Tabs>
      </section>

      {/* FAQ Section */}
      {storeFaq.length > 0 && (
        <section className="container py-12 border-t border-border">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-3">
              {storeFaq.map((item, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="border border-border/50 rounded-xl bg-card/50 backdrop-blur-sm px-6 overflow-hidden">
                  <AccordionTrigger className="text-left font-semibold text-sm md:text-base hover:no-underline py-5">{item.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 pt-0">{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </section>
      )}

      {/* Confirm Redemption Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Redemption</DialogTitle>
            <DialogDescription>Are you sure you want to redeem this item?</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="py-4">
              <div className="flex items-center gap-4 mb-4">
                {selectedItem.image_url ? (
                  <img src={selectedItem.image_url} alt={selectedItem.name} className="w-20 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center"><Package className="w-10 h-10 text-muted-foreground" /></div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{selectedItem.name}</h3>
                  <p className="text-muted-foreground text-sm">{selectedItem.description}</p>
                </div>
              </div>
              
              {getAvailableCurrencies(selectedItem).length > 1 && (
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Pay with:</Label>
                  <RadioGroup value={selectedCurrency} onValueChange={(val) => setSelectedCurrency(val as Currency)} className="grid grid-cols-3 gap-2">
                    {isCurrencyAccepted(selectedItem, "site") && selectedItem.points_cost > 0 && (
                      <Label htmlFor="currency-site" className={cn("flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-colors", selectedCurrency === "site" ? "border-primary bg-primary/10" : "border-border", !canRedeem(selectedItem, "site") && "opacity-50")}>
                        <RadioGroupItem value="site" id="currency-site" className="sr-only" />
                        <Coins className="w-5 h-5 text-yellow-500" />
                        <span className="text-xs font-medium">Site</span>
                        <span className="text-xs text-muted-foreground">{selectedItem.points_cost.toLocaleString()}</span>
                      </Label>
                    )}
                    {isCurrencyAccepted(selectedItem, "twitch") && (selectedItem.twitch_points_cost ?? 0) > 0 && (
                      <Label htmlFor="currency-twitch" className={cn("flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-colors", selectedCurrency === "twitch" ? "border-purple-500 bg-purple-500/10" : "border-border", !canRedeem(selectedItem, "twitch") && "opacity-50")}>
                        <RadioGroupItem value="twitch" id="currency-twitch" className="sr-only" />
                        <svg className="w-5 h-5 text-purple-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>
                        <span className="text-xs font-medium">Twitch</span>
                        <span className="text-xs text-muted-foreground">{(selectedItem.twitch_points_cost ?? 0).toLocaleString()}</span>
                      </Label>
                    )}
                    {isCurrencyAccepted(selectedItem, "kick") && (selectedItem.kick_points_cost ?? 0) > 0 && (
                      <Label htmlFor="currency-kick" className={cn("flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-colors", selectedCurrency === "kick" ? "border-green-500 bg-green-500/10" : "border-border", !canRedeem(selectedItem, "kick") && "opacity-50")}>
                        <RadioGroupItem value="kick" id="currency-kick" className="sr-only" />
                        <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M1.333 0v24h5.334v-8l2.666 2.667L16 24h6.667l-9.334-9.333L22.667 0H16l-6.667 8V0z"/></svg>
                        <span className="text-xs font-medium">Kick</span>
                        <span className="text-xs text-muted-foreground">{(selectedItem.kick_points_cost ?? 0).toLocaleString()}</span>
                      </Label>
                    )}
                  </RadioGroup>
                </div>
              )}
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Cost:</span><span className="font-semibold">{(getItemCost(selectedItem, selectedCurrency) ?? 0).toLocaleString()} pts</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Your Balance:</span><span className="font-semibold">{getPointsForCurrency(selectedCurrency).toLocaleString()} pts</span></div>
                <div className="border-t pt-2 flex justify-between"><span className="text-muted-foreground">After:</span><span className="font-semibold text-primary">{(getPointsForCurrency(selectedCurrency) - (getItemCost(selectedItem, selectedCurrency) ?? 0)).toLocaleString()} pts</span></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
            <Button onClick={confirmRedeem} disabled={redeemMutation.isPending || !selectedItem || !canRedeem(selectedItem, selectedCurrency)}>
              {redeemMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redeeming...</> : <><ShoppingCart className="w-4 h-4 mr-2" />Confirm</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick View Modal */}
      <StoreQuickViewModal item={quickViewItem} open={!!quickViewItem} onClose={() => setQuickViewItem(null)} onRedeem={handleRedeem} channelPoints={channelPoints} canRedeem={quickViewItem ? canRedeemAny(quickViewItem) : false} />
    </div>
  );
}
