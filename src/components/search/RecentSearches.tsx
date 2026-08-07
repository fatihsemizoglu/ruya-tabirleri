import { Clock, X, Search, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface RecentSearchesProps {
  /** Called when a recent search is clicked. If not provided, navigates to /ara?q=... */
  onSelect?: (query: string) => void;
  className?: string;
}

/**
 * Renders the user's recent search history with quick-access chips and a
 * per-item delete button. Visibility is automatic — only renders when there
 * is at least one entry.
 */
export function RecentSearches({ onSelect, className = '' }: RecentSearchesProps) {
  const { recent, removeSearch, clear } = useRecentSearches();
  const navigate = useNavigate();

  if (recent.length === 0) return null;

  const handleClick = (q: string) => {
    if (onSelect) {
      onSelect(q);
    } else {
      navigate(`/ara?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-muted-foreground inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Son Aramalar
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Temizle
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {recent.map((q) => (
            <motion.div
              key={q}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="group relative inline-flex items-center"
            >
              <button
                onClick={() => handleClick(q)}
                className="inline-flex min-h-11 items-center gap-1.5 pl-3 pr-7 py-1.5 rounded-full bg-muted/60 hover:bg-primary/10 hover:text-primary text-sm transition-colors touch-target"
              >
                <Search className="h-3 w-3 opacity-50" />
                {q}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeSearch(q);
                }}
                aria-label={`${q} aramasını sil`}
                className="absolute right-0 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full opacity-50 hover:opacity-100 hover:bg-background/50 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
