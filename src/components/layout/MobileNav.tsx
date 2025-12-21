import { useState, useMemo, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  LogIn,
  LogOut,
  Settings,
  Shield,
  User,
  Twitch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { SITE_NAV_ITEMS, type NavOrder, type NavSections, type NavSection } from "@/lib/navigation";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string;
  adminOnly?: boolean;
  settingKey?: string;
}

const adminNavItems: NavItem[] = [{ icon: Shield, label: "Admin Panel", path: "/admin", adminOnly: true }];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [hasActiveGiveaway, setHasActiveGiveaway] = useState(false);
  const [hasBonusHuntLive, setHasBonusHuntLive] = useState(false);
  const [navOrder, setNavOrder] = useState<NavOrder>({});
  const [navSections, setNavSections] = useState<NavSections>({});

  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, isModerator, isWriter, signOut } = useAuth();
  const { settings } = useSiteSettings();

  // Close sheet on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Fetch statuses
  useEffect(() => {
    const fetchStatuses = async () => {
      const { data: navRows } = await supabase
        .from("site_settings")
        .select("key,value")
        .in("key", ["nav_order", "nav_sections"]);

      navRows?.forEach((r) => {
        if (r.key === "nav_order" && r.value) setNavOrder(r.value as NavOrder);
        if (r.key === "nav_sections" && r.value) setNavSections(r.value as NavSections);
      });

      const now = new Date().toISOString();
      const { data: giveaways } = await supabase
        .from("giveaways")
        .select("id")
        .eq("status", "active")
        .gte("end_date", now)
        .limit(1);
      setHasActiveGiveaway((giveaways?.length || 0) > 0);

      const { data: bonusHunts } = await supabase
        .from("bonus_hunts")
        .select("id")
        .eq("status", "live")
        .limit(1);
      setHasBonusHuntLive((bonusHunts?.length || 0) > 0);
    };

    fetchStatuses();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setOpen(false);
  };

  const isNavItemVisible = (item: NavItem) => {
    if (!item.settingKey) return true;
    return settings[item.settingKey as keyof typeof settings] !== false;
  };

  const computedNav = useMemo(() => {
    const sectionFor = (key: string, fallback: NavSection): NavSection => {
      const v = navSections[key];
      return v === "main" || v === "community" ? v : fallback;
    };

    const base = SITE_NAV_ITEMS
      .map((def) => ({
        icon: def.icon,
        label: def.label,
        path: def.path,
        settingKey: def.settingKey,
        __key: def.key,
        __section: sectionFor(def.key, def.defaultSection),
      }))
      .sort((a, b) => (navOrder[a.__key] ?? 999) - (navOrder[b.__key] ?? 999));

    return {
      main: base.filter((i) => i.__section === "main"),
      community: base.filter((i) => i.__section === "community"),
    };
  }, [navOrder, navSections]);

  const visibleMainItems = computedNav.main.filter(isNavItemVisible);
  const visibleCommunityItems = computedNav.community.filter(isNavItemVisible);

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const currentTab = new URLSearchParams(location.search).get("tab");
    const itemUrl = new URL(item.path, "http://placeholder");
    const itemTab = itemUrl.searchParams.get("tab");
    const itemPathname = itemUrl.pathname;

    let isActive = false;
    if (item.path === "/") {
      isActive = location.pathname === "/";
    } else if (itemTab) {
      isActive = location.pathname === itemPathname && currentTab === itemTab;
    } else if (item.path === "/stream" || item.path === "/streamers") {
      isActive = location.pathname === item.path;
    } else if (item.path === "/bonus-hunt") {
      isActive = location.pathname === "/bonus-hunt" && !currentTab;
    } else {
      isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
    }

    const Icon = item.icon;

    return (
      <NavLink to={item.path} onClick={() => setOpen(false)}>
        <motion.div
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
            isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
          whileTap={{ scale: 0.98 }}
        >
          <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
          <span className="font-medium">{item.label}</span>

          {item.path === "/giveaways" && hasActiveGiveaway && (
            <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-destructive text-destructive-foreground rounded-full animate-pulse">
              LIVE
            </span>
          )}
          {item.path === "/bonus-hunt" && hasBonusHuntLive && (
            <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-green-500 text-white rounded-full animate-pulse">
              LIVE
            </span>
          )}
        </motion.div>
      </NavLink>
    );
  };

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2">
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.site_name || "Logo"}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <span className="font-space-grotesk font-bold text-lg">
              {settings.site_name || "Logo"}
            </span>
          )}
        </NavLink>

        {/* Menu Button */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 bg-background border-l border-border">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <NavLink to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                  {settings.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt={settings.site_name || "Logo"}
                      className="h-8 w-auto object-contain"
                    />
                  ) : (
                    <span className="font-space-grotesk font-bold text-lg">
                      {settings.site_name || "Logo"}
                    </span>
                  )}
                </NavLink>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <div className="space-y-1">
                  {visibleMainItems.map((item) => (
                    <NavItemComponent key={item.path} item={item} />
                  ))}
                </div>

                {visibleCommunityItems.length > 0 && (
                  <div className="pt-6">
                    <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Community
                    </p>
                    <div className="space-y-1">
                      {visibleCommunityItems.map((item) => (
                        <NavItemComponent key={item.path} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {(isModerator || isWriter) && (
                  <div className="pt-6">
                    <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Admin
                    </p>
                    <div className="space-y-1">
                      {adminNavItems.map((item) => (
                        <NavItemComponent key={item.path} item={item} />
                      ))}
                    </div>
                  </div>
                )}
              </nav>

              {/* User Section */}
              <div className="p-4 border-t border-border">
                {user ? (
                  <div className="space-y-3">
                    <NavLink 
                      to="/profile" 
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 p-2 bg-secondary/50 rounded-xl hover:bg-secondary/80 transition-colors"
                    >
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
                    </NavLink>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => { navigate("/profile"); setOpen(false); }}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={handleSignOut}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      variant="glow"
                      className="w-full gap-2"
                      onClick={() => { navigate("/auth"); setOpen(false); }}
                    >
                      <Twitch className="w-4 h-4" />
                      Login with Twitch
                    </Button>
                    <Button
                      variant="glass"
                      className="w-full gap-2"
                      onClick={() => { navigate("/auth"); setOpen(false); }}
                    >
                      <LogIn className="w-4 h-4" />
                      Login / Signup
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
