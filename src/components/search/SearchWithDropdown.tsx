import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Loader2, Sparkles, ChevronRight, Clock, X, Mic } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { captureError } from '@/lib/logger';
import { cn } from '@/lib/utils';

// framer-motion içerdiği için eager yerine tıklama anında yüklenir.
const LazyVoiceSearchModal = lazy(() =>
  import('./VoiceSearchModal').then((m) => ({ default: m.VoiceSearchModal }))
);

interface Suggestion {
  id: string;
  title: string;
  slug: string;
  category_name?: string | undefined;
  view_count?: number | null;
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
  onSearchSubmit,
}: SearchWithDropdownProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Detect SpeechRecognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = ((window as unknown) as Record<string, unknown>).SpeechRecognition ||
        ((window as unknown) as Record<string, unknown>).webkitSpeechRecognition;
      setVoiceSupported(!!SR);
    }
  }, []);

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

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const removeRecentSearch = (term: string) => {
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const searchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < MIN_CHARS) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('dreams')
        .select(`
          id,
          title,
          slug,
          view_count,
          categories:category_id (name)
        `)
        .eq('is_published', true)
        .ilike('title', `%${searchQuery}%`)
        .order('view_count', { ascending: false })
        .limit(6);

      if (data) {
        setSuggestions(
          data.map((d) => ({
            id: d.id,
            title: d.title,
            slug: d.slug,
            view_count: d.view_count,
            category_name: (d.categories as { name?: string })?.name || undefined,
          }))
        );
      }
    } catch (error) {
      captureError(error, { tags: { feature: 'search-with-dropdown' }, extra: { context: 'autocomplete' } });
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

  // Log search query
  const logSearch = async (searchQuery: string, resultsCount: number = 0) => {
    const { error } = await supabase
      .from('search_logs')
      .insert({
        query: searchQuery,
        results_count: resultsCount,
      });

    if (error && !['42501', '401'].includes(error.code || '')) {
      captureError(error, { tags: { feature: 'search-with-dropdown' }, extra: { context: 'log-search' } });
    }
  };

  const findExactDream = useCallback(async (searchQuery: string): Promise<Suggestion | null> => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('tr-TR');
    const localMatch = suggestions.find(
      suggestion => suggestion.title.trim().toLocaleLowerCase('tr-TR') === normalizedQuery
    );
    if (localMatch) return localMatch;

    try {
      const { data, error } = await supabase
        .from('dreams')
        .select(`
          id,
          title,
          slug,
          view_count,
          categories:category_id (name)
        `)
        .eq('is_published', true)
        .ilike('title', searchQuery.trim())
        .order('view_count', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      return {
        id: data.id,
        title: data.title,
        slug: data.slug,
        view_count: data.view_count,
        category_name: (data.categories as { name?: string })?.name || undefined,
      };
    } catch (error) {
      captureError(error, { tags: { feature: 'search-with-dropdown' }, extra: { context: 'exact-dream-lookup' } });
      return null;
    }
  }, [suggestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchQuery = query.trim();
    if (searchQuery) {
      saveRecentSearch(searchQuery);
      logSearch(searchQuery, suggestions.length);
      const exactDream = await findExactDream(searchQuery);
      navigate(exactDream ? `/ruya/${exactDream.slug}` : `/ara?q=${encodeURIComponent(searchQuery)}`);
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

  const handleVoiceResult = (text: string) => {
    setQuery(text);
    setShowDropdown(false);
    // Direkt aramaya yönlendir
    saveRecentSearch(text.trim());
    logSearch(text.trim(), 0);
    navigate(`/ara?q=${encodeURIComponent(text.trim())}`);
    onSearchSubmit?.();
  };

  const openVoiceModal = () => {
    setShowDropdown(false);
    setVoiceModalOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length + Math.min(recentSearches.length, 5);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (totalItems + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems + 1) % (totalItems + 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      if (selectedIndex < suggestions.length) {
        const item = suggestions[selectedIndex];
        if (item) handleSelectSuggestion(item);
      } else {
        const recentIndex = selectedIndex - suggestions.length;
        if (recentIndex < recentSearches.length) {
          const recent = recentSearches[recentIndex];
          if (recent) handleSelectRecentSearch(recent);
        }
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const showDropdownContent =
    showDropdown &&
    (suggestions.length > 0 ||
      recentSearches.length > 0 ||
      (isLoading && query.length >= MIN_CHARS));

  // Variant-specific styles
  const isHero = variant === 'hero';
  const isMobile = variant === 'mobile';

  return (
    <>
      <div className={cn('relative', className)} ref={containerRef}>
        <form onSubmit={handleSubmit} className="relative">
          <Input
            ref={inputRef}
            type="search"
            placeholder={
              placeholder || (isHero ? 'Rüyanızı arayın... (örn: yılan, su, uçmak)' : 'Rüya ara...')
            }
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            aria-label="Rüya ara"
            className={cn(
              isHero
                ? voiceSupported
                  ? 'w-full h-13 sm:h-14 pl-4 sm:pl-5 pr-24 sm:pr-28 text-base sm:text-lg rounded-2xl bg-background/85 backdrop-blur border-2 border-primary/20 focus:border-primary shadow-lg shadow-primary/5'
                  : 'w-full h-13 sm:h-14 pl-4 sm:pl-5 pr-14 text-base sm:text-lg rounded-2xl bg-background/85 backdrop-blur border-2 border-primary/20 focus:border-primary shadow-lg shadow-primary/5'
                : isMobile
                ? voiceSupported
                  ? 'w-full pr-22'
                  : 'w-full pr-10'
                : voiceSupported
                ? 'w-[200px] lg:w-[280px] pr-22 bg-muted/50'
                : 'w-[200px] lg:w-[280px] pr-10 bg-muted/50',
              inputClassName
            )}
          />
          {voiceSupported && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={openVoiceModal}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 right-14 z-10 transition-all duration-300',
                isHero
                  ? 'h-11 w-11 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground hover:scale-105'
                  : 'h-11 w-11 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground hover:scale-105'
              )}
              aria-label="Sesli arama başlat"
              title="Sesli arama"
            >
              <Mic className={isHero ? 'h-5 w-5' : 'h-4 w-4'} />
            </Button>
          )}
          <Button
            type="submit"
            variant={isHero ? 'default' : 'ghost'}
            size="icon"
            className={cn(
              'absolute top-1/2 -translate-y-1/2',
              isHero ? 'right-2 h-11 w-11 rounded-xl dream-gradient' : 'right-0 h-full'
            )}
            aria-label="Ara"
          >
            <Search className={isHero ? 'h-5 w-5' : 'h-4 w-4'} />
          </Button>
        </form>

        {/* Dropdown */}
        {showDropdownContent && (
            <div
            className={cn(
              'absolute top-full left-0 right-0 mt-2 bg-background border rounded-xl shadow-lg z-[100] overflow-hidden max-h-[min(70vh,28rem)] overflow-y-auto overscroll-contain',
              isHero && 'shadow-xl border-primary/20'
            )}
          >
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
                      'w-full text-left px-3 py-3 rounded-lg transition-colors flex items-center justify-between group',
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
                          <div className="text-xs text-muted-foreground">
                            {suggestion.category_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}

                {/* Search for query option */}
                {query.trim() && (
                  <button
                    onClick={(e) => { e.preventDefault(); handleSubmit(e); }}
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
                  onClick={(e) => { e.preventDefault(); handleSubmit(e); }}
                  className="text-primary hover:underline text-sm"
                >
                  Yine de ara →
                </button>
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (query.length < MIN_CHARS || suggestions.length === 0) && (
              <div className={cn('p-2', suggestions.length > 0 && 'border-t')}>
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
                        'flex items-center justify-between group rounded-lg',
                        selectedIndex === itemIndex && 'bg-accent'
                      )}
                    >
                      <button
                        onClick={() => handleSelectRecentSearch(term)}
                        className="min-h-11 flex-1 text-left px-3 py-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-3"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{term}</span>
                      </button>
                      <button
                        onClick={() => removeRecentSearch(term)}
                        /* Dokunmatik cihazlarda hover olmadığı için X butonu her zaman görünür;
                           hover destekleyen cihazlarda öğenin üzerine gelince belirir. */
                        className="-m-1.5 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-destructive transition-colors [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
                        aria-label={`${term} aramasını kaldır`}
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

      {/* Voice Search Modal — lazy: framer-motion'ı eager bundle'dan tutar */}
      {voiceSupported && (
        <Suspense fallback={null}>
          <LazyVoiceSearchModal
            open={voiceModalOpen}
            onOpenChange={setVoiceModalOpen}
            onResult={handleVoiceResult}
          />
        </Suspense>
      )}
    </>
  );
}
