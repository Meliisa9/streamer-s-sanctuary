import { useState, useEffect } from "react";
import { Shield, Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface AdminSidebarLogoProps {
  collapsed?: boolean;
}

export function AdminSidebarLogo({ collapsed = false }: AdminSidebarLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [siteName, setSiteName] = useState("Admin Panel");
  const [tagline, setTagline] = useState("Management Console");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["site_logo_url", "site_name", "site_tagline"]);

      data?.forEach((row) => {
        if (row.key === "site_logo_url" && row.value) {
          setLogoUrl(typeof row.value === "string" ? row.value : null);
        }
        if (row.key === "site_name" && row.value) {
          const val = typeof row.value === "string" ? row.value.replace(/^"|"$/g, '') : row.value;
          setSiteName(val as string);
        }
        if (row.key === "site_tagline" && row.value) {
          const val = typeof row.value === "string" ? row.value.replace(/^"|"$/g, '') : row.value;
          setTagline(val as string);
        }
      });
    } catch (error) {
      console.error("Error fetching branding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary animate-pulse" />
        {!collapsed && <div className="w-24 h-8 rounded bg-secondary animate-pulse" />}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3"
    >
      {logoUrl ? (
        <div className="relative flex-shrink-0">
          <img 
            src={logoUrl} 
            alt={siteName}
            className="w-10 h-10 rounded-xl object-contain bg-secondary/50"
            style={{ maxWidth: "40px", maxHeight: "40px" }}
          />
        </div>
      ) : (
        <div className="p-2 rounded-xl bg-primary/10 flex-shrink-0">
          <Shield className="w-6 h-6 text-primary" />
        </div>
      )}
      
      {!collapsed && (
        <div className="min-w-0">
          <h2 className="font-bold text-lg leading-tight truncate">Admin Panel</h2>
        </div>
      )}
    </motion.div>
  );
}
