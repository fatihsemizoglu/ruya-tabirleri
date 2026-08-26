import type { LucideIcon } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

export const CHART_COLORS = ['#8b5cf6', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export const CPM_RATE = 2.5;
export const AI_COST_PER_INTERPRETATION = 0.002;
export const AVG_READING_TIME_SECONDS = 90;

export interface ContentROI {
  id: string;
  title: string;
  slug: string;
  type: 'dream' | 'blog';
  views: number;
  likes: number;
  comments: number;
  favorites: number;
  estRevenue: number;
  estCost: number;
  profit: number;
  roi: number;
  ctr: number;
  readingTime: number;
  shareRate: number;
}

export interface SearchGap {
  query: string;
  count: number;
  results: number;
  intent: 'informational' | 'transactional' | 'navigational';
  lastSearched: string;
}

export interface UserSegment {
  segment: 'Yeni' | 'Aktif' | 'Riskli' | 'Churned' | 'VIP';
  count: number;
  percentage: number;
  avgRevenue: number;
  color: string;
  recommendations: string[];
}

export interface RealtimeMetric {
  label: string;
  value: number | string;
  change?: number;
  icon: LucideIcon;
  color: string;
}

export const SEGMENT_COLORS: Record<string, string> = {
  'Yeni': '#3b82f6',
  'Aktif': '#10b981',
  'Riskli': '#f59e0b',
  'Churned': '#ef4444',
  'VIP': '#8b5cf6',
};

export function classifyIntent(query: string): 'informational' | 'transactional' | 'navigational' {
  const q = query.toLowerCase();
  const transactional = ['satın al', 'fiyat', 'indirim', 'sipariş', 'abone ol', 'üye ol', 'kayıt'];
  const navigational = ['giriş', 'profil', 'ayarlar', 'site', 'anasayfa', 'menü'];
  if (transactional.some(t => q.includes(t))) return 'transactional';
  if (navigational.some(t => q.includes(t))) return 'navigational';
  return 'informational';
}

export function exportToCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) {
    toast.error('Dışa aktarılacak veri bulunamadı');
    return;
  }
  const firstRow = rows[0];
  if (!firstRow) return;
  const headers = Object.keys(firstRow);
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => {
      const v = r[h];
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[,"\n]/.test(s) ? `"${s}"` : s;
    }).join(',')),
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`${filename} indirildi`);
}

export function exportToPDF(rows: Record<string, unknown>[], title: string, filename: string) {
  if (!rows.length) {
    toast.error('Dışa aktarılacak veri bulunamadı');
    return;
  }
  const firstRow = rows[0];
  if (!firstRow) return;
  const headers = Object.keys(firstRow);
  const escapeHtml = (value: unknown): string =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  const safeTitle = escapeHtml(title);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeTitle}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px}h1{color:#4f46e5}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{background:#4f46e5;color:white;padding:8px;text-align:left}
    td{border:1px solid #e5e7eb;padding:6px;font-size:13px}
    tr:nth-child(even){background:#f9fafb}</style></head>
    <body><h1>${safeTitle}</h1><p>${escapeHtml(formatDate(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr }))}</p>
    <table><thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${headers.map(h => `<td>${escapeHtml(r[h])}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></body></html>`;
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 300);
    toast.success(`${filename} yazdırma penceresi açıldı`);
  }
}
