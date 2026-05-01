import { ReactNode } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LoadingWrapperProps {
  isLoading?: boolean;
  error?: Error | null;
  skeleton?: ReactNode;
  children: ReactNode;
  onRetry?: () => void;
  minHeight?: string;
}

export function LoadingWrapper({
  isLoading,
  error,
  skeleton,
  children,
  onRetry,
  minHeight = '200px',
}: LoadingWrapperProps) {
  if (isLoading) {
    if (skeleton) return <>{skeleton}</>;
    return (
      <div className="flex items-center justify-center" style={{ minHeight }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8" style={{ minHeight }}>
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Bir hata oluştu</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tekrar Dene
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

interface PageWrapperProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageWrapper({ title, description, actions, children }: PageWrapperProps) {
  return (
    <div className="container py-8">
      {(title || actions) && (
        <div className="flex items-center justify-between mb-6">
          <div>
            {title && <h1 className="text-3xl font-bold">{title}</h1>}
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

interface CardGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function CardGrid({ children, columns = 3, className }: CardGridProps) {
  return (
    <div className={cn(
      'grid gap-6',
      columns === 1 && 'grid-cols-1',
      columns === 2 && 'grid-cols-1 md:grid-cols-2',
      columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      className
    )}>
      {children}
    </div>
  );
}