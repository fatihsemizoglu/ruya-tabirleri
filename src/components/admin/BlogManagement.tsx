import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogApi, type BlogPost } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Loader2, Eye, Star, FileText, CalendarIcon, Clock, Search, X, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { BlogCategory } from '@/types/blog';
import { ImageUpload } from './ImageUpload';
import { RichTextEditor } from './RichTextEditor';
import { SEOAnalyzer } from './SEOAnalyzer';
import { SEOGenerator } from './SEOGenerator';
import { cn } from '@/lib/utils';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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

  const { data: postsResponse, isLoading } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const response = await blogApi.getPosts({ limit: 1000 });
      if (!response.success) throw new Error(response.error || 'Failed to fetch blog posts');
      return response.data || [];
    },
  });

  const posts = postsResponse || [];

  const { data: categoriesResponse } = useQuery({
    queryKey: ['admin-blog-categories-select'],
    queryFn: async () => {
      const response = await blogApi.getCategories();
      if (!response.success) throw new Error(response.error || 'Failed to fetch categories');
      return response.data || [];
    },
  });

  const categories = categoriesResponse || [];

  // Filter posts based on search query, category and status
  const filteredPosts = posts.filter((post: BlogPost) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      post.title.toLowerCase().includes(query) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(query)) ||
      (Array.isArray(post.tags) && post.tags.some(tag => tag.toLowerCase().includes(query)));
    
    const matchesCategory = selectedCategory === 'all' || post.category_id === selectedCategory;
    
    let matchesStatus = true;
    if (statusFilter === 'published') {
      matchesStatus = post.is_published === true;
    } else if (statusFilter === 'draft') {
      matchesStatus = post.is_published === false && !post.scheduled_at;
    } else if (statusFilter === 'scheduled') {
      matchesStatus = post.is_published === false && !!post.scheduled_at;
    }
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const createMutation = useMutation({
    mutationFn: async (values: BlogPostFormValues) => {
      const tagsArray = values.tags
        ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      
      const response = await blogApi.createPost({
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
        author_id: user?.id || '',
        scheduled_at: values.scheduled_at?.toISOString() || null,
      });
      
      if (!response.success) throw new Error(response.error || 'Failed to create blog post');
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
      
      const response = await blogApi.updatePost(id, {
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
      });
      
      if (!response.success) throw new Error(response.error || 'Failed to update blog post');
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
      const response = await blogApi.deletePost(id);
      if (!response.success) throw new Error(response.error || 'Failed to delete blog post');
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
      // Delete posts one by one since bulk API doesn't exist
      const results = await Promise.all(
        ids.map(id => blogApi.deletePost(id))
      );
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        throw new Error(`${failed.length} yazı silinirken hata oluştu`);
      }
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
      // Update posts one by one since bulk API doesn't exist
      const results = await Promise.all(
        ids.map(id => blogApi.updatePost(id, { is_published: true }))
      );
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        throw new Error(`${failed.length} yazı yayınlanırken hata oluştu`);
      }
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

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    // Ensure tags is an array before joining
    const tagsValue = Array.isArray(post.tags) 
      ? post.tags.join(', ') 
      : (typeof post.tags === 'string' ? post.tags : '');
    
    form.reset({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      featured_image: post.featured_image || '',
      category_id: post.category_id || '',
      tags: tagsValue,
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

  const toggleSelectAll = () => {
    if (posts && selectedIds.length === posts.length) {
      setSelectedIds([]);
    } else if (posts) {
      setSelectedIds(posts.map(p => p.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/60 dark:bg-black/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Blog Yazıları
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Blog yazılarını ekleyin, düzenleyin ve yönetin
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setEditingPost(null)}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Blog Yazısı
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPost ? 'Blog Yazısı Düzenle' : 'Yeni Blog Yazısı Ekle'}
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
                              if (!editingPost) {
                                form.setValue('slug', generateSlug(e.target.value));
                              }
                            }}
                            placeholder="Yazı başlığı"
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
                          <Input {...field} placeholder="yazi-basligi" />
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kategori seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
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
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Özet (max 300 karakter)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Kısa özet..." rows={2} maxLength={300} />
                      </FormControl>
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
                        <RichTextEditor
                          content={field.value}
                          onChange={field.onChange}
                          placeholder="Blog yazısı içeriğini buraya yazın..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Öne Çıkan Görsel</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etiketler (virgülle ayırın)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="rüya, tabir, rehber" />
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
                        <FormLabel>SEO Başlık (max 60)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="SEO başlığı" maxLength={60} />
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
                        <FormLabel>SEO Açıklama (max 160)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="SEO açıklaması" maxLength={160} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* SEO Analyzer */}
                 <div className="flex items-center justify-between">
                   <span className="text-sm font-medium">SEO Otomasyonu</span>
                   <SEOGenerator
                     title={form.watch('title')}
                     content={form.watch('content')}
                     type="blog"
                     onGenerated={(metaTitle, metaDescription) => {
                       form.setValue('meta_title', metaTitle);
                       form.setValue('meta_description', metaDescription);
                     }}
                   />
                 </div>
 
                <SEOAnalyzer
                  title={form.watch('title')}
                  metaTitle={form.watch('meta_title')}
                  metaDescription={form.watch('meta_description')}
                  content={form.watch('content')}
                  keywords={form.watch('tags')?.split(',').map(t => t.trim()).filter(Boolean) || []}
                  slug={form.watch('slug')}
                />

                {/* Scheduling Section */}
                <FormField
                  control={form.control}
                  name="scheduled_at"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Zamanla (İsteğe Bağlı)</FormLabel>
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
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
                                  // Set time to current time if not already set
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
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {field.value && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Bu yazı {format(field.value, "d MMMM yyyy 'saat' HH:mm", { locale: tr })} tarihinde otomatik yayınlanacak
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-8 pt-2">
                  <FormField
                    control={form.control}
                    name="is_published"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                            disabled={!!form.watch('scheduled_at')}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">
                          {form.watch('scheduled_at') ? 'Zamanlandı' : 'Yayınla'}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_featured"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0">Öne Çıkar</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
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
                    {editingPost ? 'Güncelle' : 'Oluştur'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
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

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Blog yazısı ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setSearchQuery('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tüm Durumlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="published">Yayında</SelectItem>
            <SelectItem value="draft">Taslak</SelectItem>
            <SelectItem value="scheduled">Zamanlanmış</SelectItem>
          </SelectContent>
        </Select>

        {(searchQuery || selectedCategory !== 'all' || statusFilter !== 'all') && (
          <span className="text-sm text-muted-foreground self-center">
            {filteredPosts.length} sonuç bulundu
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredPosts && filteredPosts.length > 0 ? (
        <div className="border rounded-2xl overflow-hidden bg-white/80 dark:bg-black/80 backdrop-blur-xl shadow-2xl shadow-orange-500/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={filteredPosts.length > 0 && selectedIds.length === filteredPosts.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Tümünü seç"
                  />
                </TableHead>
                <TableHead>Başlık</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-center">Görüntüleme</TableHead>
                <TableHead className="text-center">Durum</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post: BlogPost) => {
                const postWithExtras = post as BlogPost & { category_name?: string; scheduled_at?: string };
                return (
                  <TableRow key={post.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(post.id)}
                        onCheckedChange={() => toggleSelect(post.id)}
                        aria-label="Seç"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {post.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                        <span className="font-medium line-clamp-1">{post.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {postWithExtras.category_name || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Eye className="w-3.5 h-3.5" />
                        {post.view_count || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {post.is_published ? (
                        <Badge variant="default" className="bg-emerald-500">Yayında</Badge>
                      ) : postWithExtras.scheduled_at ? (
                        <Badge variant="outline" className="border-amber-500 text-amber-600 flex items-center gap-1 w-fit mx-auto">
                          <Clock className="w-3 h-3" />
                          {format(new Date(postWithExtras.scheduled_at), 'd MMM HH:mm', { locale: tr })}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Taslak</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(post.created_at), 'd MMM yyyy', { locale: tr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(post)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(post)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/50 rounded-xl">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Henüz blog yazısı bulunmuyor.</p>
          <Button className="mt-4" onClick={() => setIsOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            İlk Yazıyı Ekle
          </Button>
        </div>
      )}
    </div>
  );
}
