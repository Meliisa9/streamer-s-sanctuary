import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Activity, Wifi, WifiOff, RefreshCw, Clock,
  CheckCircle, AlertTriangle, XCircle, Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { safeFormatRelative } from "@/components/SafeDate";

interface StreamHealth {
  isLive: boolean;
  platform: string;
  channel: string;
  autoDetectEnabled: boolean;
  lastCheck: string | null;
  uptime: number; // minutes
  responseTime: number; // ms
  status: "healthy" | "degraded" | "offline";
}

export function StreamHealthWidget() {
  const [health, setHealth] = useState<StreamHealth>({
    isLive: false,
    platform: "twitch",
    channel: "",
    autoDetectEnabled: false,
    lastCheck: null,
    uptime: 0,
    responseTime: 0,
    status: "offline",
  });
  const [isChecking, setIsChecking] = useState(false);
  const [checkHistory, setCheckHistory] = useState<Array<{ time: Date; success: boolean }>>([]);

  useEffect(() => {
    fetchStreamHealth();
    
    // Set up realtime subscription
    const channel = supabase
      .channel("stream-health")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_settings",
        },
        () => {
          fetchStreamHealth();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStreamHealth = async () => {
    try {
      const start = performance.now();
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      const responseTime = Math.round(performance.now() - start);

      if (error) throw error;

      const settings: Record<string, any> = {};
      data?.forEach((row) => {
        settings[row.key] = row.value;
      });

      setHealth({
        isLive: settings.is_live === true,
        platform: settings.live_platform || "twitch",
        channel: settings.stream_channel || "",
        autoDetectEnabled: settings.auto_detect_enabled === true,
        lastCheck: settings.last_check || null,
        uptime: 0, // Would need tracking
        responseTime,
        status: settings.is_live ? "healthy" : "offline",
      });

      setCheckHistory((prev) => [
        { time: new Date(), success: true },
        ...prev.slice(0, 9),
      ]);
    } catch (error) {
      console.error("Error fetching stream health:", error);
      setCheckHistory((prev) => [
        { time: new Date(), success: false },
        ...prev.slice(0, 9),
      ]);
    }
  };

  const runHealthCheck = async () => {
    setIsChecking(true);
    try {
      await supabase.functions.invoke("check-stream-status");
      await fetchStreamHealth();
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = () => {
    if (health.isLive) return "text-green-500";
    if (health.autoDetectEnabled) return "text-amber-500";
    return "text-muted-foreground";
  };

  const getStatusBg = () => {
    if (health.isLive) return "bg-green-500/10";
    if (health.autoDetectEnabled) return "bg-amber-500/10";
    return "bg-secondary";
  };

  const successRate = checkHistory.length > 0
    ? Math.round((checkHistory.filter((c) => c.success).length / checkHistory.length) * 100)
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getStatusBg()}`}>
            {health.isLive ? (
              <Wifi className={`w-5 h-5 ${getStatusColor()}`} />
            ) : (
              <WifiOff className={`w-5 h-5 ${getStatusColor()}`} />
            )}
          </div>
          <div>
            <h3 className="font-semibold">Stream Health</h3>
            <p className="text-sm text-muted-foreground">
              {health.isLive ? `Live on ${health.platform}` : "Offline"}
            </p>
          </div>
        </div>
        <Badge
          className={
            health.isLive
              ? "bg-green-500/10 text-green-500 border-green-500/20"
              : "bg-muted text-muted-foreground"
          }
        >
          {health.isLive ? "LIVE" : "Offline"}
        </Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-secondary/30 text-center">
          <p className="text-lg font-bold">{health.responseTime}ms</p>
          <p className="text-xs text-muted-foreground">Response</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/30 text-center">
          <p className="text-lg font-bold">{successRate}%</p>
          <p className="text-xs text-muted-foreground">Uptime</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/30 text-center">
          <p className="text-lg font-bold">{checkHistory.length}</p>
          <p className="text-xs text-muted-foreground">Checks</p>
        </div>
      </div>

      {/* Check history visualization */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 10 }).map((_, i) => {
          const check = checkHistory[i];
          return (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full ${
                check
                  ? check.success
                    ? "bg-green-500"
                    : "bg-red-500"
                  : "bg-secondary"
              }`}
              title={check ? `${check.success ? "Success" : "Failed"} - ${check.time.toLocaleTimeString()}` : "No data"}
            />
          );
        })}
      </div>

      {/* Last check info */}
      {health.lastCheck && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Clock className="w-3 h-3" />
          <span>Last auto-check: {safeFormatRelative(health.lastCheck)}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={runHealthCheck}
          disabled={isChecking}
          className="flex-1 gap-2"
        >
          {isChecking ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Activity className="w-4 h-4" />
          )}
          Check Now
        </Button>
      </div>
    </motion.div>
  );
}
