import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, LogIn, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export function MaintenanceScreen({
  message,
  allowLogin = true,
}: {
  message: string;
  allowLogin?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12">
      <Card className="w-full max-w-lg p-8 md:p-10 border-border/60 bg-card/80 backdrop-blur-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
          We're Under Maintenance
        </h1>
        
        <p className="text-muted-foreground leading-relaxed mb-6">
          {message || "We're currently performing scheduled maintenance. Please check back soon."}
        </p>

        {allowLogin && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-3 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Admin & Moderator access only
            </p>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/auth?admin=true">
                <LogIn className="w-4 h-4" />
                Staff Login
              </Link>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
