import { useState, useEffect, useCallback } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  itemId: string;
  type: 'dream' | 'blog';
  title?: string;
  className?: string;
}

interface BookmarkItem {
  id: string;
  type: 'dream' | 'blog';
  title: string;
  date: string;
}

const STORAGE_KEY = 'bookmarks';

export function BookmarkButton({ itemId, type, title, className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const items: BookmarkItem[] = JSON.parse(saved);
      setIsBookmarked(items.some(i => i.id === itemId && i.type === type));
    }
  }, [itemId, type]);

  const toggle = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const items: BookmarkItem[] = saved ? JSON.parse(saved) : [];
    
    if (isBookmarked) {
      const updated = items.filter(i => !(i.id === itemId && i.type === type));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } else {
      items.push({ id: itemId, type, title: title || itemId, date: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
    
    setIsBookmarked(!isBookmarked);
    setAnimate(true);
    setTimeout(() => setAnimate(false), 300);
  }, [isBookmarked, itemId, type, title]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={cn('transition-transform', animate && 'scale-125', className)}
    >
      <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
    </Button>
  );
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setBookmarks(JSON.parse(saved));
    }
  }, []);

  const remove = (id: string, type: 'dream' | 'blog') => {
    const updated = bookmarks.filter(i => !(i.id === id && i.type === type));
    setBookmarks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { bookmarks, remove };
}