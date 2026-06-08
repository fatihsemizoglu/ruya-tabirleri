import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  User, 
  BookOpen, 
  FolderOpen, 
  MessageSquare, 
  FileText,
  Settings,
  Trash2,
  Edit,
  Plus,
  Eye,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  details: unknown;
  created_at: string;
  profile?: {
    username: string | null;
    full_name: string | null;
  };
}

const ACTION_ICONS: Record<string, typeof Plus> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  view: Eye,
  publish: FileText,
  unpublish: FileText,
  approve: MessageSquare,
  reject: MessageSquare,
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-500/10 text-green-600 border-green-500/20',
  update: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  delete: 'bg-red-500/10 text-red-600 border-red-500/20',
  view: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  publish: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  unpublish: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  approve: 'bg-green-500/10 text-green-600 border-green-500/20',
  reject: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const ENTITY_ICONS: Record<string, typeof BookOpen> = {
  dream: BookOpen,
  category: FolderOpen,
  user: User,
  comment: MessageSquare,
  blog_post: FileText,
  blog_category: FolderOpen,
  setting: Settings,
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Oluşturdu',
  update: 'Güncelledi',
  delete: 'Sildi',
  view: 'Görüntüledi',
  publish: 'Yayınladı',
  unpublish: 'Yayından Kaldırdı',
  approve: 'Onayladı',
  reject: 'Reddetti',
};

const ENTITY_LABELS: Record<string, string> = {
  dream: 'Rüya Tabiri',
  category: 'Kategori',
  user: 'Kullanıcı',
  comment: 'Yorum',
  blog_post: 'Blog Yazısı',
  blog_category: 'Blog Kategorisi',
  setting: 'Ayar',
};

export function AuditLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['audit-logs', page, entityFilter, actionFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (searchQuery) {
        query = query.or(`entity_title.ilike.%${searchQuery}%,action.ilike.%${searchQuery}%`);
      }

      const { data: logsData, error, count } = await query;

      if (error) throw error;

      // Fetch profiles for user_ids
      const userIds = [...new Set(logsData?.map(log => log.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const logs: AuditLogEntry[] = (logsData || []).map(log => ({
        ...log,
        profile: profileMap.get(log.user_id) as { username: string | null; full_name: string | null } | undefined,
      }));

      return { logs, totalCount: count || 0 };
    },
  });

  const totalPages = Math.ceil((data?.totalCount || 0) / pageSize);

  const getActionIcon = (action: string) => {
    const Icon = ACTION_ICONS[action] || Edit;
    return Icon;
  };

  const getEntityIcon = (entityType: string) => {
    const Icon = ENTITY_ICONS[entityType] || FileText;
    return Icon;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Aktivite Geçmişi
          </h2>
          <p className="text-muted-foreground mt-1">
            Tüm admin işlemlerinin kaydı
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tür" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Türler</SelectItem>
                  <SelectItem value="dream">Rüya Tabiri</SelectItem>
                  <SelectItem value="category">Kategori</SelectItem>
                  <SelectItem value="blog_post">Blog Yazısı</SelectItem>
                  <SelectItem value="comment">Yorum</SelectItem>
                  <SelectItem value="user">Kullanıcı</SelectItem>
                  <SelectItem value="setting">Ayar</SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="İşlem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm İşlemler</SelectItem>
                  <SelectItem value="create">Oluşturma</SelectItem>
                  <SelectItem value="update">Güncelleme</SelectItem>
                  <SelectItem value="delete">Silme</SelectItem>
                  <SelectItem value="publish">Yayınlama</SelectItem>
                  <SelectItem value="approve">Onaylama</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            {data?.totalCount || 0} kayıt bulundu
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Yükleniyor...
              </div>
            ) : data?.logs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Henüz aktivite kaydı bulunmuyor</p>
              </div>
            ) : (
              <div className="divide-y">
                {data?.logs.map((log) => {
                  const ActionIcon = getActionIcon(log.action);
                  const EntityIcon = getEntityIcon(log.entity_type);
                  
                  return (
                    <div 
                      key={log.id} 
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg border ${ACTION_COLORS[log.action] || 'bg-muted'}`}>
                          <ActionIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {log.profile?.full_name || log.profile?.username || 'Bilinmeyen Kullanıcı'}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {ACTION_LABELS[log.action] || log.action}
                            </Badge>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <EntityIcon className="h-3 w-3" />
                              <span className="text-sm">
                                {ENTITY_LABELS[log.entity_type] || log.entity_type}
                              </span>
                            </div>
                          </div>
                          {log.entity_title && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              "{log.entity_title}"
                            </p>
                          )}
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { 
                              addSuffix: true, 
                              locale: tr 
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Sayfa {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Sonraki
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
