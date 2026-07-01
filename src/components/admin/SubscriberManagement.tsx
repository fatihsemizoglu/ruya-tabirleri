import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Trash2,
  Search,
  Mail,
  Users,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { SkeletonAdminRow } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { AdminPageHeader } from './common/AdminPageHeader';
import { AdminStatsCards } from './common/AdminStatsCards';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  is_verified: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
  preferred_category_ids?: string[] | null;
}

export function SubscriberManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['admin-subscribers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });
      if (error) throw error;
      return data as Subscriber[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-subscriber-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('id, name').order('name');
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
  });

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_subscribers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] });
      toast.success('Abone silindi');
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('blog_subscribers').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] });
      setSelectedIds([]);
      toast.success('Seçilen aboneler silindi');
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleDelete = (subscriber: Subscriber) => {
    if (confirm(`"${subscriber.email}" abonesini silmek istediğinize emin misiniz?`)) {
      deleteMutation.mutate(subscriber.id);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Seçilen ${selectedIds.length} aboneyi silmek istediğinize emin misiniz?`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const filteredSubscribers = subscribers?.filter(sub =>
    sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSubscribers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubscribers.map(s => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const stats = {
    total: subscribers?.length || 0,
    verified: subscribers?.filter(s => s.is_verified && !s.unsubscribed_at).length || 0,
    unverified: subscribers?.filter(s => !s.is_verified).length || 0,
    unsubscribed: subscribers?.filter(s => s.unsubscribed_at).length || 0,
  };

  const statsData: [
    { label: string; value: number; subtext: string; icon: typeof Users },
    { label: string; value: number; subtext: string; icon: typeof CheckCircle },
    { label: string; value: number; subtext: string; icon: typeof XCircle }
  ] = [
    { label: 'Toplam Abone', value: stats.total, subtext: 'Kayıtlı e-postalar', icon: Users },
    { label: 'Aktif Abone', value: stats.verified, subtext: 'Doğrulanmış aboneler', icon: CheckCircle },
    { label: 'İptal Edenler', value: stats.unsubscribed, subtext: 'Abonelikten ayrılanlar', icon: XCircle }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Abone Yönetimi"
          description="Bültene kayıtlı e-posta abonelerini izleyin ve yönetin"
          icon={Users}
        />
        <SkeletonAdminRow count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Abone Yönetimi"
        description="Bültene kayıtlı e-posta abonelerini izleyin ve yönetin"
        icon={Users}
        badge={stats.verified > 0 ? `${stats.verified} Aktif Abone` : undefined}
      />

      <AdminStatsCards stats={statsData} />

      {/* List Container */}
      <div className="admin-panel-surface p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-white">Bülten Aboneleri</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {filteredSubscribers.length} abone ({filteredSubscribers.length > 0 ? `1-${filteredSubscribers.length}` : '0-0'} gösteriliyor)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="E-posta veya isim ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-filter-surface pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 rounded-xl">
            <span className="text-sm font-semibold text-red-900 dark:text-red-300">{selectedIds.length} abone seçildi</span>
            <Button
              size="sm"
              variant="destructive"
              className="rounded-xl font-bold"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              Toplu Sil
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-xl"
              onClick={() => setSelectedIds([])}
            >
              İptal
            </Button>
          </div>
        )}

        {filteredSubscribers.length === 0 ? (
          <div className="bg-card border border-border/40 rounded-2xl">
            <EmptyState
              icon="users"
              title={searchTerm ? 'Sonuç bulunamadı' : 'Henüz abone yok'}
              description={searchTerm ? 'Arama kriterlerine uygun abone bulunamadı.' : 'Bültene kayıtlı ilk abone geldiğinde burada görünecek.'}
              action={searchTerm ? { label: 'Aramayı Temizle', onClick: () => setSearchTerm('') } : undefined}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="admin-muted-row px-4 py-2 flex items-center gap-3 select-none">
              <Checkbox
                checked={filteredSubscribers.length > 0 && selectedIds.length === filteredSubscribers.length}
                onCheckedChange={toggleSelectAll}
                aria-label="Tümünü seç"
              />
              <span>Tümünü Seç ({filteredSubscribers.length} Öğe)</span>
            </div>

            <div className="space-y-3">
              {filteredSubscribers.map((subscriber) => (
                <div
                  key={subscriber.id}
                  className="admin-list-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedIds.includes(subscriber.id)}
                      onCheckedChange={() => toggleSelect(subscriber.id)}
                      aria-label="Seç"
                    />

                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                      subscriber.unsubscribed_at
                        ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                        : subscriber.is_verified
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>
                      <Mail className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-800 dark:text-white">
                          {subscriber.email}
                        </span>
                        {subscriber.unsubscribed_at ? (
                          <Badge variant="destructive" className="bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/15 border-none text-[10px] font-bold py-0 px-2 rounded-md">
                            İptal Edildi
                          </Badge>
                        ) : subscriber.is_verified ? (
                          <Badge variant="default" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15 border-none text-[10px] font-bold py-0 px-2 rounded-md">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold py-0 px-2 rounded-md">
                            Doğrulanmamış
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        {subscriber.name && (
                          <>
                            <span className="font-medium">{subscriber.name}</span>
                             <span className="text-muted-foreground/50">•</span>
                          </>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Kayıt: {format(new Date(subscriber.subscribed_at), 'd MMM yyyy', { locale: tr })}
                        </span>
                        {subscriber.unsubscribed_at && (
                          <>
                             <span className="text-muted-foreground/50">•</span>
                            <span className="text-red-500 font-medium">
                              İptal: {format(new Date(subscriber.unsubscribed_at), 'd MMM yyyy', { locale: tr })}
                            </span>
                          </>
                        )}
                      </div>
                      {subscriber.preferred_category_ids && subscriber.preferred_category_ids.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {subscriber.preferred_category_ids.slice(0, 4).map((categoryId) => (
                            <Badge key={categoryId} variant="outline" className="text-[10px]">
                              {categoryNameById.get(categoryId) || 'Kategori'}
                            </Badge>
                          ))}
                          {subscriber.preferred_category_ids.length > 4 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{subscriber.preferred_category_ids.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <button
                      onClick={() => handleDelete(subscriber)}
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
        )}
      </div>
    </div>
  );
}

export default SubscriberManagement;
