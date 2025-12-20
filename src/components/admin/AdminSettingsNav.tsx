import { Link, useLocation } from "react-router-dom";
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
  ChevronRight,
  Video,
  Mail,
  UserCog
} from "lucide-react";
import { cn } from "@/lib/utils";

const settingsSubcategories = [
  { path: "/admin/settings", label: "Live & Links", icon: Tv, exact: true },
  { path: "/admin/settings/branding", label: "Branding", icon: Palette },
  { path: "/admin/settings/navigation", label: "Navigation", icon: Navigation },
  { path: "/admin/settings/video-categories", label: "Video Categories", icon: Video },
  { path: "/admin/settings/statistics", label: "Statistics", icon: BarChart3 },
  { path: "/admin/settings/about", label: "About Page", icon: FileText },
  { path: "/admin/settings/notifications", label: "Send Notifications", icon: Bell },
  { path: "/admin/settings/email-templates", label: "Email Templates", icon: Mail },
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
    <div className="flex flex-wrap gap-2 mb-6">
      {settingsSubcategories.map((item) => {
        const isActive = item.exact 
          ? location.pathname === item.path 
          : location.pathname.startsWith(item.path);
        const Icon = item.icon;
        
        return (
          <Link key={item.path} to={item.path}>
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}>
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
