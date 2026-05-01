import { useState, useCallback, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableItem<T> {
  id: string;
  item: T;
}

interface UseSortableOptions<T> {
  items: T[];
  getId: (item: T) => string;
  onReorder: (items: T[]) => void;
}

export function useSortable<T>({ items, getId, onReorder }: UseSortableOptions<T>) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const dragOverId = useRef<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    dragOverId.current = id;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = items.findIndex(i => getId(i) === draggedId);
    const targetIndex = items.findIndex(i => getId(i) === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    onReorder(newItems);
    setDraggedId(null);
    dragOverId.current = null;
  }, [draggedId, items, getId, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    dragOverId.current = null;
  }, []);

  return {
    draggedId,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}

interface SortableRowProps {
  id: string;
  children: React.ReactNode;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}

export function SortableRow({
  id,
  children,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: SortableRowProps) {
  return (
    <tr
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={(e) => onDragOver(e, id)}
      onDrop={(e) => onDrop(e, id)}
      onDragEnd={onDragEnd}
      className={cn(
        'transition-opacity',
        isDragging && 'opacity-50',
        isDragOver && 'bg-primary/10'
      )}
    >
      <td className="w-8 cursor-grab">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </td>
      {children}
    </tr>
  );
}