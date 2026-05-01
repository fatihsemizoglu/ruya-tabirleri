import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseKeyboardOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onSlash?: () => void;
  enabled?: boolean;
}

export function useKeyboard({
  onEscape,
  onEnter,
  onArrowUp,
  onArrowDown,
  onSlash,
  enabled = true,
}: UseKeyboardOptions) {
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    const target = e.target as HTMLElement;
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;

    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
    } else if (e.key === 'Enter' && onEnter && !isInput) {
      e.preventDefault();
      onEnter();
    } else if (e.key === 'ArrowUp' && onArrowUp && !isInput) {
      e.preventDefault();
      onArrowUp();
    } else if (e.key === 'ArrowDown' && onArrowDown && !isInput) {
      e.preventDefault();
      onArrowDown();
    } else if (e.key === '/' && onSlash && !isInput) {
      e.preventDefault();
      onSlash();
    } else if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSlash?.();
    }
  }, [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onSlash]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function KeyboardHints() {
  return (
    <div className="fixed bottom-4 left-4 flex gap-2 text-xs text-muted-foreground">
      <kbd className="px-1.5 py-0.5 rounded border bg-muted">/</kbd>
      <span>Arama</span>
      <kbd className="px-1.5 py-0.5 rounded border bg-muted ml-2">↑↓</kbd>
      <span>Navigasyon</span>
    </div>
  );
}