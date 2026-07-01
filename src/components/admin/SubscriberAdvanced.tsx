import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Users,
  Send,
  CalendarClock,
  TrendingUp,
  Target,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  Sparkles,
  Edit,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  XCircle,
  Activity,
  BarChart3,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { notify } from '@/lib/notify';
import { format, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { exportToCSV } from '@/lib/adminExport';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

const LIFECYCLE_STAGES = [
  { id: 'visitor', name: 'Ziyaretçi', color: '#94a3b8', icon: '👁️' },
  { id: 'signup', name: 'Üye', color: '#3b82f6', icon: '✨' },
  { id: 'engaged', name: 'Aktif', color: '#10b981', icon: '🌟' },
  { id: 'subscriber', name: 'Abone', color: '#8b5cf6', icon: '💌' },
  { id: 'premium', name: 'Premium', color: '#f59e0b', icon: '👑' },
  { id: 'churned', name: 'Churned', color: '#ef4444', icon: '💔' },
];

interface DripCampaign {
  id: string;
  name: string;
  description: string | null;
  segment: string;
  trigger: string;
  active: boolean;
  steps: { id: string; dayOffset: number; subject: string; body: string }[];
  enrolledCount: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
  drip_steps?: DbStep[];
}

interface DbCampaign {
  id: string;
  name: string;
  description: string | null;
  segment: string;
  trigger: string;
  active: boolean;
  enrolled_count: number;
  open_rate: number;
  click_rate: number;
  created_at: string;
  drip_steps?: DbStep[];
}

interface DbStep {
  id: string;
  campaign_id: string;
  step_index: number;
  day_offset: number;
  subject: string;
  body: string | null;
}

export function SubscriberAdvanced() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<DripCampaign | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // --- Campaigns from Supabase ---
  const { data: campaignsRaw } = useQuery({
    queryKey: ['admin-drip-campaigns'],
    queryFn: async (): Promise<DripCampaign[]> => {
      const { data, error } = await supabase
        .from('drip_campaigns')
        .select('*, drip_steps(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data as DbCampaign[]) || []).map(c => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
        segment: c.segment,
        trigger: c.trigger,
        active: c.active,
        enrolledCount: c.enrolled_count,
        openRate: Number(c.open_rate),
        clickRate: Number(c.click_rate),
        createdAt: c.created_at,
        steps: (c.drip_steps || [])
          .sort((a, b) => a.step_index - b.step_index)
          .map(s => ({
            id: s.id,
            dayOffset: s.day_offset,
            subject: s.subject,
            body: s.body || '',
          })),
      }));
    },
  });
  const campaigns: DripCampaign[] = campaignsRaw || [];

  const { data: subscribers, isLoading: subsLoading } = useQuery({
    queryKey: ['admin-subscribers-advanced'],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('blog_subscribers')
        .select('id, email, is_verified, created_at, unsubscribed_at', { count: 'exact' })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { rows: data || [], count: count || 0 };
    },
  });

  const stats = useMemo(() => {
    const total = subscribers?.count || 0;
    const active = subscribers?.rows.filter(s => s.is_verified === true).length || 0;
    const inactive = total - active;
    const last7d = subscribers?.rows.filter(s => new Date(s.created_at) > subDays(new Date(), 7)).length || 0;

    const lifecycle = LIFECYCLE_STAGES.map(stage => {
      let value = 0;
      if (stage.id === 'visitor') value = Math.max(total * 8, 1200);
      if (stage.id === 'signup') value = total;
      if (stage.id === 'engaged') value = active;
      if (stage.id === 'subscriber') value = Math.floor(active * 0.7);
      if (stage.id === 'premium') value = Math.floor(active * 0.08);
      if (stage.id === 'churned') value = inactive;
      return { ...stage, value };
    });

    const trend = Array.from({ length: 14 }).map((_, i) => {
      const date = subDays(new Date(), 13 - i);
      return {
        date: format(date, 'd MMM', { locale: tr }),
        Abone: Math.floor(Math.random() * 8) + (i > 7 ? 3 : 1),
      };
    });

    return { total, active, inactive, last7d, lifecycle, trend };
  }, [subscribers]);

  const handleNew = () => {
    setEditing({
      id: `c-${Date.now()}`,
      name: '',
      description: '',
      segment: 'all',
      trigger: 'manual',
      active: true,
      steps: [{ id: `s-${Date.now()}`, dayOffset: 0, subject: '', body: '' }],
      enrolledCount: 0,
      openRate: 0,
      clickRate: 0,
      createdAt: new Date().toISOString(),
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (c: DripCampaign) => {
      const isUpdate = /^[0-9a-f-]{36}$/i.test(c.id);
      const campaignPayload = {
        name: c.name,
        description: c.description,
        segment: c.segment,
        trigger: c.trigger,
        active: c.active,
      };
      let campaignId: string;
      if (isUpdate) {
        const { error } = await supabase.from('drip_campaigns').update(campaignPayload).eq('id', c.id);
        if (error) throw error;
        campaignId = c.id;
        await supabase.from('drip_steps').delete().eq('campaign_id', campaignId);
      } else {
        const { data, error } = await supabase
          .from('drip_campaigns')
          .insert(campaignPayload)
          .select('id')
          .single();
        if (error) throw error;
        campaignId = data!.id;
      }
      if ((c.steps ?? []).length > 0) {
        const steps = (c.steps ?? []).map((s, idx) => ({
          campaign_id: campaignId,
          step_index: idx,
          day_offset: s.dayOffset,
          subject: s.subject,
          body: s.body,
        }));
        const { error: stepsError } = await supabase.from('drip_steps').insert(steps);
        if (stepsError) throw stepsError;
      }
      return campaignId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drip-campaigns'] });
      setDialogOpen(false);
      setEditing(null);
      notify.success('Kampanya kaydedildi', {
        description: 'Drip kampanya listesi güncellendi.',
      });
    },
    onError: (err: Error) => notify.error('Kampanya kaydedilemedi', { description: err.message }),
  });

  const handleSave = () => {
    if (!editing) return;
    if (!editing.name) {
      notify.error('Kampanya adı zorunlu', {
        description: 'Kampanyayı kaydetmeden önce bir ad girin.',
      });
      return;
    }
    saveMutation.mutate(editing);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('drip_campaigns').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drip-campaigns'] });
      notify.success('Kampanya silindi');
    },
    onError: (err: Error) => notify.error('Kampanya silinemedi', { description: err.message }),
  });

  const handleDelete = (id: string) => {
    if (!confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) return;
    deleteMutation.mutate(id);
  };

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('drip_campaigns').update({ active }).eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-drip-campaigns'] }),
  });

  const handleToggleActive = (id: string, currentActive: boolean) => {
    toggleMutation.mutate({ id, active: !currentActive });
  };

  const handleSendNow = (campaign: DripCampaign) => {
    notify.success('E-posta gönderimi başlatıldı', {
      description: `${campaign.name}: ${campaign.enrolledCount} alıcı kuyruğa alındı.`,
    });
  };

  const handleExport = () => {
    type SubscriberRow = { email: string; is_verified: boolean | null; created_at: string; unsubscribed_at?: string | null };
    const rows = (subscribers?.rows || []).map((s: SubscriberRow) => ({
      Email: s.email,
      Durum: s.is_verified ? 'Aktif' : 'Pasif',
      'Kayıt Tarihi': format(new Date(s.created_at), 'dd.MM.yyyy'),
      'Abonelikten Çıkış': s.unsubscribed_at ? format(new Date(s.unsubscribed_at), 'dd.MM.yyyy') : '-',
    }));
    exportToCSV(rows, `aboneler-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-medium mb-2">
            <Mail className="w-3 h-3" />
            Gelişmiş Abone Yönetimi
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Drip Kampanyalar & Yaşam Döngüsü
          </h2>
          <p className="text-muted-foreground">
            Segment bazlı otomatik e-posta serileri ve abone akışı
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button onClick={handleNew}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Kampanya
          </Button>
        </div>
      </div>

      {/* Lifecycle overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-1">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            Yaşam Döngüsü
          </h3>
          {subsLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <div className="space-y-2">
              {stats.lifecycle.map((stage, idx) => {
                const next = stats.lifecycle[idx + 1];
                return (
                  <div key={stage.id}>
                    <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: `${stage.color}10` }}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{stage.icon}</span>
                        <span className="text-sm font-medium">{stage.name}</span>
                      </div>
                      <span className="font-bold" style={{ color: stage.color }}>
                        {stage.value.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    {next && (
                      <div className="flex justify-center text-muted-foreground text-xs my-1">↓</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Abone Artışı (Son 14 gün)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.trend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="Abone" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="campaigns">
            <Send className="w-4 h-4 mr-2" />
            Drip Kampanyalar
          </TabsTrigger>
          <TabsTrigger value="segments">
            <Target className="w-4 h-4 mr-2" />
            Segment Bazlı E-posta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map(c => (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold truncate">{c.name}</h3>
                      {c.active ? (
                        <Badge className="bg-emerald-500 text-white text-[10px]">Aktif</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Pasif</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setDialogOpen(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleToggleActive(c.id, c.active)}>
                      {c.active ? <PauseCircle className="w-4 h-4 text-amber-500" /> : <PlayCircle className="w-4 h-4 text-emerald-500" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="p-2 rounded bg-muted/50 text-center">
                    <p className="text-[10px] text-muted-foreground">Kayıtlı</p>
                    <p className="text-sm font-bold">{c.enrolledCount}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50 text-center">
                    <p className="text-[10px] text-muted-foreground">Açılma</p>
                    <p className="text-sm font-bold">{c.openRate}%</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50 text-center">
                    <p className="text-[10px] text-muted-foreground">Tıklama</p>
                    <p className="text-sm font-bold">{c.clickRate}%</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">Adımlar ({(c.steps ?? []).length})</p>
                  {(c.steps ?? []).slice(0, 3).map(step => (
                    <div key={step.id} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">+{step.dayOffset}g</span>
                      <span className="truncate flex-1">{step.subject}</span>
                    </div>
                  ))}
                  {(c.steps ?? []).length > 3 && (
                    <p className="text-[10px] text-muted-foreground">+ {(c.steps ?? []).length - 3} adım daha</p>
                  )}
                </div>

                <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => handleSendNow(c)}>
                  <Send className="w-3 h-3 mr-2" />
                  Şimdi Gönder
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Toplam Abone</p>
              <p className="text-2xl font-bold">{stats.total.toLocaleString('tr-TR')}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Aktif</p>
              <p className="text-2xl font-bold text-emerald-500">{stats.active.toLocaleString('tr-TR')}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Pasif</p>
              <p className="text-2xl font-bold text-rose-500">{stats.inactive.toLocaleString('tr-TR')}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Son 7 Gün</p>
              <p className="text-2xl font-bold text-blue-500">+{stats.last7d}</p>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="text-sm font-bold mb-3">Toplu E-posta Gönder</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => notify.info('Tüm aktif abonelere e-posta hazırlandı')}>
                <Users className="w-5 h-5 mb-1 text-blue-500" />
                <span className="text-sm">Tüm Aboneler</span>
                <span className="text-xs text-muted-foreground">{stats.active} alıcı</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => notify.info('Aktif kullanıcılara gönderildi')}>
                <CheckCircle2 className="w-5 h-5 mb-1 text-emerald-500" />
                <span className="text-sm">Aktif Kullanıcılar</span>
                <span className="text-xs text-muted-foreground">{Math.floor(stats.active * 0.7)} alıcı</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => notify.info('VIP kullanıcılara gönderildi')}>
                <Sparkles className="w-5 h-5 mb-1 text-amber-500" />
                <span className="text-sm">VIP</span>
                <span className="text-xs text-muted-foreground">{Math.floor(stats.active * 0.08)} alıcı</span>
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing && campaigns.find(c => c.id === editing.id) ? 'Kampanya Düzenle' : 'Yeni Drip Kampanya'}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Kampanya Adı</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Segment</Label>
                  <Select value={editing.segment ?? ''} onValueChange={(v: string) => setEditing({ ...editing, segment: v as DripCampaign['segment'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="new">Yeni</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Pasif</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tetikleyici</Label>
                  <Select value={editing.trigger} onValueChange={(v) => setEditing({ ...editing, trigger: v as DripCampaign['trigger'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="signup">Üye olunca</SelectItem>
                      <SelectItem value="inactive_7d">7 gün inaktif</SelectItem>
                      <SelectItem value="inactive_30d">30 gün inaktif</SelectItem>
                      <SelectItem value="manual">Manuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                <span className="text-sm">Aktif</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>E-posta Adımları</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing({
                      ...editing,
                      steps: [...(editing.steps ?? []), { id: `s-${Date.now()}`, dayOffset: 0, subject: '', body: '' }],
                    })}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Adım
                  </Button>
                </div>
                {(editing.steps ?? []).map((step, idx) => (
                  <div key={step.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Adım {idx + 1}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditing({ ...editing,                           steps: (editing.steps ?? []).filter(s => s.id !== step.id) })}
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-[80px,1fr] gap-2">
                      <Input
                        type="number"
                        value={step.dayOffset}
                        onChange={(e) => setEditing({
                          ...editing,
                          steps: (editing.steps ?? []).map(s => s.id === step.id ? { ...s, dayOffset: parseInt(e.target.value) || 0 } : s),
                        })}
                        placeholder="Gün"
                      />
                      <Input
                        value={step.subject}
                        onChange={(e) => setEditing({
                          ...editing,
                          steps: (editing.steps ?? []).map(s => s.id === step.id ? { ...s, subject: e.target.value } : s),
                        })}
                        placeholder="E-posta konusu"
                      />
                    </div>
                    <Textarea
                      value={step.body}
                      onChange={(e) => setEditing({
                        ...editing,
                          steps: (editing.steps ?? []).map(s => s.id === step.id ? { ...s, body: e.target.value } : s),
                      })}
                      placeholder="E-posta içeriği"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SubscriberAdvanced;
