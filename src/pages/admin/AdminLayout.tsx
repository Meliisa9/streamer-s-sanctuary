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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Video, label: "Videos", path: "/admin/videos" },
  { icon: Newspaper, label: "News", path: "/admin/news" },
  { icon: Trophy, label: "Bonuses", path: "/admin/bonuses" },
  { icon: Gift, label: "Giveaways", path: "/admin/giveaways" },
  { icon: Calendar, label: "Events", path: "/admin/events" },
  { icon: Target, label: "GTW Sessions", path: "/admin/gtw" },
  { icon: BarChart, label: "Polls", path: "/admin/polls" },
  { icon: Users, label: "Streamers", path: "/admin/streamers" },
  { icon: Video, label: "Stream", path: "/admin/stream" },
  { icon: FileText, label: "Legal Pages", path: "/admin/legal" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: FileText, label: "Audit Log", path: "/admin/audit" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

export default function AdminLayout() {
  const { user, isAdmin, isModerator, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && (!user || !isModerator)) {
      navigate("/auth");
    }
  }, [user, isModerator, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isModerator) {
    return null;
  }

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
            Manage your site content, users, and settings
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
            {adminNavItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/admin" && location.pathname.startsWith(item.path));
              const Icon = item.icon;

              // Hide audit log for non-admins
              if (item.path === "/admin/audit" && !isAdmin) {
                return null;
              }

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
