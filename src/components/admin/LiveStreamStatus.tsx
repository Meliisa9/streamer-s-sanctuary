import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Radio, Users, Eye, ExternalLink, RefreshCw, Wifi, WifiOff, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { safeFormatRelative } from "@/components/SafeDate";

interface StreamSettings {
  is_live: boolean;
  stream_url: string;
  viewer_count?: number;
}

export function LiveStreamStatus() {
  const [stream, setStream] = useState<StreamSettings | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [platform, setPlatform] = useState<string>("twitch");
  const [channel, setChannel] = useState<string>("");
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [autoDetect, setAutoDetect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStreamStatus();

    const subscription = supabase
      .channel('stream-status-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
        },
        () => {
          fetchStreamStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchStreamStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["stream_settings", "is_live", "live_platform", "stream_channel", "last_check", "auto_detect_enabled"]);

      if (!error && data) {
        const settingsMap: Record<string, any> = {};
        data.forEach(s => {
          settingsMap[s.key] = s.value;
        });

        setIsLive(settingsMap.is_live === true);
        setPlatform(settingsMap.live_platform || "twitch");
        setChannel(settingsMap.stream_channel || "");
        setLastCheck(settingsMap.last_check || null);
        setAutoDetect(settingsMap.auto_detect_enabled === true);

        if (settingsMap.stream_settings && typeof settingsMap.stream_settings === 'object') {
          setStream(settingsMap.stream_settings as StreamSettings);
        }
      }
    } catch (error) {
      console.error("Error fetching stream status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshCheck = async () => {
    setIsRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke("check-stream-status");
      if (error) throw error;
      await fetchStreamStatus();
      toast({ title: "Stream status refreshed" });
    } catch (error: any) {
      console.error("Error refreshing stream status:", error);
      toast({ title: "Failed to refresh", description: error.message, variant: "destructive" });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card/50 border border-border/50 rounded-xl p-4 animate-pulse h-[180px]">
        <div className="h-5 bg-muted/30 rounded w-24 mb-3"></div>
        <div className="h-4 bg-muted/30 rounded w-full mb-2"></div>
        <div className="h-4 bg-muted/30 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-4 border transition-all ${
        isLive 
          ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30' 
          : 'bg-card/50 border-border/50'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isLive ? 'bg-green-500/20' : 'bg-muted/30'}`}>
            {isLive ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <h3 className="font-semibold text-sm">Stream Status</h3>
        </div>
        <Badge
          variant="outline"
          className={
            isLive
              ? "bg-green-500/10 text-green-500 border-green-500/30 text-xs"
              : "bg-muted/30 text-muted-foreground border-border text-xs"
          }
        >
          {isLive ? "● LIVE" : "Offline"}
        </Badge>
      </div>

      {/* Status Info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Platform</span>
          <span className="font-medium capitalize">{platform}</span>
        </div>
        {channel && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Channel</span>
            <span className="font-medium truncate max-w-[120px]">{channel}</span>
          </div>
        )}
        {stream?.viewer_count !== undefined && isLive && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Viewers</span>
            <span className="font-medium flex items-center gap-1">
              <Users className="w-3 h-3" />
              {stream.viewer_count.toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Auto-detect</span>
          <Badge variant="outline" className={`text-xs ${autoDetect ? 'text-green-500 border-green-500/30' : 'text-muted-foreground'}`}>
            {autoDetect ? "On" : "Off"}
          </Badge>
        </div>
      </div>

      {/* Last Check */}
      {lastCheck && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 pb-3 border-b border-border/50">
          <Clock className="w-3 h-3" />
          <span>Checked {safeFormatRelative(lastCheck)}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshCheck}
          disabled={isRefreshing}
          className="flex-1 h-8 text-xs gap-1.5"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          Check Now
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="flex-1 h-8 text-xs gap-1.5"
        >
          <Link to="/admin/stream">
            <TrendingUp className="w-3 h-3" />
            Manage
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
