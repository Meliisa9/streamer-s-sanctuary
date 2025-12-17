import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { LiveNotifications } from "@/components/LiveNotifications";

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        {/* Top bar with notifications */}
        <div className="flex justify-end p-4">
          <LiveNotifications />
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
