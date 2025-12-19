import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLoadingStateProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AdminLoadingState({ 
  message = "Loading...", 
  className,
  size = "md"
}: AdminLoadingStateProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center py-16", className)}>
      <Loader2 className={cn("animate-spin text-primary mb-3", sizeClasses[size])} />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
