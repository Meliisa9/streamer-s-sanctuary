import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const DISMISSED_KEY = "live_stream_alert_dismissed";

export function LiveStreamAlert() {
  const { settings } = useSiteSettings();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  const isLive = settings?.is_live === true;
  const platform = settings?.live_platform === "kick" ? "Kick" : "Twitch";
  const streamChannel = settings?.stream_channel || "";

  // Check session storage on mount
  useEffect(() => {
    const dismissedData = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissedData) {
      try {
        const { dismissed: wasDismissed, odSId } = JSON.parse(dismissedData);
        // Only keep dismissed if same user (or no user) and was actually dismissed
        if (wasDismissed && (odSId === user?.id || (!odSId && !user))) {
          setDismissed(true);
        }
      } catch {
        // Invalid data, reset
        sessionStorage.removeItem(DISMISSED_KEY);
      }
    }
    setHasCheckedSession(true);
  }, [user]);

  // Reset when user logs out
  useEffect(() => {
    if (hasCheckedSession && !user) {
      // Clear dismissed state when user logs out
      const dismissedData = sessionStorage.getItem(DISMISSED_KEY);
      if (dismissedData) {
        try {
          const { odSId } = JSON.parse(dismissedData);
          if (odSId) {
            // Was logged in before, now logged out - reset
            sessionStorage.removeItem(DISMISSED_KEY);
            setDismissed(false);
          }
        } catch {
          sessionStorage.removeItem(DISMISSED_KEY);
        }
      }
    }
  }, [user, hasCheckedSession]);

  // Reset dismissed state when stream goes offline then back online
  useEffect(() => {
    if (!isLive) {
      sessionStorage.removeItem(DISMISSED_KEY);
      setDismissed(false);
    }
  }, [isLive]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(
      DISMISSED_KEY,
      JSON.stringify({ dismissed: true, odSId: user?.id || null })
    );
  };

  // Don't show if not live, dismissed, or haven't checked session yet
  if (!isLive || dismissed || !hasCheckedSession) {
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
        initial={{ opacity: 0, x: 100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.9 }}
        className="fixed bottom-20 right-4 z-[100] max-w-xs"
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
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 rounded-full hover:bg-background/50 z-10"
            onClick={handleDismiss}
          >
            <X className="w-3 h-3" />
          </Button>

          <div className="relative p-4">
            <div className="flex items-center gap-3">
              {/* Animated live indicator */}
              <div className="relative">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  platform === "Kick" ? "bg-green-500/20" : "bg-purple-500/20"
                }`}>
                  <Radio className={`w-5 h-5 ${
                    platform === "Kick" ? "text-green-500" : "text-purple-500"
                  }`} />
                </div>
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping ${
                  platform === "Kick" ? "bg-green-500" : "bg-red-500"
                }`} />
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                  platform === "Kick" ? "bg-green-500" : "bg-red-500"
                }`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                    platform === "Kick" 
                      ? "bg-green-500 text-black" 
                      : "bg-red-500 text-white"
                  }`}>
                    LIVE
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground mt-1">
                  Now streaming on {platform}!
                </p>
                {streamChannel && (
                  <p className="text-xs text-muted-foreground truncate">
                    @{streamChannel}
                  </p>
                )}
              </div>
            </div>

            {/* Watch button */}
            <Link to="/stream" className="block mt-3">
              <Button 
                size="sm" 
                className={`w-full gap-1.5 ${
                  platform === "Kick" 
                    ? "bg-green-500 hover:bg-green-600 text-black" 
                    : "bg-purple-500 hover:bg-purple-600 text-white"
                }`}
              >
                Watch Now
                <ExternalLink className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
