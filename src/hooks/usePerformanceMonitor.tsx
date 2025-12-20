import { useState, useEffect, useCallback, useRef } from "react";

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  inp: number | null; // Interaction to Next Paint

  // Custom metrics
  pageLoadTime: number;
  domContentLoaded: number;
  jsHeapSize: number;
  usedJsHeapSize: number;
  totalJsHeapSize: number;
  fps: number;
  networkRequests: number;
  longTasks: number;
  renderCount: number;

  // Resource metrics
  resourceCount: number;
  transferSize: number;
  decodedBodySize: number;
}

interface PerformanceThresholds {
  lcp: { good: number; needsImprovement: number };
  fid: { good: number; needsImprovement: number };
  cls: { good: number; needsImprovement: number };
  fcp: { good: number; needsImprovement: number };
  ttfb: { good: number; needsImprovement: number };
}

const defaultThresholds: PerformanceThresholds = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 },
};

export function usePerformanceMonitor(enabled: boolean = true) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null,
    pageLoadTime: 0,
    domContentLoaded: 0,
    jsHeapSize: 0,
    usedJsHeapSize: 0,
    totalJsHeapSize: 0,
    fps: 60,
    networkRequests: 0,
    longTasks: 0,
    renderCount: 0,
    resourceCount: 0,
    transferSize: 0,
    decodedBodySize: 0,
  });

  const renderCountRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const longTaskCountRef = useRef(0);

  // Measure FPS
  const measureFPS = useCallback(() => {
    const now = performance.now();
    const delta = now - lastFrameTimeRef.current;
    
    if (delta >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / delta);
      setMetrics((prev) => ({ ...prev, fps }));
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
    }
    
    frameCountRef.current++;
    if (enabled) {
      requestAnimationFrame(measureFPS);
    }
  }, [enabled]);

  // Observe Core Web Vitals
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const observeLCP = () => {
      if ("PerformanceObserver" in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            setMetrics((prev) => ({ ...prev, lcp: lastEntry.renderTime || lastEntry.loadTime }));
          }
        });
        try {
          observer.observe({ type: "largest-contentful-paint", buffered: true });
        } catch (e) {
          console.debug("LCP observer not supported");
        }
        return observer;
      }
    };

    const observeFID = () => {
      if ("PerformanceObserver" in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            setMetrics((prev) => ({ ...prev, fid: entry.processingStart - entry.startTime }));
          });
        });
        try {
          observer.observe({ type: "first-input", buffered: true });
        } catch (e) {
          console.debug("FID observer not supported");
        }
        return observer;
      }
    };

    const observeCLS = () => {
      if ("PerformanceObserver" in window) {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              setMetrics((prev) => ({ ...prev, cls: clsValue }));
            }
          });
        });
        try {
          observer.observe({ type: "layout-shift", buffered: true });
        } catch (e) {
          console.debug("CLS observer not supported");
        }
        return observer;
      }
    };

    const observeFCP = () => {
      if ("PerformanceObserver" in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === "first-contentful-paint") {
              setMetrics((prev) => ({ ...prev, fcp: entry.startTime }));
            }
          });
        });
        try {
          observer.observe({ type: "paint", buffered: true });
        } catch (e) {
          console.debug("FCP observer not supported");
        }
        return observer;
      }
    };

    const observeLongTasks = () => {
      if ("PerformanceObserver" in window) {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(() => {
            longTaskCountRef.current++;
            setMetrics((prev) => ({ ...prev, longTasks: longTaskCountRef.current }));
          });
        });
        try {
          observer.observe({ type: "longtask", buffered: true });
        } catch (e) {
          console.debug("Long task observer not supported");
        }
        return observer;
      }
    };

    const lcpObserver = observeLCP();
    const fidObserver = observeFID();
    const clsObserver = observeCLS();
    const fcpObserver = observeFCP();
    const longTaskObserver = observeLongTasks();

    // Get navigation timing
    const getNavigationTiming = () => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      if (navigation) {
        setMetrics((prev) => ({
          ...prev,
          ttfb: navigation.responseStart - navigation.requestStart,
          pageLoadTime: navigation.loadEventEnd - navigation.startTime,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
        }));
      }
    };

    // Get resource timing
    const getResourceTiming = () => {
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const totalTransfer = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const totalDecoded = resources.reduce((sum, r) => sum + (r.decodedBodySize || 0), 0);
      
      setMetrics((prev) => ({
        ...prev,
        resourceCount: resources.length,
        transferSize: totalTransfer,
        decodedBodySize: totalDecoded,
        networkRequests: resources.length,
      }));
    };

    // Get memory info
    const getMemoryInfo = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        setMetrics((prev) => ({
          ...prev,
          jsHeapSize: memory.jsHeapSizeLimit,
          usedJsHeapSize: memory.usedJSHeapSize,
          totalJsHeapSize: memory.totalJSHeapSize,
        }));
      }
    };

    // Initial measurements
    if (document.readyState === "complete") {
      getNavigationTiming();
      getResourceTiming();
      getMemoryInfo();
    } else {
      window.addEventListener("load", () => {
        setTimeout(() => {
          getNavigationTiming();
          getResourceTiming();
          getMemoryInfo();
        }, 0);
      });
    }

    // Start FPS measurement
    requestAnimationFrame(measureFPS);

    // Update memory periodically
    const memoryInterval = setInterval(getMemoryInfo, 5000);

    return () => {
      lcpObserver?.disconnect();
      fidObserver?.disconnect();
      clsObserver?.disconnect();
      fcpObserver?.disconnect();
      longTaskObserver?.disconnect();
      clearInterval(memoryInterval);
    };
  }, [enabled, measureFPS]);

  // Track render count
  useEffect(() => {
    renderCountRef.current++;
    setMetrics((prev) => ({ ...prev, renderCount: renderCountRef.current }));
  });

  const getMetricStatus = useCallback(
    (metric: keyof PerformanceThresholds, value: number | null): "good" | "needs-improvement" | "poor" | "unknown" => {
      if (value === null) return "unknown";
      const threshold = defaultThresholds[metric];
      if (value <= threshold.good) return "good";
      if (value <= threshold.needsImprovement) return "needs-improvement";
      return "poor";
    },
    []
  );

  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }, []);

  const formatMs = useCallback((ms: number | null): string => {
    if (ms === null) return "N/A";
    return `${ms.toFixed(0)}ms`;
  }, []);

  const getOverallScore = useCallback((): number => {
    let score = 100;
    
    if (metrics.lcp !== null) {
      if (metrics.lcp > defaultThresholds.lcp.needsImprovement) score -= 20;
      else if (metrics.lcp > defaultThresholds.lcp.good) score -= 10;
    }
    
    if (metrics.fid !== null) {
      if (metrics.fid > defaultThresholds.fid.needsImprovement) score -= 20;
      else if (metrics.fid > defaultThresholds.fid.good) score -= 10;
    }
    
    if (metrics.cls !== null) {
      if (metrics.cls > defaultThresholds.cls.needsImprovement) score -= 20;
      else if (metrics.cls > defaultThresholds.cls.good) score -= 10;
    }
    
    if (metrics.fps < 30) score -= 15;
    else if (metrics.fps < 50) score -= 5;
    
    if (metrics.longTasks > 5) score -= 10;
    else if (metrics.longTasks > 2) score -= 5;
    
    return Math.max(0, score);
  }, [metrics]);

  return {
    metrics,
    getMetricStatus,
    formatBytes,
    formatMs,
    getOverallScore,
    thresholds: defaultThresholds,
  };
}

export type { PerformanceMetrics, PerformanceThresholds };
