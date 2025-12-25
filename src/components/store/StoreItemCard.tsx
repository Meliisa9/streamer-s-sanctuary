import { motion } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  ShoppingCart,
  Sparkles,
  Coins,
  Clock,
  Eye,
  TrendingUp,
  Flame,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// SVG Icons for platforms
const TwitchIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
  </svg>
);

const KickIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1.333 0v24h5.334v-8l2.666 2.667L16 24h6.667l-9.334-9.333L22.667 0H16l-6.667 8V0z" />
  </svg>
);

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

interface StoreItemCardProps {
  item: StoreItem;
  index: number;
  channelPoints: { site: number; twitch: number; kick: number };
  canRedeem: boolean;
  onRedeem: (item: StoreItem) => void;
  onQuickView: (item: StoreItem) => void;
  isFeatured?: boolean;
  viewMode?: "grid" | "list";
}

export function StoreItemCard({
  item,
  index,
  channelPoints,
  canRedeem,
  onRedeem,
  onQuickView,
  isFeatured = false,
  viewMode = "grid",
}: StoreItemCardProps) {
  const isOutOfStock = item.stock_quantity !== null && item.stock_quantity <= 0;
  const isLowStock = item.stock_quantity !== null && item.stock_quantity > 0 && item.stock_quantity <= 5;

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

  // Check availability timing
  const now = new Date();
  const availableFrom = item.available_from ? new Date(item.available_from) : null;
  const availableUntil = item.available_until ? new Date(item.available_until) : null;
  const isNotYetAvailable = availableFrom && availableFrom > now;
  const isExpired = availableUntil && availableUntil < now;

  // Get the lowest cost for display
  const lowestCost = Math.min(
    hasSite ? item.points_cost : Infinity,
    hasTwitch ? (item.twitch_points_cost ?? Infinity) : Infinity,
    hasKick ? (item.kick_points_cost ?? Infinity) : Infinity
  );

  // Calculate stock percentage
  const stockPercentage = item.stock_quantity !== null 
    ? Math.min(100, (item.stock_quantity / 50) * 100) // Assume max stock of 50 for visualization
    : 100;

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ delay: index * 0.03 }}
      >
        <Card className={cn(
          "overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30",
          isFeatured && "border-primary/50 bg-primary/5",
          isOutOfStock && "opacity-60"
        )}>
          <div className="flex flex-col sm:flex-row">
            {/* Image */}
            <div className="relative w-full sm:w-48 h-32 sm:h-auto shrink-0">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              {isFeatured && (
                <Badge className="absolute top-2 left-2 gap-1 bg-yellow-500 text-black">
                  <Sparkles className="w-3 h-3" /> Featured
                </Badge>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.category?.name && (
                    <Badge variant="outline" className="text-xs">{item.category.name}</Badge>
                  )}
                  {isLowStock && (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <Flame className="w-3 h-3" /> {item.stock_quantity} left
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
              </div>

              {/* Pricing */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {hasSite && (
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-lg",
                    canAffordSite ? "bg-yellow-500/10 text-yellow-600" : "bg-muted"
                  )}>
                    <Coins className="w-4 h-4" />
                    <span className="font-bold">{item.points_cost.toLocaleString()}</span>
                  </div>
                )}
                {hasTwitch && (
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-lg",
                    canAffordTwitch ? "bg-purple-500/10 text-purple-600" : "bg-muted"
                  )}>
                    <TwitchIcon />
                    <span className="font-bold">{(item.twitch_points_cost ?? 0).toLocaleString()}</span>
                  </div>
                )}
                {hasKick && (
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-lg",
                    canAffordKick ? "bg-green-500/10 text-green-600" : "bg-muted"
                  )}>
                    <KickIcon />
                    <span className="font-bold">{(item.kick_points_cost ?? 0).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onQuickView(item)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  disabled={!canRedeem || isOutOfStock || isNotYetAvailable || isExpired}
                  onClick={() => onRedeem(item)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Redeem
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="h-full"
    >
      <Card className={cn(
        "h-full flex flex-col group overflow-hidden transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1",
        isFeatured && "border-primary/50 shadow-lg shadow-primary/10 ring-1 ring-primary/20"
      )}>
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted/50 flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground/50" />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isFeatured && (
              <Badge className="gap-1 bg-yellow-500 text-black shadow-lg">
                <Sparkles className="w-3 h-3" /> Featured
              </Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge variant="destructive" className="gap-1 shadow-lg">
                <Flame className="w-3 h-3" /> Only {item.stock_quantity} left!
              </Badge>
            )}
            {isNotYetAvailable && (
              <Badge variant="secondary" className="gap-1 shadow-lg">
                <Clock className="w-3 h-3" /> Coming Soon
              </Badge>
            )}
          </div>

          {/* Quick View Button */}
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(item);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <Badge variant="destructive" className="text-lg px-4 py-2">Out of Stock</Badge>
            </div>
          )}

          {/* Stock indicator bar */}
          {item.stock_quantity !== null && !isOutOfStock && (
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/80 to-transparent">
              <div className="flex items-center gap-2">
                <Progress 
                  value={stockPercentage} 
                  className="h-1.5 flex-1"
                />
                <span className="text-xs font-medium text-foreground/80">{item.stock_quantity} left</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-4 flex flex-col">
          {/* Category */}
          {item.category?.name && (
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs font-normal">
                {item.category.name}
              </Badge>
              {item.item_type && item.item_type !== "custom" && (
                <Badge variant="outline" className="text-xs font-normal capitalize">
                  {item.item_type.replace("_", " ")}
                </Badge>
              )}
            </div>
          )}

          <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
            {item.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {item.description || "No description available"}
          </p>

          {/* Pricing Section */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            {hasSite && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    canAffordSite ? "bg-yellow-500/20" : "bg-muted"
                  )}>
                    <Coins className={cn("w-4 h-4", canAffordSite ? "text-yellow-500" : "text-muted-foreground")} />
                  </div>
                  <span className="font-bold">{item.points_cost.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">Site pts</span>
                </div>
                {canAffordSite && (
                  <Badge className="text-xs bg-green-500/20 text-green-500 border-0">
                    <TrendingUp className="w-3 h-3 mr-1" /> Affordable
                  </Badge>
                )}
              </div>
            )}
            {hasTwitch && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    canAffordTwitch ? "bg-purple-500/20" : "bg-muted"
                  )}>
                    <span className={canAffordTwitch ? "text-purple-500" : "text-muted-foreground"}>
                      <TwitchIcon />
                    </span>
                  </div>
                  <span className="font-bold">{(item.twitch_points_cost ?? 0).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">Twitch pts</span>
                </div>
                {canAffordTwitch && (
                  <Badge className="text-xs bg-green-500/20 text-green-500 border-0">
                    <TrendingUp className="w-3 h-3 mr-1" /> Affordable
                  </Badge>
                )}
              </div>
            )}
            {hasKick && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    canAffordKick ? "bg-green-500/20" : "bg-muted"
                  )}>
                    <span className={canAffordKick ? "text-green-500" : "text-muted-foreground"}>
                      <KickIcon />
                    </span>
                  </div>
                  <span className="font-bold">{(item.kick_points_cost ?? 0).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">Kick pts</span>
                </div>
                {canAffordKick && (
                  <Badge className="text-xs bg-green-500/20 text-green-500 border-0">
                    <TrendingUp className="w-3 h-3 mr-1" /> Affordable
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="p-4 pt-0">
          <Button
            className={cn(
              "w-full transition-all duration-300",
              canAffordAny && !isOutOfStock && "hover:shadow-lg hover:shadow-primary/25"
            )}
            disabled={!canRedeem || isOutOfStock || isNotYetAvailable || isExpired}
            onClick={() => onRedeem(item)}
          >
            {isOutOfStock ? (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Out of Stock
              </>
            ) : isNotYetAvailable ? (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Coming Soon
              </>
            ) : isExpired ? (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Expired
              </>
            ) : !canAffordAny ? (
              <>
                <Coins className="w-4 h-4 mr-2" />
                Not Enough Points
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Redeem Now
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
