import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import type { BlogCategory } from '@/types/blog';
import { SkeletonAdminRow } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { AdminPageHeader } from './common/AdminPageHeader';
import { AdminStatsCards } from './common/AdminStatsCards';
import { BlogCategoryForm, type BlogCategoryFormValues } from './BlogCategoryForm';

export function BlogCategoryManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as BlogCategory[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: BlogCategoryFormValues) => {
      const { error } = await supabase.from('blog_categories').insert({
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        icon: values.icon || null,
        order_index: values.order_index || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-blog-categories-select'] });
      toast.success('Blog kategorisi başarıyla oluşturuldu');
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: BlogCategoryFormValues }) => {
      const { error } = await supabase
        .from('blog_categories')
        .update({
          name: values.name,
          slug: values.slug,
          description: values.description || null,
          icon: values.icon || null,
          order_index: values.order_index || 0,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-blog-categories-select'] });
      toast.success('Blog kategorisi başarıyla güncellendi');
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-blog-categories-select'] });
      toast.success('Blog kategorisi başarıyla silindi');
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    setEditingCategory(null);
  };

  const handleEdit = (category: BlogCategory) => {
    setEditingCategory(category);
    setIsOpen(true);
  };

  const handleDelete = (category: BlogCategory) => {
    if (confirm(`"${category.name}" kategorisini silmek istediğinize emin misiniz?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  const onSubmit = (values: BlogCategoryFormValues) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const totalCategories = categories?.length || 0;
  const categoriesWithIcon = categories?.filter(c => c.icon).length || 0;
  const categoriesWithDesc = categories?.filter(c => c.description).length || 0;

  const statsData: [{ label: string; value: number; subtext: string; icon: typeof FolderOpen }, { label: string; value: number; subtext: string; icon: typeof FolderOpen }, { label: string; value: number; subtext: string; icon: typeof FolderOpen }] = [
    { label: 'Toplam Kategori', value: totalCategories, subtext: 'Tüm blog kategorileri', icon: FolderOpen },
    { label: 'İkonlu Kategori', value: categoriesWithIcon, subtext: 'İkon atanmış olanlar', icon: FolderOpen },
    { label: 'Açıklamalı', value: categoriesWithDesc, subtext: 'Açıklaması bulunanlar', icon: FolderOpen }
  ];

  const filteredCategories = categories?.filter((category) => {
    return category.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()));
  }) || [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Blog Kategori Yönetimi"
        description="Blog yazısı kategorilerini ve hiyerarşisini düzenleyin"
        icon={FolderOpen}
        badge={`${totalCategories} Kategori`}
        action={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCategory(null)} className="bg-white hover:bg-white/90 text-indigo-900 rounded-xl px-4 py-2 font-bold shadow-sm flex items-center gap-2 text-sm border border-slate-200/10">
                <Plus className="w-4 h-4" />
                Yeni Kategori
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[760px] max-w-[95vw] p-0 gap-0 bg-transparent border-0 shadow-none">
              <BlogCategoryForm
                key={editingCategory?.id ?? 'new'}
                defaultValues={
                  editingCategory
                    ? {
                        name: editingCategory.name,
                        slug: editingCategory.slug,
                        description: editingCategory.description || '',
                        icon: editingCategory.icon || '📚',
                        order_index: editingCategory.order_index || 0,
                      }
                    : undefined
                }
                onSubmit={onSubmit}
                onCancel={handleClose}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <AdminStatsCards stats={statsData} />

      <div className="admin-panel-surface p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-white">Blog Kategorileri</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {filteredCategories.length} kategori ({filteredCategories.length > 0 ? `1-${filteredCategories.length}` : '0-0'} gösteriliyor)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kategori adı veya açıklama ile ara..."
              aria-label="Kategori adı veya açıklama ile ara"
              className="admin-filter-surface"
            />
          </div>
        </div>

        {isLoading ? (
          <SkeletonAdminRow count={4} />
        ) : filteredCategories.length > 0 ? (
          <div className="space-y-3">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="admin-list-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm text-lg">
                    <CategoryIcon icon={category.icon} className="h-5 w-5" fallback="📁" />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-800 dark:text-white line-clamp-1">
                        {category.name}
                      </span>
                      <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-medium text-muted-foreground">
                        Sıra: {category.order_index}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span>Slug: {category.slug}</span>
                      {category.description && (
                        <>
                          <span className="text-muted-foreground/50">•</span>
                          <span className="line-clamp-1">{category.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
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
        ) : (
          <div className="bg-card border border-border/40 rounded-2xl">
            <EmptyState
              icon="folder"
              title={searchQuery ? 'Sonuç bulunamadı' : 'Henüz kategori yok'}
              description={
                searchQuery
                  ? 'Aradığınız kriterlere uygun kategori bulunamadı.'
                  : '"Yeni Kategori" butonuyla ilk blog kategorinizi oluşturun.'
              }
              action={searchQuery ? { label: 'Aramayı Temizle', onClick: () => setSearchQuery('') } : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogCategoryManagement;
