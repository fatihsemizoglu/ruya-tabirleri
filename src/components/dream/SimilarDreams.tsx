import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Dream } from '@/types/database';

const normalizeText = (value: string) =>
  value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

const normalizeKeywords = (values: string[]) => values.map(normalizeText).filter(Boolean);

interface SimilarDreamsProps {
  currentDream: Dream;
  categoryId: string | null;
  keywords: string[];
}

interface SimilarDream extends Dream {
  matchScore: number;
  matchReasons: string[];
}

export function SimilarDreams({ currentDream, categoryId, keywords }: SimilarDreamsProps) {
  const [similarDreams, setSimilarDreams] = useState<SimilarDream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchSimilarDreams = useCallback(async () => {
    setIsLoading(true);
    try {
      const normalizedCurrentKeywords = normalizeKeywords(keywords || []);
      const searchTerms = normalizedCurrentKeywords.slice(0, 4);
      const candidateQueries = [currentDream.title, ...searchTerms].filter(Boolean).slice(0, 4);
      const candidateIds = new Set<string>();

      const searchResults = await Promise.all(
        candidateQueries.map((search_query) =>
          supabase.rpc('search_dreams', { search_query, limit_count: 12 })
        )
      );

      searchResults.forEach(({ data }) => {
        data?.forEach((dream) => {
          if (dream.id !== currentDream.id && dream.rank >= 3) candidateIds.add(dream.id);
        });
      });

      if (categoryId) {
        const { data } = await supabase
          .from('dreams')
          .select('id')
          .eq('category_id', categoryId)
          .eq('is_published', true)
          .neq('id', currentDream.id)
          .order('view_count', { ascending: false })
          .limit(16);
        data?.forEach((dream) => candidateIds.add(dream.id));
      }

      if (candidateIds.size === 0) {
        setSimilarDreams([]);
        return;
      }

      const { data: candidates } = await supabase
        .from('dreams')
        .select('*')
        .in('id', Array.from(candidateIds))
        .eq('is_published', true);

      const dreamMap = new Map<string, SimilarDream>();

      (candidates as Dream[] | null)?.forEach((dream) => {
        const normalizedDreamKeywords = normalizeKeywords(dream.keywords || []);
        const matchingKeywordCount = normalizedDreamKeywords.filter((keyword) =>
          normalizedCurrentKeywords.some((currentKeyword) => keyword === currentKeyword || keyword.includes(currentKeyword) || currentKeyword.includes(keyword))
        ).length;
        const titleSimilarity = searchTerms.some((term) => normalizeText(dream.title).includes(term)) ? 2 : 0;
        const categoryScore = categoryId && dream.category_id === categoryId ? 2 : 0;
        const matchScore = matchingKeywordCount * 3 + titleSimilarity + categoryScore;

        if (matchScore < 3) return;

        const matchReasons: string[] = [];
        if (matchingKeywordCount > 0) matchReasons.push('Ortak Anahtar Kelime');
        if (categoryScore > 0) matchReasons.push('Aynı Kategori');
        if (titleSimilarity > 0) matchReasons.push('Başlık Benzerliği');

        dreamMap.set(dream.id, { ...dream, matchScore, matchReasons });
      });

      // Sort by score and popularity
      const sorted = Array.from(dreamMap.values())
        .sort((a, b) => {
          if (b.matchScore !== a.matchScore) {
            return b.matchScore - a.matchScore;
          }
          return (b.view_count || 0) - (a.view_count || 0);
        })
        .slice(0, 8);

      setSimilarDreams(sorted);
    } catch (error) {
      console.error('Error fetching similar dreams:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentDream.id, currentDream.title, categoryId, keywords]);

  useEffect(() => {
    fetchSimilarDreams();
  }, [fetchSimilarDreams]);

  if (isLoading) {
    return (
      <div className="mb-12">
        <h3 className="text-xl font-serif font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Benzer Rüya Tabirleri
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-muted/50">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (similarDreams.length === 0) {
    return null;
  }

  const displayedDreams = showAll ? similarDreams : similarDreams.slice(0, 4);

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-serif font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Benzer Rüya Tabirleri
          <Badge variant="secondary" className="ml-2 font-normal">
            {similarDreams.length}
          </Badge>
        </h3>
        {categoryId && (
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link to={`/kategori/${currentDream.category?.slug || ''}`}>
              Kategoride Gör
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {displayedDreams.map((dream) => (
          <Link
            key={dream.id}
            to={`/ruya/${dream.slug}`}
            className="group relative p-3 rounded-xl bg-muted/50 hover:bg-muted transition-all duration-200 hover:shadow-md border border-transparent hover:border-primary/20"
          >
            {/* Match indicator */}
            {dream.matchScore >= 3 && (
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                İlgili
              </div>
            )}
            
            <h4 className="font-medium mb-3 group-hover:text-primary transition-colors line-clamp-2">
              {dream.title}
            </h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {(dream.view_count || 0).toLocaleString('tr-TR')}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {(dream.like_count || 0).toLocaleString('tr-TR')}
                </span>
              </div>
              
              <div className="flex gap-1">
                {dream.matchReasons.slice(0, 2).map((reason) => (
                  <span 
                    key={reason} 
                    className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {similarDreams.length > 4 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4"
        >
          {showAll ? 'Daha az göster' : `${similarDreams.length - 4} rüya daha göster`}
        </Button>
      )}
    </div>
  );
}
