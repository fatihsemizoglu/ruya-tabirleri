import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lightbulb, Tags, Link2, Plus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { captureError } from '@/lib/logger';
import { toast } from 'sonner';

interface KeywordSuggestion {
  keywords: string[];
}

interface RelatedSuggestion {
  title: string;
  reason: string;
}

interface RelatedSuggestionsResponse {
  suggestions: RelatedSuggestion[];
}

interface ContentSuggestionsGeneratorProps {
  title: string;
  content: string;
  currentKeywords?: string[];
  onKeywordsSelected?: (keywords: string[]) => void;
  onRelatedDreamSelected?: (title: string) => void;
}

export function ContentSuggestionsGenerator({
  title,
  content,
  currentKeywords = [],
  onKeywordsSelected,
  onRelatedDreamSelected,
}: ContentSuggestionsGeneratorProps) {
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [relatedSuggestions, setRelatedSuggestions] = useState<RelatedSuggestion[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());

  const generateKeywords = async () => {
    if (!title) {
      toast.error('Lütfen önce bir başlık girin');
      return;
    }

    setIsLoadingKeywords(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content-suggestions', {
        body: { title, content, currentKeywords, type: 'keywords' },
      });

      if (error) throw error;

      const result = data as KeywordSuggestion;
      if (result.keywords && Array.isArray(result.keywords)) {
        setSuggestedKeywords(result.keywords);
        toast.success('Anahtar kelime önerileri oluşturuldu');
      }
    } catch (error) {
      captureError(error, { tags: { feature: 'content-suggestions' }, extra: { context: 'keyword-generation' } });
      toast.error('Anahtar kelime önerileri oluşturulamadı');
    } finally {
      setIsLoadingKeywords(false);
    }
  };

  const generateRelated = async () => {
    if (!title) {
      toast.error('Lütfen önce bir başlık girin');
      return;
    }

    setIsLoadingRelated(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content-suggestions', {
        body: { title, content, type: 'related' },
      });

      if (error) throw error;

      const result = data as RelatedSuggestionsResponse;
      if (result.suggestions && Array.isArray(result.suggestions)) {
        setRelatedSuggestions(result.suggestions);
        toast.success('İlişkili içerik önerileri oluşturuldu');
      }
    } catch (error) {
      captureError(error, { tags: { feature: 'content-suggestions' }, extra: { context: 'related-suggestions' } });
      toast.error('İlişkili içerik önerileri oluşturulamadı');
    } finally {
      setIsLoadingRelated(false);
    }
  };

  const toggleKeyword = (keyword: string) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(keyword)) {
      newSelected.delete(keyword);
    } else {
      newSelected.add(keyword);
    }
    setSelectedKeywords(newSelected);
  };

  const applySelectedKeywords = () => {
    if (selectedKeywords.size === 0) {
      toast.error('Lütfen en az bir anahtar kelime seçin');
      return;
    }

    const combined = [...new Set([...currentKeywords, ...Array.from(selectedKeywords)])];
    onKeywordsSelected?.(combined);
    toast.success(`${selectedKeywords.size} anahtar kelime eklendi`);
    setSelectedKeywords(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Keyword Suggestions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tags className="w-4 h-4 text-primary" />
              Anahtar Kelime Önerileri
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateKeywords}
              disabled={isLoadingKeywords || !title}
            >
              {isLoadingKeywords ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lightbulb className="w-4 h-4" />
              )}
              <span className="ml-2">AI ile Öner</span>
            </Button>
          </div>
        </CardHeader>
        {suggestedKeywords.length > 0 && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestedKeywords.map((keyword, index) => {
                const isSelected = selectedKeywords.has(keyword);
                const isExisting = currentKeywords.includes(keyword);
                
                return (
                  <Badge
                    key={index}
                    variant={isExisting ? "secondary" : isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      isExisting 
                        ? "opacity-50 cursor-not-allowed" 
                        : isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-primary/10"
                    }`}
                    onClick={() => !isExisting && toggleKeyword(keyword)}
                  >
                    {isSelected && <Check className="w-3 h-3 mr-1" />}
                    {keyword}
                    {isExisting && <span className="ml-1 text-xs">(mevcut)</span>}
                  </Badge>
                );
              })}
            </div>
            {selectedKeywords.size > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={applySelectedKeywords}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Seçilenleri Ekle ({selectedKeywords.size})
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      {/* Related Content Suggestions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              İlişkili Rüya Önerileri
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateRelated}
              disabled={isLoadingRelated || !title}
            >
              {isLoadingRelated ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lightbulb className="w-4 h-4" />
              )}
              <span className="ml-2">AI ile Öner</span>
            </Button>
          </div>
        </CardHeader>
        {relatedSuggestions.length > 0 && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              {relatedSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRelatedDreamSelected?.(suggestion.title);
                    }
                  }}
                  className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => onRelatedDreamSelected?.(suggestion.title)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">
                        {suggestion.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {suggestion.reason}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`${suggestion.title} önerisini kullan`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRelatedDreamSelected?.(suggestion.title);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              💡 Önerilere tıklayarak yeni rüya tabiri oluşturabilirsiniz
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
