import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FilterChipsProps {
  filters: { label: string; value: string }[];
  onRemove: (value: string) => void;
  onClearAll?: () => void;
}

export function FilterChips({ filters, onRemove, onClearAll }: FilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Aktif filtreler:</span>
      {filters.map(f => (
        <Badge key={f.value} variant="secondary" className="gap-1 pl-2">
          {f.label}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1"
            onClick={() => onRemove(f.value)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {onClearAll && (
        <Button variant="link" size="sm" onClick={onClearAll}>
          Temizle
        </Button>
      )}
    </div>
  );
}