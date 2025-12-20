import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Keep logs so local users can see the stack in DevTools
    console.error("App crashed:", error);
    console.error("Component stack:", errorInfo.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
          <section className="rounded-2xl border border-border/50 bg-card/40 p-6 shadow-sm">
            <header className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
              <p className="text-sm text-muted-foreground">
                The app hit an unexpected error and stopped rendering. You can reload the page to recover.
              </p>
            </header>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="default" onClick={this.handleReload}>
                Reload
              </Button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 rounded-xl border border-border/50 bg-background/30 p-4">
                <summary className="cursor-pointer text-sm font-medium">Error details (dev)</summary>
                <pre className="mt-3 overflow-auto text-xs text-muted-foreground">{this.state.error.stack || this.state.error.message}</pre>
              </details>
            )}
          </section>
        </main>
      </div>
    );
  }
}
