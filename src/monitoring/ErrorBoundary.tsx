import { Component, ReactNode, ErrorInfo } from 'react';
import { monitoringStore } from './monitoring-store';
import { AlertTriangle, RefreshCcw, Copy, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
  stackTrace: string;
  showDetails: boolean;
}

/**
 * ErrorBoundary — catches render-time exceptions and logs them to the monitoring store.
 * Displays a friendly fallback UI with the ability to copy the stack trace.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '', stackTrace: '', showDetails: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message, stackTrace: error.stack || '', showDetails: false };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    monitoringStore.addError(error.message, error.stack, info.componentStack ?? undefined);
    console.error('[ErrorBoundary]', error, info);
  }

  handleCopy = () => {
    const text = `Error: ${this.state.message}\n\nStack:\n${this.state.stackTrace}`;
    navigator.clipboard.writeText(text);
  };

  handleRetry = () => {
    // A full reload is safer for fatal React errors (like invalid hook calls) than just resetting state
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  }

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background/95 p-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center border-b p-8 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-bold tracking-tight">Something went wrong</h1>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  An unexpected error caused the application to crash. We've logged the issue.
                </p>
              </div>
            </div>

            <div className="p-6 bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Error Details</h3>
                <button 
                  onClick={this.toggleDetails}
                  className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {this.state.showDetails ? 'Hide' : 'Show'} Trace
                  {this.state.showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>
              
              <div className="rounded-lg bg-background border p-4 font-mono text-sm shadow-sm overflow-x-auto">
                <p className="text-destructive font-semibold break-words">{this.state.message}</p>
                {this.state.showDetails && (
                  <pre className="mt-4 text-xs text-muted-foreground whitespace-pre-wrap">
                    {this.state.stackTrace}
                  </pre>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 p-6 border-t bg-card">
              <button
                onClick={this.handleCopy}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
              <button
                onClick={this.handleHome}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Home className="h-4 w-4" />
                Home
              </button>
              <button
                onClick={this.handleRetry}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <RefreshCcw className="h-4 w-4" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
