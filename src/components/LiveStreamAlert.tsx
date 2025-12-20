import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Link } from "react-router-dom";

export function LiveStreamAlert() {
  const { settings } = useSiteSettings();
  const [dismissed, setDismissed] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  const isLive = settings?.is_live === true;
  const platform = settings?.live_platform === "kick" ? "Kick" : "Twitch";
  const streamChannel = settings?.stream_channel || "";

  // Reset dismissed state when stream goes offline then back online
  useEffect(() => {
    if (!isLive) {
      setDismissed(false);
      setHasShown(false);
    }
  }, [isLive]);

  // Show alert when stream goes live
  useEffect(() => {
    if (isLive && !hasShown && !dismissed) {
      setHasShown(true);
    }
  }, [isLive, hasShown, dismissed]);

  // Don't show if not live, dismissed, or already shown and dismissed
  if (!isLive || dismissed) {
    return null;
  }

  const getChannelUrl = () => {
    if (!streamChannel) return "/stream";
    if (platform === "Kick") {
      return `https://kick.com/${streamChannel}`;
    }
    return `https://twitch.tv/${streamChannel}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
      >
        <div className={`relative overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl ${
          platform === "Kick" 
            ? "bg-green-500/10 border-green-500/30 shadow-green-500/20" 
            : "bg-purple-500/10 border-purple-500/30 shadow-purple-500/20"
        }`}>
          {/* Animated background pulse */}
          <div className={`absolute inset-0 ${
            platform === "Kick" ? "bg-green-500/5" : "bg-purple-500/5"
          } animate-pulse`} />
          
          {/* Glow effect */}
          <div className={`absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl ${
            platform === "Kick" ? "bg-green-500/20" : "bg-purple-500/20"
          }`} />

          <div className="relative p-4">
            <div className="flex items-center gap-4">
              {/* Animated live indicator */}
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  platform === "Kick" ? "bg-green-500/20" : "bg-purple-500/20"
                }`}>
                  <Radio className={`w-6 h-6 ${
                    platform === "Kick" ? "text-green-500" : "text-purple-500"
                  }`} />
                </div>
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full animate-ping ${
                  platform === "Kick" ? "bg-green-500" : "bg-red-500"
                }`} />
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${
                  platform === "Kick" ? "bg-green-500" : "bg-red-500"
                }`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                    platform === "Kick" 
                      ? "bg-green-500 text-black" 
                      : "bg-red-500 text-white"
                  }`}>
                    LIVE
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    Now streaming on {platform}!
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {streamChannel ? `@${streamChannel}` : "Watch now"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link to="/stream">
                  <Button 
                    size="sm" 
                    className={`gap-1.5 ${
                      platform === "Kick" 
                        ? "bg-green-500 hover:bg-green-600 text-black" 
                        : "bg-purple-500 hover:bg-purple-600 text-white"
                    }`}
                  >
                    Watch
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-background/50"
                  onClick={() => setDismissed(true)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
