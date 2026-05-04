import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { dreamsApi } from '@/lib/api';
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
      // Use the API's getSimilar endpoint which handles category and keyword matching
      const response = await dreamsApi.getSimilar(currentDream.id);
      
      if (response.success && response.data) {
        // Transform the API response to include match metadata
        const dreamsWithScores: SimilarDream[] = response.data.map(dream => {
          const matchReasons: string[] = [];
          let matchScore = 1;
          
          // Check category match
          if (dream.category_id === categoryId && categoryId) {
            matchScore += 2;
            matchReasons.push('Aynı Kategori');
          }
          
          // Check keyword matches
          const matchingKeywords = dream.keywords?.filter(k => keywords.includes(k)) || [];
          if (matchingKeywords.length > 0) {
            matchScore += matchingKeywords.length;
            matchReasons.push('Ortak Anahtar Kelimeler');
          }
          
          return {
            ...dream,
            matchScore,
            matchReasons: matchReasons.length > 0 ? matchReasons : ['Benzer İçerik']
          };
        });
        
        // Sort by score and popularity
        const sorted = dreamsWithScores.sort((a, b) => {
          if (b.matchScore !== a.matchScore) {
            return b.matchScore - a.matchScore;
          }
          return (b.view_count || 0) - (a.view_count || 0);
        });
        
        setSimilarDreams(sorted);
      }
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
