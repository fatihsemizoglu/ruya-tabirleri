import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Plus, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';

interface CalendarItem {
  id: string;
  title: string;
  description: string;
  content_type: string;
  status: string;
  scheduled_date: string;
  tags: string[];
}

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  review: 'bg-purple-100 text-purple-700',
  published: 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<string, string> = {
  planned: 'Planlandı',
  in_progress: 'Devam Ediyor',
  review: 'İncelemede',
  published: 'Yayınlandı',
};

const TYPE_LABELS: Record<string, string> = {
  blog_post: 'Blog Yazısı',
  dream: 'Rüya Tabiri',
  social_media: 'Sosyal Medya',
  newsletter: 'Bülten',
};

export function ContentCalendar() {
  const queryClient = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarItem | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', content_type: 'blog_post', status: 'planned', scheduled_date: '', tags: '',
  });

  const { data: items } = useQuery({
    queryKey: ['content-calendar', year, month],
    queryFn: async () => {
      const { data } = await fetchApi<any[]>(`/admin/content-calendar?year=${year}&month=${month}`);
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => fetchApi('/admin/content-calendar', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-calendar'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchApi(`/admin/content-calendar/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content-calendar'] }),
  });

  const resetForm = () => {
    setForm({ title: '', description: '', content_type: 'blog_post', status: 'planned', scheduled_date: '', tags: '' });
    setEditing(null);
  };

  const handleSubmit = () => {
    createMutation.mutate({
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDay = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const monthName = new Date(year, month - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  const itemsByDay: Record<number, CalendarItem[]> = {};
  (items || []).forEach((item: CalendarItem) => {
    const day = new Date(item.scheduled_date).getDate();
    if (!itemsByDay[day]) itemsByDay[day] = [];
    itemsByDay[day].push(item);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            İçerik Takvimi
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => month === 1 ? (setYear(y => y - 1), setMonth(12)) : setMonth(m => m - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[140px] text-center capitalize">{monthName}</span>
            <Button variant="ghost" size="icon" onClick={() => month === 12 ? (setYear(y => y + 1), setMonth(1)) : setMonth(m => m + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Ekle</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? 'İçerik Düzenle' : 'Yeni İçerik Planla'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Başlık</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Açıklama</Label>
                    <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tür</Label>
                      <Select value={form.content_type} onValueChange={v => setForm(f => ({ ...f, content_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Durum</Label>
                      <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Tarih</Label>
                    <Input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Etiketler (virgülle ayırın)</Label>
                    <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="seo, blog, rüya" />
                  </div>
                  <Button className="w-full" onClick={handleSubmit} disabled={!form.title || !form.scheduled_date}>
                    {editing ? 'Güncelle' : 'Oluştur'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDay }, (_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: totalDays }, (_, i) => {
            const day = i + 1;
            const dayItems = itemsByDay[day] || [];
            return (
              <div key={day} className={`min-h-[80px] p-1 rounded-lg border text-xs ${dayItems.length > 0 ? 'border-primary/30 bg-primary/5' : 'border-transparent hover:bg-muted'}`}>
                <div className="font-medium text-sm mb-1">{day}</div>
                {dayItems.slice(0, 2).map(item => (
                  <div key={item.id} className={`px-1 py-0.5 rounded text-[10px] mb-0.5 truncate ${STATUS_COLORS[item.status] || 'bg-muted'}`}>
                    {item.title}
                  </div>
                ))}
                {dayItems.length > 2 && <div className="text-[10px] text-muted-foreground">+{dayItems.length - 2} daha</div>}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
