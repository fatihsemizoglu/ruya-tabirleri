import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api';
import type { Category } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, Pencil, Trash2, Loader2, Search, 
  Folder, Hash, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useItemMutations } from '@/hooks/useList';
import { queryKeys } from '@/lib/query/client';

const categorySchema = z.object({
  name: z.string().min(2, 'Kategori adı en az 2 karakter olmalıdır').max(100),
  slug: z.string().min(2, 'Slug en az 2 karakter olmalıdır').max(100).regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  order_index: z.coerce.number().int().min(0).optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white p-3 border dark:bg-slate-900/50">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", color)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{label}</p>
        <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export function CategoryManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const { data: categoriesResponse, isLoading, refetch } = useQuery({
    queryKey: queryKeys.admin.categories.list,
    queryFn: async () => {
      const response = await categoriesApi.getAll();
      if (!response.success) throw new Error(response.error || 'Failed to fetch categories');
      return response.data || [];
    },
  });

  const categories = useMemo(() => categoriesResponse || [], [categoriesResponse]);

  const stats = useMemo(() => ({
    total: categories.length,
    withIcon: categories.filter(c => c.icon).length,
    withDescription: categories.filter(c => c.description).length,
  }), [categories]);

  const filteredCategories = categories.filter(category => {
    const query = searchQuery.toLowerCase();
    return (
      category.name.toLowerCase().includes(query) ||
      category.slug.toLowerCase().includes(query) ||
      (category.description && category.description.toLowerCase().includes(query))
    );
  });

  const mutations = useItemMutations<Category>({
    queryKey: queryKeys.admin.categories.list,
    createFn: async (values) => {
      const response = await categoriesApi.create({
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        icon: values.icon || null,
        order_index: values.order_index || 0,
      });
      if (!response.success) throw new Error(response.error || 'Failed to create category');
      return response;
    },
    updateFn: async ({ id, data }) => {
      const response = await categoriesApi.update(id, {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        icon: data.icon || null,
        order_index: data.order_index || 0,
      });
      if (!response.success) throw new Error(response.error || 'Failed to update category');
      return response;
    },
    deleteFn: async (id) => {
      const response = await categoriesApi.delete(id);
      if (!response.success) throw new Error(response.error || 'Failed to delete category');
      return response;
    },
    onSuccess: () => handleClose(),
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
    setIsOpen(true);
    form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      order_index: category.order_index || 0,
    });
  };

  const handleDelete = (category: Category) => {
    if (confirm(`"${category.name}" kategorisini silmek istediğinize emin misiniz?`)) {
      mutations.remove(category.id);
    }
  };

  const onSubmit = (values: CategoryFormValues) => {
    if (editingCategory) {
      mutations.update({ id: editingCategory.id, data: values });
    } else {
      mutations.create(values);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name);
    if (!editingCategory) {
      const slug = name
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      form.setValue('slug', slug);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white p-8 dark:bg-slate-900/50">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          <span className="text-slate-500">Kategoriler yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard 
          label="Toplam"
          value={stats.total}
          icon={Folder}
          color="bg-indigo-500"
        />
        <StatCard 
          label="İkonlu"
          value={stats.withIcon}
          icon={Sparkles}
          color="bg-purple-500"
        />
        <StatCard 
          label="Açıklamalı"
          value={stats.withDescription}
          icon={Hash}
          color="bg-emerald-500"
        />
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Kategori ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Yeni Kategori</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori Adı</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Örn: Hayvanlar" 
                          {...field} 
                          onChange={handleNameChange}
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
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="Orn: hayvanlar" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İkon (opsiyonel)</FormLabel>
                        <FormControl>
                          <Input placeholder="Lucide icon adı" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="order_index"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sıra</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Açıklama (opsiyonel)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Kategori açıklaması..." 
                          className="min-h-[80px] resize-none"
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    İptal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={mutations.isCreating || mutations.isUpdating}
                  >
                    {(mutations.isCreating || mutations.isUpdating) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingCategory ? 'Güncelle' : 'Oluştur'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories List */}
      <div className="rounded-xl border bg-white overflow-hidden dark:bg-slate-900/50">
        {filteredCategories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Folder className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              {searchQuery ? 'Sonuç bulunamadı' : 'Henüz kategori yok'}
            </h3>
            <p className="text-xs text-slate-500">
              {searchQuery ? 'Arama kriterlerine uygun kategori bulunamadı.' : 'Yeni bir kategori oluşturarak başlayın.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredCategories.map((category) => (
              <div 
                key={category.id} 
                className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white shrink-0">
                    <Folder className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900 dark:text-white truncate">
                        {category.name}
                      </h3>
                      {category.icon && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {category.icon}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">/{category.slug}</p>
                    {category.description && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{category.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(category)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => handleDelete(category)}
                    disabled={mutations.isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
