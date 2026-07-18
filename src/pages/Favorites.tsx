import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Trash2, Eye, Search, SortAsc, Grid3X3, List, Calendar, TrendingUp, Filter, ArrowUpDown, Check, X, ArrowUpRight, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState as PremiumEmptyState } from '@/components/ui/empty-state';
import { Layout } from '@/components/layout/Layout';
import { PremiumBackground, PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { captureError } from '@/lib/logger';
import type { Favorite, Dream, Category } from '@/types/database';

type SortOption = 'newest' | 'oldest' | 'views' | 'likes' | 'title';
type ViewMode = 'grid' | 'list';

export default function Favorites() {
  const { user, isLoading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<(Favorite & { dreams: Dream & { categories?: Category } })[]>([]);
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
      setFavorites((data as (Favorite & { dreams: Dream & { categories?: Category } })[]) || []);
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

  const selectAll = () => {
    if (selectedItems.size === filteredFavorites.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredFavorites.map(f => f.id)));
    }
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

  const stats = [
    {
      icon: Heart,
      value: favorites.length.toString(),
      label: 'Toplam Favori',
      color: 'from-rose-500 to-pink-500',
      bg: 'bg-rose-500/10',
      text: 'text-rose-600 dark:text-rose-400',
    },
    {
      icon: Eye,
      value: favorites.reduce((sum, f) => sum + (f.dreams.view_count || 0), 0).toLocaleString('tr-TR'),
      label: 'Görüntülenme',
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
      text: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: Heart,
      value: favorites.reduce((sum, f) => sum + (f.dreams.like_count || 0), 0).toLocaleString('tr-TR'),
      label: 'Beğeni',
      color: 'from-red-500 to-orange-500',
      bg: 'bg-red-500/10',
      text: 'text-red-600 dark:text-red-400',
    },
    {
      icon: Filter,
      value: favoriteCategories.length.toString(),
      label: 'Farklı Kategori',
      color: 'from-violet-500 to-purple-500',
      bg: 'bg-violet-500/10',
      text: 'text-violet-600 dark:text-violet-400',
    },
  ];

  if (authLoading) {
    return (
      <Layout>
        <PremiumBackground variant="soft" className="absolute -top-20" />
        <div className="container py-8 md:py-12 relative">
          <div className="text-center mb-10">
            <Skeleton className="h-8 w-48 mx-auto mb-3" />
            <Skeleton className="h-10 w-72 mx-auto mb-3" />
            <Skeleton className="h-5 w-56 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500/30 via-pink-500/30 to-violet-500/30" />
                <div className="flex items-start justify-between mb-4">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-6 w-4/5 mb-3" />
                <div className="space-y-2 mb-5">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-11/12" />
                  <Skeleton className="h-3.5 w-3/4" />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/40">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/giris" replace />;
  }

  const DreamCard = ({ fav, index }: { fav: Favorite & { dreams: Dream & { categories?: Category } }; index: number }) => {
    const category = fav.dreams.categories as Category | undefined;
    const isSelected = selectedItems.has(fav.id);

    if (viewMode === 'list') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.3, delay: index * 0.02 }}
        >
          <div
            className={`group relative flex items-center gap-4 bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 ${
              isSelectionMode && isSelected ? 'ring-2 ring-primary' : ''
            }`}
          >
            {/* Top gradient bar (list) */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-pink-500 to-violet-500 rounded-t-2xl" />

            {isSelectionMode && (
              <button
                type="button"
                onClick={() => toggleSelection(fav.id)}
                className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/50 bg-background hover:border-primary'
                }`}
                aria-label={isSelected ? 'Seçimi kaldır' : 'Seç'}
              >
                {isSelected && <Check className="h-4 w-4" />}
              </button>
            )}

            {/* Heart icon (rank visual) */}
            <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-lg">
              <Heart className="h-4 w-4 fill-current" />
            </div>

            <Link
              to={`/ruya/${fav.dreams.slug}`}
              className={`flex-1 min-w-0 ${isSelectionMode ? 'pointer-events-none' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {category && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <CategoryIcon icon={category.icon} className="h-3.5 w-3.5" /> {category.name}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {fav.dreams.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {fav.dreams.content}
              </p>
            </Link>

            <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-sm text-muted-foreground">
              <div className="hidden sm:flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                <span className="font-medium text-xs">
                  {(fav.dreams.view_count || 0).toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" />
                <span className="font-medium text-xs">
                  {(fav.dreams.like_count || 0).toLocaleString('tr-TR')}
                </span>
              </div>
              <Link
                to={`/ruya/${fav.dreams.slug}`}
                className={`w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isSelectionMode ? 'hidden' : ''}`}
                onClick={(e) => e.stopPropagation()}
                aria-label="Rüyayı görüntüle"
              >
                <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
              </Link>
              {!isSelectionMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(fav.id);
                  }}
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                  aria-label="Favorilerden kaldır"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.4, delay: index * 0.03 }}
      >
        <div
          className={`group relative h-full bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-500 ${
            isSelectionMode && isSelected ? 'ring-2 ring-primary' : ''
          }`}
        >
          {/* Top gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-pink-500 to-violet-500" />

          {/* Hover shine */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none z-10" />

          {/* Selection checkbox (overlay) */}
          {isSelectionMode && (
            <button
              type="button"
              onClick={() => toggleSelection(fav.id)}
              className={`absolute top-3 left-3 z-20 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground scale-110'
                  : 'border-muted-foreground/50 bg-background/90 backdrop-blur-sm hover:border-primary'
              }`}
              aria-label={isSelected ? 'Seçimi kaldır' : 'Seç'}
            >
              {isSelected && <Check className="h-4 w-4" />}
            </button>
          )}

          {/* Delete button (overlay) */}
          {!isSelectionMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleDeleteClick(fav.id);
              }}
              className="absolute top-2 right-2 z-20 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 bg-background/80 backdrop-blur-sm"
              aria-label="Favorilerden kaldır"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}

          <Link
            to={`/ruya/${fav.dreams.slug}`}
            className={`block h-full p-6 ${isSelectionMode ? 'pointer-events-none' : ''}`}
          >
            <div className="relative">
              {/* Top row: heart icon + category */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-lg">
                    <Heart className="h-4 w-4 fill-current" />
                  </div>
                </div>
                {category && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <CategoryIcon icon={category.icon} className="h-3.5 w-3.5" /> {category.name}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h3 className="font-bold font-serif-dream text-lg text-foreground mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                {fav.dreams.title}
              </h3>

              {/* Excerpt */}
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                {fav.dreams.content}
              </p>

              {/* Keywords */}
              {fav.dreams.keywords && fav.dreams.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {fav.dreams.keywords.slice(0, 3).map((keyword) => (
                    <span
                      key={keyword}
                      className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer stats */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    <span className="font-semibold">{(fav.dreams.view_count || 0).toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    <span className="font-semibold">{(fav.dreams.like_count || 0).toLocaleString('tr-TR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground/70">
                    {new Date(fav.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </motion.div>
    );
  };

  const LoadingSkeleton = () => (

    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3'}>
      {Array.from({ length: 6 }).map((_, i) =>
        viewMode === 'grid' ? (
          <div key={i} className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500/30 via-pink-500/30 to-violet-500/30" />
            <div className="flex items-start justify-between mb-4">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-6 w-4/5 mb-3" />
            <div className="space-y-2 mb-5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-11/12" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
          </div>
        ) : (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5 bg-card border border-border/40 rounded-xl">
            <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        )
      )}
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="bg-card border border-border/40 rounded-2xl">
      <PremiumEmptyState
        icon="search"
        title={message}
        description="Filtreleri değiştirerek veya aramayı temizleyerek yeni sonuçlar keşfedebilirsiniz."
      />
    </div>
  );

  return (
    <Layout>
      <PremiumBackground variant="soft" className="absolute -top-20" />
      <div className="container py-8 md:py-12 relative">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <PremiumBadge>
              <Heart className="h-3.5 w-3.5" />
              Favori Koleksiyonum
            </PremiumBadge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.025em] text-foreground mb-3 leading-[1.05]"
          >
            <GradientText>Favorilerim</GradientText>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Kaydettiğin rüya tabirlerini yönet ve keşfet.
          </motion.p>
        </div>

        {/* Stats Cards */}
        {!isLoading && favorites.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="group bg-card border border-border/50 rounded-2xl p-4 sm:p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`h-4.5 w-4.5 ${stat.text}`} />
                  </div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold font-serif-dream text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {favorites.length > 0 && (
          <>
            {/* Sticky Filters Bar */}
            <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl p-3 mb-6 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Favorilerde ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 rounded-xl bg-muted/30 border-border/50 focus-visible:bg-background"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Category Filter */}
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[170px] h-10 rounded-xl bg-muted/30 border-border/50">
                      <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Kategoriler</SelectItem>
                      {favoriteCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <CategoryIcon icon={category.icon} className="h-4 w-4" /> {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sort */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-10 rounded-xl bg-muted/30 border-border/50">
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        Sırala
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Sıralama</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSortBy('newest')}>
                        <Calendar className="h-4 w-4 mr-2" />
                        En Yeni
                        {sortBy === 'newest' && <Check className="h-4 w-4 ml-auto" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                        <Calendar className="h-4 w-4 mr-2" />
                        En Eski
                        {sortBy === 'oldest' && <Check className="h-4 w-4 ml-auto" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('views')}>
                        <Eye className="h-4 w-4 mr-2" />
                        En Çok Görüntülenen
                        {sortBy === 'views' && <Check className="h-4 w-4 ml-auto" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('likes')}>
                        <Heart className="h-4 w-4 mr-2" />
                        En Çok Beğenilen
                        {sortBy === 'likes' && <Check className="h-4 w-4 ml-auto" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('title')}>
                        <SortAsc className="h-4 w-4 mr-2" />
                        Alfabetik
                        {sortBy === 'title' && <Check className="h-4 w-4 ml-auto" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* View Mode */}
                  <div className="flex items-center border border-border/50 rounded-xl overflow-hidden bg-muted/30">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                      className={`h-10 w-10 rounded-none ${
                        viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                      className={`h-10 w-10 rounded-none ${
                        viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Selection Mode Toggle */}
                  <Button
                    variant={isSelectionMode ? 'default' : 'outline'}
                    className="h-10 rounded-xl"
                    onClick={() => {
                      setIsSelectionMode(!isSelectionMode);
                      setSelectedItems(new Set());
                    }}
                  >
                    {isSelectionMode ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        İptal
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Seç
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Selection Actions */}
            {isSelectionMode && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-2xl border border-border/50"
              >
                <Button variant="outline" size="sm" className="rounded-xl" onClick={selectAll}>
                  {selectedItems.size === filteredFavorites.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                </Button>
                <span className="text-sm text-muted-foreground font-medium">
                  {selectedItems.size} öğe seçildi
                </span>
                {selectedItems.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-xl"
                    onClick={removeMultipleFavorites}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Seçilenleri Sil
                  </Button>
                )}
              </motion.div>
            )}

            {/* Active Filters */}
            {(searchQuery || selectedCategory !== 'all') && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mb-6 text-sm text-muted-foreground flex-wrap"
              >
                <span>Filtreler:</span>
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="rounded-full">
                    {categories.find(c => c.id === selectedCategory)?.name}
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="rounded-full">
                    "{searchQuery}"
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="text-xs h-7 rounded-full"
                >
                  Temizle
                </Button>
              </motion.div>
            )}
          </>
        )}

        {/* Content */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : filteredFavorites.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFavorites.map((fav, index) => (
                <DreamCard key={fav.id} fav={fav} index={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFavorites.map((fav, index) => (
                <DreamCard key={fav.id} fav={fav} index={index} />
              ))}
            </div>
          )
        ) : favorites.length > 0 ? (
          <EmptyState message="Filtrelere uygun favori bulunamadı." />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card border border-border/40 rounded-2xl"
          >
            <PremiumEmptyState
              icon={Heart}
              title="Henüz favori eklemediniz"
              description="Beğendiğiniz rüya tabirlerini favorilerinize ekleyerek koleksiyonunuzu oluşturun."
            />
            <div className="flex justify-center pb-8">
              <Button asChild className="rounded-xl">
                <Link to="/">Rüya Tabirlerine Göz At</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Favoriden kaldırmak istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu rüya tabiri favorilerinizden kaldırılacaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Kaldır
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
