import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useChannelPoints } from "@/hooks/useChannelPoints";
import { ChannelPointsDisplay } from "@/components/ChannelPointsDisplay";
import { 
  Store as StoreIcon, 
  Search, 
  Coins, 
  ShoppingCart, 
  Package,
  Gift,
  FileText,
  CreditCard,
  Tag,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  History,
  Loader2,
  ExternalLink,
  Wallet,
  RefreshCw,
  Calendar,
  Link2
} from "lucide-react";
import { Link } from "react-router-dom";

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

const ITEM_TYPE_ICONS: Record<string, React.ElementType> = {
  merchandise: Package,
  giveaway_entry: Gift,
  exclusive_content: FileText,
  casino_credit: CreditCard,
  custom: Tag,
};

export default function Store() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { points: channelPoints, isLoading: loadingPoints, isConnected } = useChannelPoints();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("site");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");

  // Fetch categories
  const { data: categories = [] } = useQuery({
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
  });

  // Fetch items
  const { data: items = [], isLoading: loadingItems } = useQuery({
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

  // Fetch Store FAQ from settings
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

  // Redeem mutation with currency support
  const redeemMutation = useMutation({
    mutationFn: async ({ itemId, currency }: { itemId: string; currency: Currency }) => {
      const { data, error } = await supabase.rpc("redeem_store_item_with_currency", {
        p_item_id: itemId,
        p_quantity: 1,
        p_currency: currency,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; new_balance?: number; currency?: string };
      if (!result.success) {
        throw new Error(result.error || "Redemption failed");
      }
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["store-items-public"] });
      queryClient.invalidateQueries({ queryKey: ["my-redemptions"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["channel-points"] });
      setIsConfirmOpen(false);
      setSelectedItem(null);
      setSelectedCurrency("site");
      
      const currencyLabel = data.currency === "site" ? "site" : data.currency;
      toast({
        title: "Redemption Successful!",
        description: `Your new ${currencyLabel} points balance is ${data.new_balance?.toLocaleString()}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Redemption Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get points for a specific currency
  const getPointsForCurrency = (currency: Currency): number => {
    switch (currency) {
      case "site":
        return profile?.points || 0;
      case "twitch":
        return channelPoints.twitch;
      case "kick":
        return channelPoints.kick;
      default:
        return 0;
    }
  };

  // Get item cost for a specific currency
  const getItemCost = (item: StoreItem, currency: Currency): number | null => {
    switch (currency) {
      case "site":
        return item.points_cost;
      case "twitch":
        return item.twitch_points_cost;
      case "kick":
        return item.kick_points_cost;
      default:
        return null;
    }
  };

  // Check if a currency is accepted for an item
  const isCurrencyAccepted = (item: StoreItem, currency: Currency): boolean => {
    return item.accepted_currencies?.includes(currency) ?? (currency === "site");
  };

  // Get available currencies for an item
  const getAvailableCurrencies = (item: StoreItem): Currency[] => {
    const currencies: Currency[] = [];
    if (isCurrencyAccepted(item, "site")) currencies.push("site");
    if (isCurrencyAccepted(item, "twitch") && item.twitch_points_cost) currencies.push("twitch");
    if (isCurrencyAccepted(item, "kick") && item.kick_points_cost) currencies.push("kick");
    return currencies;
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredItems = filteredItems.filter((item) => item.is_featured);
  const regularItems = filteredItems.filter((item) => !item.is_featured);

  const getItemTypeIcon = (type: string) => {
    const Icon = ITEM_TYPE_ICONS[type] || Tag;
    return <Icon className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="gap-1"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case "processing":
        return <Badge variant="outline" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Processing</Badge>;
      case "cancelled":
      case "refunded":
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> {status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canRedeem = (item: StoreItem, currency: Currency = "site") => {
    if (!user) return false;
    if (item.stock_quantity !== null && item.stock_quantity <= 0) return false;
    
    const cost = getItemCost(item, currency);
    if (cost === null) return false;
    
    const balance = getPointsForCurrency(currency);
    return balance >= cost;
  };

  const canRedeemAny = (item: StoreItem) => {
    if (!user) return false;
    if (item.stock_quantity !== null && item.stock_quantity <= 0) return false;
    const currencies = getAvailableCurrencies(item);
    return currencies.some(c => canRedeem(item, c));
  };

  const handleRedeem = (item: StoreItem) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to redeem items.",
        variant: "destructive",
      });
      return;
    }
    setSelectedItem(item);
    // Default to first available currency user can afford
    const currencies = getAvailableCurrencies(item);
    const affordable = currencies.find(c => canRedeem(item, c));
    setSelectedCurrency(affordable || currencies[0] || "site");
    setIsConfirmOpen(true);
  };

  const confirmRedeem = () => {
    if (selectedItem) {
      redeemMutation.mutate({ itemId: selectedItem.id, currency: selectedCurrency });
    }
  };

  const userPoints = getPointsForCurrency("site");

  useEffect(() => {
    document.title = "Points Store | Redeem Your Points";
  }, []);

  return (
    <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          {/* Background gradient with smooth transition */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-primary/10" />
            {/* Decorative elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          </div>
          <div className="container relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 border border-primary/20">
                <StoreIcon className="w-5 h-5" />
                <span className="font-medium">Points Store</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Redeem Your <span className="text-primary">Points</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Turn your hard-earned points into exclusive merchandise, giveaway entries, casino credits, and more!
              </p>

              {/* User Points Display with Channel Points */}
              {user && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <ChannelPointsDisplay variant="compact" showConnectButtons />
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Stats/Info Boxes */}
        <section className="container py-12">
          <div className={`grid gap-6 ${user && profile ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            {/* User Wallet Box */}
            {user && profile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <div className="flex items-center gap-4 mb-5">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                      <Wallet className="w-7 h-7 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-lg">{profile.display_name || profile.username || 'User'}</p>
                    <p className="text-sm text-muted-foreground">Member</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {/* Site Points */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <span className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      Site Points
                    </span>
                    <span className="font-bold text-base text-yellow-600">{channelPoints.site.toLocaleString()}</span>
                  </div>
                  {/* Twitch Points */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <span className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-purple-500" fill="currentColor">
                        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                      </svg>
                      Twitch Points
                    </span>
                    <span className="font-bold text-base text-purple-600">
                      {isConnected("twitch") ? channelPoints.twitch.toLocaleString() : (
                        <span className="text-muted-foreground text-xs font-normal">Not linked</span>
                      )}
                    </span>
                  </div>
                  {/* Kick Points */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <span className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-500" fill="currentColor">
                        <path d="M1.333 0v24h21.334V0H1.333Zm17.067 18.133h-4.267L9.6 12.8v5.333H6.4V5.867h3.2v5.066l4.267-5.066h4.267l-4.8 5.6 5.066 6.666Z" />
                      </svg>
                      Kick Points
                    </span>
                    <span className="font-bold text-base text-green-600">
                      {isConnected("kick") ? channelPoints.kick.toLocaleString() : (
                        <span className="text-muted-foreground text-xs font-normal">Not linked</span>
                      )}
                    </span>
                  </div>
                  {/* Redemptions */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 mt-3">
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                      Redemptions
                    </span>
                    <span className="font-bold text-base">{myRedemptions.length}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Delivery Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold text-lg">Delivery Info</p>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Items will be credited within <span className="font-semibold text-foreground">14 BUSINESS DAYS</span> from the day of approval.
              </p>
            </motion.div>

            {/* T&C Link Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-muted">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-semibold text-lg">Terms & Conditions</p>
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Learn how points work, delivery times, and store policies.
              </p>
              <Link 
                to="/store/terms" 
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Read Store T&C
                <ExternalLink className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
              <TabsList>
                <TabsTrigger value="browse" className="gap-2">
                  <ShoppingCart className="w-4 h-4" /> Browse Store
                </TabsTrigger>
                {user && (
                  <TabsTrigger value="history" className="gap-2">
                    <History className="w-4 h-4" /> My Redemptions
                  </TabsTrigger>
                )}
              </TabsList>

              {activeTab === "browse" && (
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search items..."
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              )}
            </div>

            <TabsContent value="browse">
              {/* Category Filters */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All Items
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              )}

              {loadingItems ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-20">
                  <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Items Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? "Try a different search term" : "Check back later for new items!"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Featured Items */}
                  {featuredItems.length > 0 && (
                    <div className="mb-12">
                      <div className="flex items-center gap-2 mb-6">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        <h2 className="text-2xl font-bold">Featured Items</h2>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <AnimatePresence>
                          {featuredItems.map((item, index) => (
                            <ItemCard
                              key={item.id}
                              item={item}
                              index={index}
                              channelPoints={channelPoints}
                              canRedeem={canRedeemAny(item)}
                              onRedeem={handleRedeem}
                              getItemTypeIcon={getItemTypeIcon}
                              isFeatured
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* Regular Items */}
                  {regularItems.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6">All Items</h2>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <AnimatePresence>
                          {regularItems.map((item, index) => (
                            <ItemCard
                              key={item.id}
                              item={item}
                              index={index}
                              channelPoints={channelPoints}
                              canRedeem={canRedeemAny(item)}
                              onRedeem={handleRedeem}
                              getItemTypeIcon={getItemTypeIcon}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="history">
              {loadingRedemptions ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : myRedemptions.length === 0 ? (
                <div className="text-center py-20">
                  <History className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Redemptions Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start redeeming items from the store!
                  </p>
                  <Button onClick={() => setActiveTab("browse")}>
                    Browse Store
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRedemptions.map((redemption) => (
                    <Card key={redemption.id}>
                      <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6">
                        <div className="flex items-center gap-4">
                          {redemption.item?.image_url ? (
                            <img
                              src={redemption.item.image_url}
                              alt={redemption.item?.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                              <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold">{redemption.item?.name || "Unknown Item"}</h3>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {redemption.quantity} • {redemption.points_spent.toLocaleString()} pts
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(redemption.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(redemption.status)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* FAQ Section */}
        {storeFaq.length > 0 && (
          <section className="container py-12 border-t border-border">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="space-y-3">
                {storeFaq.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`faq-${index}`}
                    className="border border-border/50 rounded-xl bg-card/50 backdrop-blur-sm px-6 overflow-hidden"
                  >
                    <AccordionTrigger className="text-left font-semibold text-sm md:text-base uppercase tracking-wide hover:no-underline py-5">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5 pt-0">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </section>
        )}
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Redemption</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem this item?
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="py-4">
              <div className="flex items-center gap-4 mb-4">
                {selectedItem.image_url ? (
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{selectedItem.name}</h3>
                  <p className="text-muted-foreground">{selectedItem.description}</p>
                </div>
              </div>
              
              {/* Currency Selection */}
              {getAvailableCurrencies(selectedItem).length > 1 && (
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Pay with:</Label>
                  <RadioGroup
                    value={selectedCurrency}
                    onValueChange={(val) => setSelectedCurrency(val as Currency)}
                    className="grid grid-cols-3 gap-2"
                  >
                    {isCurrencyAccepted(selectedItem, "site") && selectedItem.points_cost > 0 && (
                      <Label
                        htmlFor="currency-site"
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCurrency === "site" ? "border-primary bg-primary/10" : "border-border"
                        } ${!canRedeem(selectedItem, "site") ? "opacity-50" : ""}`}
                      >
                        <RadioGroupItem value="site" id="currency-site" className="sr-only" />
                        <Coins className="w-5 h-5 text-yellow-500" />
                        <span className="text-xs font-medium">Site</span>
                        <span className="text-xs text-muted-foreground">{selectedItem.points_cost.toLocaleString()}</span>
                      </Label>
                    )}
                    {isCurrencyAccepted(selectedItem, "twitch") && (selectedItem.twitch_points_cost ?? 0) > 0 && (
                      <Label
                        htmlFor="currency-twitch"
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCurrency === "twitch" ? "border-purple-500 bg-purple-500/10" : "border-border"
                        } ${!canRedeem(selectedItem, "twitch") ? "opacity-50" : ""}`}
                      >
                        <RadioGroupItem value="twitch" id="currency-twitch" className="sr-only" />
                        <svg className="w-5 h-5 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                        </svg>
                        <span className="text-xs font-medium">Twitch</span>
                        <span className="text-xs text-muted-foreground">{(selectedItem.twitch_points_cost ?? 0).toLocaleString()}</span>
                      </Label>
                    )}
                    {isCurrencyAccepted(selectedItem, "kick") && (selectedItem.kick_points_cost ?? 0) > 0 && (
                      <Label
                        htmlFor="currency-kick"
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCurrency === "kick" ? "border-green-500 bg-green-500/10" : "border-border"
                        } ${!canRedeem(selectedItem, "kick") ? "opacity-50" : ""}`}
                      >
                        <RadioGroupItem value="kick" id="currency-kick" className="sr-only" />
                        <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M1.333 0v24h5.334v-8l2.666 2.667L16 24h6.667l-9.334-9.333L22.667 0H16l-6.667 8V0z"/>
                        </svg>
                        <span className="text-xs font-medium">Kick</span>
                        <span className="text-xs text-muted-foreground">{(selectedItem.kick_points_cost ?? 0).toLocaleString()}</span>
                      </Label>
                    )}
                  </RadioGroup>
                </div>
              )}
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="font-semibold">
                    {(getItemCost(selectedItem, selectedCurrency) ?? 0).toLocaleString()} {selectedCurrency} pts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your {selectedCurrency} Balance:</span>
                  <span className="font-semibold">{getPointsForCurrency(selectedCurrency).toLocaleString()} pts</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-muted-foreground">After Redemption:</span>
                  <span className="font-semibold text-primary">
                    {(getPointsForCurrency(selectedCurrency) - (getItemCost(selectedItem, selectedCurrency) ?? 0)).toLocaleString()} pts
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmRedeem} 
              disabled={redeemMutation.isPending || !canRedeem(selectedItem!, selectedCurrency)}
            >
              {redeemMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redeeming...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Confirm Redemption
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// SVG Icons for platforms
const TwitchIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
  </svg>
);

const KickIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1.333 0v24h5.334v-8l2.666 2.667L16 24h6.667l-9.334-9.333L22.667 0H16l-6.667 8V0z"/>
  </svg>
);

// Item Card Component
function ItemCard({
  item,
  index,
  channelPoints,
  canRedeem,
  onRedeem,
  getItemTypeIcon,
  isFeatured = false,
}: {
  item: StoreItem;
  index: number;
  channelPoints: { site: number; twitch: number; kick: number };
  canRedeem: boolean;
  onRedeem: (item: StoreItem) => void;
  getItemTypeIcon: (type: string) => React.ReactNode;
  isFeatured?: boolean;
}) {
  const isOutOfStock = item.stock_quantity !== null && item.stock_quantity <= 0;
  
  // Get accepted currencies and their costs
  const acceptedCurrencies = item.accepted_currencies || ["site"];
  const hasSite = acceptedCurrencies.includes("site") && item.points_cost > 0;
  const hasTwitch = acceptedCurrencies.includes("twitch") && (item.twitch_points_cost ?? 0) > 0;
  const hasKick = acceptedCurrencies.includes("kick") && (item.kick_points_cost ?? 0) > 0;

  // Calculate if user can afford with any currency
  const canAffordSite = hasSite && channelPoints.site >= item.points_cost;
  const canAffordTwitch = hasTwitch && channelPoints.twitch >= (item.twitch_points_cost ?? 0);
  const canAffordKick = hasKick && channelPoints.kick >= (item.kick_points_cost ?? 0);
  const canAffordAny = canAffordSite || canAffordTwitch || canAffordKick;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="h-full"
    >
      <Card className={`h-full flex flex-col group ${isFeatured ? "border-primary/50 shadow-lg shadow-primary/10" : ""}`}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          {isFeatured && (
            <Badge className="absolute top-3 left-3 gap-1 bg-yellow-500 text-black">
              <Sparkles className="w-3 h-3" /> Featured
            </Badge>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="destructive" className="text-lg px-4 py-2">Out of Stock</Badge>
            </div>
          )}
        </div>
        <CardContent className="flex-1 p-4">
          {item.category?.name && (
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{item.category.name}</Badge>
            </div>
          )}
          <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {item.description || "No description available"}
          </p>
          
          {/* Display all accepted currency costs */}
          <div className="space-y-2">
            {hasSite && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold">{item.points_cost.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">Site pts</span>
                </div>
                {canAffordSite && (
                  <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">✓</Badge>
                )}
              </div>
            )}
            {hasTwitch && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-purple-500"><TwitchIcon /></span>
                  <span className="font-bold">{(item.twitch_points_cost ?? 0).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">Twitch pts</span>
                </div>
                {canAffordTwitch && (
                  <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">✓</Badge>
                )}
              </div>
            )}
            {hasKick && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-green-500"><KickIcon /></span>
                  <span className="font-bold">{(item.kick_points_cost ?? 0).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">Kick pts</span>
                </div>
                {canAffordKick && (
                  <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">✓</Badge>
                )}
              </div>
            )}
          </div>
          
          {item.stock_quantity !== null && !isOutOfStock && (
            <span className="text-sm text-muted-foreground block mt-2">
              {item.stock_quantity} left
            </span>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            disabled={!canRedeem || isOutOfStock}
            onClick={() => onRedeem(item)}
          >
            {isOutOfStock ? (
              "Out of Stock"
            ) : !canAffordAny ? (
              "Not Enough Points"
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Redeem
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}