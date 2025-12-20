import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Activity, AlertTriangle, CheckCircle, RefreshCw, 
  Database, Wifi, Clock, Server, XCircle, Terminal,
  ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { safeFormatRelative } from "@/components/SafeDate";

interface DiagnosticCheck {
  name: string;
  status: "ok" | "warning" | "error" | "checking";
  message: string;
  lastCheck: Date | null;
}

interface EdgeFunctionStatus {
  name: string;
  lastError: string | null;
  lastSuccess: Date | null;
  status: "ok" | "error" | "unknown";
}

export function AdminDiagnosticsPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticCheck[]>([
    { name: "Database Connection", status: "checking", message: "Checking...", lastCheck: null },
    { name: "Realtime Connection", status: "checking", message: "Checking...", lastCheck: null },
    { name: "Storage Access", status: "checking", message: "Checking...", lastCheck: null },
    { name: "Edge Functions", status: "checking", message: "Checking...", lastCheck: null },
  ]);
  const [edgeFunctions, setEdgeFunctions] = useState<EdgeFunctionStatus[]>([]);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setIsChecking(true);
    const now = new Date();

    // Check database connection
    try {
      const start = performance.now();
      const { error } = await supabase.from("site_settings").select("key").limit(1);
      const latency = Math.round(performance.now() - start);
      
      updateDiagnostic("Database Connection", {
        status: error ? "error" : "ok",
        message: error ? error.message : `Connected (${latency}ms latency)`,
        lastCheck: now,
      });
    } catch (e: any) {
      updateDiagnostic("Database Connection", {
        status: "error",
        message: e.message || "Connection failed",
        lastCheck: now,
      });
    }

    // Check realtime connection
    try {
      const channel = supabase.channel("diagnostic-test");
      const status = await new Promise<string>((resolve) => {
        const timeout = setTimeout(() => resolve("timeout"), 5000);
        channel.subscribe((status) => {
          clearTimeout(timeout);
          resolve(status);
        });
      });
      supabase.removeChannel(channel);
      
      updateDiagnostic("Realtime Connection", {
        status: status === "SUBSCRIBED" ? "ok" : "warning",
        message: status === "SUBSCRIBED" ? "Connected" : `Status: ${status}`,
        lastCheck: now,
      });
    } catch (e: any) {
      updateDiagnostic("Realtime Connection", {
        status: "error",
        message: e.message || "Connection failed",
        lastCheck: now,
      });
    }

    // Check storage access
    try {
      const { data, error } = await supabase.storage.listBuckets();
      updateDiagnostic("Storage Access", {
        status: error ? "error" : "ok",
        message: error ? error.message : `${data?.length || 0} bucket(s) accessible`,
        lastCheck: now,
      });
    } catch (e: any) {
      updateDiagnostic("Storage Access", {
        status: "error",
        message: e.message || "Access failed",
        lastCheck: now,
      });
    }

    // Check edge functions
    try {
      const { error } = await supabase.functions.invoke("check-stream-status", {
        body: { test: true },
      });
      
      updateDiagnostic("Edge Functions", {
        status: error ? "warning" : "ok",
        message: error ? `Warning: ${error.message}` : "Responding normally",
        lastCheck: now,
      });

      // Update edge function status list
      setEdgeFunctions([
        {
          name: "check-stream-status",
          lastError: error ? error.message : null,
          lastSuccess: error ? null : now,
          status: error ? "error" : "ok",
        },
      ]);
    } catch (e: any) {
      updateDiagnostic("Edge Functions", {
        status: "warning",
        message: "Could not verify",
        lastCheck: now,
      });
    }

    setIsChecking(false);
  };

  const updateDiagnostic = (name: string, updates: Partial<DiagnosticCheck>) => {
    setDiagnostics((prev) =>
      prev.map((d) => (d.name === name ? { ...d, ...updates } : d))
    );
  };

  const getStatusIcon = (status: DiagnosticCheck["status"]) => {
    switch (status) {
      case "ok":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />;
    }
  };

  const getOverallStatus = () => {
    if (diagnostics.some((d) => d.status === "error")) return "error";
    if (diagnostics.some((d) => d.status === "warning")) return "warning";
    if (diagnostics.some((d) => d.status === "checking")) return "checking";
    return "ok";
  };

  const overallStatus = getOverallStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            overallStatus === "ok" ? "bg-green-500/10" :
            overallStatus === "warning" ? "bg-amber-500/10" :
            overallStatus === "error" ? "bg-red-500/10" :
            "bg-secondary"
          }`}>
            <Terminal className={`w-5 h-5 ${
              overallStatus === "ok" ? "text-green-500" :
              overallStatus === "warning" ? "text-amber-500" :
              overallStatus === "error" ? "text-red-500" :
              "text-muted-foreground"
            }`} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">System Diagnostics</h3>
            <p className="text-sm text-muted-foreground">
              {overallStatus === "ok" && "All systems operational"}
              {overallStatus === "warning" && "Some warnings detected"}
              {overallStatus === "error" && "Issues detected"}
              {overallStatus === "checking" && "Running checks..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={overallStatus === "ok" ? "default" : "destructive"}
            className={
              overallStatus === "ok" ? "bg-green-500/10 text-green-500 border-green-500/20" :
              overallStatus === "warning" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
              "bg-red-500/10 text-red-500 border-red-500/20"
            }
          >
            {diagnostics.filter((d) => d.status === "ok").length}/{diagnostics.length} OK
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border/50 p-4 space-y-4">
          {/* Diagnostic checks */}
          <div className="space-y-2">
            {diagnostics.map((diag) => (
              <div
                key={diag.name}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(diag.status)}
                  <div>
                    <p className="font-medium text-sm">{diag.name}</p>
                    <p className="text-xs text-muted-foreground">{diag.message}</p>
                  </div>
                </div>
                {diag.lastCheck && (
                  <span className="text-xs text-muted-foreground">
                    {safeFormatRelative(diag.lastCheck)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Edge function details */}
          {edgeFunctions.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Server className="w-4 h-4" />
                Edge Functions
              </h4>
              <div className="space-y-2">
                {edgeFunctions.map((fn) => (
                  <div
                    key={fn.name}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 text-sm"
                  >
                    <code className="text-xs">{fn.name}</code>
                    <Badge
                      variant="outline"
                      className={
                        fn.status === "ok"
                          ? "border-green-500/30 text-green-500"
                          : "border-red-500/30 text-red-500"
                      }
                    >
                      {fn.status === "ok" ? "Healthy" : "Error"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostics}
            disabled={isChecking}
            className="w-full gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
            Run Diagnostics
          </Button>
        </div>
      )}
    </motion.div>
  );
}
