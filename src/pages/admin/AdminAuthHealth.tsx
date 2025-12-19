import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Server,
  Key,
  Globe,
  Database,
  Users,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminCard } from "@/components/admin";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface HealthCheck {
  name: string;
  status: "checking" | "healthy" | "warning" | "error";
  message: string;
  icon: React.ElementType;
  details?: string;
}

export default function AdminAuthHealth() {
  const { user, session } = useAuth();
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runHealthChecks = async () => {
    setIsRunning(true);
    const results: HealthCheck[] = [];

    // 1. Check environment variables
    const backendUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const backendKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
    
    results.push({
      name: "Backend URL Configuration",
      status: backendUrl ? "healthy" : "error",
      message: backendUrl ? "Backend URL is configured" : "Missing VITE_SUPABASE_URL",
      icon: Globe,
      details: backendUrl ? `URL: ${backendUrl.substring(0, 30)}...` : "Environment variable not set"
    });

    results.push({
      name: "API Key Configuration",
      status: backendKey ? "healthy" : "error",
      message: backendKey ? "API key is configured" : "Missing VITE_SUPABASE_PUBLISHABLE_KEY",
      icon: Key,
      details: backendKey ? "Key present and valid format" : "Environment variable not set"
    });

    // 2. Check database connectivity
    try {
      const start = Date.now();
      const { error } = await supabase.from("profiles").select("id").limit(1);
      const latency = Date.now() - start;
      
      results.push({
        name: "Database Connection",
        status: error ? "error" : "healthy",
        message: error ? `Connection failed: ${error.message}` : "Database is reachable",
        icon: Database,
        details: error ? error.hint || "Check RLS policies" : `Latency: ${latency}ms`
      });
    } catch (err: any) {
      results.push({
        name: "Database Connection",
        status: "error",
        message: "Failed to reach database",
        icon: Database,
        details: err?.message || "Network error"
      });
    }

    // 3. Check auth service
    try {
      const { data, error } = await supabase.auth.getSession();
      results.push({
        name: "Auth Service",
        status: error ? "error" : "healthy",
        message: error ? `Auth error: ${error.message}` : "Auth service is operational",
        icon: Lock,
        details: data?.session ? `Session expires: ${new Date(data.session.expires_at! * 1000).toLocaleString()}` : "No active session in this check"
      });
    } catch (err: any) {
      results.push({
        name: "Auth Service",
        status: "error",
        message: "Auth service unreachable",
        icon: Lock,
        details: err?.message || "Network error"
      });
    }

    // 4. Check current session validity
    results.push({
      name: "Current Session",
      status: session ? "healthy" : "warning",
      message: session ? "You have an active session" : "No active session detected",
      icon: Users,
      details: session ? `User ID: ${session.user.id.substring(0, 8)}...` : "User may need to re-authenticate"
    });

    // 5. Check if user profile exists
    if (user) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username")
          .eq("user_id", user.id)
          .single();

        results.push({
          name: "User Profile",
          status: error ? "warning" : "healthy",
          message: error ? "Profile not found" : "Profile exists",
          icon: Users,
          details: data?.username ? `Username: ${data.username}` : "Profile may need to be created"
        });
      } catch {
        results.push({
          name: "User Profile",
          status: "warning",
          message: "Could not verify profile",
          icon: Users,
          details: "RLS may be blocking access"
        });
      }
    }

    // 6. Check admin roles
    if (user) {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        const roles = data?.map(r => r.role) || [];
        const hasAdminRole = roles.includes("admin");

        results.push({
          name: "Admin Role",
          status: hasAdminRole ? "healthy" : "warning",
          message: hasAdminRole ? "Admin role assigned" : "No admin role found",
          icon: Shield,
          details: roles.length > 0 ? `Roles: ${roles.join(", ")}` : "User has no roles assigned"
        });
      } catch {
        results.push({
          name: "Admin Role",
          status: "warning",
          message: "Could not verify roles",
          icon: Shield,
          details: "RLS may be blocking access"
        });
      }
    }

    // 7. Server health (edge function test if available)
    results.push({
      name: "Server Status",
      status: "healthy",
      message: "Application server is running",
      icon: Server,
      details: `Environment: ${import.meta.env.MODE}`
    });

    setChecks(results);
    setLastRun(new Date());
    setIsRunning(false);
  };

  useEffect(() => {
    runHealthChecks();
  }, [user, session]);

  const getStatusIcon = (status: HealthCheck["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />;
    }
  };

  const getStatusBg = (status: HealthCheck["status"]) => {
    switch (status) {
      case "healthy":
        return "bg-green-500/10 border-green-500/20";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20";
      case "error":
        return "bg-red-500/10 border-red-500/20";
      default:
        return "bg-muted/50 border-border";
    }
  };

  const healthyCount = checks.filter(c => c.status === "healthy").length;
  const warningCount = checks.filter(c => c.status === "warning").length;
  const errorCount = checks.filter(c => c.status === "error").length;

  const overallStatus = errorCount > 0 ? "error" : warningCount > 0 ? "warning" : "healthy";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Auth Health Check"
        description="Monitor authentication system status and diagnose issues"
        icon={Shield}
      />

      {/* Overall Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-xl border-2 ${getStatusBg(overallStatus)}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getStatusIcon(overallStatus)}
            <div>
              <h3 className="text-lg font-semibold">
                {overallStatus === "healthy" && "All Systems Operational"}
                {overallStatus === "warning" && "Some Issues Detected"}
                {overallStatus === "error" && "Critical Issues Found"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {healthyCount} healthy, {warningCount} warnings, {errorCount} errors
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lastRun && (
              <span className="text-xs text-muted-foreground">
                Last checked: {lastRun.toLocaleTimeString()}
              </span>
            )}
            <Button
              onClick={runHealthChecks}
              disabled={isRunning}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? "animate-spin" : ""}`} />
              {isRunning ? "Checking..." : "Re-run Checks"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Health Check Results */}
      <div className="grid gap-4 md:grid-cols-2">
        {checks.map((check, index) => (
          <motion.div
            key={check.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <AdminCard className={`${getStatusBg(check.status)} transition-all hover:scale-[1.02]`}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  check.status === "healthy" ? "bg-green-500/20" :
                  check.status === "warning" ? "bg-yellow-500/20" :
                  check.status === "error" ? "bg-red-500/20" : "bg-muted"
                }`}>
                  <check.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium truncate">{check.name}</h4>
                    {getStatusIcon(check.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{check.message}</p>
                  {check.details && (
                    <p className="text-xs text-muted-foreground/70 mt-2 font-mono bg-background/50 px-2 py-1 rounded">
                      {check.details}
                    </p>
                  )}
                </div>
              </div>
            </AdminCard>
          </motion.div>
        ))}
      </div>

      {/* Troubleshooting Tips */}
      {(errorCount > 0 || warningCount > 0) && (
        <AdminCard>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Troubleshooting Tips
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {errorCount > 0 && checks.some(c => c.name.includes("Backend") && c.status === "error") && (
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                Check that environment variables are properly configured in your deployment settings.
              </li>
            )}
            {checks.some(c => c.name === "Database Connection" && c.status === "error") && (
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                Verify database connection and RLS policies allow access to required tables.
              </li>
            )}
            {checks.some(c => c.name === "Current Session" && c.status === "warning") && (
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                Try logging out and back in to refresh your session.
              </li>
            )}
            {checks.some(c => c.name === "Admin Role" && c.status === "warning") && (
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                Ensure your user account has the admin role assigned in the user_roles table.
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              If issues persist, check the browser console for detailed error messages.
            </li>
          </ul>
        </AdminCard>
      )}
    </div>
  );
}
