import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: string;
  href?: string;
}

interface AdminStatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4 | 5 | 6;
}

export function AdminStatsGrid({ stats, columns = 4 }: AdminStatsGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns])}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trend && stat.trend > 0 
          ? TrendingUp 
          : stat.trend && stat.trend < 0 
            ? TrendingDown 
            : Minus;
        const trendColor = stat.trend && stat.trend > 0 
          ? "text-green-500" 
          : stat.trend && stat.trend < 0 
            ? "text-red-500" 
            : "text-muted-foreground";
        
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 hover:bg-card/80 transition-all duration-300",
              stat.href && "cursor-pointer hover:border-primary/50"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl md:text-3xl font-bold tracking-tight">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
                {stat.trend !== undefined && (
                  <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
                    <TrendIcon className="w-3 h-3" />
                    <span>{Math.abs(stat.trend)}%</span>
                    {stat.trendLabel && <span className="text-muted-foreground">{stat.trendLabel}</span>}
                  </div>
                )}
              </div>
              <div className={cn(
                "p-2.5 rounded-xl",
                stat.color || "bg-primary/10 text-primary"
              )}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            
            {/* Decorative gradient */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl" />
          </motion.div>
        );
      })}
    </div>
  );
}
