import { useEffect, useCallback } from 'react';

interface ShortcutOptions {
  onSave?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
  onNew?: () => void;
  onDelete?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onSave,
  onSearch,
  onEscape,
  onNew,
  onDelete,
  enabled = true,
}: ShortcutOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    const target = e.target as HTMLElement;
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    if (modifier && e.key === 's') {
      e.preventDefault();
      onSave?.();
    } else if (modifier && e.key === 'k') {
      e.preventDefault();
      onSearch?.();
    } else if (modifier && e.key === 'n') {
      e.preventDefault();
      onNew?.();
    } else if (modifier && e.key === 'Backspace') {
      e.preventDefault();
      onDelete?.();
    } else if (e.key === 'Escape' && !isInput) {
      e.preventDefault();
      onEscape?.();
    }
  }, [enabled, onSave, onSearch, onEscape, onNew, onDelete]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function KeyboardShortcutsHelp() {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const mod = isMac ? '⌘' : 'Ctrl';

  return (
    <div className="fixed bottom-4 left-4 text-xs text-muted-foreground space-y-1">
      <div className="flex gap-2">
        <kbd className="px-1.5 py-0.5 rounded border bg-muted">{mod}+S</kbd>
        <span>Kaydet</span>
      </div>
      <div className="flex gap-2">
        <kbd className="px-1.5 py-0.5 rounded border bg-muted">{mod}+K</kbd>
        <span>Ara</span>
      </div>
      <div className="flex gap-2">
        <kbd className="px-1.5 py-0.5 rounded border bg-muted">{mod}+N</kbd>
        <span>Yeni</span>
      </div>
      <div className="flex gap-2">
        <kbd className="px-1.5 py-0.5 rounded border bg-muted">Esc</kbd>
        <span>Kapat</span>
      </div>
    </div>
  );
}