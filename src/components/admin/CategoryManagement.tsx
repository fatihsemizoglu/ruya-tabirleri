import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, FolderOpen, Check, Clock } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { CategoryForm, type CategoryFormValues } from './CategoryForm';
import { SkeletonAdminRow } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { AdminPageHeader } from './common/AdminPageHeader';
import { AdminStatsCards } from './common/AdminStatsCards';

// Icon adını gercek Lucide icon bilesenine cevir
// Orn: "Sun" -> Sun, "cloud-rain" -> CloudRain
const getCategoryIcon = (iconName: string | null | undefined) => {
  if (!iconName) return FolderOpen;
  return getIcon(iconName) || FolderOpen;
};

type Category = Tables<'categories'>;

const categorySchema = z.object({
  name: z.string().min(2, 'Kategori adı en az 2 karakter olmalıdır').max(100),
  slug: z.string().min(2, 'Slug en az 2 karakter olmalıdır').max(100).regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  order_index: z.coerce.number().int().min(0).optional(),
});

export type { CategoryFormValues };

export function CategoryManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      icon: '',
      order_index: 0,
    },
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
    staleTime: Infinity, // Static data - categories rarely change
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const { error } = await supabase.from('categories').insert({
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        icon: values.icon || null,
        order_index: values.order_index || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Kategori başarıyla oluşturuldu');
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: CategoryFormValues }) => {
      const { error } = await supabase
        .from('categories')
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
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Kategori başarıyla güncellendi');
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Kategori başarıyla silindi');
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    setEditingCategory(null);
    form.reset({
      name: '',
      slug: '',
      description: '',
      icon: '',
      order_index: 0,
    });
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      order_index: category.order_index || 0,
    });
    setIsOpen(true);
  };

  const handleDelete = (category: Category) => {
    if (confirm(`"${category.name}" kategorisini silmek istediğinize emin misiniz?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  const onSubmit = (values: CategoryFormValues) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const generateSlug = (name: string) => {
    return name
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

  const totalCategories = categories?.length || 0;
  const categoriesWithIcon = categories?.filter(c => c.icon).length || 0;
  const categoriesWithDesc = categories?.filter(c => c.description).length || 0;

  const statsData: [{ label: string; value: number; subtext: string; icon: typeof FolderOpen }, { label: string; value: number; subtext: string; icon: typeof FolderOpen }, { label: string; value: number; subtext: string; icon: typeof FolderOpen }] = [
    { label: 'Toplam Kategori', value: totalCategories, subtext: 'Tüm rüya kategorileri', icon: FolderOpen },
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
        title="Kategori Yönetimi"
        description="Rüya tabiri kategorilerini ve hiyerarşisini düzenleyin"
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
            <DialogContent className="sm:max-w-[560px] max-w-[95vw] p-0 gap-0 bg-transparent border-0 shadow-none">
              <DialogHeader className="sr-only">
                <DialogTitle>
                  {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
                </DialogTitle>
              </DialogHeader>
              <CategoryForm
                form={form}
                defaultValues={editingCategory ? {
                  name: editingCategory.name,
                  slug: editingCategory.slug,
                  description: editingCategory.description || '',
                  icon: editingCategory.icon || '🌙',
                  order_index: editingCategory.order_index ?? 0,
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

      <div className="admin-panel-surface p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-white">Kategoriler</h3>
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
          <SkeletonAdminRow count={5} />
        ) : filteredCategories.length > 0 ? (
          <div className="space-y-3">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="admin-list-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <CategoryIcon icon={category.icon} className="h-5 w-5" />
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
              title="Kategori bulunamadı"
              description="Aradığınız kriterlere uygun kategori bulunamadı. Filtreleri değiştirip tekrar deneyin."
              action={
                searchQuery
                  ? { label: 'Aramayı Temizle', onClick: () => setSearchQuery('') }
                  : { label: 'Yeni Kategori Ekle', onClick: () => { setEditingCategory(null); setIsOpen(true); } }
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryManagement;
