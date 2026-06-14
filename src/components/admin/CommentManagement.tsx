import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, CheckCircle, Clock, Check, Trash2, User, Calendar, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { BulkActions } from './BulkActions';
import { useSelection } from '@/hooks/useSelection';
import { AdminPageHeader } from './common/AdminPageHeader';
import { AdminStatsCards } from './common/AdminStatsCards';
import { SkeletonAdminRow } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  is_approved: boolean | null;
  like_count: number | null;
  dream_id: string;
  user_id: string;
  guest_name?: string | null;
  guest_email?: string | null;
  dreams?: { title: string; slug: string } | null;
  profiles?: { username: string | null; full_name: string | null } | null;
}

export function CommentManagement() {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: commentStats } = useQuery({
    queryKey: ['admin-comment-stats-aggregate'],
    queryFn: async () => {
      const [allRes, pendingRes, approvedRes] = await Promise.all([
        supabase.from('comments').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('comments').select('id', { count: 'exact', head: true }).eq('is_approved', true)
      ]);
      return {
        all: allRes.count || 0,
        pending: pendingRes.count || 0,
        approved: approvedRes.count || 0
      };
    }
  });

  const { data: comments, isLoading } = useQuery({
    queryKey: ['admin-comments', activeTab],
    queryFn: async () => {
      let query = supabase
        .from('comments')
        .select(`
          *,
          dreams(title, slug)
        `)
        .order('created_at', { ascending: false });

      if (activeTab === 'pending') {
        query = query.eq('is_approved', false);
      } else if (activeTab === 'approved') {
        query = query.eq('is_approved', true);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      
      // Fetch profiles separately since there's no direct FK
      const userIds = [...new Set(data?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, full_name')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return data?.map(comment => ({
        ...comment,
        profiles: profileMap.get(comment.user_id) || null
      })) as Comment[];
    },
  });

  const filteredComments = comments?.filter(comment => {
    return comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (comment.profiles?.username && comment.profiles.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (comment.dreams?.title && comment.dreams.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }) || [];

  const selection = useSelection(filteredComments);


  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comments')
        .update({ is_approved: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Yorum onaylandı');
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comments')
        .update({ is_approved: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      toast.success('Yorum reddedildi');
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Yorum silindi');
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    rejectMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu yorumu silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const getUsername = (comment: Comment) => {
    if (comment.profiles?.full_name) return comment.profiles.full_name;
    if (comment.profiles?.username) return comment.profiles.username;
    if (comment.guest_name) return `${comment.guest_name} (Misafir)`;
    return 'Anonim Ziyaretçi';
  };
  const statsData: [{ label: string; value: number; subtext: string; icon: typeof MessageSquare }, { label: string; value: number; subtext: string; icon: typeof CheckCircle }, { label: string; value: number; subtext: string; icon: typeof Clock }] = [
    { label: 'Toplam Yorum', value: commentStats?.all || 0, subtext: 'Tüm kullanıcı yorumları', icon: MessageSquare },
    { label: 'Onaylı', value: commentStats?.approved || 0, subtext: 'Sitede yayınlanan', icon: CheckCircle },
    { label: 'Bekleyen', value: commentStats?.pending || 0, subtext: 'Onay bekleyen', icon: Clock }
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Yorum Yönetimi"
        description="Kullanıcı rüya yorumlarını inceleyin, onaylayın veya silin"
        icon={MessageSquare}
        badge={`${commentStats?.pending || 0} Bekleyen`}
      />

      <AdminStatsCards stats={statsData} />

      <div className="admin-panel-surface p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="bg-slate-100/80 dark:bg-slate-900/60 p-1 rounded-xl">
              <TabsTrigger value="pending" className="flex items-center gap-2 rounded-lg text-xs md:text-sm font-semibold">
                <Clock className="w-4 h-4" />
                Bekleyen
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2 rounded-lg text-xs md:text-sm font-semibold">
                <CheckCircle className="w-4 h-4" />
                Onaylı
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2 rounded-lg text-xs md:text-sm font-semibold">
                <MessageSquare className="w-4 h-4" />
                Tümü
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex-1 max-w-md">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Yorum içeriği veya kullanıcı ara..."
              className="admin-filter-surface"
            />
          </div>
        </div>

        {selection.selectedIds.length > 0 && (
          <div className="mt-4">
            <BulkActions 
              selectedIds={selection.selectedIds}
              onClearSelection={selection.clearSelection}
              type="comments"
            />
          </div>
        )}

        {isLoading ? (
          <SkeletonAdminRow count={4} />
        ) : filteredComments.length > 0 ? (
          <div className="space-y-4">
            <div className="admin-muted-row px-4 py-2 flex items-center gap-3 select-none">
              <Checkbox
                checked={selection.isAllSelected}
                onCheckedChange={selection.toggleAll}
                aria-label="Tümünü seç"
              />
              <span>Tümünü Seç ({filteredComments.length} Öğe)</span>
            </div>

            <div className="space-y-3">
              {filteredComments.map((comment) => (
                <div 
                  key={comment.id} 
                  className={`admin-list-surface p-5 flex flex-col sm:flex-row justify-between gap-4 ${selection.isSelected(comment.id) ? 'bg-primary/10 border-primary/40' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox 
                      checked={selection.isSelected(comment.id)}
                      onCheckedChange={() => selection.toggleItem(comment.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      {/* Header metadata */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge 
                          variant={comment.is_approved ? 'default' : 'secondary'}
                          className={comment.is_approved ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15 border-none text-[10px] font-bold py-0.5 px-2 rounded-md' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 border-none text-[10px] font-bold py-0.5 px-2 rounded-md'}
                        >
                          {comment.is_approved ? 'Onaylı' : 'Bekliyor'}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <User className="w-3.5 h-3.5 opacity-60" />
                          {getUsername(comment)}
                        </span>
                        <span className="text-muted-foreground/50">•</span>
                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3.5 h-3.5 opacity-60" />
                          {formatDistanceToNow(new Date(comment.created_at), { 
                            addSuffix: true, 
                            locale: tr 
                          })}
                        </span>
                      </div>

                      {/* Comment Content */}
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium mb-3">
                        {comment.content}
                      </p>

                      {/* Dream Link */}
                      {comment.dreams && (
                        <Link 
                          to={`/ruya/${comment.dreams.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Rüya: {comment.dreams.title}
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
                    {!comment.is_approved ? (
                      <button
                        onClick={() => handleApprove(comment.id)}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Onayla
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReject(comment.id)}
                        disabled={rejectMutation.isPending}
                        className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-750 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Kaldır
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
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
              icon="mail"
              title="Yorum bulunamadı"
              description={
                activeTab === 'pending' ? 'Onay bekleyen yorum yok. Harika gidiyorsun! 🎉'
                : activeTab === 'approved' ? 'Henüz onaylanmış yorum bulunmuyor.'
                : 'Aradığınız kriterlere uygun yorum bulunamadı.'
              }
              action={searchQuery ? { label: 'Aramayı Temizle', onClick: () => setSearchQuery('') } : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentManagement;
