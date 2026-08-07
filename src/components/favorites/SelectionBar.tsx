import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SelectionBarProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onRemoveSelected: () => void;
}

export function SelectionBar({
  selectedCount,
  totalCount,
  allSelected,
  onSelectAll,
  onRemoveSelected,
}: SelectionBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-2xl border border-border/50"
    >
      <Button variant="outline" size="sm" className="rounded-xl" onClick={onSelectAll}>
        {allSelected ? 'Seçimi Kaldır' : 'Tümünü Seç'}
      </Button>
      <span className="text-sm text-muted-foreground font-medium">
        {selectedCount} öğe seçildi
      </span>
      {selectedCount > 0 && (
        <Button
          variant="destructive"
          size="sm"
          className="rounded-xl"
          onClick={onRemoveSelected}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Seçilenleri Sil
        </Button>
      )}
    </motion.div>
  );
}
