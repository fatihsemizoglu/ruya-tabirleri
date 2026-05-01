import { useState } from 'react';
import { Link2, Loader2, Check, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

interface LinkSuggestion {
  dreamId: string;
  title: string;
  slug: string;
  matchType: 'title' | 'keyword';
  matchedText: string;
  position: number;
}

interface InternalLinkGeneratorProps {
  content: string;
  currentDreamId?: string;
  onContentUpdated: (newContent: string) => void;
}

export function InternalLinkGenerator({ 
  content, 
  currentDreamId,
  onContentUpdated 
}: InternalLinkGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateLinks = async () => {
    if (!content || content.length < 50) {
      toast.error('İçerik çok kısa. En az 50 karakter gerekli.');
      return;
    }

    setIsLoading(true);
    setSuggestions([]);
    setSelectedSuggestions(new Set());
    setHasGenerated(false);

    try {
      const response = await fetchApi<{ suggestions: LinkSuggestion[] }>('/admin/generate-internal-links', {
        method: 'POST',
        body: JSON.stringify({ content, currentDreamId }),
      });

      if (!response.success) {
        throw new Error(response.error || 'Bağlantı önerileri oluşturulurken hata oluştu');
      }

      if (response.data?.suggestions && response.data.suggestions.length > 0) {
        setSuggestions(response.data.suggestions);
        // Select all by default
        setSelectedSuggestions(new Set(response.data.suggestions.map((_: LinkSuggestion, i: number) => i)));
        setHasGenerated(true);
        toast.success(`${response.data.suggestions.length} bağlantı önerisi bulundu`);
      } else {
        toast.info('İçerikte bağlanabilecek rüya tabiri bulunamadı');
        setHasGenerated(true);
      }
    } catch (error) {
      toast.error(`İşlem sırasında hata oluştu`);
      toast.error('Bağlantı önerileri oluşturulurken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const applySelectedLinks = () => {
    if (selectedSuggestions.size === 0) {
      toast.error('Lütfen en az bir bağlantı seçin');
      return;
    }

    let linkedContent = content;
    
    // Get selected suggestions and sort by position (descending)
    const selected = suggestions
      .filter((_, index) => selectedSuggestions.has(index))
      .sort((a, b) => b.position - a.position);

    // Apply links from end to start to maintain positions
    for (const suggestion of selected) {
      const linkUrl = `/ruya/${suggestion.slug}`;
      const originalText = linkedContent.substring(
        suggestion.position, 
        suggestion.position + suggestion.matchedText.length
      );
      const linkedText = `[${originalText}](${linkUrl})`;
      
      linkedContent = 
        linkedContent.substring(0, suggestion.position) + 
        linkedText + 
        linkedContent.substring(suggestion.position + suggestion.matchedText.length);
    }

    onContentUpdated(linkedContent);
    toast.success(`${selectedSuggestions.size} iç bağlantı eklendi`);
    
    // Reset state
    setSuggestions([]);
    setSelectedSuggestions(new Set());
    setHasGenerated(false);
  };

  const selectAll = () => {
    setSelectedSuggestions(new Set(suggestions.map((_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedSuggestions(new Set());
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          Otomatik İç Bağlantı
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          İçerikteki kelimeleri analiz ederek ilgili rüya tabirlerine otomatik bağlantı önerileri oluşturur.
        </p>

        <Button 
          onClick={generateLinks} 
          disabled={isLoading || !content}
          className="w-full"
          variant="outline"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analiz Ediliyor...
            </>
          ) : (
            <>
              <Link2 className="mr-2 h-4 w-4" />
              Bağlantı Önerilerini Bul
            </>
          )}
        </Button>

        {hasGenerated && suggestions.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            İçerikte bağlanabilecek rüya tabiri bulunamadı.
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {suggestions.length} öneri bulundu
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={selectAll}
                  className="h-7 text-xs"
                >
                  <Check className="mr-1 h-3 w-3" />
                  Tümünü Seç
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={deselectAll}
                  className="h-7 text-xs"
                >
                  <X className="mr-1 h-3 w-3" />
                  Temizle
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[200px] rounded-md border p-2">
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={`${suggestion.dreamId}-${index}`}
                    className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                      selectedSuggestions.has(index) 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <Checkbox
                      checked={selectedSuggestions.has(index)}
                      onCheckedChange={() => toggleSuggestion(index)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          "{suggestion.matchedText}"
                        </span>
                        <Badge 
                          variant={suggestion.matchType === 'title' ? 'default' : 'secondary'}
                          className="text-[10px] h-5"
                        >
                          {suggestion.matchType === 'title' ? 'Başlık' : 'Anahtar Kelime'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{suggestion.title}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Button 
              onClick={applySelectedLinks}
              disabled={selectedSuggestions.size === 0}
              className="w-full"
            >
              <Check className="mr-2 h-4 w-4" />
              {selectedSuggestions.size} Bağlantı Ekle
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

