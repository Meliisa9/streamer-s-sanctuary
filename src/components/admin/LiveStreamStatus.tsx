import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Radio, Users, Eye, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface StreamSettings {
  is_live: boolean;
  stream_url: string;
  viewer_count?: number;
}

export function LiveStreamStatus() {
  const [stream, setStream] = useState<StreamSettings | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStreamStatus();

    // Subscribe to realtime updates for both stream_settings and is_live
    const channel = supabase
      .channel('stream-status-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
        },
        (payload) => {
          // Refresh on any site_settings change
          fetchStreamStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStreamStatus = async () => {
    try {
      // Fetch all relevant settings
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["stream_settings", "is_live", "live_platform"]);

      if (!error && data) {
        const settingsMap: Record<string, any> = {};
        data.forEach(s => {
          settingsMap[s.key] = s.value;
        });

        // Check is_live from dedicated setting first
        const liveStatus = settingsMap.is_live === true;
        setIsLive(liveStatus);

        // Also get stream_settings for URL and viewer count
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
      <div className="bg-card/50 border border-border/50 rounded-xl p-4 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-32 mb-2"></div>
        <div className="h-4 bg-muted/30 rounded w-24"></div>
      </div>
    );
  }

  return (
    <div className={`border rounded-xl p-4 ${isLive ? 'bg-green-500/10 border-green-500/30' : 'bg-card/50 border-border/50'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isLive ? 'bg-green-500/20' : 'bg-muted/20'}`}>
            <Radio className={`w-5 h-5 ${isLive ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{isLive ? 'Live Now' : 'Offline'}</span>
              {isLive && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  LIVE
                </span>
              )}
            </div>
            {stream?.viewer_count !== undefined && isLive && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{stream.viewer_count.toLocaleString()} viewers</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefreshCheck} 
            disabled={isRefreshing}
            className="h-8 w-8"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          {stream?.stream_url && isLive && (
            <Button variant="outline" size="sm" asChild>
              <a href={stream.stream_url} target="_blank" rel="noopener noreferrer" className="gap-1">
                <Eye className="w-4 h-4" />
                Watch
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
