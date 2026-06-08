import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts: ShortcutConfig[] = [
    {
      key: 'k',
      ctrl: true,
      action: () => {
        // Focus search input
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Aramayı aç',
    },
    {
      key: '/',
      action: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput && document.activeElement !== searchInput) {
          searchInput.focus();
        }
      },
      description: 'Aramayı aç',
    },
    {
      key: 'h',
      alt: true,
      action: () => navigate('/'),
      description: 'Ana sayfaya git',
    },
    {
      key: 'p',
      alt: true,
      action: () => navigate('/populer'),
      description: 'Popüler sayafasına git',
    },
    {
      key: 'k',
      alt: true,
      action: () => navigate('/kategoriler'),
      description: 'Kategorilere git',
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open modal or dropdown
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          activeElement.blur();
        }
      },
      description: 'Kapat',
    },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input/textarea
    const target = event.target as HTMLElement;
    const isTyping = target.tagName === 'INPUT' || 
                     target.tagName === 'TEXTAREA' || 
                     target.isContentEditable;
    
    // Allow Ctrl+K and Escape even when typing
    const allowedWhileTyping = (event.ctrlKey && event.key === 'k') || event.key === 'Escape';
    
    if (isTyping && !allowedWhileTyping) return;

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}
