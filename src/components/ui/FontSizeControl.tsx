import { Type, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFontSize, type FontSize } from '@/hooks/useFontSize';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const labels: Record<FontSize, string> = {
  sm: 'Küçük',
  md: 'Orta',
  lg: 'Büyük',
  xl: 'Çok Büyük',
};

interface FontSizeControlProps {
  variant?: 'inline' | 'compact';
}

/**
 * Floating control for adjusting the global font size.
 * `inline` shows A-/A+ side by side. `compact` shows a single button
 * that expands to a popover with the 4 size options.
 */
export function FontSizeControl({ variant = 'inline' }: FontSizeControlProps) {
  const { fontSize, setFontSize, cycleUp, cycleDown } = useFontSize();
  const [open, setOpen] = useState(false);

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-1" role="group" aria-label="Yazı boyutu">
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleDown}
          disabled={fontSize === 'sm'}
          aria-label="Yazı boyutunu küçült"
          className="touch-target"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <div className="min-w-[5.5rem] text-center text-xs font-medium text-muted-foreground">
          {labels[fontSize]}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleUp}
          disabled={fontSize === 'xl'}
          aria-label="Yazı boyutunu büyüt"
          className="touch-target"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-label="Yazı boyutu"
        className="touch-target"
      >
        <Type className="h-4 w-4 mr-1.5" />
        <span className="text-xs">{labels[fontSize]}</span>
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 top-full mt-2 z-50 min-w-[140px] rounded-xl border border-border bg-card shadow-xl p-1"
          >
            {(Object.keys(labels) as FontSize[]).map((size) => (
              <button
                key={size}
                onClick={() => {
                  setFontSize(size);
                  setOpen(false);
                }}
                className={cn(
                  'w-full min-h-11 text-left px-3 py-2 text-sm rounded-lg transition-colors',
                  fontSize === size
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'hover:bg-muted'
                )}
              >
                {labels[size]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
