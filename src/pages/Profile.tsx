import { useState, useEffect } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { User, Mail, Camera, Heart, Clock, Book, Plus, Trash2, Edit, Eye, Calendar, Settings, LogOut, BarChart3, MessageCircle, TrendingUp, Award, Sparkles } from 'lucide-react';
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
import { api, type Dream, type Favorite, type ViewHistory, type DreamJournalEntry, type DreamMood, type Comment } from '@/lib/api';

const moodOptions: { value: DreamMood; label: string; emoji: string }[] = [
  { value: 'happy', label: 'Mutlu', emoji: '??' },
  { value: 'sad', label: 'Üzgün', emoji: '??' },
  { value: 'scared', label: 'Korkmu?', emoji: '??' },
  { value: 'confused', label: '??k?n', emoji: '??' },
  { value: 'peaceful', label: 'Huzurlu', emoji: '??' },
  { value: 'anxious', label: 'Endi?eli', emoji: '??' },
  { value: 'excited', label: 'Heyecanl?', emoji: '??' },
  { value: 'neutral', label: 'Nötr', emoji: '??' },
];

export default function Profile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  const { user, profile, isLoading: authLoading, signOut, updateProfile } = useAuth();
  
  // Profile form state
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    bio: '',
  });

  // Favorites state
  const [favorites, setFavorites] = useState<(Favorite & { dreams?: Dream })[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);

  // History state
  const [history, setHistory] = useState<(ViewHistory & { dreams?: Dream })[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Dream journal state
  const [entries, setEntries] = useState<DreamJournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [isJournalDialogOpen, setIsJournalDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DreamJournalEntry | null>(null);
  const [journalForm, setJournalForm] = useState({
    title: '',
    content: '',
    dream_date: new Date().toISOString().split('T')[0],
    mood: '' as DreamMood | '',
    tags: '',
  });

  // Statistics state
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

  // User comments state
  const [userComments, setUserComments] = useState<(Comment & { dreams?: Dream })[]>([]);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  // Fetch data based on active tab
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
  }, [activeTab, user]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await api.users.getStats();
      if (response.success && response.data) {
        setStats({
          totalFavorites: response.data.totalFavorites || 0,
          totalViews: response.data.totalViews || 0,
          totalComments: response.data.totalComments || 0,
          totalLikes: response.data.totalLikes || 0,
          journalEntries: response.data.journalEntries || 0,
          memberSince: profile?.created_at || '',
          moodDistribution: response.data.moodDistribution || {},
          recentActivity: response.data.recentActivity || [],
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchFavorites = async () => {
    setFavoritesLoading(true);
    try {
      const response = await api.users.getFavorites();
      if (response.success && response.data) {
        setFavorites(response.data as (Favorite & { dreams?: Dream })[]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await api.users.getHistory();
      if (response.success && response.data) {
        setHistory(response.data as (ViewHistory & { dreams?: Dream })[]);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchEntries = async () => {
    setEntriesLoading(true);
    try {
      const response = await api.users.getJournal();
      if (response.success && response.data) {
        setEntries(response.data);
      }
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
      const { error } = await updateProfile({
        full_name: formData.fullName,
        username: formData.username,
        bio: formData.bio,
      });
      
      if (error) throw error;
      toast.success('Profil güncellendi');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Profil güncellenirken bir hata olu?tu';
      toast.error(message);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      const response = await api.users.removeFavorite(id);
      if (!response.success) throw new Error(response.error);
      toast.success('Favorilerden kald?r?ld?');
      setFavorites(favorites.filter(f => f.id !== id));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Bir hata olu?tu';
      toast.error(message);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Tüm geçmi?i silmek istedi?inize emin misiniz?')) return;

    try {
      const response = await api.users.clearHistory();
      if (!response.success) throw new Error(response.error);
      toast.success('Geçmi? temizlendi');
      setHistory([]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Bir hata olu?tu';
      toast.error(message);
    }
  };

  const removeHistoryItem = async (id: string) => {
    try {
      const response = await api.users.removeHistoryItem(id);
      if (!response.success) throw new Error(response.error);
      setHistory(history.filter(h => h.id !== id));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Bir hata olu?tu';
      toast.error(message);
    }
  };

  const handleJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const entryData = {
        title: journalForm.title,
        content: journalForm.content,
        dream_date: journalForm.dream_date,
        mood: journalForm.mood as DreamMood || null,
        tags: journalForm.tags ? journalForm.tags.split(',').map(t => t.trim()) : [],
      };

      if (selectedEntry) {
        const response = await api.users.updateJournalEntry(selectedEntry.id, entryData);
        if (!response.success) throw new Error(response.error);
        toast.success('Rüya güncellendi');
      } else {
        const response = await api.users.createJournalEntry(entryData);
        if (!response.success) throw new Error(response.error);
        toast.success('Rüya eklendi');
      }

      setIsJournalDialogOpen(false);
      setSelectedEntry(null);
      setJournalForm({ title: '', content: '', dream_date: new Date().toISOString().split('T')[0], mood: '', tags: '' });
      fetchEntries();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Bir hata olu?tu';
      toast.error(message);
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
    if (!confirm('Bu rüyay? silmek istedi?inize emin misiniz?')) return;

    try {
      const response = await api.users.deleteJournalEntry(id);
      if (!response.success) throw new Error(response.error);
      toast.success('Rüya silindi');
      setEntries(entries.filter(e => e.id !== id));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Bir hata olu?tu';
      toast.error(message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="max-w-4xl mx-auto animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8" />
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/giris" replace />;
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 pb-8 border-b border-border">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center text-2xl sm:text-3xl font-medium text-primary ring-4 ring-primary/20">
                {profile?.full_name?.[0] || profile?.username?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold">
                  {profile?.full_name || profile?.username || 'Kullan?c?'}
                </h1>
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Üye
                </Badge>
              </div>
              <p className="text-muted-foreground">{user.email}</p>
              {profile?.bio && (
                <p className="mt-2 text-sm">{profile.bio}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(profile?.created_at || '').toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                  })} üye
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Ç?k?? Yap
            </Button>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="dream-card text-center">
              <Heart className="h-6 w-6 mx-auto mb-2 text-pink-500" />
              <p className="text-2xl font-bold">{stats.totalFavorites}</p>
              <p className="text-xs text-muted-foreground">Favori</p>
            </div>
            <div className="dream-card text-center">
              <Eye className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{stats.totalViews}</p>
              <p className="text-xs text-muted-foreground">Görüntüleme</p>
            </div>
            <div className="dream-card text-center">
              <MessageCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats.totalComments}</p>
              <p className="text-xs text-muted-foreground">Yorum</p>
            </div>
            <div className="dream-card text-center">
              <Book className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{stats.journalEntries}</p>
              <p className="text-xs text-muted-foreground">Rüya Günlü?ü</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Profil</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">?statistik</span>
              </TabsTrigger>
              <TabsTrigger value="journal" className="flex items-center gap-2">
                <Book className="h-4 w-4" />
                <span className="hidden sm:inline">Günlük</span>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Favoriler</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Geçmi?</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="dream-card">
                <h2 className="text-xl font-serif font-semibold mb-6">Profil Bilgileri</h2>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Ad Soyad</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Ad Soyad"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Kullan?c? Ad?</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="kullanici_adi"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Hakk?mda</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Kendinizden bahsedin..."
                      rows={4}
                    />
                  </div>
                  <Button type="submit" disabled={isProfileLoading}>
                    {isProfileLoading ? 'Kaydediliyor...' : 'De?i?iklikleri Kaydet'}
                  </Button>
                </form>
              </div>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats">
              <div className="space-y-6">
                {statsLoading ? (
                  <div className="dream-card animate-pulse">
                    <div className="h-8 bg-muted rounded w-1/3 mb-4" />
                    <div className="h-32 bg-muted rounded" />
                  </div>
                ) : (
                  <>
                    {/* Mood Distribution */}
                    <div className="dream-card">
                      <h3 className="text-lg font-serif font-semibold mb-4">Rüya Durumu Da??l?m?</h3>
                      {Object.keys(stats.moodDistribution).length > 0 ? (
                        <div className="space-y-3">
                          {Object.entries(stats.moodDistribution).map(([mood, count]) => {
                            const moodOption = moodOptions.find(m => m.value === mood);
                            const percentage = (count / stats.journalEntries) * 100;
                            return (
                              <div key={mood}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>{moodOption?.emoji} {moodOption?.label}</span>
                                  <span className="text-muted-foreground">{count} rüya</span>
                                </div>
                                <Progress value={percentage} className="h-2" />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          Henüz rüya günlü?ü kayd?n?z yok.
                        </p>
                      )}
                    </div>

                    {/* Recent Activity */}
                    <div className="dream-card">
                      <h3 className="text-lg font-serif font-semibold mb-4">Son Aktiviteler</h3>
                      {stats.recentActivity.length > 0 ? (
                        <div className="space-y-3">
                          {stats.recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                              {activity.type === 'comment' ? (
                                <MessageCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <Book className="h-5 w-5 text-purple-500" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm">{activity.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(activity.date).toLocaleDateString('tr-TR')}
                                </p>
                              </div>
                              {activity.link && (
                                <Link to={activity.link} className="text-primary text-sm hover:underline">
                                  Görüntüle
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          Henüz aktivite yok.
                        </p>
                      )}
                    </div>

                    {/* User Comments */}
                    <div className="dream-card">
                      <h3 className="text-lg font-serif font-semibold mb-4">Yorumlar?n?z</h3>
                      {userComments.length > 0 ? (
                        <div className="space-y-3">
                          {userComments.map((comment) => (
                            <div key={comment.id} className="p-3 rounded-lg bg-muted/50">
                              <p className="text-sm mb-2">{comment.content}</p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {comment.dreams?.title ? (
                                    <Link to={`/ruya/${comment.dreams.slug}`} className="hover:text-primary">
                                      {comment.dreams.title}
                                    </Link>
                                  ) : (
                                    'Rüya'
                                  )}
                                </span>
                                <span>{new Date(comment.created_at).toLocaleDateString('tr-TR')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          Henüz yorum yapmam??s?n?z.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Journal Tab */}
            <TabsContent value="journal">
              <div className="dream-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-serif font-semibold">Rüya Günlü?ü</h2>
                  <Dialog open={isJournalDialogOpen} onOpenChange={setIsJournalDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setSelectedEntry(null);
                        setJournalForm({ title: '', content: '', dream_date: new Date().toISOString().split('T')[0], mood: '', tags: '' });
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Rüya
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{selectedEntry ? 'Rüyay? Düzenle' : 'Yeni Rüya Ekle'}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleJournalSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Rüya Ba?l???</Label>
                          <Input
                            id="title"
                            value={journalForm.title}
                            onChange={(e) => setJournalForm({ ...journalForm, title: e.target.value })}
                            placeholder="Rüyan?z?n ba?l???"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dream_date">Rüya Tarihi</Label>
                          <Input
                            id="dream_date"
                            type="date"
                            value={journalForm.dream_date}
                            onChange={(e) => setJournalForm({ ...journalForm, dream_date: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mood">Rüya Durumu</Label>
                          <Select
                            value={journalForm.mood}
                            onValueChange={(value) => setJournalForm({ ...journalForm, mood: value as DreamMood })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Rüya durumunu seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {moodOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.emoji} {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="content">Rüya ?çeri?i</Label>
                          <Textarea
                            id="content"
                            value={journalForm.content}
                            onChange={(e) => setJournalForm({ ...journalForm, content: e.target.value })}
                            placeholder="Rüyan?z? detayl? bir ?ekilde anlat?n..."
                            rows={6}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tags">Etiketler</Label>
                          <Input
                            id="tags"
                            value={journalForm.tags}
                            onChange={(e) => setJournalForm({ ...journalForm, tags: e.target.value })}
                            placeholder="virgülle ay?r?n: uçmak, su, a?aç..."
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsJournalDialogOpen(false)}>
                            ?ptal
                          </Button>
                          <Button type="submit">
                            {selectedEntry ? 'Güncelle' : 'Kaydet'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {entriesLoading ? (
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-muted rounded" />
                    ))}
                  </div>
                ) : entries.length > 0 ? (
                  <div className="space-y-4">
                    {entries.map((entry) => (
                      <div key={entry.id} className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{entry.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(entry.dream_date).toLocaleDateString('tr-TR')}
                              {entry.mood && (
                                <>
                                  <span>·</span>
                                  <span>{moodOptions.find(m => m.value === entry.mood)?.emoji} {moodOptions.find(m => m.value === entry.mood)?.label}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditJournal(entry)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteJournalEntry(entry.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{entry.content}</p>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Henüz rüya kayd?n?z yok</h3>
                    <p className="text-muted-foreground mb-4">
                      Rüyalar?n?z? kaydedin ve tekrar gözden geçirin.
                    </p>
                    <Button onClick={() => setIsJournalDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      ?lk Rüyan?z? Ekleyin
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites">
              <div className="dream-card">
                <h2 className="text-xl font-serif font-semibold mb-6">Favori Rüyalar?m</h2>
                {favoritesLoading ? (
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded" />
                    ))}
                  </div>
                ) : favorites.length > 0 ? (
                  <div className="space-y-3">
                    {favorites.map((favorite) => (
                      <div key={favorite.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <Link to={`/ruya/${favorite.dreams?.slug}`} className="flex-1">
                          <h4 className="font-medium">{favorite.dreams?.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(favorite.created_at).toLocaleDateString('tr-TR')} tarihinde eklendi
                          </p>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => removeFavorite(favorite.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Henüz favori rüyalar?n?z yok</h3>
                    <p className="text-muted-foreground">
                      Be?endi?iniz rüyalar? favorilere ekleyerek buradan eri?ebilirsiniz.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <div className="dream-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-serif font-semibold">Geçmi?</h2>
                  {history.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearHistory}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Geçmi?i Temizle
                    </Button>
                  )}
                </div>
                {historyLoading ? (
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded" />
                    ))}
                  </div>
                ) : history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <Link to={`/ruya/${item.dreams?.slug}`} className="flex-1">
                          <h4 className="font-medium">{item.dreams?.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(item.viewed_at).toLocaleDateString('tr-TR')} tarihinde görüntülendi
                          </p>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => removeHistoryItem(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Geçmi? bo?</h3>
                    <p className="text-muted-foreground">
                      Görüntüledi?iniz rüyalar burada listelenecektir.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
