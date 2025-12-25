import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  XCircle,
  Search,
  History,
  Calendar,
  Coins,
  ArrowUpDown,
  Filter,
  ShoppingCart,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface StoreItem {
  id: string;
  name: string;
  image_url: string | null;
  item_type: string;
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
  notes?: string | null;
  item?: StoreItem;
}

interface StoreRedemptionHistoryProps {
  redemptions: StoreRedemption[];
  isLoading: boolean;
  onBrowse: () => void;
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: "Pending",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
  },
  processing: {
    icon: Loader2,
    label: "Processing",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    animate: true,
  },
  completed: {
    icon: CheckCircle,
    label: "Completed",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  cancelled: {
    icon: XCircle,
    label: "Cancelled",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
  },
  refunded: {
    icon: AlertCircle,
    label: "Refunded",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
  },
};

type SortOption = "newest" | "oldest" | "points-high" | "points-low";

export function StoreRedemptionHistory({
  redemptions,
  isLoading,
  onBrowse,
}: StoreRedemptionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Filter and sort redemptions
  const filteredRedemptions = useMemo(() => {
    let result = [...redemptions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.item?.name?.toLowerCase().includes(query) ||
          r.id.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "points-high":
        result.sort((a, b) => b.points_spent - a.points_spent);
        break;
      case "points-low":
        result.sort((a, b) => a.points_spent - b.points_spent);
        break;
    }

    return result;
  }, [redemptions, searchQuery, statusFilter, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const pending = redemptions.filter((r) => r.status === "pending").length;
    const completed = redemptions.filter((r) => r.status === "completed").length;
    const totalSpent = redemptions.reduce((sum, r) => sum + r.points_spent, 0);
    return { pending, completed, totalSpent };
  }, [redemptions]);

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
      icon: Clock,
      label: status,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      borderColor: "border-border",
      animate: false,
    };
    const Icon = config.icon;
    const shouldAnimate = "animate" in config && config.animate;

    return (
      <Badge
        variant="outline"
        className={cn("gap-1", config.color, config.borderColor, config.bgColor)}
      >
        <Icon className={cn("w-3 h-3", shouldAnimate && "animate-spin")} />
        {config.label}
      </Badge>
    );
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case "twitch":
        return (
          <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
          </svg>
        );
      case "kick":
        return (
          <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1.333 0v24h5.334v-8l2.666 2.667L16 24h6.667l-9.334-9.333L22.667 0H16l-6.667 8V0z" />
          </svg>
        );
      default:
        return <Coins className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (redemptions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
          <History className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold mb-2">No Redemptions Yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Start redeeming items from the store and your order history will appear here.
        </p>
        <Button onClick={onBrowse} size="lg">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Browse Store
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/20">
              <Coins className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">{stats.totalSpent.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/20">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search redemptions..."
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-full md:w-44">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="points-high">Highest Points</SelectItem>
            <SelectItem value="points-low">Lowest Points</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Redemption List */}
      {filteredRedemptions.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredRedemptions.map((redemption, index) => (
              <motion.div
                key={redemption.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Image */}
                      <div className="w-full sm:w-24 h-24 shrink-0 relative">
                        {redemption.item?.image_url ? (
                          <img
                            src={redemption.item.image_url}
                            alt={redemption.item?.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-muted flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {redemption.item?.name || "Unknown Item"}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1.5 text-sm">
                              {getCurrencyIcon(redemption.currency || "site")}
                              <span className="font-medium">{redemption.points_spent.toLocaleString()}</span>
                              <span className="text-muted-foreground">pts</span>
                            </div>
                            {redemption.quantity > 1 && (
                              <Badge variant="secondary" className="text-xs">
                                x{redemption.quantity}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span title={format(new Date(redemption.created_at), "PPpp")}>
                              {formatDistanceToNow(new Date(redemption.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {getStatusBadge(redemption.status)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
