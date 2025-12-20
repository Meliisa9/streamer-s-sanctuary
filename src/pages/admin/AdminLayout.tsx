import { useEffect, useState } from "react";
import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  BarChart3,
  RefreshCw,
  Tv,
  Activity,
  ChevronDown,
  ChevronRight,
  Search,
  Menu,
  X,
  Bell,
  Crosshair,
  Home,
  Zap,
  Server,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { AdminCodeGate } from "@/components/admin/AdminCodeGate";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavSection {
  title: string;
  items: NavItem[];
  roles: string[];
}

interface NavItem {
  icon: any;
  label: string;
  path: string;
  roles: string[];
  badge?: number;
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    roles: ["admin", "moderator", "writer"],
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin", roles: ["admin", "moderator"] },
      { icon: BarChart3, label: "Analytics", path: "/admin/analytics", roles: ["admin"] },
      { icon: Activity, label: "Activity Log", path: "/admin/activity", roles: ["admin"] },
    ],
  },
  {
    title: "Content",
    roles: ["admin", "moderator", "writer"],
    items: [
      { icon: Video, label: "Videos", path: "/admin/videos", roles: ["admin", "moderator"] },
      { icon: Newspaper, label: "News", path: "/admin/news", roles: ["admin", "moderator", "writer"] },
      { icon: Trophy, label: "Bonuses", path: "/admin/bonuses", roles: ["admin", "moderator"] },
      { icon: Gift, label: "Giveaways", path: "/admin/giveaways", roles: ["admin", "moderator"] },
      { icon: Calendar, label: "Events", path: "/admin/events", roles: ["admin", "moderator"] },
    ],
  },
  {
    title: "Gaming",
    roles: ["admin", "moderator"],
    items: [
      { icon: Crosshair, label: "Bonus Hunt", path: "/admin/bonus-hunt", roles: ["admin", "moderator"] },
      { icon: BarChart3, label: "Polls", path: "/admin/polls", roles: ["admin", "moderator"] },
    ],
  },
  {
    title: "Community",
    roles: ["admin", "moderator"],
    items: [
      { icon: Users, label: "Streamers", path: "/admin/streamers", roles: ["admin", "moderator"] },
      { icon: Tv, label: "Stream", path: "/admin/stream", roles: ["admin", "moderator"] },
      { icon: FileText, label: "Legal Pages", path: "/admin/legal", roles: ["admin", "moderator"] },
    ],
  },
  {
    title: "Administration",
    roles: ["admin"],
    items: [
      { icon: Users, label: "Users", path: "/admin/users", roles: ["admin"] },
      { icon: RefreshCw, label: "Profile Sync", path: "/admin/profile-sync", roles: ["admin"] },
      { icon: Shield, label: "Roles & Permissions", path: "/admin/settings/roles", roles: ["admin"] },
      { icon: FileText, label: "Audit Log", path: "/admin/audit", roles: ["admin"] },
      { icon: Settings, label: "Settings", path: "/admin/settings", roles: ["admin"] },
    ],
  },
];

// Helper function to check if a nav item is active
function isNavItemActive(itemPath: string, currentPath: string): boolean {
  // Exact match for dashboard
  if (itemPath === "/admin") {
    return currentPath === "/admin";
  }
  
  // For streamers, only match exact path to avoid stream conflict
  if (itemPath === "/admin/streamers") {
    return currentPath === "/admin/streamers";
  }
  
  // For stream, only match exact path
  if (itemPath === "/admin/stream") {
    return currentPath === "/admin/stream";
  }
  
  // For settings, match exact /admin/settings or settings sub-pages except auth-health
  if (itemPath === "/admin/settings") {
    // Exclude auth-health which has its own nav state
    if (currentPath === "/admin/auth-health") return false;
    // Match /admin/settings exactly or any sub-path like /admin/settings/navigation
    return currentPath === "/admin/settings" || currentPath.startsWith("/admin/settings/");
  }
  
  // Standard prefix matching for other items
  return currentPath.startsWith(itemPath);
}

function AdminNavItem({ item, isActive, collapsed }: { item: NavItem; isActive: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  
  return (
    <NavLink to={item.path}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
          isActive
            ? "bg-primary/15 text-primary shadow-sm"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
        {!collapsed && (
          <>
            <span className="font-medium text-sm flex-1">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </div>
    </NavLink>
  );
}

function AdminNavSection({ 
  section, 
  isAdmin, 
  isModerator, 
  isWriter,
  location,
  collapsed,
  expandedSections,
  toggleSection
}: { 
  section: NavSection;
  isAdmin: boolean;
  isModerator: boolean;
  isWriter: boolean;
  location: any;
  collapsed: boolean;
  expandedSections: string[];
  toggleSection: (title: string) => void;
}) {
  const visibleItems = section.items.filter((item) => {
    if (isAdmin) return true;
    if (isModerator) return item.roles.includes("moderator");
    if (isWriter) return item.roles.includes("writer");
    return false;
  });

  if (visibleItems.length === 0) return null;

  const isExpanded = expandedSections.includes(section.title);
  const hasActiveItem = visibleItems.some((item) => isNavItemActive(item.path, location.pathname));

  if (collapsed) {
    return (
      <div className="space-y-1">
        {visibleItems.map((item) => {
          const isActive = isNavItemActive(item.path, location.pathname);
          return <AdminNavItem key={item.path} item={item} isActive={isActive} collapsed={collapsed} />;
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => toggleSection(section.title)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>{section.title}</span>
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pl-1">
              {visibleItems.map((item) => {
                const isActive = isNavItemActive(item.path, location.pathname);
                return <AdminNavItem key={item.path} item={item} isActive={isActive} collapsed={collapsed} />;
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminSidebar({ 
  isAdmin, 
  isModerator, 
  isWriter, 
  location,
  collapsed,
  setCollapsed
}: { 
  isAdmin: boolean;
  isModerator: boolean;
  isWriter: boolean;
  location: any;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}) {
  const [expandedSections, setExpandedSections] = useState<string[]>(
    navSections.map(s => s.title)
  );
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSection = (title: string) => {
    setExpandedSections(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title) 
        : [...prev, title]
    );
  };

  const filteredSections = searchQuery 
    ? navSections.map(section => ({
        ...section,
        items: section.items.filter(item => 
          item.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(section => section.items.length > 0)
    : navSections;

  return (
    <div className={cn(
      "flex flex-col h-full",
      collapsed ? "w-[72px]" : "w-[260px]"
    )}>
      {/* Search */}
      {!collapsed && (
        <div className="p-3 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary/50 border-border/50 h-9 text-sm"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {filteredSections.map((section) => (
          <AdminNavSection
            key={section.title}
            section={section}
            isAdmin={isAdmin}
            isModerator={isModerator}
            isWriter={isWriter}
            location={location}
            collapsed={collapsed}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
        ))}
      </div>

      {/* System Status */}
      {!collapsed && (
        <div className="p-3 border-t border-border/50">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-500">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">System Operational</span>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 rotate-90" />}
        </Button>
      </div>
    </div>
  );
}

function AdminLayoutContent() {
  const { user, profile, isAdmin, isModerator, isWriter, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const canAccessAdmin = isAdmin || isModerator || isWriter;

  useEffect(() => {
    if (!isLoading && (!user || !canAccessAdmin)) {
      navigate("/auth");
      return;
    }

    if (!isLoading && user && isWriter && !isAdmin && !isModerator) {
      if (location.pathname === "/admin") {
        navigate("/admin/news");
      }
    }
  }, [user, canAccessAdmin, isLoading, navigate, isWriter, isAdmin, isModerator, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-3 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="flex items-center gap-3 p-4 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold">Admin Panel</h2>
                    <p className="text-xs text-muted-foreground">Management Console</p>
                  </div>
                </div>
                <AdminSidebar
                  isAdmin={isAdmin}
                  isModerator={isModerator}
                  isWriter={isWriter}
                  location={location}
                  collapsed={false}
                  setCollapsed={() => {}}
                />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-bold">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && <AdminNotifications />}
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={cn(
          "hidden lg:flex flex-col sticky top-0 h-screen border-r border-border/50 bg-card/30 backdrop-blur-sm transition-all duration-300",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}>
          {/* Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              {!collapsed && (
                <div>
                  <h2 className="font-bold text-lg">Admin Panel</h2>
                  <p className="text-xs text-muted-foreground">
                    {isWriter && !isModerator && !isAdmin ? "Writer Access" : "Management Console"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <AdminSidebar
            isAdmin={isAdmin}
            isModerator={isModerator}
            isWriter={isWriter}
            location={location}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Desktop Header */}
          <header className="hidden lg:flex items-center justify-between sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50 px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <Home className="w-5 h-5" />
              </Button>
              <div className="h-6 w-px bg-border" />
              <span className="text-sm text-muted-foreground">
                Welcome back, <span className="text-foreground font-medium">{profile?.display_name || profile?.username || user?.email?.split("@")[0]}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && <AdminNotifications />}
            </div>
          </header>

          {/* Page Content */}
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
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
