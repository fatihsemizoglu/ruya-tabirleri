import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dreamsApi, categoriesApi } from '@/lib/api';
import type { Dream, Category } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Loader2, Eye, Star, ChevronLeft, ChevronRight, Filter, Search, X } from 'lucide-react';
import { SEOAnalyzer } from './SEOAnalyzer';
import { SEOGenerator } from './SEOGenerator';
import { ContentSuggestionsGenerator } from './ContentSuggestionsGenerator';
import { InternalLinkGenerator } from './InternalLinkGenerator';
import { toast } from 'sonner';
import { BulkActions, useSelection } from './BulkActions';

const dreamSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır').max(200),
  slug: z.string().min(3, 'Slug en az 3 karakter olmalıdır').max(200).regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  content: z.string().min(50, 'İçerik en az 50 karakter olmalıdır'),
  islamic_interpretation: z.string().optional(),
  psychological_interpretation: z.string().optional(),
  category_id: z.string().optional(),
  keywords: z.string().optional(),
  meta_title: z.string().max(60).optional(),
  meta_description: z.string().max(160).optional(),
  is_published: z.boolean().default(true),
  is_featured: z.boolean().default(false),
});

type DreamFormValues = z.infer<typeof dreamSchema>;

export function DreamManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingDream, setEditingDream] = useState<Dream | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  // Fetch categories for filter and form
  const { data: categoriesResponse } = useQuery({
    queryKey: ['admin-categories-select'],
    queryFn: async () => {
      const response = await categoriesApi.getAll();
      if (!response.success) throw new Error(response.error || 'Failed to fetch categories');
      return response.data || [];
    },
  });

  const categories = categoriesResponse || [];

  // Fetch dreams with pagination, category filter and search
  const { data: dreamsResponse, isLoading } = useQuery({
    queryKey: ['admin-dreams', currentPage, selectedCategory, searchQuery],
    queryFn: async () => {
      const response = await dreamsApi.getAll({ 
        page: currentPage, 
        limit: itemsPerPage,
        category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined
      });
      if (!response.success) throw new Error(response.error || 'Failed to fetch dreams');
      return {
        dreams: response.data || [],
        pagination: response.pagination
      };
    },
  });

  const dreams = dreamsResponse?.dreams || [];
  const pagination = dreamsResponse?.pagination;

  // Update total pages from pagination
  useEffect(() => {
    if (pagination) {
      setTotalPages(pagination.totalPages || 1);
    }
  }, [pagination]);

  // Reset page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const selection = useSelection(dreams);

  const form = useForm<DreamFormValues>({
    resolver: zodResolver(dreamSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      islamic_interpretation: '',
      psychological_interpretation: '',
      category_id: '',
      keywords: '',
      meta_title: '',
      meta_description: '',
      is_published: true,
      is_featured: false,
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    setEditingDream(null);
    form.reset();
  };

  const handleEdit = (dream: Dream) => {
    setEditingDream(dream);
    setIsOpen(true);
    form.reset({
      title: dream.title,
      slug: dream.slug,
      content: dream.content,
      islamic_interpretation: dream.islamic_interpretation || '',
      psychological_interpretation: dream.psychological_interpretation || '',
      category_id: dream.category_id || '',
      keywords: Array.isArray(dream.keywords) ? dream.keywords.join(', ') : '',
      meta_title: dream.meta_title || '',
      meta_description: dream.meta_description || '',
      is_published: dream.is_published,
      is_featured: dream.is_featured,
    });
  };

  const handleDelete = async (dream: Dream) => {
    if (!confirm(`"${dream.title}" rüya tabirini silmek istediğinize emin misiniz?`)) {
      return;
    }
    deleteMutation.mutate(dream.id);
  };

  const onSubmit = (values: DreamFormValues) => {
    if (editingDream) {
      updateMutation.mutate({ id: editingDream.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const createMutation = useMutation({
    mutationFn: async (values: DreamFormValues) => {
      const keywordsArray = values.keywords
        ? values.keywords.split(',').map((k) => k.trim()).filter(Boolean)
        : [];
      
      const response = await dreamsApi.create({
        title: values.title,
        slug: values.slug,
        content: values.content,
        islamic_interpretation: values.islamic_interpretation || null,
        psychological_interpretation: values.psychological_interpretation || null,
        category_id: values.category_id || null,
        keywords: keywordsArray,
        meta_title: values.meta_title || null,
        meta_description: values.meta_description || null,
        is_published: values.is_published,
        is_featured: values.is_featured,
      });
      
      if (!response.success) throw new Error(response.error || 'Failed to create dream');
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
      
      const response = await dreamsApi.update(id, {
        title: values.title,
        slug: values.slug,
        content: values.content,
        islamic_interpretation: values.islamic_interpretation || null,
        psychological_interpretation: values.psychological_interpretation || null,
        category_id: values.category_id || null,
        keywords: keywordsArray,
        meta_title: values.meta_title || null,
        meta_description: values.meta_description || null,
        is_published: values.is_published,
        is_featured: values.is_featured,
      });
      
      if (!response.success) throw new Error(response.error || 'Failed to update dream');
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
      const response = await dreamsApi.delete(id);
      if (!response.success) throw new Error(response.error || 'Failed to delete dream');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dreams'] });
      toast.success('Rüya tabiri başarıyla silindi');
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header - Large Card Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 border p-6 group hover:shadow-xl transition-all duration-300">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-10 -translate-x-10" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Rüya Tabirleri
            </h2>
            <p className="text-muted-foreground mt-1">
              Rüya tabirlerini ekleyin, düzenleyin ve yönetin
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rüya ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-[220px] bg-white/70 dark:bg-black/70 backdrop-blur-sm border-white/30 dark:border-white/20"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2 bg-white/70 dark:bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px] border-0 bg-transparent shadow-none focus:ring-0">
                <SelectValue placeholder="Tüm Kategoriler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setEditingDream(null)}
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yeni Rüya Tabiri
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingDream ? 'Rüya Tabiri Düzenle' : 'Yeni Rüya Tabiri Ekle'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Başlık</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                if (!editingDream) {
                                  form.setValue('slug', generateSlug(e.target.value));
                                }
                              }}
                              placeholder="Örn: Yılan Görmek"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug (URL)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Örn: yilan-gormek" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Kategori seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İçerik</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Rüya tabirinin açıklamasını yazın..."
                            className="min-h-[150px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="islamic_interpretation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>İslami Yorum</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="İslami açıdan yorumu..."
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="psychological_interpretation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Psikolojik Yorum</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Psikolojik açıdan yorumu..."
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anahtar Kelimeler (virgülle ayırın)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Örn: yılan, köpek, uçuş" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="meta_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Başlık</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="SEO için başlık" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="meta_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Açıklama</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="SEO için açıklama" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-6">
                    <FormField
                      control={form.control}
                      name="is_published"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Yayınla</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="is_featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Öne Çıkan</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {editingDream && (
                    <div className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium">SEO Araçları</h4>
                      <SEOAnalyzer content={form.watch('content') || ''} title={form.watch('title') || ''} />
                      <SEOGenerator 
                        title={form.watch('title') || ''}
                        content={form.watch('content') || ''}
                        type="dream"
                        onGenerated={(metaTitle, metaDescription) => {
                          form.setValue('meta_title', metaTitle);
                          form.setValue('meta_description', metaDescription);
                        }}
                      />
                      <ContentSuggestionsGenerator 
                        title={form.watch('title') || ''}
                        content={form.watch('content') || ''}
                        currentKeywords={form.watch('keywords')?.split(',').map(k => k.trim()).filter(Boolean) || []}
                        onKeywordsSelected={(keywords) => form.setValue('keywords', keywords.join(', '))}
                      />
                      <InternalLinkGenerator 
                        content={form.watch('content') || ''}
                        onContentUpdated={(content) => form.setValue('content', content)}
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleClose}>
                      İptal
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {(createMutation.isPending || updateMutation.isPending) && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {editingDream ? 'Güncelle' : 'Oluştur'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : dreams && dreams.length > 0 ? (
        <div className="space-y-4">
          <BulkActions 
            selectedIds={selection.selectedIds}
            onClearSelection={selection.clearSelection}
            type="dreams"
          />
          <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5" />
            <div className="relative bg-white/80 dark:bg-black/80 backdrop-blur-xl">
              <Table>
              <TableHeader className="bg-gradient-to-r from-muted/80 to-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 font-semibold">
                    <Checkbox 
                      checked={selection.isAllSelected}
                      onCheckedChange={selection.toggleAll}
                      aria-label="Tümünü seç"
                    />
                  </TableHead>
                  <TableHead className="font-semibold">Başlık</TableHead>
                  <TableHead className="font-semibold">Kategori</TableHead>
                  <TableHead className="text-center font-semibold">Görüntüleme</TableHead>
                  <TableHead className="text-center font-semibold">Durum</TableHead>
                  <TableHead className="text-right font-semibold">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dreams.map((dream, index) => (
                  <TableRow 
                    key={dream.id} 
                    className={`${selection.isSelected(dream.id) ? 'bg-primary/5' : ''} hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all duration-200 group`}
                  >
                    <TableCell>
                      <Checkbox 
                        checked={selection.isSelected(dream.id)}
                        onCheckedChange={() => selection.toggleItem(dream.id)}
                        aria-label={`${dream.title} seç`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium group-hover:text-primary transition-colors">{dream.title}</span>
                        {dream.is_featured && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dream.category_name || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        {dream.view_count || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${dream.is_published 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-sm' 
                        : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0 shadow-sm'}`}>
                        {dream.is_published ? 'Yayında' : 'Taslak'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                          onClick={() => handleEdit(dream)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-red-500/10 hover:text-red-500 transition-colors"
                          onClick={() => handleDelete(dream)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t bg-muted/30">
                <div className="text-sm text-muted-foreground">
                  Sayfa {currentPage} / {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Önceki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sonraki
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/50 rounded-xl">
          <p className="text-muted-foreground">Henüz rüya tabiri bulunmuyor.</p>
        </div>
      )}
    </div>
  );
}
