import { useState, useEffect, useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Heart, Trash2, Eye, Search, SortAsc, Grid3X3, List, Calendar, TrendingUp, Filter, ArrowUpDown, Check, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
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
import { usersApi, categoriesApi } from '@/lib/api';
import type { Favorite, Dream, Category } from '@/types/database';

type SortOption = 'newest' | 'oldest' | 'views' | 'likes' | 'title';
type ViewMode = 'grid' | 'list';

export default function Favorites() {
  const { user, isLoading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<(Favorite & { dreams: Dream & { categories?: Category } })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchFavorites();
      fetchCategories();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const response = await usersApi.getFavorites();

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch favorites');
      }

      setFavorites((response.data as (Favorite & { dreams: Dream & { categories?: Category } })[]) || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    const response = await categoriesApi.getAll();
    
    if (response.success && response.data) {
      setCategories(response.data as Category[]);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      const response = await usersApi.removeFavorite(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to remove favorite');
      }

      toast.success('Favorilerden kaldırıldı');
      setFavorites(favorites.filter(f => f.id !== id));
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu');
    }
  };

  const removeMultipleFavorites = async () => {
    try {
      // Remove favorites one by one since the API doesn't support batch delete
      const promises = Array.from(selectedItems).map(id => usersApi.removeFavorite(id));
      const results = await Promise.all(promises);
      
      const hasErrors = results.some(r => !r.success);
      if (hasErrors) {
        throw new Error('Some favorites could not be removed');
      }

      toast.success(`${selectedItems.size} favori kaldırıldı`);
      setFavorites(favorites.filter(f => !selectedItems.has(f.id)));
      setSelectedItems(new Set());
      setIsSelectionMode(false);
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu');
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

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(fav => 
        fav.dreams.title.toLowerCase().includes(query) ||
        fav.dreams.content.toLowerCase().includes(query) ||
        fav.dreams.keywords?.some(k => k.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(fav => fav.dreams.category_id === selectedCategory);
    }

    // Sort
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

  // Get unique categories from favorites
  const favoriteCategories = useMemo(() => {
    const categoryIds = new Set(favorites.map(f => f.dreams.category_id).filter(Boolean));
    return categories.filter(c => categoryIds.has(c.id));
  }, [favorites, categories]);

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/giris" replace />;
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold">Favorilerim</h1>
            <p className="text-muted-foreground mt-1">
              {favorites.length} rüya tabiri kaydettin
            </p>
          </div>
          {favorites.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant={isSelectionMode ? 'default' : 'outline'}
                size="sm"
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
          )}
        </div>

        {favorites.length > 0 && (
          <>
            {/* Filters & Controls */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Favorilerde ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Kategoriler</SelectItem>
                    {favoriteCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
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
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Selection Actions */}
            {isSelectionMode && (
              <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-xl">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {selectedItems.size === filteredFavorites.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedItems.size} öğe seçildi
                </span>
                {selectedItems.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={removeMultipleFavorites}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Seçilenleri Sil
                  </Button>
                )}
              </div>
            )}

            {/* Active Filters */}
            {(searchQuery || selectedCategory !== 'all') && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-muted-foreground">Filtreler:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Arama: {searchQuery}
                    <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {categories.find(c => c.id === selectedCategory)?.name}
                    <button onClick={() => setSelectedCategory('all')} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="text-xs"
                >
                  Tümünü Temizle
                </Button>
              </div>
            )}
          </>
        )}

        {/* Content */}
        {isLoading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`bg-muted rounded-xl animate-pulse ${viewMode === 'grid' ? 'h-48' : 'h-24'}`} />
            ))}
          </div>
        ) : filteredFavorites.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFavorites.map((fav) => (
                <div 
                  key={fav.id} 
                  className={`dream-card group relative transition-all duration-200 ${
                    isSelectionMode && selectedItems.has(fav.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => isSelectionMode && toggleSelection(fav.id)}
                >
                  {/* Selection Checkbox */}
                  {isSelectionMode && (
                    <div className={`absolute top-3 left-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedItems.has(fav.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/50 bg-background'
                    }`}>
                      {selectedItems.has(fav.id) && <Check className="h-4 w-4" />}
                    </div>
                  )}

                  {/* Category Badge */}
                  {fav.dreams.categories && (
                    <Badge variant="secondary" className="mb-3 text-xs">
                      {(fav.dreams.categories as Category).icon} {(fav.dreams.categories as Category).name}
                    </Badge>
                  )}

                  <Link to={`/ruya/${fav.dreams.slug}`} className={isSelectionMode ? 'pointer-events-none' : ''}>
                    <h3 className="text-xl font-serif font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {fav.dreams.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {fav.dreams.content}
                    </p>
                  </Link>

                  {/* Keywords */}
                  {Array.isArray(fav.dreams.keywords) && fav.dreams.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {fav.dreams.keywords.slice(0, 3).map((keyword) => (
                        <span key={keyword} className="text-xs px-2 py-0.5 rounded-full bg-muted">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {(fav.dreams.view_count || 0).toLocaleString('tr-TR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {(fav.dreams.like_count || 0).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    {!isSelectionMode && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(fav.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Added date */}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(fav.created_at).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })} tarihinde eklendi
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFavorites.map((fav) => (
                <div 
                  key={fav.id} 
                  className={`flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all group ${
                    isSelectionMode && selectedItems.has(fav.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => isSelectionMode && toggleSelection(fav.id)}
                >
                  {/* Selection Checkbox */}
                  {isSelectionMode && (
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selectedItems.has(fav.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/50 bg-background'
                    }`}>
                      {selectedItems.has(fav.id) && <Check className="h-4 w-4" />}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {fav.dreams.categories && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {(fav.dreams.categories as Category).icon} {(fav.dreams.categories as Category).name}
                        </Badge>
                      )}
                    </div>
                    <Link to={`/ruya/${fav.dreams.slug}`} className={isSelectionMode ? 'pointer-events-none' : ''}>
                      <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-1">
                        {fav.dreams.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{fav.dreams.content}</p>
                    </Link>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {(fav.dreams.view_count || 0).toLocaleString('tr-TR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {(fav.dreams.like_count || 0).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    {!isSelectionMode && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(fav.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : favorites.length > 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif font-semibold mb-2">Sonuç bulunamadı</h3>
            <p className="text-muted-foreground mb-6">
              Arama kriterlerinize uygun favori bulunamadı.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Filtreleri Temizle
            </Button>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif font-semibold mb-2">Henüz favori eklemediniz</h3>
            <p className="text-muted-foreground mb-6">
              Beğendiğiniz rüya tabirlerini favorilerinize ekleyin.
            </p>
            <Button asChild className="dream-gradient">
              <Link to="/">Rüya Tabirlerine Göz At</Link>
            </Button>
          </div>
        )}

        {/* Statistics */}
        {favorites.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-lg font-serif font-semibold mb-4">İstatistikler</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="dream-card text-center">
                <Heart className="h-6 w-6 mx-auto mb-2 text-pink-500" />
                <p className="text-2xl font-bold">{favorites.length}</p>
                <p className="text-xs text-muted-foreground">Toplam Favori</p>
              </div>
              <div className="dream-card text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">
                  {favorites.reduce((sum, f) => sum + (f.dreams.view_count || 0), 0).toLocaleString('tr-TR')}
                </p>
                <p className="text-xs text-muted-foreground">Toplam Görüntülenme</p>
              </div>
              <div className="dream-card text-center">
                <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
                <p className="text-2xl font-bold">
                  {favorites.reduce((sum, f) => sum + (f.dreams.like_count || 0), 0).toLocaleString('tr-TR')}
                </p>
                <p className="text-xs text-muted-foreground">Toplam Beğeni</p>
              </div>
              <div className="dream-card text-center">
                <Filter className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{favoriteCategories.length}</p>
                <p className="text-xs text-muted-foreground">Farklı Kategori</p>
              </div>
            </div>
          </div>
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
