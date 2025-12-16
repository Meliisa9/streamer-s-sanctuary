import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Video,
  Gift,
  Newspaper,
  Trophy,
  Calendar,
  Target,
  Users,
  ChevronLeft,
  ChevronRight,
  Twitch,
  LogIn,
  LogOut,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Video, label: "Videos", path: "/videos" },
  { icon: Trophy, label: "Bonuses", path: "/bonuses" },
  { icon: Newspaper, label: "News", path: "/news" },
  { icon: Gift, label: "Giveaways", path: "/giveaways", badge: "LIVE" },
];

const communityNavItems: NavItem[] = [
  { icon: Calendar, label: "Events", path: "/events" },
  { icon: Target, label: "Guess The Win", path: "/guess-the-win" },
  { icon: Users, label: "Leaderboard", path: "/leaderboard" },
];

const adminNavItems: NavItem[] = [
  { icon: Shield, label: "Admin Panel", path: "/admin", adminOnly: true },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, isModerator, signOut } = useAuth();

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 80 },
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.path || 
      (item.path !== "/" && location.pathname.startsWith(item.path));
    const Icon = item.icon;

    return (
      <NavLink to={item.path}>
        <motion.div
          className={cn(
            "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
            isActive
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          {isActive && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-medium whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {item.badge && !collapsed && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto px-2 py-0.5 text-xs font-bold bg-destructive text-destructive-foreground rounded-full animate-pulse"
            >
              {item.badge}
            </motion.span>
          )}
        </motion.div>
      </NavLink>
    );
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={collapsed ? "collapsed" : "expanded"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-50 flex flex-col"
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-neon flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-primary-foreground">S</span>
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="overflow-hidden"
            >
              <h1 className="font-space-grotesk font-bold text-lg text-foreground">
                StreamerX
              </h1>
              <p className="text-xs text-muted-foreground">Casino Streams</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavItemComponent key={item.path} item={item} />
          ))}
        </div>

        {/* Community Section */}
        <div className="pt-6">
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3"
            >
              Community
            </motion.p>
          )}
          <div className="space-y-1">
            {communityNavItems.map((item) => (
              <NavItemComponent key={item.path} item={item} />
            ))}
          </div>
        </div>

        {/* Admin Section */}
        {isModerator && (
          <div className="pt-6">
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3"
              >
                Admin
              </motion.p>
            )}
            <div className="space-y-1">
              {adminNavItems.map((item) => (
                <NavItemComponent key={item.path} item={item} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <AnimatePresence mode="wait">
          {user ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {!collapsed ? (
                <>
                  <div className="flex items-center gap-3 p-2 bg-secondary/50 rounded-xl">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {profile?.display_name || profile?.username || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {isAdmin ? "Admin" : isModerator ? "Moderator" : "Member"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate("/profile")}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {!collapsed ? (
                <>
                  <Button
                    variant="glow"
                    className="w-full gap-2"
                    onClick={() => navigate("/auth")}
                  >
                    <Twitch className="w-4 h-4" />
                    Login with Twitch
                  </Button>
                  <Button
                    variant="glass"
                    className="w-full gap-2"
                    onClick={() => navigate("/auth")}
                  >
                    <LogIn className="w-4 h-4" />
                    Discord Login
                  </Button>
                </>
              ) : (
                <Button variant="glow" size="icon" onClick={() => navigate("/auth")}>
                  <Twitch className="w-4 h-4" />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-secondary border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary hover:border-primary transition-all duration-300"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </motion.aside>
  );
}
