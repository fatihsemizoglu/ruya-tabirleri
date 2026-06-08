// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
// Basit ceviri helper'i (i18n hook henuz eklenmedi; fallback string'ler)
const t = (key: string, params?: Record<string, unknown>): string => {
  const dict: Record<string, string> = {
    'profile.ruyaGezgini': 'Rüya Gezgini',
    'profile.ruyaGezginiEmoji': 'Rüya Gezgini',
    'profile.memberSince': 'üyesi',
    'profile.daysUnit': 'gün',
    'profile.signOut': 'Çıkış Yap',
    'profile.favorilerimPage': 'Favorilerim',
    'profile.profileInfo': 'Profil Bilgileri',
    'profile.profileInfoDesc': 'Bilgilerinizi güncelleyin',
    'profile.saving': 'Kaydediliyor...',
    'profile.saveChanges': 'Değişiklikleri Kaydet',
    'auth.fullName': 'Ad Soyad',
    'auth.fullNamePlaceholder': 'Adınızı ve soyadınızı girin',
    'auth.username': 'Kullanıcı Adı',
    'auth.usernamePlaceholder': 'kullanici_adi',
    'auth.email': 'E-posta',
    'profile.bio': 'Hakkımda',
    'profile.bioPlaceholder': 'Kendinizden bahsedin',
    'profile.profileUpdated': 'Profil güncellendi',
    'profile.profileUpdateError': 'Profil güncellenemedi',
    'profile.usernameTaken': 'Bu kullanıcı adı zaten alınmış',
    'profile.favoriteRemoved': 'Favori kaldırıldı',
    'favorites.error': 'Bir hata oluştu',
    'favorites.cancelBtn': 'İptal',
    'profile.statFavorites': 'Favoriler',
    'profile.statViews': 'Görüntülenme',
    'profile.statComments': 'Yorumlar',
    'profile.statJournal': 'Günlük',
    'profile.tabProfile': 'Profil',
    'profile.tabStats': 'İstatistikler',
    'profile.tabJournal': 'Günlük',
    'profile.tabFavorites': 'Favoriler',
    'profile.tabHistory': 'Geçmiş',
    'profile.usernameDefault': 'kullanici',
    'profile.memberSinceShort': 'Üyelik',
    'profile.profileCompletion': 'Profil Tamamlama',
    'profile.memberLevel': 'Seviye',
    'profile.levelUp': 'Daha fazla içerik ekleyerek seviye atlayın',
    'profile.activitySummary': 'Aktivite Özeti',
    'profile.statFavoritesLabel': 'Favoriler',
    'profile.statViewsLabel': 'Görüntülenme',
    'profile.statCommentsLabel': 'Yorumlar',
    'profile.statLikesLabel': 'Beğeniler',
    'profile.moodDistribution': 'Ruh Hali Dağılımı',
    'profile.moodHappy': 'Mutlu',
    'profile.moodSad': 'Üzgün',
    'profile.moodScared': 'Korkmuş',
    'profile.moodConfused': 'Kafası Karışık',
    'profile.moodPeaceful': 'Huzurlu',
    'profile.moodAnxious': 'Kaygılı',
    'profile.moodExcited': 'Heyecanlı',
    'profile.moodNeutral': 'Nötr',
    'profile.noMood': 'Henüz ruh hali kaydı yok',
    'profile.recentActivities': 'Son Aktiviteler',
    'profile.noActivity': 'Henüz aktivite yok',
    'profile.myComments': 'Yorumlarım',
    'profile.historyClearConfirm': 'Tüm geçmişi temizlemek istediğinize emin misiniz?',
    'profile.historyCleared': 'Geçmiş temizlendi',
    'profile.journalUpdated': 'Günlük güncellendi',
    'profile.journalAdded': 'Günlük eklendi',
    'profile.journalDeleteConfirm': 'Bu günlük girdisini silmek istediğinize emin misiniz?',
    'profile.journalDeleted': 'Günlük silindi',
    'profile.emailLocked': 'E-posta değiştirilemez'
  };
  let result = dict[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      result = result.split('{' + k + '}').join(String(v));
    });
  }
  return result;
};import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Camera, Heart, Clock, Book, Plus, Trash2, Edit, Eye, Calendar, Settings, LogOut, BarChart3, MessageCircle, TrendingUp, Award, Sparkles, Save, Activity, Hash, ArrowRight, Bookmark } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Dream, Favorite, ViewHistory, DreamJournalEntry, DreamMood, Comment } from '@/types/database';

type MoodValue = DreamMood | '';

const moodOptions: { value: DreamMood; key: string; emoji: string }[] = [
  { value: 'happy', key: 'moodHappy', emoji: '😊' },
  { value: 'sad', key: 'moodSad', emoji: '😢' },
  { value: 'scared', key: 'moodScared', emoji: '😨' },
  { value: 'confused', key: 'moodConfused', emoji: '😕' },
  { value: 'peaceful', key: 'moodPeaceful', emoji: '😌' },
  { value: 'anxious', key: 'moodAnxious', emoji: '😰' },
  { value: 'excited', key: 'moodExcited', emoji: '🤩' },
  { value: 'neutral', key: 'moodNeutral', emoji: '😐' },
];

const moodColors: Record<string, { ring: string; text: string; bg: string }> = {
  happy: { ring: 'stroke-amber-400', text: 'text-amber-500', bg: 'bg-amber-500/10' },
  sad: { ring: 'stroke-blue-400', text: 'text-blue-500', bg: 'bg-blue-500/10' },
  scared: { ring: 'stroke-purple-500', text: 'text-purple-500', bg: 'bg-purple-500/10' },
  confused: { ring: 'stroke-orange-400', text: 'text-orange-500', bg: 'bg-orange-500/10' },
  peaceful: { ring: 'stroke-emerald-400', text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  anxious: { ring: 'stroke-rose-400', text: 'text-rose-500', bg: 'bg-rose-500/10' },
  excited: { ring: 'stroke-pink-500', text: 'text-pink-500', bg: 'bg-pink-500/10' },
  neutral: { ring: 'stroke-slate-400', text: 'text-slate-500', bg: 'bg-slate-500/10' },
};

export default function Profile() {
  const locale = 'tr-TR'; // Always Turkish (Türkçe)
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab = useMemo(() => {
    if (rawTab === 'profil' || rawTab === 'profile') return 'profile';
    if (rawTab === 'gunluk' || rawTab === 'journal') return 'journal';
    if (rawTab === 'favoriler' || rawTab === 'favorites') return 'favorites';
    if (rawTab === 'gecmis' || rawTab === 'history') return 'history';
    return rawTab || 'profile';
  }, [rawTab]);
  const { user, profile, isLoading: authLoading, signOut } = useAuth();

  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    bio: '',
  });

  const [favorites, setFavorites] = useState<(Favorite & { dreams: Dream })[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);

  const [history, setHistory] = useState<(ViewHistory & { dreams: Dream })[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [entries, setEntries] = useState<DreamJournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [isJournalDialogOpen, setIsJournalDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DreamJournalEntry | null>(null);
  const [journalForm, setJournalForm] = useState({
    title: '',
    content: '',
    dream_date: new Date().toISOString().split('T')[0],
    mood: '' as MoodValue,
    tags: '',
  });

  const [stats, setStats] = useState({
    totalFavorites: 0,
    totalViews: 0,
    totalComments: 0,
    totalLikes: 0,
    journalEntries: 0,
    memberSince: '',
    moodDistribution: {} as Record<string, number>,
    recentActivity: [] as { type: string; title: string; date: string; link?: string }[],
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const [userComments, setUserComments] = useState<(Comment & { dreams?: Dream })[]>([]);

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;

    if (activeTab === 'stats') {
      fetchStats();
    } else if (activeTab === 'favorites' && favorites.length === 0) {
      fetchFavorites();
    } else if (activeTab === 'history' && history.length === 0) {
      fetchHistory();
    } else if (activeTab === 'journal' && entries.length === 0) {
      fetchEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const { count: favCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      const { count: viewCount } = await supabase
        .from('view_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      const { data: commentsData, count: commentCount } = await supabase
        .from('comments')
        .select('*, dreams(*)', { count: 'exact' })
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setUserComments((commentsData as (Comment & { dreams?: Dream })[]) || []);

      const { data: likesData } = await supabase
        .from('comments')
        .select('like_count')
        .eq('user_id', user!.id);

      const totalLikes = likesData?.reduce((sum, c) => sum + (c.like_count || 0), 0) || 0;

      const { data: journalData, count: journalCount } = await supabase
        .from('dream_journal')
        .select('*', { count: 'exact' })
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      const moodDist: Record<string, number> = {};
      journalData?.forEach((entry: DreamJournalEntry) => {
        if (entry.mood) {
          moodDist[entry.mood] = (moodDist[entry.mood] || 0) + 1;
        }
      });

      const recentActivity: { type: string; title: string; date: string; link?: string }[] = [];

      commentsData?.slice(0, 3).forEach((comment: Comment & { dreams: { title: string; slug: string } | null }) => {
        recentActivity.push({
          type: 'comment',
          title: t('profile.commentActivity', { title: comment.dreams?.title || t('profile.dreamFallback') }),
          date: comment.created_at,
          link: comment.dreams?.slug ? `/ruya/${comment.dreams.slug}` : undefined,
        });
      });

      journalData?.slice(0, 3).forEach((entry: DreamJournalEntry) => {
        recentActivity.push({
          type: 'journal',
          title: t('profile.journalActivity', { title: entry.title }),
          date: entry.created_at,
        });
      });

      recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setStats({
        totalFavorites: favCount || 0,
        totalViews: viewCount || 0,
        totalComments: commentCount || 0,
        totalLikes,
        journalEntries: journalCount || 0,
        memberSince: profile?.created_at || user!.created_at || '',
        moodDistribution: moodDist,
        recentActivity: recentActivity.slice(0, 5),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchFavorites = async () => {
    setFavoritesLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*, dreams(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites((data as (Favorite & { dreams: Dream })[]) || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('view_history')
        .select('*, dreams(*)')
        .eq('user_id', user!.id)
        .order('viewed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const uniqueHistory = data?.reduce((acc: (ViewHistory & { dreams?: Dream })[], curr: ViewHistory & { dreams?: Dream }) => {
        const exists = acc.find(h => h.dream_id === curr.dream_id);
        if (!exists) acc.push(curr);
        return acc;
      }, []) || [];

      setHistory(uniqueHistory as (ViewHistory & { dreams: Dream })[]);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchEntries = async () => {
    setEntriesLoading(true);
    try {
      const { data, error } = await supabase
        .from('dream_journal')
        .select('*')
        .eq('user_id', user!.id)
        .order('dream_date', { ascending: false });

      if (error) throw error;
      setEntries((data as DreamJournalEntry[]) || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setEntriesLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          username: formData.username,
          bio: formData.bio,
        })
        .eq('user_id', user!.id);

      if (error) throw error;

      // UI senkronizasyonu: DB'den guncel profili tekrar cek (hero ve formData icin).
      const { data: refreshed } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (refreshed) {
        setFormData({
          fullName: refreshed.full_name || '',
          username: refreshed.username || '',
          bio: refreshed.bio || '',
        });
      }

      toast.success(t('profile.profileUpdated'));
    } catch (err: unknown) {
      // Daha anlasilir hata mesajlari (Supabase/Postgres hata kodlari)
      let message = t('profile.profileUpdateError');
      const error = err instanceof Error ? err : new Error(String(err));
      const code = (err && typeof err === 'object' ? (err as Record<string, unknown>).code : null) || (err && typeof err === 'object' ? ((err as Record<string, unknown>).details as Record<string, unknown> | undefined)?.code : null);
      if (code === '23505' || /duplicate|unique/i.test(error.message || '')) {
        message = t('profile.usernameTaken') || 'Bu kullanici adi zaten alinmis, lutfen baska bir tane secin.';
      } else if (code === '42501' || /row.level.security|policy/i.test(error.message || '')) {
        message = 'Bu islem icin yetkiniz yok.';
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      const { error } = await supabase.from('favorites').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('profile.favoriteRemoved'));
      setFavorites(favorites.filter(f => f.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('favorites.error'));
    }
  };

  const clearHistory = async () => {
    if (!confirm(t('profile.historyClearConfirm'))) return;

    try {
      const { error } = await supabase.from('view_history').delete().eq('user_id', user!.id);
      if (error) throw error;
      toast.success(t('profile.historyCleared'));
      setHistory([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('favorites.error'));
    }
  };

  const removeHistoryItem = async (id: string) => {
    try {
      const { error } = await supabase.from('view_history').delete().eq('id', id);
      if (error) throw error;
      setHistory(history.filter(h => h.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('favorites.error'));
    }
  };

  const handleJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const entryData = {
        user_id: user!.id,
        title: journalForm.title,
        content: journalForm.content,
        dream_date: journalForm.dream_date,
        mood: journalForm.mood || null,
        tags: journalForm.tags ? journalForm.tags.split(',').map(t => t.trim()) : [],
      };

      if (selectedEntry) {
        const { error } = await supabase
          .from('dream_journal')
          .update(entryData)
          .eq('id', selectedEntry.id);
        if (error) throw error;
        toast.success(t('profile.journalUpdated'));
      } else {
        const { error } = await supabase.from('dream_journal').insert(entryData);
        if (error) throw error;
        toast.success(t('profile.journalAdded'));
      }

      setIsJournalDialogOpen(false);
      setSelectedEntry(null);
      setJournalForm({ title: '', content: '', dream_date: new Date().toISOString().split('T')[0], mood: '', tags: '' });
      fetchEntries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('favorites.error'));
    }
  };

  const openEditJournal = (entry: DreamJournalEntry) => {
    setSelectedEntry(entry);
    setJournalForm({
      title: entry.title,
      content: entry.content,
      dream_date: entry.dream_date,
      mood: entry.mood || '',
      tags: entry.tags?.join(', ') || '',
    });
    setIsJournalDialogOpen(true);
  };

  const deleteJournalEntry = async (id: string) => {
    if (!confirm(t('profile.journalDeleteConfirm'))) return;

    try {
      const { error } = await supabase.from('dream_journal').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('profile.journalDeleted'));
      setEntries(entries.filter(e => e.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('favorites.error'));
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-mesh">
          <div className="container py-12">
            <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-3xl bg-muted" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-muted rounded w-48" />
                  <div className="h-4 bg-muted rounded w-32" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-28 surface rounded-2xl" />)}
              </div>
              <div className="h-12 surface rounded-xl" />
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/giris" replace />;
  }

  const memberDate = new Date(profile?.created_at || user.created_at || '');
  const memberSinceLabel = memberDate.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
  const userInitial = (profile?.full_name?.[0] || profile?.username?.[0] || user.email?.[0] || 'U').toUpperCase();
  const displayName = profile?.full_name || profile?.username || t('profile.usernameDefault');
  const daysSinceMember = Math.max(0, Math.floor((Date.now() - memberDate.getTime()) / (1000 * 60 * 60 * 24)));
  const profileCompletion = [
    !!profile?.full_name,
    !!profile?.username,
    !!profile?.bio,
    !!user.email,
  ].filter(Boolean).length * 25;

  const getMoodLabel = (moodValue: string) => {
    const opt = moodOptions.find(m => m.value === moodValue);
    return opt ? t(`profile.${opt.key}`) : moodValue;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-mesh relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-full blur-3xl -translate-x-1/2 pointer-events-none" />

        {/* Hero Section */}
        <section className="relative">
          <div className="container pt-10 pb-8 md:pt-16 md:pb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="surface p-6 md:p-10 relative overflow-hidden"
            >
              <div className="absolute -top-32 -right-32 w-72 h-72 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-gradient-to-br from-indigo-500/15 to-blue-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="relative shrink-0"
                >
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 opacity-75 blur-md" />
                  <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-4xl md:text-5xl font-serif-dream font-bold text-white shadow-2xl">
                    {userInitial}
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:scale-110 transition-all border-4 border-card">
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </motion.div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-3"
                  >
                    <Sparkles className="w-3 h-3" />
                    {t('profile.ruyaGezgini')}
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-3xl md:text-4xl font-serif-dream font-bold leading-tight tracking-tight mb-2"
                  >
                    <span className="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                      {displayName}
                    </span>
                  </motion.h1>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground"
                  >
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {user.email}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {memberSinceLabel} {t('profile.memberSince')} · {daysSinceMember} {t('profile.daysUnit')}
                    </span>
                  </motion.div>

                  {profile?.bio && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mt-4 text-sm text-foreground/80 leading-relaxed italic border-l-2 border-primary/30 pl-4"
                    >
                      "{profile.bio}"
                    </motion.p>
                  )}
                </div>

                {/* Sign out & Favorilerim */}
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-2 w-full md:w-auto"
                >
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-xl h-10 hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/30"
                  >
                    <Link to="/favorilerim">
                      <Bookmark className="h-4 w-4 mr-2" />
                      {t('profile.favorilerimPage')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="rounded-xl h-10 hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('profile.signOut')}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Quick Stats Cards */}
        <section className="container pb-6">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08 } },
            }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { icon: Heart, label: t('profile.statFavorites'), value: stats.totalFavorites, gradient: 'from-rose-500 to-pink-500', bgGradient: 'from-rose-500/10 to-pink-500/5' },
              { icon: Eye, label: t('profile.statViews'), value: stats.totalViews, gradient: 'from-blue-500 to-cyan-500', bgGradient: 'from-blue-500/10 to-cyan-500/5' },
              { icon: MessageCircle, label: t('profile.statComments'), value: stats.totalComments, gradient: 'from-emerald-500 to-teal-500', bgGradient: 'from-emerald-500/10 to-teal-500/5' },
              { icon: Book, label: t('profile.statJournal'), value: stats.journalEntries, gradient: 'from-violet-500 to-purple-500', bgGradient: 'from-violet-500/10 to-purple-500/5' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 },
                  }}
                  whileHover={{ y: -4 }}
                  className={`relative surface p-5 overflow-hidden group cursor-default`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold tracking-tight">
                      {stat.value.toLocaleString(locale)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Tabs */}
        <section className="container pb-12">
          <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="space-y-8">
            <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl -mx-4 px-4 py-3 border-y border-border/60">
              <TabsList className="inline-flex h-12 bg-muted/40 p-1 rounded-xl w-full overflow-x-auto">
                <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all flex-1">
                  <Settings className="h-4 w-4 mr-1.5" />
                  <span>{t('profile.tabProfile')}</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all flex-1">
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  <span>{t('profile.tabStats')}</span>
                </TabsTrigger>
                <TabsTrigger value="journal" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all flex-1">
                  <Book className="h-4 w-4 mr-1.5" />
                  <span>{t('profile.tabJournal')}</span>
                </TabsTrigger>
                <TabsTrigger value="favorites" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all flex-1">
                  <Heart className="h-4 w-4 mr-1.5" />
                  <span>{t('profile.tabFavorites')}</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all flex-1">
                  <Clock className="h-4 w-4 mr-1.5" />
                  <span>{t('profile.tabHistory')}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-0">
              <div className="grid lg:grid-cols-[320px_1fr] gap-6">
                {/* Avatar Card */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="surface p-6"
                >
                  <div className="text-center">
                    <div className="relative inline-block mb-4">
                      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 opacity-75 blur-md" />
                      <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-5xl font-serif-dream font-bold text-white shadow-2xl">
                        {userInitial}
                      </div>
                    </div>
                    <h3 className="text-lg font-serif-dream font-bold mb-1">{displayName}</h3>
                    <p className="text-sm text-muted-foreground mb-4">@{profile?.username || t('profile.usernameDefault')}</p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5" /> {t('profile.memberSinceShort')}
                        </span>
                        <span className="font-medium">{memberSinceLabel}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5" /> {t('profile.profileCompletion')}
                        </span>
                        <span className="font-medium">%{profileCompletion}</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
                      <p className="text-xs text-muted-foreground">{t('profile.memberLevel')}</p>
                      <p className="text-sm font-semibold mt-1">{t('profile.ruyaGezginiEmoji')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('profile.levelUp')}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Form */}
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="surface p-6 md:p-8 relative overflow-hidden"
                >
                  <div className="absolute -top-32 -right-32 w-72 h-72 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border/60">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-serif-dream font-bold">{t('profile.profileInfo')}</h2>
                        <p className="text-sm text-muted-foreground">{t('profile.profileInfoDesc')}</p>
                      </div>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="fullName" className="text-sm font-medium">{t('auth.fullName')}</Label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                              id="fullName"
                              value={formData.fullName}
                              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                              className="pl-11 h-11 rounded-xl border-border/60"
                              placeholder={t('auth.fullNamePlaceholder')}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-sm font-medium">{t('auth.username')}</Label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">@</span>
                            <Input
                              id="username"
                              value={formData.username}
                              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                              className="pl-11 h-11 rounded-xl border-border/60"
                              placeholder={t('auth.usernamePlaceholder')}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">{t('auth.email')}</Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input
                            id="email"
                            value={user.email || ''}
                            disabled
                            className="pl-11 h-11 rounded-xl bg-muted/50 border-border/60 cursor-not-allowed"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{t('profile.emailLocked')}</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-sm font-medium">{t('profile.bio')}</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          placeholder={t('profile.bioPlaceholder')}
                          rows={4}
                          className="rounded-xl border-border/60 resize-none"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {t('profile.bioCount', { count: formData.bio.length })}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFormData({
                            fullName: profile?.full_name || '',
                            username: profile?.username || '',
                            bio: profile?.bio || '',
                          })}
                          className="rounded-xl h-11"
                        >
                          {t('favorites.cancelBtn')}
                        </Button>
                        <Button
                          type="submit"
                          disabled={isProfileLoading}
                          className="rounded-xl h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25 px-6"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {isProfileLoading ? t('profile.saving') : t('profile.saveChanges')}
                        </Button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="stats" className="mt-0">
              {statsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 surface rounded-2xl animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Activity Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="surface p-6"
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                        <TrendingUp className="h-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-serif-dream font-bold">{t('profile.activitySummary')}</h3>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: t('profile.statFavoritesLabel'), value: stats.totalFavorites, max: 100 },
                        { label: t('profile.statViewsLabel'), value: stats.totalViews, max: 50 },
                        { label: t('profile.statCommentsLabel'), value: stats.totalComments, max: 100 },
                        { label: t('profile.statLikesLabel'), value: stats.totalLikes, max: 20 },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-semibold">{item.value}</span>
                          </div>
                          <Progress value={Math.min(item.value * item.max / 100 * 100, 100)} className="h-2 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Mood Distribution */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="surface p-6"
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-md">
                        <Award className="h-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-serif-dream font-bold">{t('profile.moodDistribution')}</h3>
                    </div>
                    {Object.keys(stats.moodDistribution).length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(stats.moodDistribution).map(([mood, count]) => {
                          const moodOption = moodOptions.find(m => m.value === mood);
                          const percentage = Math.round((count / stats.journalEntries) * 100);
                          const radius = 24;
                          const circumference = 2 * Math.PI * radius;
                          const strokeDashoffset = circumference - (percentage / 100) * circumference;
                          const colors = moodColors[mood] || moodColors.neutral;

                          return (
                            <div key={mood} className="flex flex-col items-center p-3 rounded-xl bg-muted/30 border border-border/60 hover:border-primary/30 transition-all text-center">
                              <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle
                                    className="text-muted/40"
                                    strokeWidth="3"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r={radius}
                                    cx="32"
                                    cy="32"
                                  />
                                  <circle
                                    className={`${colors.ring} transition-all duration-700`}
                                    strokeWidth="3"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r={radius}
                                    cx="32"
                                    cy="32"
                                  />
                                </svg>
                                <span className="absolute text-2xl">{moodOption?.emoji}</span>
                              </div>
                              <span className="text-xs font-semibold text-foreground line-clamp-1">
                                {getMoodLabel(mood)}
                              </span>
                              <span className={`text-[10px] font-bold ${colors.text} mt-0.5`}>
                                {percentage}% · {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                          <Book className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm text-muted-foreground">{t('profile.noMood')}</p>
                      </div>
                    )}
                  </motion.div>

                  {/* Recent Activity */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="surface p-6 md:col-span-2"
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                        <Clock className="h-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-serif-dream font-bold">{t('profile.recentActivities')}</h3>
                    </div>
                    {stats.recentActivity.length > 0 ? (
                      <div className="relative pl-8 border-l-2 border-border/60 space-y-4">
                        {stats.recentActivity.map((activity, index) => {
                          const isComment = activity.type === 'comment';
                          return (
                            <div key={index} className="relative">
                              <div className={`absolute -left-[37px] top-3 w-4 h-4 rounded-full border-2 border-card flex items-center justify-center ${
                                isComment
                                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                                  : 'bg-gradient-to-br from-violet-500 to-purple-500'
                              }`}>
                                {isComment ? (
                                  <MessageCircle className="h-2 w-2 text-white" />
                                ) : (
                                  <Book className="h-2 w-2 text-white" />
                                )}
                              </div>

                              <Link
                                to={activity.link || '#'}
                                className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/60 hover:border-primary/30 hover:bg-muted/50 transition-all block"
                              >
                                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                                  isComment
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : 'bg-violet-500/10 text-violet-600'
                                }`}>
                                  {isComment ? <MessageCircle className="h-5 w-5" /> : <Book className="h-5 w-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold line-clamp-1">
                                    {activity.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(activity.date).toLocaleDateString(locale, {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                          <Clock className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm text-muted-foreground">{t('profile.noActivity')}</p>
                      </div>
                    )}
                  </motion.div>

                  {/* User Comments */}
                  {userComments.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="surface p-6 md:col-span-2"
                    >
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                            <MessageCircle className="h-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-serif-dream font-bold">{t('profile.myComments')}</h3>
                        </div>
                        <Badge variant="secondary" className="rounded-full">
                          {t('profile.totalBadge', { count: stats.totalComments })}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {userComments.slice(0, 5).map((comment) => (
                          <div key={comment.id} className="p-4 rounded-xl bg-muted/30 border border-border/60 hover:border-primary/30 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              {comment.dreams?.slug ? (
                                <Link
                                  to={`/ruya/${comment.dreams.slug}`}
                                  className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1 flex-1"
                                >
                                  {comment.dreams?.title || t('profile.dreamFallback')}
                                </Link>
                              ) : (
                                <span className="text-sm font-semibold">{comment.dreams?.title || t('profile.dreamFallback')}</span>
                              )}
                              <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                <Heart className="h-3 w-3" />
                                {comment.like_count || 0}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/80 line-clamp-2">{comment.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(comment.created_at).toLocaleDateString(locale)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Dream Journal Tab */}
            <TabsContent value="journal" className="mt-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-serif-dream font-bold">{t('profile.journalTitle')}</h2>
                  <p className="text-sm text-muted-foreground">{t('profile.journalDesc')}</p>
                </div>
                <Dialog open={isJournalDialogOpen} onOpenChange={(open) => {
                  setIsJournalDialogOpen(open);
                  if (!open) {
                    setSelectedEntry(null);
                    setJournalForm({ title: '', content: '', dream_date: new Date().toISOString().split('T')[0], mood: '', tags: '' });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('profile.newJournalBtn')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-serif-dream">
                        {selectedEntry ? t('profile.editJournalTitle') : t('profile.newJournalTitle')}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleJournalSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t('profile.titleLabel')}</Label>
                        <Input
                          value={journalForm.title}
                          onChange={(e) => setJournalForm({ ...journalForm, title: e.target.value })}
                          placeholder={t('profile.titlePlaceholder')}
                          required
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('profile.dateLabel')}</Label>
                          <Input
                            type="date"
                            value={journalForm.dream_date}
                            onChange={(e) => setJournalForm({ ...journalForm, dream_date: e.target.value })}
                            required
                            className="h-11 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('profile.moodLabel')}</Label>
                          <Select
                            value={journalForm.mood}
                            onValueChange={(value) => setJournalForm({ ...journalForm, mood: value as MoodValue })}
                          >
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder={t('profile.selectPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                              {moodOptions.map((mood) => (
                                <SelectItem key={mood.value} value={mood.value}>
                                  {mood.emoji} {t(`profile.${mood.key}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('profile.contentLabel')}</Label>
                        <Textarea
                          value={journalForm.content}
                          onChange={(e) => setJournalForm({ ...journalForm, content: e.target.value })}
                          placeholder={t('profile.contentPlaceholder')}
                          rows={5}
                          required
                          className="rounded-xl resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('profile.tagsLabel')}</Label>
                        <Input
                          value={journalForm.tags}
                          onChange={(e) => setJournalForm({ ...journalForm, tags: e.target.value })}
                          placeholder={t('profile.tagsPlaceholder')}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setIsJournalDialogOpen(false)} className="rounded-xl">
                          {t('favorites.cancelBtn')}
                        </Button>
                        <Button type="submit" className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
                          {selectedEntry ? t('profile.update') : t('profile.save')}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {entriesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 surface rounded-2xl animate-pulse" />)}
                </div>
              ) : entries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {entries.map((entry) => {
                    const mood = moodOptions.find(m => m.value === entry.mood);
                    const moodColor = entry.mood ? moodColors[entry.mood] : null;
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative surface p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden"
                      >
                        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${moodColor ? moodColor.bg.replace('bg-', 'from-').replace('/10', '-500') : 'from-violet-500 to-fuchsia-500'} ${moodColor ? 'to-' + moodColor.bg.split('-')[1] + '-500' : ''}`} />

                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                            <Calendar className="h-3 w-3" />
                            {new Date(entry.dream_date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                          {mood && moodColor && (
                            <div className={`flex items-center gap-1 ${moodColor.bg} px-2.5 py-1 rounded-full text-xs font-semibold ${moodColor.text}`}>
                              <span>{mood.emoji}</span>
                              <span>{t(`profile.${mood.key}`)}</span>
                            </div>
                          )}
                        </div>

                        <h3 className="text-lg font-serif-dream font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {entry.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-4 mb-4 leading-relaxed whitespace-pre-line">
                          {entry.content}
                        </p>

                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {entry.tags.slice(0, 4).map((tag) => (
                              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted/50 border border-border/60">
                                <Hash className="w-2.5 h-2.5 inline mr-0.5 opacity-60" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-3 border-t border-border/60">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditJournal(entry)}
                            className="rounded-lg flex-1 hover:bg-violet-500/10 hover:text-violet-600"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" />{t('profile.editBtn')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteJournalEntry(entry.id)}
                            className="rounded-lg flex-1 hover:bg-rose-500/10 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />{t('profile.deleteBtn')}
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20 surface rounded-3xl"
                >
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-5">
                    <Book className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-serif-dream font-bold mb-2">{t('profile.noJournals')}</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {t('profile.noJournalsDesc')}
                  </p>
                  <Button
                    onClick={() => setIsJournalDialogOpen(true)}
                    className="rounded-xl h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />{t('profile.addFirstJournal')}
                  </Button>
                </motion.div>
              )}
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="mt-0">
              <div className="mb-6">
                <h2 className="text-2xl font-serif-dream font-bold">{t('profile.favoritesTitle')}</h2>
                <p className="text-sm text-muted-foreground">{t('profile.favoritesDesc')}</p>
              </div>
              {favoritesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 surface rounded-2xl animate-pulse" />)}
                </div>
              ) : favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {favorites.map((fav) => (
                    <motion.div
                      key={fav.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group relative surface p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden"
                    >
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
                      <Link to={`/ruya/${fav.dreams.slug}`} className="block">
                        <h3 className="text-lg font-serif-dream font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {fav.dreams.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{fav.dreams.content}</p>
                      </Link>
                      <div className="flex items-center justify-between pt-3 border-t border-border/60">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {(fav.dreams.view_count || 0).toLocaleString(locale)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {(fav.dreams.like_count || 0).toLocaleString(locale)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFavorite(fav.id)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                          title={t('profile.favoriteRemoveConfirm')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20 surface rounded-3xl"
                >
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-5">
                    <Heart className="h-10 w-10 text-rose-500" />
                  </div>
                  <h3 className="text-xl font-serif-dream font-bold mb-2">{t('profile.noFavoritesInTab')}</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {t('profile.noFavoritesInTabDesc')}
                  </p>
                  <Button asChild className="rounded-xl h-11 bg-gradient-to-r from-rose-600 to-pink-600 text-white">
                    <Link to="/">{t('profile.browseDreams')}</Link>
                  </Button>
                </motion.div>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-serif-dream font-bold">{t('profile.historyTitle')}</h2>
                  <p className="text-sm text-muted-foreground">{t('profile.historyDesc')}</p>
                </div>
                {history.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearHistory} className="rounded-xl hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30">
                    <Trash2 className="mr-2 h-4 w-4" />{t('profile.clearAllHistory')}
                  </Button>
                )}
              </div>
              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 surface rounded-xl animate-pulse" />)}
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div key={item.id} className="group flex items-center gap-3 p-4 surface hover:border-amber-500/30 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center shrink-0">
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                      <Link to={`/ruya/${item.dreams.slug}`} className="flex-1 min-w-0">
                        <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                          {item.dreams.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>
                            {new Date(item.viewed_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {(item.dreams.view_count || 0).toLocaleString(locale)}
                          </span>
                        </div>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeHistoryItem(item.id)}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20 surface rounded-3xl"
                >
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-5">
                    <Clock className="h-10 w-10 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-serif-dream font-bold mb-2">{t('profile.noHistory')}</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {t('profile.noHistoryDesc')}
                  </p>
                  <Button asChild className="rounded-xl h-11 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    <Link to="/">{t('profile.browseDreams')}</Link>
                  </Button>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </Layout>
  );
}
