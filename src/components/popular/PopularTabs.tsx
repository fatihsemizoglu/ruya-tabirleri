import { Flame, Eye, Heart, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSkeleton } from './LoadingSkeleton';
import { DreamGrid } from './DreamGrid';
import { EmptyState } from './EmptyState';
import type { Dream, Category } from '@/types/database';
import type { ViewMode } from '@/lib/popular';

type LoadMoreType = 'viewed' | 'liked' | 'featured';

interface PopularTabsProps {
  activeTab: string;
  onActiveTabChange: (value: string) => void;
  isLoading: boolean;
  viewMode: ViewMode;
  filteredTrending: Dream[];
  filteredViewed: Dream[];
  filteredLiked: Dream[];
  filteredFeatured: Dream[];
  hasMoreViewed: boolean;
  hasMoreLiked: boolean;
  hasMoreFeatured: boolean;
  loadingMore: boolean;
  searchQuery: string;
  selectedCategory: string;
  categories: Record<string, Category>;
  onLoadMore: (type: LoadMoreType) => void;
}

export function PopularTabs({
  activeTab,
  onActiveTabChange,
  isLoading,
  viewMode,
  filteredTrending,
  filteredViewed,
  filteredLiked,
  filteredFeatured,
  hasMoreViewed,
  hasMoreLiked,
  hasMoreFeatured,
  loadingMore,
  searchQuery,
  selectedCategory,
  categories,
  onLoadMore,
}: PopularTabsProps) {
  const canLoadMore = !searchQuery && selectedCategory === 'all';

  return (
    <Tabs value={activeTab} onValueChange={onActiveTabChange} className="w-full">
      <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8 h-12 p-1 bg-muted/30 rounded-2xl">
        <TabsTrigger
          value="trending"
          className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground flex items-center gap-2 text-xs sm:text-sm"
        >
          <Flame className="h-4 w-4" />
          <span className="hidden sm:inline">Trend</span>
        </TabsTrigger>
        <TabsTrigger
          value="viewed"
          className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground flex items-center gap-2 text-xs sm:text-sm"
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">Görüntülenen</span>
        </TabsTrigger>
        <TabsTrigger
          value="liked"
          className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground flex items-center gap-2 text-xs sm:text-sm"
        >
          <Heart className="h-4 w-4" />
          <span className="hidden sm:inline">Beğenilen</span>
        </TabsTrigger>
        <TabsTrigger
          value="featured"
          className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground flex items-center gap-2 text-xs sm:text-sm"
        >
          <Star className="h-4 w-4" />
          <span className="hidden sm:inline">Öne Çıkan</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="trending" className="mt-0">
        {isLoading ? (
          <LoadingSkeleton viewMode={viewMode} />
        ) : filteredTrending.length > 0 ? (
          <DreamGrid dreams={filteredTrending} viewMode={viewMode} isRanked categories={categories} loadingMore={loadingMore} onLoadMore={onLoadMore} />
        ) : (
          <EmptyState message="Trend rüya tabiri bulunamadı." />
        )}
      </TabsContent>

      <TabsContent value="viewed" className="mt-0">
        {isLoading ? (
          <LoadingSkeleton viewMode={viewMode} />
        ) : filteredViewed.length > 0 ? (
          <DreamGrid
            dreams={filteredViewed}
            viewMode={viewMode}
            isRanked={false}
            categories={categories}
            type="viewed"
            hasMore={hasMoreViewed && canLoadMore}
            loadingMore={loadingMore}
            onLoadMore={onLoadMore}
          />
        ) : (
          <EmptyState message="Görüntülenen rüya tabiri bulunamadı." />
        )}
      </TabsContent>

      <TabsContent value="liked" className="mt-0">
        {isLoading ? (
          <LoadingSkeleton viewMode={viewMode} />
        ) : filteredLiked.length > 0 ? (
          <DreamGrid
            dreams={filteredLiked}
            viewMode={viewMode}
            isRanked={false}
            categories={categories}
            type="liked"
            hasMore={hasMoreLiked && canLoadMore}
            loadingMore={loadingMore}
            onLoadMore={onLoadMore}
          />
        ) : (
          <EmptyState message="Beğenilen rüya tabiri bulunamadı." />
        )}
      </TabsContent>

      <TabsContent value="featured" className="mt-0">
        {isLoading ? (
          <LoadingSkeleton viewMode={viewMode} />
        ) : filteredFeatured.length > 0 ? (
          <DreamGrid
            dreams={filteredFeatured}
            viewMode={viewMode}
            isRanked={false}
            categories={categories}
            type="featured"
            hasMore={hasMoreFeatured && canLoadMore}
            loadingMore={loadingMore}
            onLoadMore={onLoadMore}
          />
        ) : (
          <EmptyState message="Öne çıkan rüya tabiri bulunamadı." />
        )}
      </TabsContent>
    </Tabs>
  );
}
