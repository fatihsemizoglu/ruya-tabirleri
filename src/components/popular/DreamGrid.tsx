import { motion } from 'framer-motion';
import { Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DreamCard } from '@/components/dream/DreamCard';
import type { Dream, Category } from '@/types/database';
import type { ViewMode } from '@/lib/popular';

type LoadMoreType = 'viewed' | 'liked' | 'featured';

interface DreamGridProps {
  dreams: Dream[];
  viewMode: ViewMode;
  isRanked: boolean;
  categories: Record<string, Category>;
  type?: LoadMoreType;
  hasMore?: boolean;
  loadingMore: boolean;
  onLoadMore: (type: LoadMoreType) => void;
}

export function DreamGrid({
  dreams,
  viewMode,
  isRanked,
  categories,
  type,
  hasMore,
  loadingMore,
  onLoadMore,
}: DreamGridProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2' : 'space-y-0'}>        {dreams.map((dream, index) => (
          <DreamCard key={dream.id} dream={dream} index={index} viewMode={viewMode} variant="compact" isRanked={isRanked} category={dream.category_id ? categories[dream.category_id] ?? null : null} />
        ))}
      </div>

      {type && hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onLoadMore(type)}
            disabled={loadingMore}
            className="rounded-xl px-8 h-12 border-border hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Daha Fazla Göster
              </>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
