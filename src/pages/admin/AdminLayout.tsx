import { useEffect } from "react";
import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Video,
  Newspaper,
  Trophy,
  Gift,
  Calendar,
  Target,
  Users,
  Settings,
  Shield,
  FileText,
  BarChart,
  BarChart3,
  RefreshCw,
  Tv,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { AdminCodeGate } from "@/components/admin/AdminCodeGate";

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin", roles: ["admin", "moderator"] },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics", roles: ["admin"] },
  { icon: Video, label: "Videos", path: "/admin/videos", roles: ["admin", "moderator"] },
  { icon: Newspaper, label: "News", path: "/admin/news", roles: ["admin", "moderator", "writer"] },
  { icon: Trophy, label: "Bonuses", path: "/admin/bonuses", roles: ["admin", "moderator"] },
  { icon: Gift, label: "Giveaways", path: "/admin/giveaways", roles: ["admin", "moderator"] },
  { icon: Calendar, label: "Events", path: "/admin/events", roles: ["admin", "moderator"] },
  { icon: Target, label: "GTW Sessions", path: "/admin/gtw", roles: ["admin", "moderator"] },
  { icon: BarChart, label: "Polls", path: "/admin/polls", roles: ["admin", "moderator"] },
  { icon: Users, label: "Streamers", path: "/admin/streamers", roles: ["admin", "moderator"] },
  { icon: Tv, label: "Stream", path: "/admin/stream", roles: ["admin", "moderator"] },
  { icon: FileText, label: "Legal Pages", path: "/admin/legal", roles: ["admin", "moderator"] },
  { icon: Users, label: "Users", path: "/admin/users", roles: ["admin"] },
  { icon: RefreshCw, label: "Profile Sync", path: "/admin/profile-sync", roles: ["admin"] },
  { icon: FileText, label: "Audit Log", path: "/admin/audit", roles: ["admin"] },
  { icon: Settings, label: "Settings", path: "/admin/settings", roles: ["admin"] },
];

function AdminLayoutContent() {
  const { user, isAdmin, isModerator, isWriter, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user can access admin panel (admin, moderator, or writer)
  const canAccessAdmin = isAdmin || isModerator || isWriter;

  useEffect(() => {
    if (!isLoading && (!user || !canAccessAdmin)) {
      navigate("/auth");
      return;
    }

    // If user is ONLY a writer (not admin or moderator), redirect to /admin/news
    if (!isLoading && user && isWriter && !isAdmin && !isModerator) {
      if (location.pathname === "/admin") {
        navigate("/admin/news");
      }
    }
  }, [user, canAccessAdmin, isLoading, navigate, isWriter, isAdmin, isModerator, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!canAccessAdmin) {
    return null;
  }

  // Filter nav items based on user roles
  const visibleNavItems = adminNavItems.filter((item) => {
    if (isAdmin) return true; // Admins see everything
    if (isModerator) return item.roles.includes("moderator");
    if (isWriter) return item.roles.includes("writer");
    return false;
  });

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Panel</h1>
          </div>
          <p className="text-muted-foreground">
            {isWriter && !isModerator && !isAdmin 
              ? "Manage news articles" 
              : "Manage your site content, users, and settings"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          {/* Admin Navigation */}
          <motion.nav
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-1"
          >
            {visibleNavItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/admin" && location.pathname.startsWith(item.path));
              const Icon = item.icon;

              return (
                <NavLink key={item.path} to={item.path}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </NavLink>
              );
            })}
          </motion.nav>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminCodeGate>
      <AdminLayoutContent />
    </AdminCodeGate>
  );
}
