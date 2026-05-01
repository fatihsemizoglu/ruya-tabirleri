import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Check, X, Trash2, Loader2, MessageSquare, Clock, CheckCircle, 
  ExternalLink, User, Calendar, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  is_approved: boolean | null;
  like_count: number | null;
  dream_id: string;
  user_id: string;
  dreams?: { title: string; slug: string } | null;
  profiles?: { username: string | null; full_name: string | null } | null;
}

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

export function CommentManagement() {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: [...queryKeys.admin.comments.all, activeTab],
    queryFn: async () => {
      const status = activeTab as 'pending' | 'approved' | 'all';
      const response = await adminApi.getComments({ status, limit: 50 });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch comments');
      }
      
      return response.data as Comment[];
    },
  });

  const filteredComments = useMemo(() => {
    if (!comments || !searchQuery.trim()) return comments || [];
    
    const query = searchQuery.toLowerCase();
    return comments.filter(comment => 
      comment.content.toLowerCase().includes(query) ||
      comment.dreams?.title.toLowerCase().includes(query) ||
      comment.profiles?.username?.toLowerCase().includes(query) ||
      comment.profiles?.full_name?.toLowerCase().includes(query)
    );
  }, [comments, searchQuery]);

  const stats = useMemo(() => {
    if (!comments) return { total: 0, pending: 0, approved: 0 };
    return {
      total: comments.length,
      pending: comments.filter(c => !c.is_approved).length,
      approved: comments.filter(c => c.is_approved).length,
    };
  }, [comments]);

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await adminApi.approveComment(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to approve comment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.comments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
      toast.success('Yorum onaylandı');
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await adminApi.rejectComment(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to reject comment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.comments.all });
      toast.success('Yorum reddedildi');
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await adminApi.deleteComment(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete comment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.comments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
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
    return comment.profiles?.username || comment.profiles?.full_name || 'Anonim';
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white p-8 dark:bg-slate-900/50">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          <span className="text-slate-500">Yorumlar yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Toplam" value={stats.total} color="text-indigo-600" />
        <StatCard label="Bekleyen" value={stats.pending} color="text-amber-600" />
        <StatCard label="Onaylı" value={stats.approved} color="text-emerald-600" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-3 h-9">
            <TabsTrigger value="pending" className="text-xs">
              Bekleyen
              {stats.pending > 0 && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{stats.pending}</span>}
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs">Onaylı</TabsTrigger>
            <TabsTrigger value="all" className="text-xs">Tümü</TabsTrigger>
          </TabsList>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Yorum ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 w-full sm:w-64"
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <div className="rounded-xl border bg-white overflow-hidden dark:bg-slate-900/50">
            {filteredComments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  {searchQuery ? 'Sonuç bulunamadı' : 'Yorum yok'}
                </h3>
                <p className="text-xs text-slate-500">
                  {searchQuery ? 'Arama kriterlerine uygun yorum bulunamadı.' : 'Bu kriterlere uygun yorum bulunmuyor.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredComments.map((comment) => (
                  <div key={comment.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold shrink-0 text-sm">
                        {getUsername(comment).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-900 dark:text-white text-sm">{getUsername(comment)}</span>
                          <span className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: tr })}
                          </span>
                          <Badge variant={comment.is_approved ? "default" : "secondary"} className="text-[10px] h-5">
                            {comment.is_approved ? (
                              <><CheckCircle className="h-3 w-3 mr-1" /> Onaylı</>
                            ) : (
                              <><Clock className="h-3 w-3 mr-1" /> Bekliyor</>
                            )}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1.5">{comment.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Link 
                            to={`/ruya/${comment.dreams?.slug}`} 
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {comment.dreams?.title || 'Rüya'}
                          </Link>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!comment.is_approved && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            onClick={() => handleApprove(comment.id)}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {comment.is_approved && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            onClick={() => handleReject(comment.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(comment.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
