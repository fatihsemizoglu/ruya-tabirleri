import { toast } from 'sonner';

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
    ...rows.map(r =>
      headers.map(h => {
        const v = r[h];
        if (v == null) return '';
        const s = String(v).replace(/"/g, '""');
        return /[,"\n]/.test(s) ? `"${s}"` : s;
      }).join(',')
    ),
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
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px}h1{color:#4f46e5}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{background:#4f46e5;color:white;padding:8px;text-align:left}
    td{border:1px solid #e5e7eb;padding:6px;font-size:13px}
    tr:nth-child(even){background:#f9fafb}</style></head>
    <body><h1>${title}</h1>
    <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${headers.map(h => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></body></html>`;
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 300);
    toast.success(`${filename} yazdırma penceresi açıldı`);
  }
}
