import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bug, X, Database, Wifi, Clock, Cpu, 
  ChevronUp, ChevronDown, Activity, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

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
  const [diagnostics, setDiagnostics] = useState<DiagnosticData>({
    dbLatency: 0,
    realtimeConnected: false,
    renderCount: 0,
    memoryUsage: null,
    lastUpdate: new Date(),
  });

  // Only show in development
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    if (!isDev || !isOpen) return;

    const updateDiagnostics = async () => {
      // Measure DB latency
      const start = performance.now();
      try {
        await supabase.from("site_settings").select("key").limit(1);
        const latency = Math.round(performance.now() - start);
        
        // Get memory usage if available
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

    // Check realtime connection
    const channel = supabase.channel("dev-diagnostics");
    channel.subscribe((status) => {
      setDiagnostics((prev) => ({
        ...prev,
        realtimeConnected: status === "SUBSCRIBED",
      }));
    });

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [isDev, isOpen]);

  if (!isDev) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-[200] p-2 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-500 transition-all hover:scale-110"
        title="Dev Diagnostics"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* Overlay Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed bottom-16 left-4 z-[200] w-72 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden"
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
