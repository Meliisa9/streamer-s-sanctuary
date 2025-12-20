import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

// Map paths to readable labels
const pathLabels: Record<string, string> = {
  "admin": "Dashboard",
  "videos": "Videos",
  "analytics": "Analytics",
  "bonuses": "Casino Bonuses",
  "giveaways": "Giveaways",
  "news": "News & Articles",
  "events": "Events",
  "polls": "Polls",
  "streamers": "Streamers",
  "stream": "Live Stream",
  "legal": "Legal Pages",
  "users": "Users",
  "profile-sync": "Profile Sync",
  "settings": "Settings",
  "branding": "Branding",
  "navigation": "Navigation",
  "statistics": "Statistics",
  "permissions": "Permissions",
  "about": "About",
  "notifications": "Send Notifications",
  "bans": "User Bans",
  "scheduled": "Scheduled Posts",
  "moderation": "Moderation Queue",
  "bulk-actions": "Bulk Actions",
  "auth-health": "Auth Health",
  "video-categories": "Video Categories",
  "email-templates": "Email Templates",
  "roles": "Roles & Permissions",
  "webhooks": "Webhooks",
  "bonus-hunt": "Bonus Hunt",
  "audit": "Audit Log",
  "activity": "Activity Log",
};

interface Breadcrumb {
  label: string;
  path: string;
  isLast: boolean;
}

export function AdminBreadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  
  // Build breadcrumb items
  const breadcrumbs: Breadcrumb[] = [];
  let currentPath = "";
  
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    
    breadcrumbs.push({
      label,
      path: currentPath,
      isLast: index === pathSegments.length - 1,
    });
  });

  // Don't show breadcrumbs on dashboard (root admin page)
  if (pathSegments.length <= 1 && pathSegments[0] === "admin") {
    return null;
  }

  return (
    <nav 
      aria-label="Breadcrumb" 
      className="flex items-center gap-1.5 text-sm mb-6"
    >
      <Link 
        to="/admin"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="w-4 h-4" />
        <span className="sr-only">Dashboard</span>
      </Link>
      
      {breadcrumbs.slice(1).map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground">
              {crumb.label}
            </span>
          ) : (
            <Link
              to={crumb.path}
              className={cn(
                "text-muted-foreground hover:text-foreground transition-colors",
                "hover:underline underline-offset-4"
              )}
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
