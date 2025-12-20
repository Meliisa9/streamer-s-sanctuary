import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bug, X, Database, Wifi, Clock, Cpu, 
  ChevronUp, ChevronDown, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DiagnosticData {
  dbLatency: number;
  realtimeConnected: boolean;
  renderCount: number;
  memoryUsage: number | null;
  lastUpdate: Date;
}

export function DevDiagnosticsOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticData>({
    dbLatency: 0,
    realtimeConnected: false,
    renderCount: 0,
    memoryUsage: null,
    lastUpdate: new Date(),
  });

  const { user, isAdmin } = useAuth();
  const isDev = import.meta.env.DEV;

  // Check permission for viewing diagnostics
  useEffect(() => {
    const checkPermission = async () => {
      if (!user) { setHasPermission(false); return; }
      if (isAdmin) { setHasPermission(true); return; }
      
      // Check if user has the view_dev_diagnostics permission
      const { data } = await supabase.rpc("has_permission", { _user_id: user.id, _permission: "view_dev_diagnostics" });
      setHasPermission(data === true);
    };
    checkPermission();
  }, [user, isAdmin]);

  useEffect(() => {
    if ((!isDev && !hasPermission) || !isOpen) return;

    const updateDiagnostics = async () => {
      const start = performance.now();
      try {
        await supabase.from("site_settings").select("key").limit(1);
        const latency = Math.round(performance.now() - start);
        const memory = (performance as any).memory?.usedJSHeapSize;
        
        setDiagnostics((prev) => ({
          ...prev,
          dbLatency: latency,
          memoryUsage: memory ? Math.round(memory / 1024 / 1024) : null,
          lastUpdate: new Date(),
          renderCount: prev.renderCount + 1,
        }));
      } catch (error) {
        console.error("Diagnostics error:", error);
      }
    };

    updateDiagnostics();
    const interval = setInterval(updateDiagnostics, 5000);

    const channel = supabase.channel("dev-diagnostics");
    channel.subscribe((status) => {
      setDiagnostics((prev) => ({ ...prev, realtimeConnected: status === "SUBSCRIBED" }));
    });

    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [isDev, hasPermission, isOpen]);

  // Only show to admins or users with permission (or in dev mode)
  if (!isDev && !hasPermission) return null;

  return (
    <>
      {/* Toggle Button - positioned at top right, out of the way */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-[200] p-2 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-500 transition-all hover:scale-110 opacity-50 hover:opacity-100"
        title="Dev Diagnostics"
      >
        <Bug className="w-4 h-4" />
      </button>

      {/* Overlay Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-14 right-4 z-[200] w-72 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-sm">Dev Diagnostics</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Content */}
            {!isMinimized && (
              <div className="p-3 space-y-3">
                {/* DB Latency */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span>DB Latency</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      diagnostics.dbLatency < 100
                        ? "border-green-500/30 text-green-500"
                        : diagnostics.dbLatency < 300
                        ? "border-amber-500/30 text-amber-500"
                        : "border-red-500/30 text-red-500"
                    }
                  >
                    {diagnostics.dbLatency}ms
                  </Badge>
                </div>

                {/* Realtime Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Wifi className="w-4 h-4 text-purple-500" />
                    <span>Realtime</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      diagnostics.realtimeConnected
                        ? "border-green-500/30 text-green-500"
                        : "border-red-500/30 text-red-500"
                    }
                  >
                    {diagnostics.realtimeConnected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>

                {/* Memory Usage */}
                {diagnostics.memoryUsage !== null && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Cpu className="w-4 h-4 text-orange-500" />
                      <span>Memory</span>
                    </div>
                    <Badge variant="outline" className="border-border">
                      {diagnostics.memoryUsage} MB
                    </Badge>
                  </div>
                )}

                {/* Render Count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 text-cyan-500" />
                    <span>Updates</span>
                  </div>
                  <Badge variant="outline" className="border-border">
                    {diagnostics.renderCount}
                  </Badge>
                </div>

                {/* Last Update */}
                <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last update: {diagnostics.lastUpdate.toLocaleTimeString()}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
