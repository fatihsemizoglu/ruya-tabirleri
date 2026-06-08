import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Dream } from '@/types/database';

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

  useEffect(() => {
    fetchSimilarDreams();
  }, [currentDream.id, categoryId, keywords]);

  const fetchSimilarDreams = async () => {
    setIsLoading(true);
    try {
      // Fetch dreams from same category
      let categoryDreams: Dream[] = [];
      if (categoryId) {
        const { data } = await supabase
          .from('dreams')
          .select('*')
          .eq('category_id', categoryId)
          .eq('is_published', true)
          .neq('id', currentDream.id)
          .order('view_count', { ascending: false })
          .limit(10);
        categoryDreams = (data as Dream[]) || [];
      }

      // Fetch dreams with matching keywords using search
      let keywordDreams: Dream[] = [];
      if (keywords && keywords.length > 0) {
        const keywordQuery = keywords.slice(0, 3).join(' ');
        const { data } = await supabase
          .rpc('search_dreams', { search_query: keywordQuery, limit_count: 10 });
        
        if (data) {
          // Filter out current dream and fetch full details
          const ids = data.filter(d => d.id !== currentDream.id).map(d => d.id);
          if (ids.length > 0) {
            const { data: fullDreams } = await supabase
              .from('dreams')
              .select('*')
              .in('id', ids)
              .eq('is_published', true);
            keywordDreams = (fullDreams as Dream[]) || [];
          }
        }
      }

      // Score and deduplicate dreams
      const dreamMap = new Map<string, SimilarDream>();

      categoryDreams.forEach(dream => {
        const existing = dreamMap.get(dream.id);
        if (existing) {
          existing.matchScore += 2;
          if (!existing.matchReasons.includes('Aynı Kategori')) {
            existing.matchReasons.push('Aynı Kategori');
          }
        } else {
          dreamMap.set(dream.id, {
            ...dream,
            matchScore: 2,
            matchReasons: ['Aynı Kategori']
          });
        }
      });

      keywordDreams.forEach(dream => {
        const existing = dreamMap.get(dream.id);
        const matchingKeywords = dream.keywords?.filter(k => keywords.includes(k)) || [];
        const keywordScore = matchingKeywords.length;

        if (existing) {
          existing.matchScore += keywordScore;
          if (matchingKeywords.length > 0 && !existing.matchReasons.includes('Ortak Anahtar Kelimeler')) {
            existing.matchReasons.push('Ortak Anahtar Kelimeler');
          }
        } else if (keywordScore > 0) {
          dreamMap.set(dream.id, {
            ...dream,
            matchScore: keywordScore,
            matchReasons: ['Ortak Anahtar Kelimeler']
          });
        }
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
  };

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
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
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
            <Link to={`/kategori/${(currentDream.category as any)?.slug || ''}`}>
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
            className="group relative p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all duration-200 hover:shadow-md border border-transparent hover:border-primary/20"
          >
            {/* Match indicator */}
            {dream.matchScore >= 3 && (
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                İlgili
              </div>
            )}
            
            <h4 className="font-medium mb-2 group-hover:text-primary transition-colors line-clamp-1">
              {dream.title}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {dream.content}
            </p>
            
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
