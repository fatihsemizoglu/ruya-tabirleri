import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Eye, Star, FileText, CalendarIcon, Clock, Check, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { BlogPost, BlogCategory } from '@/types/blog';
import { BlogForm, type BlogFormValues } from './BlogForm';
import { SkeletonAdminRow } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { AdminPageHeader } from './common/AdminPageHeader';
import { AdminStatsCards } from './common/AdminStatsCards';

const blogPostSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır').max(200),
  slug: z.string().min(3, 'Slug en az 3 karakter olmalıdır').max(200).regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  content: z.string().min(50, 'İçerik en az 50 karakter olmalıdır'),
  excerpt: z.string().max(300).optional(),
  featured_image: z.string().url('Geçerli bir URL girin').optional().or(z.literal('')),
  category_id: z.string().optional(),
  tags: z.string().optional(),
  meta_title: z.string().max(60).optional(),
  meta_description: z.string().max(160).optional(),
  is_published: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  scheduled_at: z.date().optional().nullable(),
});

type BlogPostFormValues = z.infer<typeof blogPostSchema>;

export function BlogManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      featured_image: '',
      category_id: '',
      tags: '',
      meta_title: '',
      meta_description: '',
      is_published: false,
      is_featured: false,
      scheduled_at: null,
    },
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-blog-posts', categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*, blog_categories(name)')
        .order('created_at', { ascending: false });

      // Server-side kategori filtresi (hızlı)
      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-blog-categories-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data as Pick<BlogCategory, 'id' | 'name'>[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: BlogPostFormValues) => {
      const tagsArray = values.tags
        ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      
      const { error } = await supabase.from('blog_posts').insert({
        title: values.title,
        slug: values.slug,
        content: values.content,
        excerpt: values.excerpt || null,
        featured_image: values.featured_image || null,
        category_id: values.category_id || null,
        tags: tagsArray,
        meta_title: values.meta_title || null,
        meta_description: values.meta_description || null,
        is_published: values.scheduled_at ? false : values.is_published,
        is_featured: values.is_featured,
        author_id: user?.id,
        scheduled_at: values.scheduled_at?.toISOString() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast.success('Blog yazısı başarıyla oluşturuldu');
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: BlogPostFormValues }) => {
      const tagsArray = values.tags
        ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      
      const { error } = await supabase
        .from('blog_posts')
        .update({
          title: values.title,
          slug: values.slug,
          content: values.content,
          excerpt: values.excerpt || null,
          featured_image: values.featured_image || null,
          category_id: values.category_id || null,
          tags: tagsArray,
          meta_title: values.meta_title || null,
          meta_description: values.meta_description || null,
          is_published: values.scheduled_at ? false : values.is_published,
          is_featured: values.is_featured,
          scheduled_at: values.scheduled_at?.toISOString() || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast.success('Blog yazısı başarıyla güncellendi');
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast.success('Blog yazısı başarıyla silindi');
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('blog_posts').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast.success(`${selectedIds.length} yazı silindi`);
      setSelectedIds([]);
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const bulkPublishMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('blog_posts').update({ is_published: true }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast.success(`${selectedIds.length} yazı yayınlandı`);
      setSelectedIds([]);
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    setEditingPost(null);
    form.reset({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      featured_image: '',
      category_id: '',
      tags: '',
      meta_title: '',
      meta_description: '',
      is_published: false,
      is_featured: false,
      scheduled_at: null,
    });
  };

  const handleEdit = (post: BlogPost & { blog_categories?: { name: string } | null }) => {
    setEditingPost(post);
    form.reset({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      featured_image: post.featured_image || '',
      category_id: post.category_id || '',
      tags: post.tags?.join(', ') || '',
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      is_published: post.is_published,
      is_featured: post.is_featured,
      scheduled_at: post.scheduled_at ? new Date(post.scheduled_at) : null,
    });
    setIsOpen(true);
  };

  const handleDelete = (post: BlogPost) => {
    if (confirm(`"${post.title}" yazısını silmek istediğinize emin misiniz?`)) {
      deleteMutation.mutate(post.id);
    }
  };

  const onSubmit = (values: BlogPostFormValues) => {
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, values });
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredPosts = posts?.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'published' ? post.is_published :
      statusFilter === 'draft' ? (!post.is_published && !post.scheduled_at) :
      statusFilter === 'scheduled' ? (!post.is_published && !!post.scheduled_at) :
      true;

    return matchesSearch && matchesStatus;
  }) || [];

  const toggleSelectAll = () => {
    if (filteredPosts.length > 0 && selectedIds.length === filteredPosts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPosts.map(p => p.id));
    }
  };

  const totalPosts = posts?.length || 0;
  const publishedPosts = posts?.filter(p => p.is_published).length || 0;
  const draftPosts = totalPosts - publishedPosts;

  const statsData: [{ label: string; value: number; subtext: string; icon: typeof FileText }, { label: string; value: number; subtext: string; icon: typeof Check }, { label: string; value: number; subtext: string; icon: typeof Clock }] = [
    { label: 'Toplam Blog', value: totalPosts, subtext: 'Yayınlanan ve taslak', icon: FileText },
    { label: 'Yayınlanan', value: publishedPosts, subtext: 'Aktif yazılar', icon: Check },
    { label: 'Taslaklar', value: draftPosts, subtext: 'Bekleyen içerik', icon: Clock }
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Blog Yönetimi"
        description="Finansal rehberlerinizi ve blog yazılarınızı yönetin"
        icon={FileText}
        badge={`${publishedPosts} Yayında`}
        action={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPost(null)} className="bg-white hover:bg-white/90 text-indigo-900 rounded-xl px-4 py-2 font-bold shadow-sm flex items-center gap-2 text-sm border border-slate-200/10">
                <Plus className="w-4 h-4" />
                Yeni Yazı
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[760px] max-w-[95vw] p-0 gap-0 bg-transparent border-0 shadow-none max-h-[90vh]">
              <DialogHeader className="sr-only">
                <DialogTitle>
                  {editingPost ? 'Blog Yazısı Düzenle' : 'Yeni Blog Yazısı Ekle'}
                </DialogTitle>
              </DialogHeader>
              <BlogForm
                key={editingPost?.id ?? 'new'}
                form={form}
                categories={categories || []}
                defaultValues={editingPost ? {
                  title: editingPost.title,
                  slug: editingPost.slug,
                  excerpt: editingPost.excerpt || '',
                  content: editingPost.content,
                  featured_image: editingPost.featured_image || '',
                  category_id: editingPost.category_id || '',
                  tags: editingPost.tags?.join(', ') || '',
                  meta_title: editingPost.meta_title || '',
                  meta_description: editingPost.meta_description || '',
                  is_published: editingPost.is_published,
                  is_featured: editingPost.is_featured,
                  scheduled_at: editingPost.scheduled_at ? new Date(editingPost.scheduled_at) : null,
                } : undefined}
                onSubmit={onSubmit}
                onCancel={handleClose}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
                extraSections={
                  <div className="space-y-4 pt-2">
                    {/* Zamanlama */}
                    <FormField
                      control={form.control}
                      name="scheduled_at"
                      render={({ field }) => (
                        <FormItem className="rounded-xl border border-border/60 bg-card p-4">
                          <FormLabel className="flex items-center gap-1.5 text-sm font-semibold">
                            <Clock className="h-3.5 w-3.5" />
                            Zamanlı Yayın (İsteğe Bağlı)
                          </FormLabel>
                          <div className="flex items-center gap-2 mt-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "flex-1 justify-start text-left font-normal rounded-xl",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? (
                                      format(field.value, "d MMM yyyy HH:mm", { locale: tr })
                                    ) : (
                                      <span>Yayın tarihi seçin</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value || undefined}
                                  onSelect={(date) => {
                                    if (date) {
                                      const now = new Date();
                                      date.setHours(now.getHours());
                                      date.setMinutes(now.getMinutes());
                                    }
                                    field.onChange(date);
                                  }}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                  className="p-3 pointer-events-auto"
                                />
                                {field.value && (
                                  <div className="p-3 border-t">
                                    <FormLabel className="text-xs">Saat</FormLabel>
                                    <Input
                                      type="time"
                                      value={field.value ? format(field.value, "HH:mm") : ""}
                                      onChange={(e) => {
                                        if (field.value && e.target.value) {
                                          const [hours, minutes] = e.target.value.split(':');
                                          const newDate = new Date(field.value);
                                          newDate.setHours(parseInt(hours), parseInt(minutes));
                                          field.onChange(newDate);
                                        }
                                      }}
                                      className="mt-1"
                                    />
                                  </div>
                                )}
                              </PopoverContent>
                            </Popover>
                            {field.value && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => field.onChange(null)}
                                className="rounded-xl"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {field.value && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                              <Clock className="h-3 w-3" />
                              Bu yazı {format(field.value, "d MMMM yyyy 'saat' HH:mm", { locale: tr })} tarihinde otomatik yayınlanacak
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                }
              />
            </DialogContent>
          </Dialog>
        }
      />

      <AdminStatsCards stats={statsData} />

      <div className="bg-white dark:bg-[#0b0f19]/60 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/40 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-white">Blog Yazıları</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {filteredPosts.length} yazı ({filteredPosts.length > 0 ? `1-${filteredPosts.length}` : '0-0'} gösteriliyor)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Başlık veya özet ile ara..."
              className="bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/40 rounded-xl"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/40 rounded-xl text-slate-700 dark:text-slate-200 font-semibold text-xs md:text-sm">
              <SelectValue placeholder="Durum Filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="published">Yayında</SelectItem>
              <SelectItem value="draft">Taslak</SelectItem>
              <SelectItem value="scheduled">Zamanlanmış</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
            <span className="text-sm font-medium">{selectedIds.length} yazı seçildi</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkPublishMutation.mutate(selectedIds)}
              disabled={bulkPublishMutation.isPending}
            >
              Toplu Yayınla
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm(`${selectedIds.length} yazıyı silmek istediğinize emin misiniz?`)) {
                  bulkDeleteMutation.mutate(selectedIds);
                }
              }}
              disabled={bulkDeleteMutation.isPending}
            >
              Toplu Sil
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
              İptal
            </Button>
          </div>
        )}

        {isLoading ? (
          <SkeletonAdminRow count={5} />
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/20 rounded-xl px-4 py-2 flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase select-none">
              <Checkbox
                checked={filteredPosts.length > 0 && selectedIds.length === filteredPosts.length}
                onCheckedChange={toggleSelectAll}
                aria-label="Tümünü seç"
              />
              <span>Tümünü Seç ({filteredPosts.length} Öğe)</span>
            </div>

            <div className="space-y-3">
              {filteredPosts.map((post: BlogPost & { blog_categories?: { name: string } | null }) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-slate-900/10 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedIds.includes(post.id)}
                      onCheckedChange={() => toggleSelect(post.id)}
                      aria-label="Seç"
                    />
                    
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.is_featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                        <span className="font-semibold text-sm text-slate-800 dark:text-white line-clamp-1">
                          {post.title}
                        </span>
                        {post.is_published ? (
                          <Badge variant="default" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15 border-none text-[10px] font-bold py-0 px-2 rounded-md">
                            Yayında
                          </Badge>
                        ) : post.scheduled_at ? (
                          <Badge variant="outline" className="border-amber-500 text-amber-600 flex items-center gap-1 text-[10px] py-0 px-2 rounded-md">
                            <Clock className="w-2.5 h-2.5" />
                            Zamanlandı
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] py-0 px-2 rounded-md">
                            Taslak
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          Admin
                        </span>
                        <span className="text-slate-300 dark:text-slate-800">•</span>
                        <span className="flex items-center gap-1">
                          {format(new Date(post.created_at), 'dd.MM.yyyy')}
                        </span>
                        {post.blog_categories?.name && (
                          <>
                            <span className="text-slate-300 dark:text-slate-800">•</span>
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-medium text-slate-600 dark:text-slate-300">
                              {post.blog_categories.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <button
                      onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Görüntüle
                    </button>
                    <button
                      onClick={() => handleEdit(post)}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-300 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(post)}
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
          </div>
        ) : (
          <div className="bg-card border border-border/40 rounded-2xl">
            <EmptyState
              icon="book"
              title="Blog yazısı bulunamadı"
              description="Aradığınız kriterlere uygun blog yazısı bulunamadı. Filtreleri değiştirip tekrar deneyin."
              action={
                searchQuery
                  ? { label: 'Aramayı Temizle', onClick: () => setSearchQuery('') }
                  : { label: 'Yeni Blog Yazısı Ekle', onClick: () => { setEditingPost(null); setIsOpen(true); } }
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
