import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type RouteErrorBoundaryProps = {
  children: ReactNode;
};

type RouteErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Route render error", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-medium">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Loading problem</p>
            <h1 className="mt-3 font-heading text-3xl font-bold text-foreground">This page didn’t load correctly</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Refresh to pull the latest version, or retry the route without leaving the app.
            </p>
            {this.state.error?.message ? (
              <p className="mt-4 rounded-2xl bg-muted px-4 py-3 text-left text-xs text-muted-foreground">
                {this.state.error.message}
              </p>
            ) : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="hero" onClick={this.handleReload}>
                Reload page
              </Button>
              <Button variant="outline" onClick={this.handleRetry}>
                Try again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;