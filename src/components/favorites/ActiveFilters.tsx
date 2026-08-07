import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ActiveFiltersProps {
  searchQuery: string;
  selectedCategoryName?: string | undefined;
  onClear: () => void;
}

export function ActiveFilters({ searchQuery, selectedCategoryName, onClear }: ActiveFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 mb-6 text-sm text-muted-foreground flex-wrap"
    >
      <span>Filtreler:</span>
      {selectedCategoryName && (
        <Badge variant="secondary" className="rounded-full">
          {selectedCategoryName}
        </Badge>
      )}
      {searchQuery && (
        <Badge variant="secondary" className="rounded-full">
          "{searchQuery}"
        </Badge>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="text-xs rounded-full"
      >
        Temizle
      </Button>
    </motion.div>
  );
}
