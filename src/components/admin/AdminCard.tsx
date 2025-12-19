import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
  noPadding?: boolean;
  delay?: number;
}

export function AdminCard({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  className,
  headerActions,
  noPadding,
  delay = 0
}: AdminCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        "rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden",
        className
      )}
    >
      {(title || headerActions) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="w-4 h-4 text-primary" />
              </div>
            )}
            <div>
              {title && <h3 className="font-semibold">{title}</h3>}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}
      <div className={cn(!noPadding && "p-6")}>
        {children}
      </div>
    </motion.div>
  );
}
