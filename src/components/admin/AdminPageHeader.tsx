import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  breadcrumb?: string[];
}

export function AdminPageHeader({ 
  title, 
  description, 
  icon: Icon, 
  actions,
  breadcrumb 
}: AdminPageHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
    >
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span>/</span>}
                <span className={i === breadcrumb.length - 1 ? "text-foreground" : ""}>{item}</span>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-xl bg-primary/10">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </motion.div>
  );
}
