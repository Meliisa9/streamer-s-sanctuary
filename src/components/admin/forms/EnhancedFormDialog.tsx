import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface EnhancedFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  submitText?: string;
  submitIcon?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showFooter?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function EnhancedFormDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  icon,
  children,
  onSubmit,
  isSubmitting = false,
  submitText = "Save",
  submitIcon,
  size = "lg",
  showFooter = true,
}: EnhancedFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "p-0 overflow-hidden border-border/50 bg-gradient-to-b from-card to-card/95 backdrop-blur-xl",
        sizeClasses[size],
        "max-h-[90vh]"
      )}>
        {/* Header with gradient */}
        <div className="relative px-6 pt-6 pb-4 border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-accent/5">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-3">
              {icon && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-2.5 rounded-xl bg-primary/10 border border-primary/20"
                >
                  {icon}
                </motion.div>
              )}
              <div>
                <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
          </DialogHeader>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-5">
          {onSubmit ? (
            <form onSubmit={onSubmit} className="space-y-5">
              {children}
              
              {showFooter && (
                <div className="flex items-center gap-3 pt-4 border-t border-border/50 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 gap-2"
                    variant="glow"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : submitIcon}
                    {submitText}
                  </Button>
                </div>
              )}
            </form>
          ) : (
            children
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Form Section Component
export function FormSection({ 
  title, 
  icon, 
  children,
  className 
}: { 
  title: string; 
  icon?: ReactNode; 
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {icon}
        <span>{title}</span>
      </div>
      <div className="space-y-4 pl-0.5">
        {children}
      </div>
    </div>
  );
}

// Form Field Component
export function FormField({
  label,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

// Form Row Component for side-by-side fields
export function FormRow({ 
  children, 
  cols = 2 
}: { 
  children: ReactNode; 
  cols?: 2 | 3 | 4 
}) {
  return (
    <div className={cn(
      "grid gap-4",
      cols === 2 && "grid-cols-1 md:grid-cols-2",
      cols === 3 && "grid-cols-1 md:grid-cols-3",
      cols === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
    )}>
      {children}
    </div>
  );
}

// Toggle Option Component
export function ToggleOption({
  checked,
  onChange,
  icon,
  label,
  description,
  color = "primary",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: ReactNode;
  label: string;
  description?: string;
  color?: "primary" | "green" | "amber" | "red" | "purple";
}) {
  const colorClasses = {
    primary: checked ? "bg-primary/10 border-primary/30 shadow-primary/10" : "",
    green: checked ? "bg-green-500/10 border-green-500/30 shadow-green-500/10" : "",
    amber: checked ? "bg-amber-500/10 border-amber-500/30 shadow-amber-500/10" : "",
    red: checked ? "bg-red-500/10 border-red-500/30 shadow-red-500/10" : "",
    purple: checked ? "bg-purple-500/10 border-purple-500/30 shadow-purple-500/10" : "",
  };

  return (
    <div
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
        checked 
          ? cn(colorClasses[color], "shadow-lg") 
          : "bg-secondary/50 border-transparent hover:border-border"
      )}
    >
      {icon && (
        <div className={cn(
          "p-2 rounded-lg",
          checked ? "bg-white/10" : "bg-secondary"
        )}>
          {icon}
        </div>
      )}
      <div className="flex-1">
        <p className="font-medium text-sm">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className={cn(
        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
        checked 
          ? "border-primary bg-primary" 
          : "border-muted-foreground"
      )}>
        {checked && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
    </div>
  );
}
