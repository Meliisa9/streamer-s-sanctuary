import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  Activity, 
  Database, 
  Users, 
  HardDrive, 
  Wifi,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface SystemHealth {
  database: "healthy" | "degraded" | "down";
  realtime: "connected" | "disconnected";
  activeUsers: number;
  recentActivities: number;
  lastCheck: Date;
}

export function SystemMonitor() {
  const [health, setHealth] = useState<SystemHealth>({
    database: "healthy",
    realtime: "disconnected",
    activeUsers: 0,
    recentActivities: 0,
    lastCheck: new Date()
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    // Subscribe to realtime to verify connection
    const channel = supabase
      .channel('system-monitor')
      .on('presence', { event: 'sync' }, () => {
        setHealth(prev => ({ ...prev, realtime: "connected" }));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setHealth(prev => ({ ...prev, realtime: "connected" }));
        }
      });

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const checkHealth = async () => {
    setIsRefreshing(true);
    try {
      // Check database connection
      const { error: dbError } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .limit(1);
      
      // Get active users (activity in last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: activeCount } = await supabase
        .from("user_activities")
        .select("*", { count: "exact", head: true })
        .gte("created_at", fiveMinutesAgo);

      // Get recent activities (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: recentCount } = await supabase
        .from("user_activities")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneHourAgo);

      setHealth(prev => ({
        ...prev,
        database: dbError ? "down" : "healthy",
        activeUsers: activeCount || 0,
        recentActivities: recentCount || 0,
        lastCheck: new Date()
      }));
    } catch (error) {
      setHealth(prev => ({
        ...prev,
        database: "down",
        lastCheck: new Date()
      }));
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "connected":
        return "text-green-500";
      case "degraded":
        return "text-yellow-500";
      default:
        return "text-red-500";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 border border-border/50 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">System Monitor</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={checkHealth}
          disabled={isRefreshing}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-3">
        {/* Database Status */}
        <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Database</span>
          </div>
          <div className="flex items-center gap-1">
            {getStatusIcon(health.database)}
            <span className={`text-sm capitalize ${getStatusColor(health.database)}`}>
              {health.database}
            </span>
          </div>
        </div>

        {/* Realtime Status */}
        <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Realtime</span>
          </div>
          <div className="flex items-center gap-1">
            {getStatusIcon(health.realtime)}
            <span className={`text-sm capitalize ${getStatusColor(health.realtime)}`}>
              {health.realtime}
            </span>
          </div>
        </div>

        {/* Active Users */}
        <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Active (5m)</span>
          </div>
          <span className="text-sm font-medium">{health.activeUsers}</span>
        </div>

        {/* Recent Activities */}
        <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Activities (1h)</span>
          </div>
          <span className="text-sm font-medium">{health.recentActivities}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        Last checked: {formatDistanceToNow(health.lastCheck, { addSuffix: true })}
      </p>
    </motion.div>
  );
}
