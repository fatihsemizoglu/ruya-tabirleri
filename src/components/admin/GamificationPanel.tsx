import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Award,
  Star,
  TrendingUp,
  Users,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Crown,
  Medal,
  Zap,
  Moon,
  Share2,
  Sparkles,
  Target,
  X,
  Save,
  Mail,
  Bell,
  CalendarClock,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { subDays, format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { exportToCSV } from '@/lib/adminExport';

const XP_RULES = {
  comment: 10,
  share: 5,
  dailyLogin: 2,
  dreamJournal: 15,
  interpretation: 8,
};

interface DbBadge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  category: Badge['category'];
  rarity: Badge['rarity'];
  condition: string | null;
  auto: boolean;
  is_active: boolean;
  created_at: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  condition: string;
  auto: boolean;
  category: 'engagement' | 'achievement' | 'special' | 'loyalty';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  createdAt?: string;
  assignedCount?: number;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  xp: number;
  level: number;
  comments: number;
  shares: number;
  avatar?: string;
}

interface ChurnRisk {
  userId: string;
  name: string;
  risk: 'high' | 'medium' | 'low';
  score: number;
  lastLogin: string;
  commentsLast30d: number;
  subscription: 'active' | 'inactive';
  email: string;
}

const STORAGE_KEY_CAMPAIGNS = 'admin_gamification_campaigns';

const ICON_MAP: Record<string, typeof Trophy> = {
  Trophy,
  Award,
  Star,
  Moon,
  Share2,
  Sparkles,
};

function computeLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

function xpToNextLevel(level: number): number {
  return level * level * 50;
}

const RARITY_COLORS: Record<Badge['rarity'], string> = {
  common: 'bg-slate-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-amber-500',
};

const CATEGORY_LABELS: Record<Badge['category'], string> = {
  engagement: 'Etkileşim',
  achievement: 'Başarı',
  special: 'Özel',
  loyalty: 'Sadakat',
};

export function GamificationPanel() {
  const queryClient = useQueryClient();
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Badges from Supabase ---
  const { data: badgesRaw, isLoading: badgesLoading } = useQuery({
    queryKey: ['admin-gamification-badges'],
    queryFn: async (): Promise<Badge[]> => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return ((data as DbBadge[]) || []).map(d => ({
        id: d.id,
        name: d.name,
        description: d.description || '',
        icon: d.icon,
        color: d.color,
        category: d.category,
        rarity: d.rarity,
        condition: d.condition || '',
        auto: d.auto,
        createdAt: d.created_at,
      }));
    },
  });
  const badges: Badge[] = useMemo(() => badgesRaw || [], [badgesRaw]);

  // --- Leaderboard from real data ---
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['admin-gamification-leaderboard'],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const sinceIso = subDays(new Date(), 30).toISOString();
      const [{ data: profiles }, { data: comments }, { data: views }, { data: favorites }] = await Promise.all([
        supabase.from('profiles').select('user_id, username, full_name, avatar_url').limit(200),
        supabase.from('comments').select('user_id, created_at').gte('created_at', sinceIso),
        supabase.from('view_history').select('user_id, viewed_at').gte('viewed_at', sinceIso),
        supabase.from('favorites').select('user_id').gte('created_at', sinceIso),
      ]);

      const xpMap = new Map<string, { xp: number; comments: number; shares: number }>();
      const userMap = new Map<string, { name: string; avatar?: string }>();

      profiles?.forEach(p => {
        userMap.set(p.user_id, { name: p.full_name || p.username || 'Kullanıcı', avatar: p.avatar_url || undefined });
        xpMap.set(p.user_id, { xp: 0, comments: 0, shares: 0 });
      });

      const commentCount = new Map<string, number>();
      comments?.forEach(c => commentCount.set(c.user_id, (commentCount.get(c.user_id) || 0) + 1));

      const viewCount = new Map<string, number>();
      views?.forEach(v => viewCount.set(v.user_id, (viewCount.get(v.user_id) || 0) + 1));

      profiles?.forEach(p => {
        const u = xpMap.get(p.user_id);
        if (!u) return;
        const c = commentCount.get(p.user_id) || 0;
        const v = viewCount.get(p.user_id) || 0;
        const f = favorites?.filter(f => f.user_id === p.user_id).length || 0;
        u.comments = c;
        u.shares = f;
        u.xp = c * XP_RULES.comment + f * XP_RULES.share + v * 1 + XP_RULES.dailyLogin;
      });

      return Array.from(xpMap.entries())
        .map(([userId, stats]) => {
          const profile = userMap.get(userId);
          return {
            userId,
            name: profile?.name || 'Anonim',
            avatar: profile?.avatar,
            xp: stats.xp,
            comments: stats.comments,
            shares: stats.shares,
            level: computeLevel(stats.xp),
          };
        })
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 50);
    },
  });

  // --- Churn Prediction ---
  const { data: churnData, isLoading: churnLoading } = useQuery({
    queryKey: ['admin-gamification-churn'],
    queryFn: async (): Promise<ChurnRisk[]> => {
      const since30 = subDays(new Date(), 30).toISOString();
      const [{ data: profiles }, { data: comments }, { data: views }, { data: subs }] = await Promise.all([
        supabase.from('profiles').select('user_id, username, full_name').limit(500),
        supabase.from('comments').select('user_id, created_at').gte('created_at', since30),
        supabase.from('view_history').select('user_id, viewed_at').gte('viewed_at', since30),
        supabase.from('blog_subscribers').select('user_id, is_active'),
      ]);

      const userMap = new Map<string, ChurnRisk>();
      const commentMap = new Map<string, number>();
      const viewMap = new Map<string, number>();
      const subMap = new Map<string, boolean>();

      comments?.forEach(c => commentMap.set(c.user_id, (commentMap.get(c.user_id) || 0) + 1));
      views?.forEach(v => viewMap.set(v.user_id, (viewMap.get(v.user_id) || 0) + 1));
      subs?.forEach(s => subMap.set(s.user_id, !!s.is_active));

      profiles?.forEach(p => {
        const c = commentMap.get(p.user_id) || 0;
        const v = viewMap.get(p.user_id) || 0;
        const isActive = subMap.get(p.user_id) || false;
        const lastLogin = v > 0 ? new Date().toISOString() : p.user_id;

        let score = 0;
        if (v === 0) score += 50;
        else if (v < 3) score += 25;
        if (c === 0) score += 20;
        if (!isActive) score += 15;

        const risk: ChurnRisk['risk'] = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';

        userMap.set(p.user_id, {
          userId: p.user_id,
          name: p.full_name || p.username || 'Kullanıcı',
          risk,
          score: Math.min(score, 100),
          lastLogin,
          commentsLast30d: c,
          subscription: isActive ? 'active' : 'inactive',
          email: `${p.username || 'user'}@example.com`,
        });
      });

      return Array.from(userMap.values())
        .filter(u => u.risk !== 'low')
        .sort((a, b) => b.score - a.score)
        .slice(0, 30);
    },
  });

  const stats = useMemo(() => {
    const totalXP = (leaderboard || []).reduce((sum, u) => sum + u.xp, 0);
    const activeUsers = (leaderboard || []).filter(u => u.xp > 0).length;
    const totalBadges = badges.length;
    const highRisk = (churnData || []).filter(u => u.risk === 'high').length;
    return { totalXP, activeUsers, totalBadges, highRisk };
  }, [leaderboard, badges, churnData]);

  const saveBadgeMutation = useMutation({
    mutationFn: async (badge: Badge) => {
      const { error } = await supabase
        .from('badges')
        .upsert({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          color: badge.color,
          category: badge.category,
          rarity: badge.rarity,
          condition: badge.condition,
          auto: badge.auto,
          is_active: true,
        });
      if (error) throw error;
      return badge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gamification-badges'] });
      setIsDialogOpen(false);
      setEditingBadge(null);
      toast.success('Rozet kaydedildi');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('badges').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gamification-badges'] });
      toast.success('Rozet silindi');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleNewBadge = () => {
    setEditingBadge({
      id: `b-${Date.now()}`,
      name: '',
      description: '',
      icon: 'Award',
      color: 'from-blue-500 to-cyan-500',
      condition: '',
      auto: true,
      category: 'engagement',
      rarity: 'common',
    });
    setIsDialogOpen(true);
  };

  const handleEditBadge = (badge: Badge) => {
    setEditingBadge({ ...badge });
    setIsDialogOpen(true);
  };

  const handleExportBadges = () => {
    const rows = badges.map(b => ({
      ID: b.id,
      İsim: b.name,
      Açıklama: b.description,
      Kategori: CATEGORY_LABELS[b.category],
      Nadirlik: b.rarity,
      Otomatik: b.auto ? 'Evet' : 'Hayır',
      Koşul: b.condition,
    }));
    exportToCSV(rows, `rozetler-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const filteredBadges = badges.filter(b =>
    !searchTerm || b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium mb-2">
            <Trophy className="w-3 h-3" />
            Gamification
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Rozet, Seviye & Sadakat
          </h2>
          <p className="text-muted-foreground">
            Kullanıcı katılımı, seviye sistemi ve churn tahmini
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Toplam XP</p>
              <p className="text-2xl font-bold">{stats.totalXP.toLocaleString('tr-TR')}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Aktif Kullanıcı</p>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rozet Sayısı</p>
              <p className="text-2xl font-bold">{stats.totalBadges}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Yüksek Risk</p>
              <p className="text-2xl font-bold text-rose-500">{stats.highRisk}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="badges">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="badges">
            <Award className="w-4 h-4 mr-2" />
            Rozetler
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <Trophy className="w-4 h-4 mr-2" />
            Liderlik
          </TabsTrigger>
          <TabsTrigger value="churn">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Churn Tahmini
          </TabsTrigger>
        </TabsList>

        {/* === BADGES === */}
        <TabsContent value="badges" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rozet ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportBadges}>
                CSV Dışa Aktar
              </Button>
              <Button onClick={handleNewBadge}>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Rozet
              </Button>
            </div>
          </div>

          {badgesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : filteredBadges.length === 0 ? (
            <Card className="p-12 text-center">
              <Award className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold mb-1">Henüz rozet yok</p>
              <p className="text-sm text-muted-foreground mb-4">İlk rozeti oluşturarak başlayın</p>
              <Button onClick={handleNewBadge}>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Rozet
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBadges.map(badge => {
              const Icon = ICON_MAP[badge.icon] || Trophy;
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-5 group hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditBadge(badge)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Bu rozeti silmek istediğinize emin misiniz?')) {
                              deleteBadgeMutation.mutate(badge.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-bold mb-1">{badge.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{badge.description}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      <Badge variant="outline" className="text-[10px]">
                        {CATEGORY_LABELS[badge.category]}
                      </Badge>
                      <Badge className={`text-[10px] text-white ${RARITY_COLORS[badge.rarity]}`}>
                        {badge.rarity}
                      </Badge>
                      {badge.auto ? (
                        <Badge variant="secondary" className="text-[10px]">Otomatik</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Manuel</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 font-mono">
                      {badge.condition}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
            </div>
          )}
        </TabsContent>

        {/* === LEADERBOARD === */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-semibold">XP Sistemi:</span>
              <span className="text-muted-foreground">
                Yorum {XP_RULES.comment} • Paylaşım {XP_RULES.share} • Günlük giriş {XP_RULES.dailyLogin} • Rüya {XP_RULES.dreamJournal} • Yorumlatma {XP_RULES.interpretation}
              </span>
            </div>
          </Card>

          {leaderboardLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : !leaderboard || leaderboard.length === 0 ? (
            <Card className="p-12 text-center">
              <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold">Henüz liderlik verisi yok</p>
            </Card>
          ) : (
            <Card className="p-4">
              <div className="space-y-2">
                {leaderboard.map((entry, idx) => {
                  const nextLevelXP = xpToNextLevel(entry.level);
                  const progress = ((entry.xp % nextLevelXP) / nextLevelXP) * 100;
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        idx < 3 ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="w-8 text-center text-xl">{idx < 3 ? medals[idx] : idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate flex items-center gap-2">
                          {entry.name}
                          {entry.level >= 10 && <Crown className="w-3 h-3 text-amber-500" />}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            Lv.{entry.level}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-amber-600 dark:text-amber-400">
                          {entry.xp.toLocaleString('tr-TR')} XP
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.comments} yorum • {entry.shares} paylaşım
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* === CHURN === */}
        <TabsContent value="churn" className="space-y-4">
          <Card className="p-4 bg-rose-500/5 border-rose-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Churn (Kayıp) Tahmini</p>
                <p className="text-muted-foreground">
                  Son 30 günde yorum yapmayan, abone olmayan veya giriş yapmayan kullanıcılar yüksek risk altındadır.
                </p>
              </div>
            </div>
          </Card>

          {churnLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : !churnData || churnData.length === 0 ? (
            <Card className="p-12 text-center">
              <Target className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold">Risk altında kullanıcı yok 🎉</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {churnData.map(user => (
                <Card key={user.userId} className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold truncate">{user.name}</p>
                        <Badge
                          variant={user.risk === 'high' ? 'destructive' : 'secondary'}
                          className="text-[10px]"
                        >
                          {user.risk === 'high' ? 'Yüksek Risk' : 'Orta Risk'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          Skor: {user.score}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.commentsLast30d} yorum (30g) • Abonelik: {user.subscription === 'active' ? 'Aktif' : 'Pasif'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info(`${user.name} kullanıcısına "Seni özledik" e-postası gönderildi`)}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        E-posta
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info(`${user.name} kullanıcısına push bildirim gönderildi`)}
                      >
                        <Bell className="w-4 h-4 mr-1" />
                        Push
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Badge Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingBadge && badges.find(b => b.id === editingBadge.id) ? 'Rozet Düzenle' : 'Yeni Rozet'}
            </DialogTitle>
            <DialogDescription>
              Koşul SQL/JS expression olarak tanımlanır (örn: <code>comment_count &gt;= 10</code>)
            </DialogDescription>
          </DialogHeader>
          {editingBadge && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>İsim</Label>
                  <Input
                    value={editingBadge.name}
                    onChange={(e) => setEditingBadge({ ...editingBadge, name: e.target.value })}
                    placeholder="İlk Rüya"
                  />
                </div>
                <div className="space-y-2">
                  <Label>İkon</Label>
                  <Select
                    value={editingBadge.icon}
                    onValueChange={(v) => setEditingBadge({ ...editingBadge, icon: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Award">Ödül</SelectItem>
                      <SelectItem value="Trophy">Kupa</SelectItem>
                      <SelectItem value="Star">Yıldız</SelectItem>
                      <SelectItem value="Moon">Ay</SelectItem>
                      <SelectItem value="Share2">Paylaş</SelectItem>
                      <SelectItem value="Sparkles">Parıltı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={editingBadge.description}
                  onChange={(e) => setEditingBadge({ ...editingBadge, description: e.target.value })}
                  placeholder="Kullanıcıya gösterilecek açıklama"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select
                    value={editingBadge.category}
                    onValueChange={(v) => setEditingBadge({ ...editingBadge, category: v as Badge['category'] })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engagement">Etkileşim</SelectItem>
                      <SelectItem value="achievement">Başarı</SelectItem>
                      <SelectItem value="special">Özel</SelectItem>
                      <SelectItem value="loyalty">Sadakat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nadirlik</Label>
                  <Select
                    value={editingBadge.rarity}
                    onValueChange={(v) => setEditingBadge({ ...editingBadge, rarity: v as Badge['rarity'] })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Yaygın</SelectItem>
                      <SelectItem value="rare">Nadir</SelectItem>
                      <SelectItem value="epic">Epik</SelectItem>
                      <SelectItem value="legendary">Efsanevi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Koşul (JS Expression)</Label>
                <Input
                  value={editingBadge.condition}
                  onChange={(e) => setEditingBadge({ ...editingBadge, condition: e.target.value })}
                  placeholder="comment_count >= 10"
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Switch
                  checked={editingBadge.auto}
                  onCheckedChange={(v) => setEditingBadge({ ...editingBadge, auto: v })}
                />
                <div>
                  <p className="text-sm font-medium">Otomatik Atama</p>
                  <p className="text-xs text-muted-foreground">
                    Koşul sağlandığında otomatik olarak verilir
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              İptal
            </Button>
            <Button onClick={() => editingBadge && saveBadgeMutation.mutate(editingBadge)}>
              <Save className="w-4 h-4 mr-2" />
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GamificationPanel;
