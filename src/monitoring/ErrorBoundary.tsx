import { Component, ReactNode, ErrorInfo } from 'react';
import { monitoringStore } from './monitoring-store';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * ErrorBoundary — catches render-time exceptions and logs them to the monitoring store.
 * Displays a friendly fallback UI with the ability to copy the stack trace.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    monitoringStore.addError(error.message, error.stack, info.componentStack ?? undefined);
    console.error('[ErrorBoundary]', error, info);
  }

  handleCopy = () => {
    const snapshot = monitoringStore.getSnapshot();
    const latest = snapshot.errors[0];
    if (latest) {
      navigator.clipboard.writeText(
        `Error: ${latest.message}\n\nStack:\n${latest.stack ?? 'N/A'}\n\nComponent Stack:\n${latest.componentStack ?? 'N/A'}`
      );
    }
  };

  handleRetry = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-3xl">
            🚨
          </div>
          <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
          <p className="max-w-md text-sm text-muted-foreground">{this.state.message}</p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Try Again
            </button>
            <button
              onClick={this.handleCopy}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Copy Error
            </button>
          </div>
          {import.meta.env.DEV && (
            <p className="mt-2 font-mono text-xs text-muted-foreground/60">
              Open the Monitoring Panel (Ctrl+Shift+M) to see full details
            </p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
