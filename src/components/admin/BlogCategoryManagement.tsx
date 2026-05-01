import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Loader2, Search, Tag } from 'lucide-react';
import { toast } from 'sonner';
import type { BlogCategory } from '@/types/blog';
import { cn } from '@/lib/utils';

const blogCategorySchema = z.object({
  name: z.string().min(2, 'Kategori adı en az 2 karakter olmalıdır').max(100),
  slug: z.string().min(2, 'Slug en az 2 karakter olmalıdır').max(100).regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  order_index: z.coerce.number().int().min(0).optional(),
});

type BlogCategoryFormValues = z.infer<typeof blogCategorySchema>;

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white p-3 border dark:bg-slate-900/50">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{label}</span>
      <span className={cn("text-lg font-bold tabular-nums", color)}>{value}</span>
    </div>
  );
}

export function BlogCategoryManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const form = useForm<BlogCategoryFormValues>({
    resolver: zodResolver(blogCategorySchema),
    defaultValues: { name: '', slug: '', description: '', icon: '', order_index: 0 },
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: queryKeys.admin.blog.categories,
    queryFn: async () => {
      const response = await blogApi.getCategories();
      if (!response.success) throw new Error(response.error || 'Failed to fetch categories');
      return response.data as BlogCategory[];
    },
  });

  const filteredCategories = (categories || []).filter(category => {
    const query = searchQuery.toLowerCase();
    return category.name.toLowerCase().includes(query) || category.slug.toLowerCase().includes(query) || (category.description && category.description.toLowerCase().includes(query));
  });

  const stats = { total: categories?.length || 0, withIcon: categories?.filter(c => c.icon).length || 0, withDescription: categories?.filter(c => c.description).length || 0 };

  const createMutation = useMutation({
    mutationFn: async (values: BlogCategoryFormValues) => {
      const response = await blogApi.createCategory({ name: values.name, slug: values.slug, description: values.description || null, icon: values.icon || null, order_index: values.order_index || 0 });
      if (!response.success) throw new Error(response.error || 'Failed to create category');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.admin.blog.categories }); toast.success('Kategori oluşturuldu'); handleClose(); },
    onError: (error: Error) => { toast.error(`Hata: ${error.message}`); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: BlogCategoryFormValues }) => {
      const response = await blogApi.updateCategory(id, { name: values.name, slug: values.slug, description: values.description || null, icon: values.icon || null, order_index: values.order_index || 0 });
      if (!response.success) throw new Error(response.error || 'Failed to update category');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.admin.blog.categories }); toast.success('Kategori güncellendi'); handleClose(); },
    onError: (error: Error) => { toast.error(`Hata: ${error.message}`); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const response = await blogApi.deleteCategory(id); if (!response.success) throw new Error(response.error || 'Failed to delete category'); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.admin.blog.categories }); toast.success('Kategori silindi'); },
    onError: (error: Error) => { toast.error(`Hata: ${error.message}`); },
  });

  const handleClose = () => { setIsOpen(false); setEditingCategory(null); form.reset({ name: '', slug: '', description: '', icon: '', order_index: 0 }); };

  const handleEdit = (category: BlogCategory) => {
    setEditingCategory(category); setIsOpen(true);
    form.reset({ name: category.name, slug: category.slug, description: category.description || '', icon: category.icon || '', order_index: category.order_index || 0 });
  };

  const handleDelete = (category: BlogCategory) => { if (confirm(`"${category.name}" silinsin mi?`)) deleteMutation.mutate(category.id); };

  const onSubmit = (values: BlogCategoryFormValues) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value; form.setValue('name', name);
    if (!editingCategory) {
      const slug = name.toLowerCase().replace(/\u011f/g, 'g').replace(/\u00fc/g, 'u').replace(/\u015f/g, 's').replace(/\u0131/g, 'i').replace(/\u00f6/g, 'o').replace(/\u00e7/g, 'c').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      form.setValue('slug', slug);
    }
  };

  if (isLoading) return <div className="rounded-xl border bg-white p-8 dark:bg-slate-900/50"><div className="flex items-center justify-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /><span className="text-slate-500">Yükleniyor...</span></div></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Toplam" value={stats.total} color="text-pink-600" />
        <StatCard label="İkonlu" value={stats.withIcon} color="text-rose-600" />
        <StatCard label="Açıklamalı" value={stats.withDescription} color="text-purple-600" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Kategori ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-9" /></div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button size="sm" className="h-9 gap-1.5"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Yeni Kategori</span></Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>{editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Kategori Adı</FormLabel><FormControl><Input placeholder="Örn: Rehber" {...field} onChange={handleNameChange} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="slug" render={({ field }) => (<FormItem><FormLabel>Slug</FormLabel><FormControl><Input placeholder="Orn: rehber" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="icon" render={({ field }) => (<FormItem><FormLabel>İkon</FormLabel><FormControl><Input placeholder="Lucide icon" {...field} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name="order_index" render={({ field }) => (<FormItem><FormLabel>Sıra</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Açıklama</FormLabel><FormControl><Textarea placeholder="Kategori açıklaması..." className="min-h-[80px] resize-none" {...field} /></FormControl></FormItem>)} />
                <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={handleClose}>İptal</Button><Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingCategory ? 'Güncelle' : 'Oluştur'}</Button></div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden dark:bg-slate-900/50">
        {filteredCategories.length === 0 ? (
          <div className="p-12 text-center"><div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4"><Tag className="h-6 w-6 text-slate-400" /></div><h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{searchQuery ? 'Sonuç bulunamadı' : 'Henüz kategori yok'}</h3><p className="text-xs text-slate-500">{searchQuery ? 'Arama kriterlerine uygun kategori bulunamadı.' : 'Yeni bir kategori oluşturarak başlayın.'}</p></div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredCategories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white shrink-0"><Tag className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><h3 className="font-medium text-slate-900 dark:text-white truncate">{category.name}</h3>{category.icon && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{category.icon}</span>}</div>
                    <p className="text-xs text-slate-500 truncate">/{category.slug}</p>
                    {category.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{category.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(category)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(category)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
