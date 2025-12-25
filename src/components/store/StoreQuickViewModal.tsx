import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  ShoppingCart,
  Sparkles,
  Coins,
  Clock,
  Calendar,
  Tag,
  Box,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// SVG Icons for platforms
const TwitchIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
  </svg>
);

const KickIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
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

interface StoreQuickViewModalProps {
  item: StoreItem | null;
  open: boolean;
  onClose: () => void;
  onRedeem: (item: StoreItem) => void;
  channelPoints: { site: number; twitch: number; kick: number };
  canRedeem: boolean;
}

export function StoreQuickViewModal({
  item,
  open,
  onClose,
  onRedeem,
  channelPoints,
  canRedeem,
}: StoreQuickViewModalProps) {
  if (!item) return null;

  const isOutOfStock = item.stock_quantity !== null && item.stock_quantity <= 0;
  const acceptedCurrencies = item.accepted_currencies || ["site"];
  const hasSite = acceptedCurrencies.includes("site") && item.points_cost > 0;
  const hasTwitch = acceptedCurrencies.includes("twitch") && (item.twitch_points_cost ?? 0) > 0;
  const hasKick = acceptedCurrencies.includes("kick") && (item.kick_points_cost ?? 0) > 0;

  const canAffordSite = hasSite && channelPoints.site >= item.points_cost;
  const canAffordTwitch = hasTwitch && channelPoints.twitch >= (item.twitch_points_cost ?? 0);
  const canAffordKick = hasKick && channelPoints.kick >= (item.kick_points_cost ?? 0);
  const canAffordAny = canAffordSite || canAffordTwitch || canAffordKick;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Image Section */}
          <div className="relative aspect-square md:aspect-auto">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted/50 flex items-center justify-center">
                <Package className="w-24 h-24 text-muted-foreground/30" />
              </div>
            )}
            {item.is_featured && (
              <Badge className="absolute top-4 left-4 gap-1 bg-yellow-500 text-black">
                <Sparkles className="w-3 h-3" /> Featured
              </Badge>
            )}
          </div>

          {/* Content Section */}
          <div className="p-6 flex flex-col">
            <DialogHeader className="text-left mb-4">
              {item.category?.name && (
                <Badge variant="secondary" className="w-fit mb-2">{item.category.name}</Badge>
              )}
              <DialogTitle className="text-2xl">{item.name}</DialogTitle>
            </DialogHeader>

            <p className="text-muted-foreground mb-4 flex-1">
              {item.description || "No description available for this item."}
            </p>

            {/* Item Details */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 text-sm">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="capitalize">{item.item_type.replace("_", " ")}</span>
              </div>
              
              {item.stock_quantity !== null && (
                <div className="flex items-center gap-3 text-sm">
                  <Box className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {isOutOfStock ? (
                      <span className="text-destructive">Out of stock</span>
                    ) : (
                      <span>{item.stock_quantity} available</span>
                    )}
                  </span>
                </div>
              )}

              {item.max_per_user && (
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>Max {item.max_per_user} per user</span>
                </div>
              )}

              {item.available_until && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Available until {format(new Date(item.available_until), "PPP")}</span>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Pricing */}
            <div className="space-y-3 mb-6">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Pricing Options</h4>
              {hasSite && (
                <div className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  canAffordSite ? "border-yellow-500/30 bg-yellow-500/5" : "border-border"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      <Coins className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-bold">{item.points_cost.toLocaleString()} pts</p>
                      <p className="text-xs text-muted-foreground">Site Points</p>
                    </div>
                  </div>
                  {canAffordSite ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              )}
              {hasTwitch && (
                <div className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  canAffordTwitch ? "border-purple-500/30 bg-purple-500/5" : "border-border"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500">
                      <TwitchIcon />
                    </div>
                    <div>
                      <p className="font-bold">{(item.twitch_points_cost ?? 0).toLocaleString()} pts</p>
                      <p className="text-xs text-muted-foreground">Twitch Channel Points</p>
                    </div>
                  </div>
                  {canAffordTwitch ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              )}
              {hasKick && (
                <div className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  canAffordKick ? "border-green-500/30 bg-green-500/5" : "border-border"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20 text-green-500">
                      <KickIcon />
                    </div>
                    <div>
                      <p className="font-bold">{(item.kick_points_cost ?? 0).toLocaleString()} pts</p>
                      <p className="text-xs text-muted-foreground">Kick Channel Points</p>
                    </div>
                  </div>
                  {canAffordKick ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              )}
            </div>

            {/* Action Button */}
            <Button
              size="lg"
              className="w-full"
              disabled={!canRedeem || isOutOfStock}
              onClick={() => {
                onRedeem(item);
                onClose();
              }}
            >
              {isOutOfStock ? (
                "Out of Stock"
              ) : !canAffordAny ? (
                "Not Enough Points"
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Redeem Now
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
