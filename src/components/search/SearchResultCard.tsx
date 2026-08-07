import { Link } from 'react-router-dom';
import { Eye, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import type { DreamSearchResult } from '@/types/database';
import type { ViewMode } from '@/lib/search-data';

interface SearchResultCardProps {
  dream: DreamSearchResult;
  index: number;
  viewMode: ViewMode;
  categoryName: string;
  categoryIconValue: string;
}

export function SearchResultCard({
  dream,
  index,
  viewMode,
  categoryName,
  categoryIconValue,
}: SearchResultCardProps) {
  if (viewMode === 'list') {
    return (
      <Link
        to={`/ruya/${dream.slug}`}
        style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
        className="group block rounded-xl border border-border/60 bg-card/80 p-3 shadow-sm transition-all duration-200 hover:border-primary/35 hover:bg-card hover:shadow-md render-optimize animate-fadeIn"
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2">
              {index < 3 && (
                <Badge className="dream-gradient text-white">
                  #{index + 1}
                </Badge>
              )}
              {dream.category_id && (
                <Badge variant="secondary">
                  <CategoryIcon icon={categoryIconValue} className="h-3.5 w-3.5" />
                  {categoryName}
                </Badge>
              )}
            </div>
            <h3 className="text-[15px] font-semibold leading-snug transition-colors line-clamp-2 group-hover:text-primary sm:text-base">
              {dream.title}
            </h3>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1 tabular-nums">
              <Eye className="h-4 w-4" />
              <span>{(dream.view_count || 0).toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex items-center gap-1 tabular-nums">
              <Heart className="h-4 w-4" />
              <span>{(dream.like_count || 0).toLocaleString('tr-TR')}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/ruya/${dream.slug}`}
      className="group relative flex min-h-[104px] flex-col rounded-xl border border-border/60 bg-card/80 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card hover:shadow-md hover:shadow-primary/5 render-optimize animate-fadeIn"
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        {dream.category_id && (
          <Badge variant="secondary" className="max-w-[70%] truncate text-[11px]">
            <CategoryIcon icon={categoryIconValue} className="h-3.5 w-3.5" />
            {categoryName}
          </Badge>
        )}
        {index < 3 && (
          <Badge className="dream-gradient text-white">
            Top {index + 1}
          </Badge>
        )}
      </div>
      <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.01em] transition-colors line-clamp-2 group-hover:text-primary sm:text-base">
        {dream.title}
      </h3>

      <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-xs text-muted-foreground">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex items-center gap-1 tabular-nums">
            <Eye className="h-3.5 w-3.5" />
            {(dream.view_count || 0).toLocaleString('tr-TR')}
          </span>
          <span className="flex items-center gap-1 tabular-nums">
            <Heart className="h-3.5 w-3.5" />
            {(dream.like_count || 0).toLocaleString('tr-TR')}
          </span>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          Oku
        </span>
      </div>
    </Link>
  );
}
