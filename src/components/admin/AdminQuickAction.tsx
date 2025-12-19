import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AdminQuickActionProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  href: string;
  color?: string;
}

export function AdminQuickAction({ icon: Icon, label, description, href, color }: AdminQuickActionProps) {
  return (
    <Link 
      to={href}
      className="group flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-all duration-200 hover:scale-[1.02]"
    >
      <div className={cn(
        "p-2.5 rounded-lg transition-colors",
        color || "bg-primary/10 text-primary group-hover:bg-primary/20"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-sm">{label}</p>
        {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
      </div>
    </Link>
  );
}
