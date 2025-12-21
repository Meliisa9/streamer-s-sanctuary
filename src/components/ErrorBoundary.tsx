import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId: string;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, errorId: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for support reference
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error with context (sanitized for security)
    const sanitizedError = {
      message: error.message,
      name: error.name,
      errorId: this.state.errorId,
      componentStack: errorInfo.componentStack?.slice(0, 500), // Truncate long stacks
      timestamp: new Date().toISOString(),
      url: window.location.pathname, // Don't include query params
    };
    
    console.error("[ErrorBoundary] Application error:", sanitizedError);
    
    // In production, you might send this to an error tracking service
    // Example: sendToErrorTracking(sanitizedError);
  }

  private handleReload = () => {
    // Clear any potentially corrupted state before reloading
    sessionStorage.removeItem('error_recovery_attempted');
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    // Allow custom fallback UI
    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
          <section className="rounded-2xl border border-border/50 bg-card/40 p-8 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <header className="flex-1 space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
                <p className="text-sm text-muted-foreground">
                  The application encountered an unexpected error. This has been logged and we'll look into it.
                </p>
              </header>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="default" onClick={this.handleRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={this.handleReload} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
              <Button variant="ghost" onClick={this.handleGoHome} className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>

            {/* Error reference for support */}
            <div className="mt-6 rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                Error Reference: <code className="font-mono text-foreground">{this.state.errorId}</code>
              </p>
            </div>

            {/* Development-only error details */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 rounded-xl border border-border/50 bg-background/30 p-4">
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <Bug className="h-4 w-4" />
                  Error details (development only)
                </summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Error Message:</p>
                    <pre className="mt-1 overflow-auto rounded bg-muted/50 p-2 text-xs">
                      {this.state.error.message}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Stack Trace:</p>
                      <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted/50 p-2 text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Component Stack:</p>
                      <pre className="mt-1 max-h-32 overflow-auto rounded bg-muted/50 p-2 text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </section>
        </main>
      </div>
    );
  }
}

/**
 * Hook to programmatically trigger error boundary
 */
export function useErrorHandler() {
  const [, setError] = React.useState<Error>();
  
  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}
