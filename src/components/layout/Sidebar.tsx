import { useState, useEffect } from "react";
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
  Crosshair,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string;
  adminOnly?: boolean;
  settingKey?: string;
}

const mainNavItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Video, label: "Videos", path: "/videos", settingKey: "nav_videos_visible" },
  { icon: Trophy, label: "Bonuses", path: "/bonuses", settingKey: "nav_bonuses_visible" },
  { icon: Newspaper, label: "News", path: "/news", settingKey: "nav_news_visible" },
  { icon: Gift, label: "Giveaways", path: "/giveaways", settingKey: "nav_giveaways_visible" },
  { icon: Users, label: "Streamers", path: "/streamers", settingKey: "nav_streamers_visible" },
  { icon: Twitch, label: "Stream", path: "/stream", settingKey: "nav_stream_visible" },
];

import { BarChart, Info } from "lucide-react";

const communityNavItems: NavItem[] = [
  { icon: Calendar, label: "Events", path: "/events", settingKey: "nav_events_visible" },
  { icon: Crosshair, label: "Bonus Hunt", path: "/bonus-hunt", settingKey: "nav_bonus_hunt_visible" },
  { icon: Target, label: "Guess The Win", path: "/bonus-hunt?tab=gtw", settingKey: "nav_gtw_visible" },
  { icon: BarChart, label: "Average X", path: "/bonus-hunt?tab=avgx", settingKey: "nav_gtw_visible" },
  { icon: Users, label: "Leaderboard", path: "/leaderboard", settingKey: "nav_leaderboard_visible" },
  { icon: BarChart, label: "Polls", path: "/polls", settingKey: "nav_polls_visible" },
  { icon: Info, label: "About", path: "/about", settingKey: "nav_about_visible" },
];

const adminNavItems: NavItem[] = [
  { icon: Shield, label: "Admin Panel", path: "/admin", adminOnly: true },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [hasActiveGiveaway, setHasActiveGiveaway] = useState(false);
  const [hasBonusHuntLive, setHasBonusHuntLive] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, isModerator, isWriter, signOut } = useAuth();
  const { settings } = useSiteSettings();

  // Fetch and subscribe to live status, giveaways, and bonus hunt
  useEffect(() => {
    const fetchStatuses = async () => {
      // Live status
      const { data: liveData } = await supabase.from("site_settings").select("value").eq("key", "is_live").maybeSingle();
      if (liveData) setIsLive(liveData.value === true || liveData.value === "true" || liveData.value === 1);
      
      // Active giveaways
      const now = new Date().toISOString();
      const { data: giveaways } = await supabase.from("giveaways").select("id").eq("status", "active").gte("end_date", now).limit(1);
      setHasActiveGiveaway((giveaways?.length || 0) > 0);
      
      // Live bonus hunt
      const { data: bonusHunts } = await supabase.from("bonus_hunts").select("id").eq("status", "live").limit(1);
      setHasBonusHuntLive((bonusHunts?.length || 0) > 0);
    };

    fetchStatuses();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('sidebar-statuses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (payload: any) => {
        if (payload.new?.key === 'is_live') {
          const val = payload.new.value;
          setIsLive(val === true || val === "true" || val === 1);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'giveaways' }, () => fetchStatuses())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bonus_hunts' }, () => fetchStatuses())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 80 },
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isNavItemVisible = (item: NavItem) => {
    if (!item.settingKey) return true;
    return settings[item.settingKey as keyof typeof settings] !== false;
  };

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    // Handle special deep-link navigation items like GTW and AvgX
    const currentTab = new URLSearchParams(location.search).get("tab");
    const itemUrl = new URL(item.path, "http://placeholder");
    const itemTab = itemUrl.searchParams.get("tab");
    const itemPathname = itemUrl.pathname;
    
    // Determine if this item is active
    let isActive = false;
    if (item.path === "/") {
      isActive = location.pathname === "/";
    } else if (itemTab) {
      // This is a deep-link with a tab param (GTW, AvgX)
      isActive = location.pathname === itemPathname && currentTab === itemTab;
    } else if (item.path === "/stream" || item.path === "/streamers") {
      isActive = location.pathname === item.path;
    } else if (item.path === "/bonus-hunt") {
      // Bonus Hunt is active only when on /bonus-hunt without a tab param
      isActive = location.pathname === "/bonus-hunt" && !currentTab;
    } else {
      isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
    }
    
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
              className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
          {!collapsed && (
            <span className="font-medium whitespace-nowrap overflow-hidden">
              {item.label}
            </span>
          )}
          {/* Dynamic LIVE badge for Giveaways */}
          {item.path === "/giveaways" && hasActiveGiveaway && !collapsed && (
            <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-destructive text-destructive-foreground rounded-full animate-pulse">LIVE</span>
          )}
          {/* Dynamic LIVE badge for Bonus Hunt */}
          {item.path === "/bonus-hunt" && hasBonusHuntLive && !collapsed && (
            <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-green-500 text-white rounded-full animate-pulse">LIVE</span>
          )}
        </motion.div>
      </NavLink>
    );
  };

  const visibleMainItems = mainNavItems.filter(isNavItemVisible);
  const visibleCommunityItems = communityNavItems.filter(isNavItemVisible);

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={collapsed ? "collapsed" : "expanded"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-50 flex flex-col"
    >
      {/* Logo */}
      <NavLink to="/" className="p-4 flex items-center gap-3 hover:opacity-80 transition-opacity">
        {settings.logo_url ? (
          <motion.img 
            src={settings.logo_url} 
            alt={settings.site_name} 
            className={`${collapsed ? "w-10 h-10 rounded-xl object-contain" : "h-12 w-auto max-w-[200px] object-contain"} flex-shrink-0`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-neon flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary-foreground">{settings.site_name.charAt(0)}</span>
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="font-space-grotesk font-bold text-lg text-foreground leading-tight">
                  {settings.site_name}
                </h1>
                <p className="text-xs text-muted-foreground">{settings.site_tagline}</p>
              </div>
            )}
          </>
        )}
      </NavLink>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        <div className="space-y-1">
          {visibleMainItems.map((item) => (
            <NavItemComponent key={item.path} item={item} />
          ))}
        </div>

        {/* Community Section */}
        {visibleCommunityItems.length > 0 && (
          <div className="pt-6">
            {!collapsed && (
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Community
              </p>
            )}
            <div className="space-y-1">
              {visibleCommunityItems.map((item) => (
                <NavItemComponent key={item.path} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Admin Section */}
        {(isModerator || isWriter) && (
          <div className="pt-6">
            {!collapsed && (
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Admin
              </p>
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
                  <NavLink to="/profile" className="flex items-center gap-3 p-2 bg-secondary/50 rounded-xl hover:bg-secondary/80 transition-colors">
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
                        {profile?.display_name || profile?.username || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.preferred_username || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {isAdmin ? "Admin" : isModerator ? "Moderator" : "Member"}
                      </p>
                    </div>
                  </NavLink>
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
                  <NavLink to="/profile">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-10 h-10 rounded-lg object-cover hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors cursor-pointer">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </NavLink>
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
                    Login / Signup
                  </Button>
                </>
              ) : (
                <Button variant="glow" size="icon" onClick={() => navigate("/auth")}>
                  <LogIn className="w-4 h-4" />
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
