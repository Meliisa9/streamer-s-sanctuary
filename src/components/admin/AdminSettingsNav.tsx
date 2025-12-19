import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Tv, 
  Palette, 
  Navigation, 
  BarChart3, 
  Shield, 
  FileText, 
  Bell, 
  Ban, 
  Clock, 
  Flag, 
  Zap,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const settingsSubcategories = [
  { path: "/admin/settings", label: "Live & Links", icon: Tv, exact: true },
  { path: "/admin/settings/branding", label: "Branding", icon: Palette },
  { path: "/admin/settings/navigation", label: "Navigation", icon: Navigation },
  { path: "/admin/settings/statistics", label: "Statistics", icon: BarChart3 },
  { path: "/admin/settings/permissions", label: "Permissions", icon: Shield },
  { path: "/admin/settings/about", label: "About Page", icon: FileText },
  { path: "/admin/settings/notifications", label: "Send Notifications", icon: Bell },
  { path: "/admin/settings/bans", label: "User Bans", icon: Ban },
  { path: "/admin/settings/scheduled", label: "Scheduled Posts", icon: Clock },
  { path: "/admin/settings/moderation", label: "Moderation Queue", icon: Flag },
  { path: "/admin/settings/bulk-actions", label: "Bulk Actions", icon: Zap },
];

export function AdminSettingsNav() {
  const { isAdmin } = useAuth();
  const location = useLocation();

  if (!isAdmin) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Navigation className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold">Settings Categories</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {settingsSubcategories.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.path 
            : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          
          return (
            <Link key={item.path} to={item.path}>
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
