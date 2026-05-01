import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  backUrl?: string;
  className?: string;
}

export function PageHeader({ title, description, actions, backUrl, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      {backUrl && (
        <Link 
          to={backUrl} 
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1"
        >
          ← Geri
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

interface SectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function Section({ title, description, children, actions, className }: SectionProps) {
  return (
    <section className={cn('mb-12', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-6">
          <div>
            {title && <h2 className="text-2xl font-bold">{title}</h2>}
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

interface GridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: number;
  empty?: ReactNode;
}

export function Grid<T>({ items, renderItem, keyExtractor, columns = 3, gap = 6, empty }: GridProps<T>) {
  if (items.length === 0 && empty) return <>{empty}</>;

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div className={cn('grid gap-6', gridCols[columns])}>
      {items.map((item, index) => (
        <div key={keyExtractor(item)}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  gap?: number;
  empty?: ReactNode;
}

export function List<T>({ items, renderItem, keyExtractor, gap = 3, empty }: ListProps<T>) {
  if (items.length === 0 && empty) return <>{empty}</>;

  return (
    <div className={cn('space-y-3', gap === 3 ? '' : `gap-${gap}`)}>
      {items.map((item, index) => (
        <div key={keyExtractor(item)}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}