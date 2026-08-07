import { motion } from 'framer-motion';
import { Search, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DreamCard } from '@/components/dream/DreamCard';
import { pickGradient } from '@/lib/category';
import type { ViewMode } from '@/lib/category';
import type { Dream } from '@/types/database';

interface CategoryResultsProps {
  dreams: Dream[];
  totalResults: number;
  searchQuery: string;
  viewMode: ViewMode;
  hasMore: boolean;
  remainingCount: number;
  onLoadMore: () => void;
  onClearSearch: () => void;
}

export function CategoryResults({
  dreams,
  totalResults,
  searchQuery,
  viewMode,
  hasMore,
  remainingCount,
  onLoadMore,
  onClearSearch,
}: CategoryResultsProps) {
  return (
    <section className="container pb-16">
      {searchQuery && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground mb-6"
        >
          "<span className="font-medium text-foreground">{searchQuery}</span>" için{' '}
          <span className="font-semibold text-foreground">{totalResults}</span> sonuç bulundu
        </motion.p>
      )}

      {dreams.length > 0 ? (
        <>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.04 } },
            }}
            className={viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              : "flex flex-col gap-3"
            }
          >
            {dreams.map((dream, index) => (
              <DreamCard
                key={dream.id}
                dream={dream}
                viewMode={viewMode}
                variant="rich"
                gradient={pickGradient(dream.id)}
                index={index}
                showFeatured
                showFirstKeyword
              />
            ))}
          </motion.div>

          {hasMore && (
            <div className="flex justify-center mt-12">
              <Button
                variant="outline"
                size="lg"
                onClick={onLoadMore}
                className="rounded-xl px-8 h-12 border-border hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all"
              >
                <Zap className="h-4 w-4 mr-2" />
                Daha Fazla Göster
                <span className="ml-2 text-muted-foreground text-sm">
                  ({remainingCount} kaldı)
                </span>
              </Button>
            </div>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center mx-auto mb-6">
            <Search className="h-12 w-12 text-primary" />
          </div>
          {searchQuery ? (
            <>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Sonuç Bulunamadı</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                "{searchQuery}" için bu kategoride sonuç bulunamadı.
              </p>
              <Button variant="outline" onClick={onClearSearch} className="rounded-xl">
                Aramayı Temizle
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Henüz Rüya Yok</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Bu kategoride henüz rüya tabiri bulunmuyor. Kısa süre içinde eklenecektir.
              </p>
            </>
          )}
        </motion.div>
      )}
    </section>
  );
}
