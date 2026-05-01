import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dreamsApi, categoriesApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/client';
import type { Dream } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Star } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { DreamForm } from './DreamForm';
import { BulkActions } from './BulkActions';
import { useSelection } from '@/hooks/useCRUD';
import { useList } from '@/hooks/useList';
import { useItemMutations } from '@/hooks/useList';

const ITEMS_PER_PAGE = 10;

export function DreamManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingDream, setEditingDream] = useState<Dream | null>(null);

  const { data: categoriesResponse } = useQuery({
    queryKey: queryKeys.admin.categories.select,
    queryFn: async () => {
      const response = await categoriesApi.getAll();
      if (!response.success) throw new Error(response.error || 'Failed to fetch categories');
      return response.data || [];
    },
  });

  const categories = categoriesResponse || [];

  const list = useList<Dream>({
    queryKey: queryKeys.admin.dreams.all,
    fetchFn: async (params) => {
      const response = await dreamsApi.getAll({
        ...params,
        limit: ITEMS_PER_PAGE,
        is_published: 'all'
      });
      if (!response.success) throw new Error(response.error || 'Failed to fetch dreams');
      return response;
    },
  });

  const mutations = useItemMutations<Dream>({
    queryKey: queryKeys.admin.dreams.all,
    createFn: async (data) => {
      const keywords = data.keywords?.split(',').map((k: string) => k.trim()).filter(Boolean) || [];
      const response = await dreamsApi.create({ ...data, keywords });
      if (!response.success) throw new Error(response.error || 'Failed to create dream');
      return response;
    },
    updateFn: async ({ id, data }) => {
      const keywords = data.keywords?.split(',').map((k: string) => k.trim()).filter(Boolean) || [];
      const response = await dreamsApi.update(id, { ...data, keywords });
      if (!response.success) throw new Error(response.error || 'Failed to update dream');
      return response;
    },
    deleteFn: async (id) => {
      const response = await dreamsApi.delete(id);
      if (!response.success) throw new Error(response.error || 'Failed to delete dream');
      return response;
    },
    onSuccess: (action) => {
      setIsOpen(false);
    },
    onError: (action, error) => {
      // error handled by mutation
    },
  });

  const selection = useSelection({
    items: list.items,
    getId: (d) => d.id,
  });

  const handleFilterChange = (key: string, value: string) => {
    list.setFilter(key, value === 'all' ? undefined : value);
  };

  const columns = [
    {
      key: 'title',
      header: 'Başlık',
      cell: (dream: Dream) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{dream.title}</span>
          {dream.is_featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
        </div>
      ),
    },
    {
      key: 'category_name',
      header: 'Kategori',
    },
    {
      key: 'view_count',
      header: 'Görüntüleme',
      cell: (dream: Dream) => (
        <div className="flex items-center justify-center gap-1 text-muted-foreground">
          <Eye className="w-4 h-4" />
          {dream.view_count || 0}
        </div>
      ),
    },
    {
      key: 'is_published',
      header: 'Durum',
      cell: (dream: Dream) => (
        <Badge className={dream.is_published ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}>
          {dream.is_published ? 'Yayında' : 'Taslak'}
        </Badge>
      ),
    },
  ];

  const handleEdit = (dream: Dream) => {
    setEditingDream(dream);
    setIsOpen(true);
  };

  const handleDelete = (dream: Dream) => {
    if (confirm(`"${dream.title}" silinsin mi?`)) {
      mutations.remove(dream.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Rüya Tabirleri</h2>
          <p className="text-muted-foreground">Rüya tabirlerini yönetin</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rüya ara..."
              value={(list.params as any)?.search || ''}
              onChange={(e) => list.setSearch(e.target.value)}
              className="pl-10 w-[220px]"
            />
          </div>
          <Select
            value={(list.params as any)?.category_id || 'all'}
            onValueChange={(val) => handleFilterChange('category_id', val)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tüm Kategoriler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => { setEditingDream(null); setIsOpen(true); }}>
            Yeni Rüya Tabiri
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDream ? 'Rüya Tabiri Düzenle' : 'Yeni Rüya Tabiri Ekle'}</DialogTitle>
          </DialogHeader>
          <DreamForm
            categories={categories}
            defaultValues={editingDream ? {
              title: editingDream.title,
              slug: editingDream.slug,
              content: editingDream.content,
              islamic_interpretation: editingDream.islamic_interpretation || '',
              psychological_interpretation: editingDream.psychological_interpretation || '',
              category_id: editingDream.category_id || '',
              keywords: Array.isArray(editingDream.keywords) ? editingDream.keywords.join(', ') : '',
              meta_title: editingDream.meta_title || '',
              meta_description: editingDream.meta_description || '',
              is_published: editingDream.is_published,
              is_featured: editingDream.is_featured,
            } : undefined}
            onSubmit={(values) => editingDream ? mutations.update({ id: editingDream.id, data: values }) : mutations.create(values)}
            onCancel={() => setIsOpen(false)}
            isSubmitting={mutations.isCreating || mutations.isUpdating}
          />
        </DialogContent>
      </Dialog>

      {list.isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {selection.selected.size > 0 && (
            <BulkActions
              selectedIds={Array.from(selection.selected)}
              onClearSelection={selection.clear}
              type="dreams"
            />
          )}
          <DataTable
            columns={columns}
            data={list.items}
            getId={(d) => d.id}
            selection={selection}
            onEdit={handleEdit}
            onDelete={handleDelete}
            page={list.pagination.page}
            totalPages={list.pagination.totalPages}
            onPageChange={list.setPage}
            isLoading={list.isLoading}
          />
        </div>
      )}
    </div>
  );
}