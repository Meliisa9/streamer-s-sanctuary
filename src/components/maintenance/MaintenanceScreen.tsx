import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

export function MaintenanceScreen({
  message,
  allowLogin = true,
}: {
  message: string;
  allowLogin?: boolean;
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <Card className="w-full max-w-2xl p-8 md:p-10 border-border/60 bg-card/70 backdrop-blur">
        <div className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Maintenance Mode
              </h1>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {allowLogin && (
            <div className="shrink-0">
              <Button asChild variant="glow" className="gap-2">
                <Link to="/auth">
                  <LogIn className="w-4 h-4" />
                  Admin login
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 text-sm text-muted-foreground">
          Please check back soon.
        </div>
      </Card>
    </div>
  );
}
