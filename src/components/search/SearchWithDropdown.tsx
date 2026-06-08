import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Loader2, Sparkles, ChevronRight, Clock, X, Mic, MicOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
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
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Detect SpeechRecognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = ((window as unknown) as Record<string, unknown>).SpeechRecognition ||
        ((window as unknown) as Record<string, unknown>).webkitSpeechRecognition;
      setVoiceSupported(!!SR);
    }
  }, []);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {
          // ignore
        }
      }
    };
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
        setSuggestions(data.map(d => ({
          id: d.id,
          title: d.title,
          slug: d.slug,
          view_count: d.view_count,
          category_name: (d.categories as { name?: string })?.name || undefined
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

  // Log search query
  const logSearch = async (searchQuery: string, resultsCount: number = 0) => {
    try {
      await supabase
        .from('search_logs')
        .insert({ 
          query: searchQuery, 
          results_count: resultsCount 
        });
    } catch (error) {
      console.error('Failed to log search:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      logSearch(query.trim(), suggestions.length);
      navigate(`/ara?q=${encodeURIComponent(query.trim())}`);
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

  const performSearch = useCallback((searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;
    saveRecentSearch(term);
    logSearch(term, 0);
    navigate(`/ara?q=${encodeURIComponent(term)}`);
    setQuery('');
    setShowDropdown(false);
    onSearchSubmit?.();
  }, [recentSearches, navigate, onSearchSubmit]);

  const handleVoiceSearch = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    const SR =
      ((window as unknown as Record<string, unknown>).SpeechRecognition as { new(): SpeechRecognitionInstance } | undefined) ||
      ((window as unknown as Record<string, unknown>).webkitSpeechRecognition as { new(): SpeechRecognitionInstance } | undefined);
    if (!SR) {
      toast({
        title: 'Sesli arama desteklenmiyor',
        description: 'Tarayıcınız sesli aramayı desteklemiyor.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const recognition = new SR();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        const text = finalTranscript || interimTranscript;
        if (text) {
          setQuery(text);
          if (finalTranscript) {
            setIsListening(false);
            // Otomatik arama
            setTimeout(() => {
              performSearch(text.trim());
            }, 200);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          toast({
            title: 'Mikrofon erişimi reddedildi',
            description: 'Sesli arama için mikrofon iznine ihtiyaç var.',
            variant: 'destructive',
          });
        } else if (event.error === 'no-speech') {
          toast({
            title: 'Ses algılanamadı',
            description: 'Lütfen tekrar deneyin ve mikrofonunuza yakın konuşun.',
            variant: 'destructive',
          });
        } else if (event.error !== 'aborted') {
          toast({
            title: 'Sesli arama hatası',
            description: 'Lütfen tekrar deneyin.',
            variant: 'destructive',
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
      toast({
        title: 'Sesli arama başlatılamadı',
        description: 'Tarayıcınız sesli aramayı desteklemiyor olabilir.',
        variant: 'destructive',
      });
    }
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
              ? voiceSupported 
                ? "w-full h-14 pl-5 pr-28 text-lg rounded-2xl bg-background/80 backdrop-blur border-2 border-primary/20 focus:border-primary shadow-lg shadow-primary/5"
                : "w-full h-14 pl-5 pr-14 text-lg rounded-2xl bg-background/80 backdrop-blur border-2 border-primary/20 focus:border-primary shadow-lg shadow-primary/5"
              : isMobile
              ? voiceSupported
                ? "w-full pr-22"
                : "w-full pr-10"
              : voiceSupported
                ? "w-[200px] lg:w-[280px] pr-22 bg-muted/50"
                : "w-[200px] lg:w-[280px] pr-10 bg-muted/50",
            inputClassName
          )}
        />
        {voiceSupported && (
          <div className="absolute top-1/2 -translate-y-1/2 right-14 z-10">
            {/* Animasyonlu ses dalgaları (sadece dinlerken) */}
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-xl bg-red-500/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                <span className="absolute inset-0 rounded-xl bg-red-500/20 animate-pulse" style={{ animationDuration: '1s' }} />
                <span
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-red-500/40 animate-ping"
                  style={{ animationDuration: '1.2s' }}
                />
              </>
            )}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleVoiceSearch}
              className={cn(
                "relative transition-all duration-300",
                isHero
                  ? isListening
                    ? "h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/40 scale-110"
                    : "h-10 w-10 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground hover:scale-105"
                  : isListening
                    ? "h-9 w-9 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/40 scale-110"
                    : "h-9 w-9 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground hover:scale-105"
              )}
              aria-label={isListening ? 'Sesli aramayı durdur' : 'Sesli arama başlat'}
              title={isListening ? 'Dinleniyor... (durdurmak için tıklayın)' : 'Sesli arama'}
            >
              {isListening ? <MicOff className={cn(isHero ? "h-5 w-5" : "h-4 w-4", "animate-pulse")} /> : <Mic className={isHero ? "h-5 w-5" : "h-4 w-4"} />}
            </Button>
          </div>
        )}
        <Button 
          type="submit" 
          variant={isHero ? "default" : "ghost"}
          size="icon" 
          className={cn(
            "absolute top-1/2 -translate-y-1/2",
            isHero 
              ? "right-2 h-10 w-10 rounded-xl dream-gradient" 
              : "right-0 h-full"
          )}
        >
          <Search className={isHero ? "h-5 w-5" : "h-4 w-4"} />
        </Button>
      </form>

      {/* Voice search listening indicator */}
      {isListening && (
        <div className={cn(
          "absolute left-0 right-0 z-10 flex items-center justify-center gap-2 text-xs text-red-500 animate-in fade-in slide-in-from-top-1",
          isHero ? "-bottom-8" : "-bottom-7"
        )}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          {isHero ? "Dinleniyor... Konuşun" : "Dinleniyor..."}
        </div>
      )}

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
                  onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
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
                onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
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
