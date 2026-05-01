import { SearchX, FileQuestion, Inbox, Frown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: 'search' | 'file' | 'inbox' | 'frown' | 'warning';
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

const icons = {
  search: SearchX,
  file: FileQuestion,
  inbox: Inbox,
  frown: Frown,
  warning: AlertTriangle,
};

export function EmptyState({ icon = 'inbox', title, description, action }: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-muted-foreground max-w-sm mb-6">{description}</p>}
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}