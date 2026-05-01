import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { blogApi, type BlogPost } from '@/lib/api';
import { queryKeys } from '@/lib/query/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Star } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { BlogForm } from './BlogForm';
import { BulkActions } from './BulkActions';
import { useSelection } from '@/hooks/useCRUD';
import { useList } from '@/hooks/useList';
import { useItemMutations } from '@/hooks/useList';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const ITEMS_PER_PAGE = 10;

export function BlogManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const { data: categoriesResponse } = useQuery({
    queryKey: queryKeys.admin.blog.categories,
    queryFn: async () => {
      const response = await blogApi.getCategories();
      if (!response.success) throw new Error(response.error || 'Failed to fetch categories');
      return response.data || [];
    },
  });

  const categories = categoriesResponse || [];

  const list = useList<BlogPost>({
    queryKey: queryKeys.admin.blog.posts,
    fetchFn: async (params) => {
      const response = await blogApi.getPosts({
        ...params,
        limit: ITEMS_PER_PAGE,
        is_published: 'all'
      });
      if (!response.success) throw new Error(response.error || 'Failed to fetch blog posts');
      return response;
    },
  });

  const mutations = useItemMutations<BlogPost>({
    queryKey: queryKeys.admin.blog.posts,
    createFn: async (data) => {
      const tags = data.tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || [];
      const response = await blogApi.createPost({ ...data, tags });
      if (!response.success) throw new Error(response.error || 'Failed to create blog post');
      return response;
    },
    updateFn: async ({ id, data }) => {
      const tags = data.tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || [];
      const response = await blogApi.updatePost(id, { ...data, tags });
      if (!response.success) throw new Error(response.error || 'Failed to update blog post');
      return response;
    },
    deleteFn: async (id) => {
      const response = await blogApi.deletePost(id);
      if (!response.success) throw new Error(response.error || 'Failed to delete blog post');
      return response;
    },
    onSuccess: () => setIsOpen(false),
  });

  const selection = useSelection({
    items: list.items,
    getId: (p) => p.id,
  });

  const handleFilterChange = (key: string, value: string) => {
    list.setFilter(key, value === 'all' ? undefined : value);
  };

  const columns = [
    {
      key: 'title',
      header: 'Başlık',
      cell: (post: BlogPost) => (
        <div className="flex items-center gap-2">
          {post.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
          <span className="font-medium">{post.title}</span>
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
      cell: (post: BlogPost) => (
        <div className="flex items-center justify-center gap-1 text-muted-foreground">
          <Eye className="w-4 h-4" />
          {post.view_count || 0}
        </div>
      ),
    },
    {
      key: 'is_published',
      header: 'Durum',
      cell: (post: BlogPost) => (
        post.is_published ? (
          <Badge className="bg-green-500 text-white">Yayında</Badge>
        ) : (
          <Badge variant="secondary">Taslak</Badge>
        )
      ),
    },
    {
      key: 'created_at',
      header: 'Tarih',
      cell: (post: BlogPost) => (
        <span className="text-muted-foreground text-sm">
          {format(new Date(post.created_at), 'd MMM yyyy', { locale: tr })}
        </span>
      ),
    },
  ];

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setIsOpen(true);
  };

  const handleDelete = (post: BlogPost) => {
    if (confirm(`"${post.title}" silinsin mi?`)) {
      mutations.remove(post.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Blog Yazıları</h2>
          <p className="text-muted-foreground">Blog yazılarını yönetin</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Blog yazısı ara..."
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
          <Select
            value={(list.params as any)?.status || 'all'}
            onValueChange={(val) => handleFilterChange('status', val)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="published">Yayında</SelectItem>
              <SelectItem value="draft">Taslak</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => { setEditingPost(null); setIsOpen(true); }}>
            Yeni Blog Yazısı
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Blog Yazısı Düzenle' : 'Yeni Blog Yazısı Ekle'}</DialogTitle>
          </DialogHeader>
          <BlogForm
            categories={categories}
            defaultValues={editingPost ? {
              title: editingPost.title,
              slug: editingPost.slug,
              content: editingPost.content,
              excerpt: editingPost.excerpt || '',
              featured_image: editingPost.featured_image || '',
              category_id: editingPost.category_id || '',
              tags: Array.isArray(editingPost.tags) ? editingPost.tags.join(', ') : '',
              meta_title: editingPost.meta_title || '',
              meta_description: editingPost.meta_description || '',
              is_published: editingPost.is_published,
              is_featured: editingPost.is_featured,
            } : undefined}
            onSubmit={(values) => editingPost ? mutations.update({ id: editingPost.id, data: values }) : mutations.create(values)}
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
              type="blog"
            />
          )}
          <DataTable
            columns={columns}
            data={list.items}
            getId={(p) => p.id}
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