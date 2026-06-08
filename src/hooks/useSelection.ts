import { useState } from 'react';

export function useSelection<T extends { id: string }>(items: T[] | undefined) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (!items) return;
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  const isSelected = (id: string) => selectedIds.includes(id);
  const isAllSelected = items ? selectedIds.length === items.length && items.length > 0 : false;
  const isSomeSelected = selectedIds.length > 0 && (!items || selectedIds.length < items.length);

  return {
    selectedIds,
    toggleItem,
    toggleAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isSomeSelected,
  };
}
