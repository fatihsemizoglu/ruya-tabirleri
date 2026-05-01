import { useState, useEffect, useRef } from 'react';
import { Search, History, TrendingUp, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  type: 'history' | 'suggestion' | 'trending';
  text: string;
  count?: number;
}

interface SearchSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  suggestions?: SearchSuggestion[];
}

const STORAGE_KEY = 'searchHistory';
const MAX_HISTORY = 10;

export function SearchSuggestions({ value, onChange, onSelect, suggestions }: SearchSuggestionsProps) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (text: string) => {
    onSelect(text);
    setOpen(false);

    const updated = [text, ...history.filter(h => h !== text)].slice(0, MAX_HISTORY);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const removeHistory = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h !== text);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setOpen(true);
  };

  const filteredSuggestions = suggestions?.filter(s => 
    s.text.toLowerCase().includes(value.toLowerCase())
  ) || [];

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Rüya ara..."
        className="pr-10"
      />
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-80 overflow-auto">
          {history.length > 0 && !value && (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-xs text-muted-foreground">Son Aramalar</span>
                <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-foreground">
                  Temizle
                </button>
              </div>
              {history.map(h => (
                <button
                  key={h}
                  onClick={() => handleSelect(h)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-muted rounded"
                >
                  <History className="h-3 w-3 text-muted-foreground" />
                  <span className="flex-1 text-left">{h}</span>
                  <X onClick={(e) => removeHistory(h, e)} className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              ))}
            </div>
          )}
          
          {filteredSuggestions.length > 0 && (
            <div className="p-2 border-t">
              <div className="px-2 mb-2">
                <span className="text-xs text-muted-foreground">Öneriler</span>
              </div>
              {filteredSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(s.text)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-muted rounded"
                >
                  {s.type === 'trending' && <TrendingUp className="h-3 w-3 text-muted-foreground" />}
                  <span className="flex-1 text-left">{s.text}</span>
                  {s.count && <span className="text-xs text-muted-foreground">{s.count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}