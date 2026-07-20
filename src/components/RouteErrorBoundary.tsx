import { Component, type ReactNode, type ErrorInfo } from 'react';
import { captureError } from '@/lib/logger';
import { RefreshCw, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function isChunkError(error: Error): boolean {
  const msg = error.message || '';
  return (
    msg.includes('Loading chunk') ||
    msg.includes('dynamically imported') ||
    msg.includes('text/html') ||
    msg.includes('MIME') ||
    msg.includes('script') ||
    msg.includes('import()')
  );
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureError(error, {
      tags: { boundary: this.props.label || 'route', feature: 'route-boundary' },
      extra: { componentStack: errorInfo.componentStack || '' },
    });
  }

  private handleReset = () => {
    if (this.state.error && isChunkError(this.state.error)) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const error = this.state.error;
      const isChunk = error ? isChunkError(error) : false;
      const showDetails = import.meta.env.DEV;

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border rounded-2xl p-8 text-center shadow-lg">
            {isChunk ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-foreground">Güncelleme Gerekli</h2>
                <p className="text-muted-foreground mb-2 text-sm leading-relaxed">
                  Uygulama güncellendi. Sayfayı yenileyerek yeni sürüme geçebilirsiniz.
                </p>
                <p className="text-xs text-muted-foreground/70 mb-6">
                  {this.props.label && `"${this.props.label}" yüklenirken sürüm uyuşmazlığı oluştu.`}
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  size="lg"
                  className="w-full rounded-xl h-12"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sayfayı Yenile
                </Button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-foreground">Bu sayfa yüklenemedi</h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  {this.props.label
                    ? `"${this.props.label}" bölümünde bir hata oluştu.`
                    : 'Sayfada beklenmeyen bir hata oluştu.'}
                </p>
                {showDetails && error && (
                  <pre className="text-xs bg-muted p-3 rounded text-left overflow-auto max-h-24 mb-4">
                    {error.message}
                  </pre>
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={() => window.location.reload()}
                    className="flex-1 rounded-xl"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tekrar Dene
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { window.location.href = '/'; }}
                    className="flex-1 rounded-xl"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Anasayfa
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
