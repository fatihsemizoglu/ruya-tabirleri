import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  Trophy,
  Trash2,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  X,
  Save,
  Sparkles,
  Activity,
  Crown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { exportToCSV } from '@/lib/adminExport';

interface ABVariant {
  id: string;
  name: string;
  payload: Record<string, unknown>;
  weight: number;
}

interface ABTest {
  id: string;
  name: string;
  hypothesis: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ABVariant[];
  metrics: string[];
  winner?: string;
  createdAt: string;
  updatedAt: string;
}

interface VariantStats {
  id: string;
  name: string;
  views: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
  avgTimeOnPage: number;
  uniqueUsers: number;
}

interface Comparison {
  controlId: string;
  variantId: string;
  lift: number;
  pValue: number;
  significant: boolean;
}

interface TestStats {
  variants: VariantStats[];
  comparisons: Comparison[];
  winner?: string;
  timeSeries: Array<Record<string, number | string | number>>;
}

const STATUS_COLORS = {
  draft: 'bg-slate-500',
  running: 'bg-emerald-500',
  paused: 'bg-amber-500',
  completed: 'bg-blue-500',
};

const STATUS_LABELS = {
  draft: 'Taslak',
  running: 'Çalışıyor',
  paused: 'Duraklatıldı',
  completed: 'Tamamlandı',
};

async function callManager(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('ab-test-manager', { body });
  if (error) throw error;
  return data;
}

export function ABTestManager() {
  const queryClient = useQueryClient();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [editing, setEditing] = useState<Partial<ABTest> | null>(null);
  const [detailTest, setDetailTest] = useState<ABTest | null>(null);

  const { data: tests, isLoading } = useQuery({
    queryKey: ['admin-ab-tests'],
    queryFn: async () => {
      const res = await callManager({ action: 'list' });
      return (res.tests as ABTest[]) || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (test: Partial<ABTest>) => {
      const res = await callManager({ action: 'create', test });
      return res.test as ABTest;
    },
    onSuccess: (test) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ab-tests'] });
      toast.success('Test oluşturuldu');
      setWizardOpen(false);
      setEditing(null);
      setStep(1);
      setDetailTest(test);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ABTest> }) => {
      const res = await callManager({ action: 'update', id, patch });
      return res.test as ABTest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ab-tests'] });
      toast.success('Test güncellendi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await callManager({ action: 'delete', id });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ab-tests'] });
      toast.success('Test silindi');
    },
  });

  const handleStart = (test: ABTest) =>
    updateMutation.mutate({ id: test.id, patch: { status: 'running' } });

  const handlePause = (test: ABTest) =>
    updateMutation.mutate({ id: test.id, patch: { status: 'paused' } });

  const handleComplete = (test: ABTest, winnerId?: string) =>
    updateMutation.mutate({
      id: test.id,
      patch: { status: 'completed', ...(winnerId ? { winner: winnerId } : test.winner ? { winner: test.winner } : {}) },
    });

  const handleExport = (test: ABTest) => {
    const rows = test.variants.map(v => ({
      Varyant: v.name,
      Ağırlık: v.weight,
      Payload: JSON.stringify(v.payload),
    }));
    exportToCSV(rows, `ab-test-${test.id}.csv`);
  };

  const startNew = () => {
    setEditing({
      name: '',
      hypothesis: '',
      status: 'draft',
      variants: [
        { id: 'v-control', name: 'Kontrol (A)', payload: {}, weight: 1 },
        { id: 'v-variant', name: 'Varyant (B)', payload: {}, weight: 1 },
      ],
      metrics: ['view', 'click', 'conversion'],
    });
    setStep(1);
    setWizardOpen(true);
  };

  const totalWeight = (editing?.variants || []).reduce((s, v) => s + (v.weight || 1), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400 text-xs font-medium mb-2">
            <FlaskConical className="w-3 h-3" />
            A/B Test Framework
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            A/B Test Yönetimi
          </h2>
          <p className="text-muted-foreground">
            Deterministik varyant atama, istatistiksel analiz ve otomatik kazanan seçimi
          </p>
        </div>
        <Button onClick={startNew}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Test
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : !tests || tests.length === 0 ? (
        <Card className="p-16 text-center">
          <FlaskConical className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold mb-1">Henüz A/B test yok</p>
          <p className="text-sm text-muted-foreground mb-4">
            Deterministik hash atama ve istatistiksel analiz ile içerik testleri yapın
          </p>
          <Button onClick={startNew}>
            <Plus className="w-4 h-4 mr-2" />
            İlk Testi Oluştur
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map(test => (
            <TestCard
              key={test.id}
              test={test}
              onStart={() => handleStart(test)}
              onPause={() => handlePause(test)}
              onComplete={(winner) => handleComplete(test, winner)}
              onDelete={() => {
                if (confirm(`${test.name} silinecek. Emin misiniz?`)) {
                  deleteMutation.mutate(test.id);
                }
              }}
              onExport={() => handleExport(test)}
              onView={() => setDetailTest(test)}
            />
          ))}
        </div>
      )}

      {/* Wizard Dialog */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Yeni A/B Test - Adım {step}/4
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4 py-2">
              <Progress value={(step / 4) * 100} className="mb-4" />

              {step === 1 && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Test Adı</Label>
                    <Input
                      value={editing.name || ''}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      placeholder="örn: Yeni Başlık Testi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hipotez</Label>
                    <Textarea
                      value={editing.hypothesis || ''}
                      onChange={(e) => setEditing({ ...editing, hypothesis: e.target.value })}
                      placeholder="örn: Daha kısa başlık tıklama oranını artırır"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <Label>Varyantlar</Label>
                  {editing.variants?.map((v, idx) => (
                    <Card key={v.id} className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={v.name}
                          onChange={(e) => setEditing({
                            ...editing,
                            variants: editing.variants!.map((vv, i) => i === idx ? { ...vv, name: e.target.value } : vv),
                          })}
                          placeholder={`Varyant ${idx + 1}`}
                        />
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={v.weight}
                          onChange={(e) => setEditing({
                            ...editing,
                            variants: editing.variants!.map((vv, i) => i === idx ? { ...vv, weight: parseInt(e.target.value) || 1 } : vv),
                          })}
                          className="w-20"
                          title="Ağırlık"
                        />
                        {editing.variants!.length > 2 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditing({
                              ...editing,
                              variants: editing.variants!.filter((_, i) => i !== idx),
                            })}
                          >
                            <X className="w-4 h-4 text-rose-500" />
                          </Button>
                        )}
                      </div>
                      <Textarea
                        value={JSON.stringify(v.payload, null, 2)}
                        onChange={(e) => {
                          try {
                            const payload = JSON.parse(e.target.value);
                            setEditing({
                              ...editing,
                              variants: editing.variants!.map((vv, i) => i === idx ? { ...vv, payload } : vv),
                            });
                          } catch (_error) {
                            // Keep the previous payload while JSON is incomplete.
                          }
                        }}
                        placeholder='{"title": "...", "cta": "..."}'
                        rows={3}
                        className="font-mono text-xs"
                      />
                    </Card>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing({
                      ...editing,
                      variants: [
                        ...(editing.variants || []),
                        { id: `v-${Date.now()}`, name: `Varyant ${(editing.variants?.length || 0) + 1}`, payload: {}, weight: 1 },
                      ],
                    })}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Varyant Ekle
                  </Button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <Label>Metrikler</Label>
                  <div className="space-y-2">
                    {['view', 'click', 'conversion', 'time_on_page'].map(m => (
                      <label key={m} className="flex items-center gap-2 p-2 border rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(editing.metrics || []).includes(m)}
                          onChange={(e) => {
                            const current = editing.metrics || [];
                            setEditing({
                              ...editing,
                              metrics: e.target.checked
                                ? [...current, m]
                                : current.filter(x => x !== m),
                            });
                          }}
                        />
                        <span className="text-sm font-mono">{m}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <Label>Özet</Label>
                  <Card className="p-4 space-y-2 text-sm">
                    <div><strong>İsim:</strong> {editing.name}</div>
                    <div><strong>Hipotez:</strong> {editing.hypothesis || '-'}</div>
                    <div><strong>Varyantlar:</strong> {editing.variants?.length}</div>
                    <div><strong>Metrikler:</strong> {editing.metrics?.join(', ')}</div>
                  </Card>
                  <p className="text-xs text-muted-foreground">
                    Test taslak olarak oluşturulacak. İstediğiniz zaman başlatabilirsiniz.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (step === 1) {
                  setWizardOpen(false);
                  setEditing(null);
                } else {
                  setStep(step - 1);
                }
              }}
            >
              {step === 1 ? 'İptal' : 'Geri'}
            </Button>
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!editing?.name}>
                İleri
              </Button>
            ) : (
              <Button
                onClick={() => editing && createMutation.mutate(editing)}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Oluştur
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <TestDetailDialog test={detailTest} onClose={() => setDetailTest(null)} />
    </div>
  );
}

interface TestCardProps {
  test: ABTest;
  onStart: () => void;
  onPause: () => void;
  onComplete: (winnerId?: string) => void;
  onDelete: () => void;
  onExport: () => void;
  onView: () => void;
}

function TestCard({ test, onStart, onPause, onComplete, onDelete, onExport, onView }: TestCardProps) {
  const totalWeight = test.variants.reduce((s, v) => s + v.weight, 0) || 1;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold truncate">{test.name}</h3>
              <Badge className={`text-[10px] text-white ${STATUS_COLORS[test.status]}`}>
                {STATUS_LABELS[test.status]}
              </Badge>
              {test.winner && (
                <Badge variant="outline" className="text-[10px]">
                  <Crown className="w-3 h-3 mr-1 text-amber-500" />
                  Kazanan
                </Badge>
              )}
            </div>
            {test.hypothesis && (
              <p className="text-xs text-muted-foreground line-clamp-2 italic">"{test.hypothesis}"</p>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <p className="text-xs font-semibold text-muted-foreground">Trafik Bölümü</p>
          {test.variants.map(v => {
            const pct = ((v.weight / totalWeight) * 100).toFixed(0);
            return (
              <div key={v.id} className="flex items-center gap-2 text-xs">
                <span className="w-24 truncate">{v.name}</span>
                <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-mono w-10 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {test.metrics.map(m => (
            <Badge key={m} variant="outline" className="text-[10px] font-mono">{m}</Badge>
          ))}
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {test.status === 'draft' && (
            <Button size="sm" onClick={onStart}>
              <Play className="w-3 h-3 mr-1" />
              Başlat
            </Button>
          )}
          {test.status === 'running' && (
            <>
              <Button size="sm" variant="outline" onClick={onPause}>
                <Pause className="w-3 h-3 mr-1" />
                Duraklat
              </Button>
              <Button size="sm" onClick={() => onComplete()}>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Tamamla
              </Button>
            </>
          )}
          {test.status === 'paused' && (
            <Button size="sm" onClick={onStart}>
              <Play className="w-3 h-3 mr-1" />
              Devam
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onView}>
            <BarChart3 className="w-3 h-3 mr-1" />
            Detay
          </Button>
          <Button size="sm" variant="ghost" onClick={onExport}>
            <Download className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="w-3 h-3 text-rose-500" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function TestDetailDialog({ test, onClose }: { test: ABTest | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-ab-test-stats', test?.id],
    queryFn: async () => {
      if (!test) return null;
      const res = await callManager({ action: 'stats', id: test.id });
      return res as { stats: TestStats };
    },
    enabled: !!test,
    refetchInterval: 10_000,
  });

  const stats = data?.stats;

  return (
    <Dialog open={!!test} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-pink-500" />
            {test?.name}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !stats ? (
          <div className="space-y-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Variant Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stats.variants.map((v, idx) => (
                <Card key={v.id} className={`p-4 ${v.id === stats.winner ? 'ring-2 ring-amber-500' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm">{v.name}</h3>
                    {v.id === stats.winner && <Crown className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Görüntülenme</p>
                      <p className="font-bold">{v.views.toLocaleString('tr-TR')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tıklama</p>
                      <p className="font-bold">{v.clicks.toLocaleString('tr-TR')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CTR</p>
                      <p className="font-bold">{v.ctr.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CVR</p>
                      <p className="font-bold text-emerald-500">{v.cvr.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ort. Süre</p>
                      <p className="font-bold">{v.avgTimeOnPage.toFixed(0)}s</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Benzersiz</p>
                      <p className="font-bold">{v.uniqueUsers}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Comparison */}
            {stats.comparisons.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  İstatistiksel Karşılaştırma
                </h3>
                <div className="space-y-2">
                  {stats.comparisons.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                      <span className="text-xs flex-1">
                        {stats.variants.find(v => v.id === c.controlId)?.name} vs {stats.variants.find(v => v.id === c.variantId)?.name}
                      </span>
                      <Badge variant={c.lift > 0 ? 'default' : 'secondary'} className="text-[10px]">
                        {c.lift > 0 ? '+' : ''}{c.lift.toFixed(1)}%
                      </Badge>
                      <Badge variant={c.significant ? 'default' : 'outline'} className="text-[10px]">
                        p={c.pValue.toFixed(3)} {c.significant && '✓'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Time Series */}
            {stats.timeSeries.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-bold mb-3">Zaman İçinde Etkileşim</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={stats.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="ts"
                      tickFormatter={(v) => format(new Date(v as number), 'HH:mm', { locale: tr })}
                      fontSize={10}
                    />
                    <YAxis fontSize={11} />
                    <Tooltip
                      labelFormatter={(v) => format(new Date(v as number), 'dd MMM HH:mm', { locale: tr })}
                    />
                    <Legend />
                    {stats.variants.map((v, i) => (
                      <Line
                        key={v.id}
                        type="monotone"
                        dataKey={v.id}
                        name={v.name}
                        stroke={['#8b5cf6', '#ec4899', '#10b981', '#f59e0b'][i % 4]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {stats.variants.length === 0 || (stats.variants[0]?.views === 0 && stats.variants[1]?.views === 0) ? (
              <Card className="p-8 text-center bg-muted/30">
                <Activity className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Henüz etkileşim verisi yok. <code className="text-xs">useABTest</code> hook'unu kullanın.
                </p>
              </Card>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ABTestManager;
