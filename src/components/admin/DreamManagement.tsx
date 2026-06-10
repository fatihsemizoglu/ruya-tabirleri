import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Star, BookOpen, Check, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import { DreamForm, type DreamFormValues } from './DreamForm';
import { SkeletonAdminRow } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { BulkActions } from './BulkActions';
import { useSelection } from '@/hooks/useSelection';
import { AdminPageHeader } from './common/AdminPageHeader';
import { AdminStatsCards } from './common/AdminStatsCards';

type Dream = Tables<'dreams'>;
type Category = Tables<'categories'>;

const dreamSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır').max(200),
  slug: z.string().min(3, 'Slug en az 3 karakter olmalıdır').max(200).regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  content: z.string().min(50, 'İçerik en az 50 karakter olmalıdır'),
  category_id: z.string().optional(),
  keywords: z.string().optional(),
  meta_title: z.string().max(60).optional(),
  meta_description: z.string().max(160).optional(),
  is_published: z.boolean().default(true),
  is_featured: z.boolean().default(false),
});

export type { DreamFormValues };

const PAGE_SIZE = 50;

export function DreamManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingDream, setEditingDream] = useState<Dream | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Toplam rüya sayısını çek (filtreye göre server-side)
  const { data: totalCount } = useQuery({
    queryKey: ['admin-dreams-count', statusFilter, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('dreams')
        .select('*', { count: 'exact', head: true });

      if (statusFilter === 'published') query = query.eq('is_published', true);
      if (statusFilter === 'draft') query = query.eq('is_published', false);
      if (statusFilter === 'featured') query = query.eq('is_featured', true);
      if (categoryFilter !== 'all') query = query.eq('category_id', categoryFilter);

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    staleTime: 30000,
  });

  const { data: dreams, isLoading } = useQuery({
    queryKey: ['admin-dreams', currentPage, statusFilter, categoryFilter],
    queryFn: async () => {
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('dreams')
        .select('*, categories(name, slug)')
        .order('created_at', { ascending: false });

      // Server-side filtreleme (daha hızlı - az veri çekilir)
      if (statusFilter === 'published') query = query.eq('is_published', true);
      if (statusFilter === 'draft') query = query.eq('is_published', false);
      if (statusFilter === 'featured') query = query.eq('is_featured', true);
      if (categoryFilter !== 'all') query = query.eq('category_id', categoryFilter);

      const { data, error } = await query.range(from, to);
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  type DreamWithCategory = Dream & { categories: { name: string; slug: string } | null };
  const filteredDreams = (dreams as DreamWithCategory[] | undefined)?.filter((dream) => {
    const matchesSearch = 
      dream.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      dream.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'published') return matchesSearch && dream.is_published;
    if (statusFilter === 'draft') return matchesSearch && !dream.is_published;
    if (statusFilter === 'featured') return matchesSearch && dream.is_featured;
    return matchesSearch;
  }) || [];

  const selection = useSelection(filteredDreams);

  const form = useForm<DreamFormValues>({
    resolver: zodResolver(dreamSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      category_id: '',
      keywords: '',
      meta_title: '',
      meta_description: '',
      is_published: true,
      is_featured: false,
    },
  });


  const { data: categories } = useQuery({
    queryKey: ['admin-categories-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data as Pick<Category, 'id' | 'name'>[];
    },
    staleTime: Infinity, // Static data
    gcTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (values: DreamFormValues) => {
      const keywordsArray = values.keywords
        ? values.keywords.split(',').map((k) => k.trim()).filter(Boolean)
        : [];
      
      const { error } = await supabase.from('dreams').insert({
        title: values.title,
        slug: values.slug,
        content: values.content,
        category_id: values.category_id || null,
        keywords: keywordsArray,
        meta_title: values.meta_title || null,
        meta_description: values.meta_description || null,
        is_published: values.is_published,
        is_featured: values.is_featured,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dreams'] });
      toast.success('Rüya tabiri başarıyla oluşturuldu');
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: DreamFormValues }) => {
      const keywordsArray = values.keywords
        ? values.keywords.split(',').map((k) => k.trim()).filter(Boolean)
        : [];
      
      const { error } = await supabase
        .from('dreams')
        .update({
          title: values.title,
          slug: values.slug,
          content: values.content,
          category_id: values.category_id || null,
          keywords: keywordsArray,
          meta_title: values.meta_title || null,
          meta_description: values.meta_description || null,
          is_published: values.is_published,
          is_featured: values.is_featured,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dreams'] });
      toast.success('Rüya tabiri başarıyla güncellendi');
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dreams').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dreams'] });
      toast.success('Rüya tabiri başarıyla silindi');
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    setEditingDream(null);
    form.reset({
      title: '',
      slug: '',
      content: '',
      category_id: '',
      keywords: '',
      meta_title: '',
      meta_description: '',
      is_published: true,
      is_featured: false,
    });
  };

  const handleEdit = (dream: Dream) => {
    setEditingDream(dream);
    form.reset({
      title: dream.title,
      slug: dream.slug,
      content: dream.content,
      category_id: dream.category_id || '',
      keywords: dream.keywords?.join(', ') || '',
      meta_title: dream.meta_title || '',
      meta_description: dream.meta_description || '',
      is_published: dream.is_published ?? true,
      is_featured: dream.is_featured ?? false,
    });
    setIsOpen(true);
  };

  const handleDelete = (dream: Dream) => {
    if (confirm(`"${dream.title}" rüya tabirini silmek istediğinize emin misiniz?`)) {
      deleteMutation.mutate(dream.id);
    }
  };

  const onSubmit = (values: DreamFormValues) => {
    if (editingDream) {
      updateMutation.mutate({ id: editingDream.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const totalDreams = totalCount || 0;
  const publishedDreams = dreams?.filter(d => d.is_published).length || 0;
  const featuredDreams = dreams?.filter(d => d.is_featured).length || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  const statsData: [{ label: string; value: number; subtext: string; icon: typeof BookOpen }, { label: string; value: number; subtext: string; icon: typeof Check }, { label: string; value: number; subtext: string; icon: typeof Star }] = [
    { label: 'Toplam Rüya', value: totalDreams, subtext: 'Veritabanındaki rüyalar', icon: BookOpen },
    { label: 'Yayınlanan', value: publishedDreams, subtext: 'Aktif tabirler', icon: Check },
    { label: 'Öne Çıkan', value: featuredDreams, subtext: 'Öne çıkarılan tabirler', icon: Star }
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Rüya Tabiri Yönetimi"
        description="Kullanıcıların okuyacağı rüya tabiri içeriklerini ve detaylarını yönetin"
        icon={BookOpen}
        badge={`${publishedDreams} Yayında`}
        action={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingDream(null)} className="bg-white hover:bg-white/90 text-indigo-900 rounded-xl px-4 py-2 font-bold shadow-sm flex items-center gap-2 text-sm border border-slate-200/10">
                <Plus className="w-4 h-4" />
                Yeni Rüya Tabiri
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[760px] max-w-[95vw] p-0 gap-0 bg-transparent border-0 shadow-none">
              <DialogHeader className="sr-only">
                <DialogTitle>
                  {editingDream ? 'Rüya Tabiri Düzenle' : 'Yeni Rüya Tabiri Ekle'}
                </DialogTitle>
              </DialogHeader>
              <DreamForm
                categories={categories || []}
                form={form}
                defaultValues={editingDream ? {
                  title: editingDream.title,
                  slug: editingDream.slug,
                  content: editingDream.content,
                  category_id: editingDream.category_id || '',
                  keywords: editingDream.keywords?.join(', ') || '',
                  meta_title: editingDream.meta_title || '',
                  meta_description: editingDream.meta_description || '',
                  is_published: editingDream.is_published ?? true,
                  is_featured: editingDream.is_featured ?? false,
                } : undefined}
                onSubmit={onSubmit}
                onCancel={handleClose}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <AdminStatsCards stats={statsData} />

      <div className="bg-white dark:bg-[#0b0f19]/60 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/40 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-white">Rüya Tabirleri</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {totalCount?.toLocaleString('tr-TR') || 0} toplam tabir • Sayfa {currentPage} / {totalPages} ({filteredDreams.length} gösteriliyor)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Başlık veya içerik ile ara..."
              className="bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/40 rounded-xl"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px] bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/40 rounded-xl text-slate-700 dark:text-slate-200 font-semibold text-xs md:text-sm">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/40 rounded-xl text-slate-700 dark:text-slate-200 font-semibold text-xs md:text-sm">
              <SelectValue placeholder="Durum Filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="published">Yayında</SelectItem>
              <SelectItem value="draft">Taslak</SelectItem>
              <SelectItem value="featured">Öne Çıkan</SelectItem>
            </SelectContent>
          </Select>
          {(categoryFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCategoryFilter('all');
                setCurrentPage(1);
              }}
              className="h-10 px-3 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Temizle
            </Button>
          )}
        </div>

        {selection.selectedIds.length > 0 && (
          <BulkActions 
            selectedIds={selection.selectedIds}
            onClearSelection={selection.clearSelection}
            type="dreams"
          />
        )}

        {isLoading ? (
          <SkeletonAdminRow count={6} />
        ) : filteredDreams.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/20 rounded-xl px-4 py-2 flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase select-none">
              <Checkbox
                checked={selection.isAllSelected}
                onCheckedChange={selection.toggleAll}
                aria-label="Tümünü seç"
              />
              <span>Tümünü Seç ({filteredDreams.length} Öğe)</span>
            </div>

            <div className="space-y-3">
              {filteredDreams.map((dream) => (
                <div
                  key={dream.id}
                  className={`bg-white dark:bg-slate-900/10 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-200 ${selection.isSelected(dream.id) ? 'bg-primary/5 border-primary/20' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selection.isSelected(dream.id)}
                      onCheckedChange={() => selection.toggleItem(dream.id)}
                      aria-label={`${dream.title} seç`}
                    />
                    
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <BookOpen className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        {dream.is_featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                        <span className="font-semibold text-sm text-slate-800 dark:text-white line-clamp-1">
                          {dream.title}
                        </span>
                        {dream.is_published ? (
                          <Badge variant="default" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15 border-none text-[10px] font-bold py-0 px-2 rounded-md">
                            Yayında
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] py-0 px-2 rounded-md">
                            Taslak
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          Görüntüleme: {dream.view_count || 0}
                        </span>
                        {(dream as DreamWithCategory).categories?.name && (
                          <>
                            <span className="text-slate-300 dark:text-slate-800">•</span>
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-medium text-slate-600 dark:text-slate-300">
                              {(dream as DreamWithCategory).categories!.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <button
                      onClick={() => handleEdit(dream)}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-300 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(dream)}
                      className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount || 0)} / {(totalCount || 0).toLocaleString('tr-TR')} arası gösteriliyor
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoading}
                    className="h-9 w-9 p-0 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1 px-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Sayfa</span>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md min-w-[24px] text-center">
                      {currentPage}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">/ {totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || isLoading}
                    className="h-9 w-9 p-0 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border/40 rounded-2xl">
            <EmptyState
              icon="book"
              title="Rüya tabiri bulunamadı"
              description="Aradığınız kriterlere uygun rüya tabiri bulunamadı. Filtreleri değiştirip tekrar deneyin."
              action={
                searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? {
                      label: 'Filtreleri Temizle',
                      onClick: () => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setCategoryFilter('all');
                        setCurrentPage(1);
                      },
                    }
                  : { label: 'Yeni Rüya Tabiri Ekle', onClick: () => { setEditingDream(null); setIsOpen(true); } }
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default DreamManagement;
