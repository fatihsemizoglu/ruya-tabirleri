import { Component, type ReactNode, type ErrorInfo } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional label for Sentry reporting */
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Route-level error boundary. Catches rendering errors within a route group
 * and shows a recoverable UI instead of crashing the entire app.
 *
 * The top-level Sentry.ErrorBoundary in App.tsx remains as a last-resort fallback.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[RouteErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`, error, errorInfo);
    // Report to Sentry if available
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error, {
        contexts: { react: { componentStack: errorInfo.componentStack || '' } },
        tags: { boundary: this.props.label || 'route' },
      });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const message = this.state.error?.message || 'Bilinmeyen hata';
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border rounded-2xl p-8 text-center shadow-lg">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Bu sayfa yüklenemedi</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              {this.props.label
                ? `"${this.props.label}" bölümünde bir hata oluştu.`
                : 'Sayfada beklenmeyen bir hata oluştu.'}
            </p>
            <pre className="text-xs bg-muted p-3 rounded text-left overflow-auto max-h-24 mb-4">
              {message}
            </pre>
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 font-medium hover:bg-primary/90 transition-colors"
              >
                Tekrar Dene
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 bg-muted text-foreground rounded-lg py-2 font-medium hover:bg-muted/80 transition-colors"
              >
                Anasayfa
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
