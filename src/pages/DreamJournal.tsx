import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Plus, Book, Calendar, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { usersApi } from '@/lib/api';
import type { DreamJournalEntry, DreamMood } from '@/types/database';

const moodOptions: { value: DreamMood; label: string; emoji: string }[] = [
  { value: 'happy', label: 'Mutlu', emoji: '😊' },
  { value: 'sad', label: 'Üzgün', emoji: '😢' },
  { value: 'scared', label: 'Korkmuş', emoji: '😨' },
  { value: 'confused', label: 'Şaşkın', emoji: '😕' },
  { value: 'peaceful', label: 'Huzurlu', emoji: '😌' },
  { value: 'anxious', label: 'Endişeli', emoji: '😰' },
  { value: 'excited', label: 'Heyecanlı', emoji: '🤩' },
  { value: 'neutral', label: 'Nötr', emoji: '😐' },
];

export default function DreamJournal() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<DreamJournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DreamJournalEntry | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    dream_date: new Date().toISOString().split('T')[0],
    mood: '' as DreamMood | '',
    tags: '',
  });

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const fetchEntries = async () => {
    try {
      const response = await usersApi.getJournal();

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch journal entries');
      }

      setEntries((response.data as DreamJournalEntry[]) || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const entryData = {
        title: formData.title,
        content: formData.content,
        dream_date: formData.dream_date,
        mood: formData.mood || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      };

      if (selectedEntry) {
        const response = await usersApi.updateJournalEntry(selectedEntry.id, entryData);

        if (!response.success) {
          throw new Error(response.error || 'Failed to update entry');
        }

        toast({ title: 'Rüya güncellendi' });
      } else {
        const response = await usersApi.createJournalEntry(entryData);

        if (!response.success) {
          throw new Error(response.error || 'Failed to create entry');
        }

        toast({ title: 'Rüya eklendi' });
      }

      setIsDialogOpen(false);
      setSelectedEntry(null);
      setFormData({ title: '', content: '', dream_date: new Date().toISOString().split('T')[0], mood: '', tags: '' });
      fetchEntries();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Hata', description: error.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu rüyayı silmek istediğinize emin misiniz?')) return;

    try {
      const response = await usersApi.deleteJournalEntry(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete entry');
      }

      toast({ title: 'Rüya silindi' });
      fetchEntries();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Hata', description: error.message });
    }
  };

  const openEditDialog = (entry: DreamJournalEntry) => {
    setSelectedEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      dream_date: entry.dream_date,
      mood: entry.mood || '',
      tags: entry.tags?.join(', ') || '',
    });
    setIsDialogOpen(true);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-muted rounded-xl" />
              ))}
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Rüya Günlüğüm</h1>
            <p className="text-muted-foreground">
              Gördüğünüz rüyaları kaydedin ve zamanla analiz edin.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setSelectedEntry(null);
              setFormData({ title: '', content: '', dream_date: new Date().toISOString().split('T')[0], mood: '', tags: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="dream-gradient">
                <Plus className="mr-2 h-4 w-4" />
                Yeni Rüya Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {selectedEntry ? 'Rüyayı Düzenle' : 'Yeni Rüya Ekle'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Başlık</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Rüyanıza bir başlık verin"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Tarih</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.dream_date}
                      onChange={(e) => setFormData({ ...formData, dream_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mood">Duygu Durumu</Label>
                    <Select
                      value={formData.mood}
                      onValueChange={(value) => setFormData({ ...formData, mood: value as DreamMood })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {moodOptions.map((mood) => (
                          <SelectItem key={mood.value} value={mood.value}>
                            {mood.emoji} {mood.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Rüya İçeriği</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Rüyanızı detaylı bir şekilde anlatın..."
                    rows={5}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Etiketler</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="yılan, su, uçmak (virgülle ayırın)"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button type="submit" className="dream-gradient">
                    {selectedEntry ? 'Güncelle' : 'Kaydet'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Entries */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry) => (
              <div key={entry.id} className="dream-card group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(entry.dream_date).toLocaleDateString('tr-TR')}</span>
                  </div>
                  {entry.mood && (
                    <span className="text-2xl">
                      {moodOptions.find(m => m.value === entry.mood)?.emoji}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-serif font-semibold mb-2">{entry.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{entry.content}</p>

                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {entry.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-muted">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(entry)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Düzenle
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(entry.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Sil
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Book className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif font-semibold mb-2">Henüz rüya eklemediniz</h3>
            <p className="text-muted-foreground mb-6">
              İlk rüyanızı kaydetmeye başlayın ve rüya dünyanızı keşfedin.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="dream-gradient">
              <Plus className="mr-2 h-4 w-4" />
              İlk Rüyamı Ekle
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
