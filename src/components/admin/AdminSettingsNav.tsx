import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const settingsSubcategories = [
  { path: "/admin/settings", label: "Live & Links", exact: true },
  { path: "/admin/settings/branding", label: "Branding" },
  { path: "/admin/settings/navigation", label: "Navigation" },
  { path: "/admin/settings/statistics", label: "Statistics" },
  { path: "/admin/settings/permissions", label: "Permissions" },
  { path: "/admin/settings/about", label: "About Page" },
];

export function AdminSettingsNav() {
  const { isAdmin } = useAuth();
  const location = useLocation();

  if (!isAdmin) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Settings Categories</h3>
      <div className="flex flex-wrap gap-2">
        {settingsSubcategories.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.path 
            : location.pathname.startsWith(item.path);
          
          return (
            <Link key={item.path} to={item.path}>
              <Button 
                variant={isActive ? "default" : "outline"} 
                size="sm"
              >
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
