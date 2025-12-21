import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { UserNotifications } from "@/components/UserNotifications";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useWhiteLabelSettings } from "@/hooks/useWhiteLabelSettings";
import { useAuth } from "@/contexts/AuthContext";
import { MaintenanceScreen } from "@/components/maintenance/MaintenanceScreen";

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { settings, isLoading: isWhiteLabelLoading } = useWhiteLabelSettings();
  const { isModerator, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    const checkSidebarState = () => {
      const sidebar = document.querySelector("aside");
      if (sidebar) {
        setSidebarCollapsed(sidebar.clientWidth < 100);
      }
    };

    const observer = new ResizeObserver(checkSidebarState);
    const sidebar = document.querySelector("aside");
    if (sidebar) {
      observer.observe(sidebar);
    }

    return () => observer.disconnect();
  }, []);

  const isMaintenanceOn = !!settings.maintenance_mode;
  const isAuthRoute = location.pathname.startsWith("/auth");

  if (!isWhiteLabelLoading && !isAuthLoading && isMaintenanceOn && !isModerator && !isAuthRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <MaintenanceScreen message={settings.maintenance_message} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <motion.main
        className="flex-1 flex flex-col min-h-screen"
        animate={{
          marginLeft: sidebarCollapsed ? 80 : 260,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Top bar with search and notifications */}
        <div className="flex items-center gap-4 p-4">
          <div className="flex-1 flex justify-center">
            <GlobalSearch />
          </div>
          <UserNotifications />
        </div>
        <div className="flex-1 px-6">
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </div>
        <Footer />
      </motion.main>
    </div>
  );
}
