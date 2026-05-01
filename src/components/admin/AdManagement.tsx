import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Megaphone, Plus, Edit, Trash2, Eye, MousePointerClick, TrendingUp } from 'lucide-react';

const POSITIONS = [
  { value: 'header', label: 'Üst Banner' },
  { value: 'sidebar', label: 'Yan Panel' },
  { value: 'in_content', label: 'İçerik Arası' },
  { value: 'footer', label: 'Alt Banner' },
  { value: 'popup', label: 'Popup' },
];

export function AdManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', position: 'header', content_html: '', image_url: '', link_url: '', is_active: true,
    start_date: '', end_date: '',
  });

  const { data: ads } = useQuery({
    queryKey: ['admin-ads'],
    queryFn: async () => {
      const { data } = await fetchApi<any[]>('/admin/ads');
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => fetchApi('/admin/ads', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-ads'] }); setDialogOpen(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: any) => fetchApi(`/admin/ads/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-ads'] }); setDialogOpen(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchApi(`/admin/ads/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-ads'] }),
  });

  const resetForm = () => {
    setForm({ name: '', position: 'header', content_html: '', image_url: '', link_url: '', is_active: true, start_date: '', end_date: '' });
    setEditing(null);
  };

  const openEdit = (ad: any) => {
    setEditing(ad);
    setForm({
      name: ad.name, position: ad.position, content_html: ad.content_html || '',
      image_url: ad.image_url || '', link_url: ad.link_url || '', is_active: ad.is_active,
      start_date: ad.start_date?.slice(0, 10) || '', end_date: ad.end_date?.slice(0, 10) || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Reklam Yönetimi
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Yeni Reklam</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? 'Reklam Düzenle' : 'Yeni Reklam'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Ad</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div>
                  <Label>Pozisyon</Label>
                  <Select value={form.position} onValueChange={v => setForm(f => ({ ...f, position: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Görsel URL</Label><Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} /></div>
                <div><Label>Link URL</Label><Input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} /></div>
                <div><Label>HTML İçerik</Label><Textarea value={form.content_html} onChange={e => setForm(f => ({ ...f, content_html: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Başlangıç</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
                  <div><Label>Bitiş</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                  <Label>Aktif</Label>
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={!form.name}>
                  {editing ? 'Güncelle' : 'Oluştur'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>Pozisyon</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Gösterim</TableHead>
              <TableHead>Tıklama</TableHead>
              <TableHead>CTR</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(ads || []).map((ad: any) => (
              <TableRow key={ad.id}>
                <TableCell className="font-medium">{ad.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{POSITIONS.find(p => p.value === ad.position)?.label || ad.position}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={ad.is_active ? 'default' : 'secondary'}>{ad.is_active ? 'Aktif' : 'Pasif'}</Badge>
                </TableCell>
                <TableCell><Eye className="inline h-3 w-3 mr-1" />{ad.impression_count || 0}</TableCell>
                <TableCell><MousePointerClick className="inline h-3 w-3 mr-1" />{ad.click_count || 0}</TableCell>
                <TableCell>
                  {ad.impression_count > 0
                    ? `${((ad.click_count / ad.impression_count) * 100).toFixed(1)}%`
                    : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ad)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(ad.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
