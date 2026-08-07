import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { PremiumBackground } from '@/components/layout/PremiumBackground';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { captureError } from '@/lib/logger';
import type { Category } from '@/types/database';
import { FavoritesHeader } from '@/components/favorites/FavoritesHeader';
import { FavoritesStats } from '@/components/favorites/FavoritesStats';
import { FavoritesFilterBar } from '@/components/favorites/FavoritesFilterBar';
import { SelectionBar } from '@/components/favorites/SelectionBar';
import { ActiveFilters } from '@/components/favorites/ActiveFilters';
import { DreamCard } from '@/components/dream/DreamCard';
import { FavoritesPageLoading, FavoritesGridSkeleton } from '@/components/favorites/FavoritesLoading';
import { FavoritesEmpty, NoFavorites } from '@/components/favorites/FavoritesEmpty';
import { DeleteFavoriteDialog } from '@/components/favorites/DeleteFavoriteDialog';
import type { FavoriteDream, SortOption, ViewMode } from '@/lib/favorites';

export default function Favorites() {
  const { user, isLoading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteDream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*, dreams(*, categories(*))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites((data as FavoriteDream[]) || []);
    } catch (error) {
      captureError(error, { tags: { feature: 'favorites-page' } });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (data) setCategories(data as Category[]);
  }, []);

  useEffect(() => {
    if (user) {
      fetchFavorites();
      fetchCategories();
    }
  }, [user, fetchFavorites, fetchCategories]);

  const removeFavorite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Favorilerden kaldırıldı');
      setFavorites(favorites.filter(f => f.id !== id));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Bir hata oluştu';
      toast.error(message);
    }
  };

  const removeMultipleFavorites = async () => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .in('id', Array.from(selectedItems));

      if (error) throw error;
      toast.success(`${selectedItems.size} favori kaldırıldı`);
      setFavorites(favorites.filter(f => !selectedItems.has(f.id)));
      setSelectedItems(new Set());
      setIsSelectionMode(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Bir hata oluştu';
      toast.error(message);
    }
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeFavorite(itemToDelete);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItems(newSet);
  };

  // Filter and sort favorites
  const filteredFavorites = useMemo(() => {
    let result = [...favorites];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(fav =>
        fav.dreams.title.toLowerCase().includes(query) ||
        fav.dreams.content.toLowerCase().includes(query) ||
        fav.dreams.keywords?.some(k => k.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(fav => fav.dreams.category_id === selectedCategory);
    }

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'views':
        result.sort((a, b) => (b.dreams.view_count || 0) - (a.dreams.view_count || 0));
        break;
      case 'likes':
        result.sort((a, b) => (b.dreams.like_count || 0) - (a.dreams.like_count || 0));
        break;
      case 'title':
        result.sort((a, b) => a.dreams.title.localeCompare(b.dreams.title, 'tr'));
        break;
    }

    return result;
  }, [favorites, searchQuery, selectedCategory, sortBy]);

  const favoriteCategories = useMemo(() => {
    const categoryIds = new Set(favorites.map(f => f.dreams.category_id).filter(Boolean));
    return categories.filter(c => categoryIds.has(c.id));
  }, [favorites, categories]);

  const selectAll = () => {
    if (selectedItems.size === filteredFavorites.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredFavorites.map(f => f.id)));
    }
  };

  const totalViews = favorites.reduce((sum, f) => sum + (f.dreams.view_count || 0), 0);
  const totalLikes = favorites.reduce((sum, f) => sum + (f.dreams.like_count || 0), 0);
  const selectedCategoryName = selectedCategory !== 'all'
    ? categories.find(c => c.id === selectedCategory)?.name
    : undefined;

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedItems(new Set());
  };

  if (authLoading) {
    return <FavoritesPageLoading />;
  }

  if (!user) {
    return <Navigate to="/giris" replace />;
  }

  return (
    <Layout>
      <PremiumBackground variant="soft" className="absolute -top-20" />
      <div className="container py-8 md:py-12 relative">
        <FavoritesHeader />

        {/* Stats Cards */}
        {!isLoading && favorites.length > 0 && (
          <FavoritesStats
            totalFavorites={favorites.length}
            totalViews={totalViews}
            totalLikes={totalLikes}
            distinctCategories={favoriteCategories.length}
          />
        )}

        {favorites.length > 0 && (
          <>
            <FavoritesFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              favoriteCategories={favoriteCategories}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              isSelectionMode={isSelectionMode}
              onToggleSelectionMode={handleToggleSelectionMode}
            />

            {/* Selection Actions */}
            {isSelectionMode && (
              <SelectionBar
                selectedCount={selectedItems.size}
                totalCount={filteredFavorites.length}
                allSelected={selectedItems.size === filteredFavorites.length}
                onSelectAll={selectAll}
                onRemoveSelected={removeMultipleFavorites}
              />
            )}

            {/* Active Filters */}
            {(searchQuery || selectedCategory !== 'all') && (
              <ActiveFilters
                searchQuery={searchQuery}
                selectedCategoryName={selectedCategoryName}
                onClear={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              />
            )}
          </>
        )}

        {/* Content */}
        {isLoading ? (
          <FavoritesGridSkeleton viewMode={viewMode} />
        ) : filteredFavorites.length > 0 ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
            : 'space-y-3'
          }>
            {filteredFavorites.map((fav, index) => (
              <DreamCard
                key={fav.id}
                dream={fav.dreams}
                index={index}
                viewMode={viewMode}
                variant="rich"
                animation="inview"
                icon="heart"
                gradient="from-rose-400 via-pink-500 to-violet-500"
                category={fav.dreams.categories ?? null}
                showCategoryBadge
                isSelectionMode={isSelectionMode}
                isSelected={selectedItems.has(fav.id)}
                onToggleSelect={toggleSelection}
                onDelete={handleDeleteClick}
                footerDate={new Date(fav.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
              />
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <FavoritesEmpty message="Filtrelere uygun favori bulunamadı." />
        ) : (
          <NoFavorites />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteFavoriteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </Layout>
  );
}
