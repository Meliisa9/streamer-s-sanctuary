import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Gauge, Zap, Clock, Database, Cpu, RefreshCw,
  TrendingUp, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";

export function PerformanceMonitorWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { metrics, getMetricStatus, formatBytes, formatMs, getOverallScore } = usePerformanceMonitor(true);

  const overallScore = getOverallScore();

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "needs-improvement": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "poor": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "good": return <Badge className="bg-green-500/10 text-green-500 border-green-500/30">Good</Badge>;
      case "needs-improvement": return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">Needs Work</Badge>;
      case "poor": return <Badge className="bg-red-500/10 text-red-500 border-red-500/30">Poor</Badge>;
      default: return <Badge variant="secondary">Measuring...</Badge>;
    }
  };

  const coreWebVitals = [
    { 
      name: "LCP", 
      fullName: "Largest Contentful Paint",
      value: metrics.lcp, 
      formatted: formatMs(metrics.lcp),
      status: getMetricStatus("lcp", metrics.lcp),
      desc: "Loading performance"
    },
    { 
      name: "FID", 
      fullName: "First Input Delay",
      value: metrics.fid, 
      formatted: formatMs(metrics.fid),
      status: getMetricStatus("fid", metrics.fid),
      desc: "Interactivity"
    },
    { 
      name: "CLS", 
      fullName: "Cumulative Layout Shift",
      value: metrics.cls, 
      formatted: metrics.cls?.toFixed(3) ?? "N/A",
      status: getMetricStatus("cls", metrics.cls),
      desc: "Visual stability"
    },
    { 
      name: "FCP", 
      fullName: "First Contentful Paint",
      value: metrics.fcp, 
      formatted: formatMs(metrics.fcp),
      status: getMetricStatus("fcp", metrics.fcp),
      desc: "First paint"
    },
    { 
      name: "TTFB", 
      fullName: "Time to First Byte",
      value: metrics.ttfb, 
      formatted: formatMs(metrics.ttfb),
      status: getMetricStatus("ttfb", metrics.ttfb),
      desc: "Server response"
    },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Force a re-render to update metrics
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-border/50 overflow-hidden"
    >
      {/* Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Performance Monitor</h3>
            <p className="text-xs text-muted-foreground">Core Web Vitals & Metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</p>
            <p className="text-xs text-muted-foreground">Score</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
            className="shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 pb-4 grid grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-secondary/30 text-center">
          <Gauge className="w-5 h-5 mx-auto mb-1 text-green-500" />
          <p className="text-lg font-bold">{metrics.fps}</p>
          <p className="text-xs text-muted-foreground">FPS</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/30 text-center">
          <Cpu className="w-5 h-5 mx-auto mb-1 text-blue-500" />
          <p className="text-lg font-bold">{formatBytes(metrics.usedJsHeapSize)}</p>
          <p className="text-xs text-muted-foreground">Memory</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/30 text-center">
          <Database className="w-5 h-5 mx-auto mb-1 text-purple-500" />
          <p className="text-lg font-bold">{metrics.networkRequests}</p>
          <p className="text-xs text-muted-foreground">Requests</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/30 text-center">
          <Zap className="w-5 h-5 mx-auto mb-1 text-amber-500" />
          <p className="text-lg font-bold">{metrics.longTasks}</p>
          <p className="text-xs text-muted-foreground">Long Tasks</p>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
              {/* Core Web Vitals */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Core Web Vitals
                </h4>
                <div className="space-y-3">
                  {coreWebVitals.map((vital) => (
                    <div key={vital.name} className="flex items-center gap-3">
                      {getStatusIcon(vital.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{vital.name}</span>
                          <span className="text-sm font-mono">{vital.formatted}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{vital.fullName}</p>
                      </div>
                      {getStatusBadge(vital.status)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Resource Metrics */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  Resource Metrics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Page Load</p>
                    <p className="font-semibold">{formatMs(metrics.pageLoadTime)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <p className="text-xs text-muted-foreground">DOM Ready</p>
                    <p className="font-semibold">{formatMs(metrics.domContentLoaded)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Resources</p>
                    <p className="font-semibold">{metrics.resourceCount}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Transfer Size</p>
                    <p className="font-semibold">{formatBytes(metrics.transferSize)}</p>
                  </div>
                </div>
              </div>

              {/* Memory Usage */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  Memory Usage
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>JS Heap Used</span>
                    <span className="font-mono">{formatBytes(metrics.usedJsHeapSize)}</span>
                  </div>
                  <Progress 
                    value={(metrics.usedJsHeapSize / metrics.jsHeapSize) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    of {formatBytes(metrics.jsHeapSize)} limit
                  </p>
                </div>
              </div>

              {/* Performance Score Breakdown */}
              <div>
                <h4 className="text-sm font-medium mb-3">Score Breakdown</h4>
                <div className="h-4 rounded-full bg-secondary overflow-hidden flex">
                  <div className={`${getScoreBg(overallScore)} transition-all`} style={{ width: `${overallScore}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
