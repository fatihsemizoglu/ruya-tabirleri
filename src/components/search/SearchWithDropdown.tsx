import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Loader2, Sparkles, ChevronRight, Clock, X, Mic } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface Suggestion {
  id: string;
  title: string;
  slug: string;
  category_name?: string;
  view_count?: number;
}

interface SearchWithDropdownProps {
  variant?: 'hero' | 'header' | 'mobile';
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  onSearchSubmit?: () => void;
}

const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;
const RECENT_SEARCHES_KEY = 'dream_recent_searches';

export function SearchWithDropdown({
  variant = 'header',
  placeholder,
  className,
  inputClassName,
  onSearchSubmit
}: SearchWithDropdownProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  // Load recent searches
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setVoiceSupported(true);
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'tr-TR';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');

        if (event.results[0].isFinal) {
          setQuery(transcript);
          setShowDropdown(true);
        }
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      // Cleanup on unmount to prevent memory leaks
      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
      };
    }
  }, []);

  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setQuery('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const removeRecentSearch = (term: string) => {
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Normalize search query to include both "rüyada" and plain pattern
  // e.g., "uçmak" becomes "uçmak rüyada uçmak" to match both formats
  const normalizeSearchQuery = (query: string): string => {
    const normalized = query.toLowerCase().trim();
    const ruyadaPrefix = 'rüyada ';

    // If already starts with "rüyada ", return as-is
    if (normalized.startsWith(ruyadaPrefix)) {
      return query;
    }

    // Otherwise, add the prefix version to increase search matches
    return `${query} ${ruyadaPrefix}${query}`;
  };

  const searchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < MIN_CHARS) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Normalize query to include both "rüyada" and plain pattern
      const normalizedQuery = normalizeSearchQuery(searchQuery);
      const data = await searchApi.getSuggestions(normalizedQuery, 6);

      if (data) {
        setSuggestions((data.data || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          slug: d.slug,
          view_count: d.view_count,
          category_name: d.category_name || undefined
        })));
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
    setShowDropdown(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchSuggestions(value);
    }, DEBOUNCE_MS);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const normalizedQuery = normalizeSearchQuery(query.trim());
      saveRecentSearch(query.trim());
      navigate(`/ara?q=${encodeURIComponent(normalizedQuery)}`);
      setQuery('');
      setShowDropdown(false);
      onSearchSubmit?.();
    }
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    saveRecentSearch(suggestion.title);
    navigate(`/ruya/${suggestion.slug}`);
    setQuery('');
    setShowDropdown(false);
    onSearchSubmit?.();
  };

  const handleSelectRecentSearch = (term: string) => {
    navigate(`/ara?q=${encodeURIComponent(term)}`);
    setQuery('');
    setShowDropdown(false);
    onSearchSubmit?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length + Math.min(recentSearches.length, 5);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (totalItems + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalItems + 1) % (totalItems + 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      if (selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else {
        const recentIndex = selectedIndex - suggestions.length;
        if (recentIndex < recentSearches.length) {
          handleSelectRecentSearch(recentSearches[recentIndex]);
        }
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const showDropdownContent = showDropdown && (suggestions.length > 0 || recentSearches.length > 0 || (isLoading && query.length >= MIN_CHARS));

  // Variant-specific styles
  const isHero = variant === 'hero';
  const isMobile = variant === 'mobile';

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <form onSubmit={handleSubmit} className="relative">
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder || (isHero ? "Rüyanızı arayın... (örn: yılan, su, uçmak)" : "Rüya ara...")}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            isHero
              ? "w-full h-14 pl-5 pr-24 text-lg rounded-2xl bg-background/80 backdrop-blur border-2 border-primary/20 focus:border-primary shadow-lg shadow-primary/5"
              : isMobile
              ? "w-full pr-24"
              : "w-[200px] lg:w-[280px] pr-24 bg-muted/50",
            inputClassName
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoiceSearch}
              className={cn(
                "p-1.5 rounded-full transition-all duration-200",
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                isHero ? "h-10 w-10" : "h-8 w-8"
              )}
              title={isListening ? 'Ses dinlemeyi durdur' : 'Sesli ara'}
            >
              <Mic className={isHero ? "h-5 w-5" : "h-4 w-4"} />
            </button>
          )}
          <Button
            type="submit"
            variant={isHero ? "default" : "ghost"}
            size="icon"
            className={cn(
              "",
              isHero
                ? "h-10 w-10 rounded-xl dream-gradient"
                : "h-8 w-8"
            )}
          >
            <Search className={isHero ? "h-5 w-5" : "h-4 w-4"} />
          </Button>
        </div>
        {isListening && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-red-500 font-medium animate-pulse">
            Dinleniyor...
          </span>
        )}
      </form>

      {/* Dropdown */}
      {showDropdownContent && (
        <div className={cn(
          "absolute top-full left-0 right-0 mt-2 bg-background border rounded-xl shadow-lg z-[100] overflow-hidden max-h-[70vh] overflow-y-auto",
          isHero && "shadow-xl border-primary/20"
        )}>
          {/* Loading State */}
          {isLoading && query.length >= MIN_CHARS && (
            <div className="p-4 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span>Aranıyor...</span>
            </div>
          )}

          {/* Suggestions from Database */}
          {!isLoading && suggestions.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>Önerilen Rüyalar</span>
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={cn(
                    "w-full text-left px-3 py-3 rounded-lg transition-colors flex items-center justify-between group",
                    selectedIndex === index ? 'bg-accent' : 'hover:bg-muted'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Search className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{suggestion.title}</div>
                      {suggestion.category_name && (
                        <div className="text-xs text-muted-foreground">{suggestion.category_name}</div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}

              {/* Search for query option */}
              {query.trim() && (
                <button
                  onClick={handleSubmit as any}
                  className="w-full text-left px-3 py-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-3 border-t mt-2 pt-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Search className="h-4 w-4" />
                  </div>
                  <span>
                    "<span className="font-medium">{query}</span>" için tüm sonuçları gör
                  </span>
                </button>
              )}
            </div>
          )}

          {/* No Results */}
          {!isLoading && query.length >= MIN_CHARS && suggestions.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              <p className="mb-2">"{query}" için öneri bulunamadı</p>
              <button
                onClick={handleSubmit as any}
                className="text-primary hover:underline text-sm"
              >
                Yine de ara →
              </button>
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (query.length < MIN_CHARS || suggestions.length === 0) && (
            <div className={cn("p-2", suggestions.length > 0 && "border-t")}>
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Son Aramalar</span>
                </div>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Temizle
                </button>
              </div>
              {recentSearches.slice(0, 5).map((term, index) => {
                const itemIndex = suggestions.length + index;
                return (
                  <div
                    key={term}
                    className={cn(
                      "flex items-center justify-between group rounded-lg",
                      selectedIndex === itemIndex && 'bg-accent'
                    )}
                  >
                    <button
                      onClick={() => handleSelectRecentSearch(term)}
                      className="flex-1 text-left px-3 py-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-3"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{term}</span>
                    </button>
                    <button
                      onClick={() => removeRecentSearch(term)}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
