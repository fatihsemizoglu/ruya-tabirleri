// @ts-nocheck
import { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Clock, X, Loader2, Sparkles, ChevronRight, Mic, MicOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutocompleteSuggestion {
  id: string;
  title: string;
  slug: string;
  category_name?: string;
  view_count?: number;
}

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

interface SearchAutocompleteProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
  recentSearches: string[];
  onClearRecentSearches: () => void;
  onRemoveRecentSearch: (term: string) => void;
  placeholder?: string;
}

const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;

export const SearchAutocomplete = forwardRef<HTMLInputElement, SearchAutocompleteProps>(
  ({ initialQuery = '', onSearch, recentSearches, onClearRecentSearches, onRemoveRecentSearch, placeholder }, ref) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [query, setQuery] = useState(initialQuery);
    const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isListening, setIsListening] = useState(false);
    const [voiceSupported, setVoiceSupported] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
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

    // Cleanup on unmount
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

    // Sync with initialQuery prop
    useEffect(() => {
      setQuery(initialQuery);
    }, [initialQuery]);

    // Cleanup debounce timer on unmount
    useEffect(() => {
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setShowDropdown(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
          .limit(8);

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

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
        setShowDropdown(false);
      }
    };

    const handleSelectSuggestion = (suggestion: AutocompleteSuggestion) => {
      navigate(`/ruya/${suggestion.slug}`);
      setShowDropdown(false);
    };

    const handleSelectRecentSearch = (term: string) => {
      setQuery(term);
      onSearch(term);
      setShowDropdown(false);
    };

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
                onSearch(text.trim());
                setShowDropdown(false);
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
      const totalItems = suggestions.length + recentSearches.length;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (totalItems > 0) {
          setSelectedIndex(prev => (prev + 1) % totalItems);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (totalItems > 0) {
          setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
        }
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        if (selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else {
          const recentIndex = selectedIndex - suggestions.length;
          handleSelectRecentSearch(recentSearches[recentIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    const showDropdownContent = showDropdown && (suggestions.length > 0 || recentSearches.length > 0 || isLoading);

    return (
      <div className="relative" ref={dropdownRef}>
        <form onSubmit={handleSubmit} className="relative">
          <Input
            ref={ref}
            type="search"
            placeholder={placeholder || "Rüyanızı arayın... (örn: yılan, su, uçmak)"}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            className="w-full h-14 pl-5 pr-28 text-lg rounded-2xl border-2 focus:border-primary"
          />
          {voiceSupported && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleVoiceSearch}
              className={`absolute right-14 top-2 h-10 w-10 rounded-xl transition-all ${
                isListening
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 animate-pulse ring-2 ring-red-500/40'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
              aria-label={isListening ? 'Sesli aramayı durdur' : 'Sesli arama başlat'}
              title={isListening ? 'Dinleniyor... (durdurmak için tıklayın)' : 'Sesli arama'}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          )}
          <Button
            type="submit"
            size="icon"
            className="absolute right-2 top-2 h-10 w-10 rounded-xl dream-gradient"
          >
            <Search className="h-5 w-5" />
          </Button>
        </form>

        {isListening && (
          <div className="absolute -bottom-7 left-0 right-0 flex items-center justify-center gap-2 text-xs text-red-500 animate-in fade-in slide-in-from-top-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            Dinleniyor... Konuşun
          </div>
        )}

        {/* Dropdown */}
        {showDropdownContent && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-xl shadow-lg z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
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
                    className={`w-full text-left px-3 py-3 rounded-lg transition-colors flex items-center justify-between group ${
                      selectedIndex === index ? 'bg-accent' : 'hover:bg-muted'
                    }`}
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
                    onClick={() => {
                      onSearch(query.trim());
                      setShowDropdown(false);
                    }}
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
                  onClick={() => {
                    onSearch(query.trim());
                    setShowDropdown(false);
                  }}
                  className="text-primary hover:underline text-sm"
                >
                  Yine de ara →
                </button>
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="p-2 border-t">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Son Aramalar</span>
                  </div>
                  <button
                    onClick={onClearRecentSearches}
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
                      className={`flex items-center justify-between group rounded-lg ${
                        selectedIndex === itemIndex ? 'bg-accent' : ''
                      }`}
                    >
                      <button
                        onClick={() => handleSelectRecentSearch(term)}
                        className="flex-1 text-left px-3 py-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-3"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{term}</span>
                      </button>
                      <button
                        onClick={() => onRemoveRecentSearch(term)}
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
);

SearchAutocomplete.displayName = 'SearchAutocomplete';
