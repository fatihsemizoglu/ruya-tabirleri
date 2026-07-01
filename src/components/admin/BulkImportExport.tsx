import { useState } from 'react';
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { Button } from '@/components/ui/button';
 import { Card } from '@/components/ui/card';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import { 
   Download, 
   Upload, 
   FileJson, 
   FileSpreadsheet, 
   CheckCircle2, 
   XCircle, 
   AlertCircle,
   Loader2,
   FileText
 } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
 
type DreamRow = Database['public']['Tables']['dreams']['Row'];
type BlogPostRow = Database['public']['Tables']['blog_posts']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];
type BlogCategoryRow = Database['public']['Tables']['blog_categories']['Row'];
 
 interface DreamExport {
   title: string;
   slug: string;
   content: string;
   islamic_interpretation: string | null;
   psychological_interpretation: string | null;
   category_id: string | null;
   keywords: string[] | null;
   meta_title: string | null;
   meta_description: string | null;
   is_published: boolean | null;
   is_featured: boolean | null;
   category_name?: string;
 }
 
 interface BlogPostExport {
   title: string;
   slug: string;
   content: string;
   excerpt: string | null;
   category_id: string | null;
   tags: string[] | null;
   meta_title: string | null;
   meta_description: string | null;
   is_published: boolean | null;
   is_featured: boolean | null;
   category_name?: string;
 }
 
 interface ImportDreamRecord {
   title?: string;
   slug?: string;
   content?: string;
   islamic_interpretation?: string;
   psychological_interpretation?: string;
   category_name?: string;
   category?: string;
   keywords?: string | string[];
   meta_title?: string;
   meta_description?: string;
   is_published?: string | boolean;
   is_featured?: string | boolean;
 }
 
 interface ImportBlogPostRecord {
   title?: string;
   slug?: string;
   content?: string;
   excerpt?: string;
   category_name?: string;
   category?: string;
   tags?: string | string[];
   meta_title?: string;
   meta_description?: string;
   is_published?: string | boolean;
   is_featured?: string | boolean;
 }
 
 interface ImportResult {
   success: number;
   failed: number;
   errors: string[];
 }
 
 export function BulkImportExport() {
   const [activeTab, setActiveTab] = useState('export');
   const [contentType, setContentType] = useState<'dreams' | 'blog'>('dreams');
   const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
   const [importData, setImportData] = useState('');
   const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json');
   const [isImporting, setIsImporting] = useState(false);
   const [importProgress, setImportProgress] = useState(0);
   const [importResult, setImportResult] = useState<ImportResult | null>(null);
   
   const queryClient = useQueryClient();
 
   // Fetch dreams for export
   const { data: dreams } = useQuery({
     queryKey: ['export-dreams'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('dreams')
         .select('*, categories(name, slug)')
         .order('created_at', { ascending: false });
       if (error) throw error;
       return data;
     },
     enabled: contentType === 'dreams',
   });
 
   // Fetch blog posts for export
   const { data: blogPosts } = useQuery({
     queryKey: ['export-blog-posts'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('blog_posts')
         .select('*, blog_categories(name, slug)')
         .order('created_at', { ascending: false });
       if (error) throw error;
       return data;
     },
     enabled: contentType === 'blog',
   });
 
   // Fetch categories for import mapping
   const { data: categories } = useQuery({
     queryKey: ['import-categories'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('categories')
         .select('id, name, slug');
       if (error) throw error;
       return data;
     },
   });
 
   const { data: blogCategories } = useQuery({
     queryKey: ['import-blog-categories'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('blog_categories')
         .select('id, name, slug');
       if (error) throw error;
       return data;
     },
   });
 
// Export functions
   const exportToJSON = () => {
     const data = contentType === 'dreams' ? dreams : blogPosts;
     if (!data || data.length === 0) {
       toast.error('Dışa aktarılacak veri bulunamadı');
       return;
     }

      const exportData = data.map((item) => {
        const { id, created_at, updated_at, view_count, like_count, ...rest } = item as Record<string, unknown> & { id?: string; created_at?: string; updated_at?: string; view_count?: number; like_count?: number; categories?: { name: string } | null; blog_categories?: { name: string } | null };
        const { search_vector: _sv, categories, blog_categories, ...cleanRest } = rest;
        void _sv;
        const exportItem: Record<string, unknown> = { ...cleanRest };
        if (contentType === 'dreams' && categories) {
          (exportItem as unknown as DreamExport).category_name = categories.name;
        } else if (contentType === 'blog' && blog_categories) {
          (exportItem as unknown as BlogPostExport).category_name = blog_categories.name;
        }
       return exportItem;
     });

     const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
     downloadFile(blob, `${contentType}-export-${new Date().toISOString().split('T')[0]}.json`);
     toast.success(`${data.length} kayıt JSON olarak dışa aktarıldı`);
   };

   const exportToCSV = () => {
     const data = contentType === 'dreams' ? dreams : blogPosts;
     if (!data || data.length === 0) {
       toast.error('Dışa aktarılacak veri bulunamadı');
       return;
     }

     const headers = contentType === 'dreams' 
       ? ['title', 'slug', 'content', 'islamic_interpretation', 'psychological_interpretation', 'category_name', 'keywords', 'meta_title', 'meta_description', 'is_published', 'is_featured'] as const
       : ['title', 'slug', 'content', 'excerpt', 'category_name', 'tags', 'meta_title', 'meta_description', 'is_published', 'is_featured'] as const;

     const csvRows = [headers.join(',')];

     data.forEach((item) => {
        const row = headers.map((header: string) => {
          let value: string | number = '';
          const itemAny = item as unknown as Record<string, unknown> & { categories?: { name: string } | null; blog_categories?: { name: string } | null; keywords?: string[]; tags?: string[] };
          if (header === 'category_name') {
            value = itemAny.categories?.name || itemAny.blog_categories?.name || '';
          } else if (header === 'keywords') {
            value = itemAny.keywords?.join(';') || '';
          } else if (header === 'tags') {
            value = itemAny.tags?.join(';') || '';
          } else {
            value = String((item as Record<string, unknown>)[header] ?? '');
          }
         // Escape CSV special characters
         if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
           value = `"${value.replace(/"/g, '""')}"`;
         }
         return value;
       });
       csvRows.push(row.join(','));
     });

     const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
     downloadFile(blob, `${contentType}-export-${new Date().toISOString().split('T')[0]}.csv`);
     toast.success(`${data.length} kayıt CSV olarak dışa aktarıldı`);
   };
 
   const downloadFile = (blob: Blob, filename: string) => {
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = filename;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
   };
 
// Import functions
    const parseCSV = (text: string): (ImportDreamRecord | ImportBlogPostRecord)[] => {
     const lines = text.split('\n').filter(line => line.trim());
     if (lines.length < 2) return [];

      const firstLine = lines[0];
      if (!firstLine) return [];
      const headers = firstLine.split(',').map(h => h.trim());
      const records: (ImportDreamRecord | ImportBlogPostRecord)[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (const char of line) {
         if (char === '"') {
           inQuotes = !inQuotes;
         } else if (char === ',' && !inQuotes) {
           values.push(current.trim());
           current = '';
         } else {
           current += char;
         }
       }
       values.push(current.trim());

       const record: ImportDreamRecord | ImportBlogPostRecord = {};
       headers.forEach((header, index) => {
         record[header as keyof (ImportDreamRecord | ImportBlogPostRecord)] = values[index] || '';
       });
       records.push(record);
     }

     return records;
   };

   const parseJSON = (text: string): (ImportDreamRecord | ImportBlogPostRecord)[] => {
     try {
       const data = JSON.parse(text);
       return Array.isArray(data) ? data : [data];
     } catch {
       return [];
     }
   };
 
   const findCategoryId = (categoryName: string, type: 'dreams' | 'blog'): string | null => {
     const cats = type === 'dreams' ? categories : blogCategories;
     if (!cats || !categoryName) return null;
     const found = cats.find(c => 
       c.name.toLowerCase() === categoryName.toLowerCase() || 
       c.slug.toLowerCase() === categoryName.toLowerCase()
     );
     return found?.id || null;
   };
 
   const generateSlug = (title: string): string => {
     return title
       .toLowerCase()
       .replace(/ğ/g, 'g')
       .replace(/ü/g, 'u')
       .replace(/ş/g, 's')
       .replace(/ı/g, 'i')
       .replace(/ö/g, 'o')
       .replace(/ç/g, 'c')
       .replace(/[^a-z0-9]+/g, '-')
       .replace(/^-|-$/g, '');
   };
 
   const handleImport = async () => {
     if (!importData.trim()) {
       toast.error('İçe aktarılacak veri giriniz');
       return;
     }
 
     setIsImporting(true);
     setImportProgress(0);
     setImportResult(null);
 
     try {
       const records = importFormat === 'json' ? parseJSON(importData) : parseCSV(importData);
       
       if (records.length === 0) {
         toast.error('Geçerli veri bulunamadı');
         setIsImporting(false);
         return;
       }
 
       const result: ImportResult = { success: 0, failed: 0, errors: [] };
 
       for (let i = 0; i < records.length; i++) {
          const record = records[i];
          if (!record) continue;
          setImportProgress(Math.round(((i + 1) / records.length) * 100));

          try {
            if (contentType === 'dreams') {
              await importDream(record as ImportDreamRecord);
            } else {
              await importBlogPost(record as ImportBlogPostRecord);
            }
           result.success++;
          } catch (error: unknown) {
            result.failed++;
            result.errors.push(`Satır ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
         }
       }
 
       setImportResult(result);
       
       if (result.success > 0) {
         queryClient.invalidateQueries({ queryKey: contentType === 'dreams' ? ['admin-dreams'] : ['admin-blog-posts'] });
         toast.success(`${result.success} kayıt başarıyla içe aktarıldı`);
       }
       
       if (result.failed > 0) {
         toast.error(`${result.failed} kayıt içe aktarılamadı`);
       }
      } catch (error: unknown) {
        toast.error(`İçe aktarma hatası: ${error instanceof Error ? error.message : String(error)}`);
     } finally {
       setIsImporting(false);
     }
   };
 
const importDream = async (record: ImportDreamRecord) => {
     const title = record.title?.trim();
     if (!title) throw new Error('Başlık gerekli');

     const content = record.content?.trim();
     if (!content || content.length < 50) throw new Error('İçerik en az 50 karakter olmalı');

     const slug = record.slug?.trim() || generateSlug(title);
     
     // Check for duplicate slug
     const { data: existing } = await supabase
       .from('dreams')
       .select('id')
       .eq('slug', slug)
       .maybeSingle();
     
     if (existing) throw new Error(`"${slug}" slug'ı zaten mevcut`);

      const categoryId = findCategoryId(record.category_name || record.category || '', 'dreams');
     const keywords = record.keywords 
       ? (typeof record.keywords === 'string' ? record.keywords.split(';').map((k: string) => k.trim()).filter(Boolean) : record.keywords)
       : [];

     const { error } = await supabase.from('dreams').insert({
       title,
       slug,
       content,
       islamic_interpretation: record.islamic_interpretation || null,
       psychological_interpretation: record.psychological_interpretation || null,
       category_id: categoryId,
       keywords,
       meta_title: record.meta_title || null,
       meta_description: record.meta_description || null,
       is_published: record.is_published === 'true' || record.is_published === true,
       is_featured: record.is_featured === 'true' || record.is_featured === true,
     });

     if (error) throw error;
   };

   const importBlogPost = async (record: ImportBlogPostRecord) => {
     const title = record.title?.trim();
     if (!title) throw new Error('Başlık gerekli');
 
     const content = record.content?.trim();
     if (!content) throw new Error('İçerik gerekli');
 
     const slug = record.slug?.trim() || generateSlug(title);
     
     // Check for duplicate slug
     const { data: existing } = await supabase
       .from('blog_posts')
       .select('id')
       .eq('slug', slug)
       .maybeSingle();
     
      if (existing) throw new Error(`"${slug}" slug'ı zaten mevcut`);

      const categoryId = findCategoryId(record.category_name || record.category || '', 'blog');
     const tags = record.tags 
       ? (typeof record.tags === 'string' ? record.tags.split(';').map((t: string) => t.trim()).filter(Boolean) : record.tags)
       : [];
 
     // Get current user for author_id
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) throw new Error('Oturum açmanız gerekli');
 
     const { error } = await supabase.from('blog_posts').insert({
       title,
       slug,
       content,
       excerpt: record.excerpt || null,
       category_id: categoryId,
       author_id: user.id,
       tags,
       meta_title: record.meta_title || null,
       meta_description: record.meta_description || null,
       is_published: record.is_published === 'true' || record.is_published === true,
       is_featured: record.is_featured === 'true' || record.is_featured === true,
     });
 
     if (error) throw error;
   };
 
   const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
     const file = event.target.files?.[0];
     if (!file) return;
 
     const reader = new FileReader();
     reader.onload = (e) => {
       const text = e.target?.result as string;
       setImportData(text);
       
       // Auto-detect format
       if (file.name.endsWith('.json')) {
         setImportFormat('json');
       } else if (file.name.endsWith('.csv')) {
         setImportFormat('csv');
       }
     };
     reader.readAsText(file);
   };
 
   const currentData = contentType === 'dreams' ? dreams : blogPosts;
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <h2 className="text-xl font-serif font-semibold">Toplu İçe/Dışa Aktarma</h2>
         <Select value={contentType} onValueChange={(v) => setContentType(v as 'dreams' | 'blog')}>
           <SelectTrigger className="w-[200px]">
             <SelectValue />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="dreams">Rüya Tabirleri</SelectItem>
             <SelectItem value="blog">Blog Yazıları</SelectItem>
           </SelectContent>
         </Select>
       </div>
 
       <Tabs value={activeTab} onValueChange={setActiveTab}>
         <TabsList className="grid w-full grid-cols-2">
           <TabsTrigger value="export" className="flex items-center gap-2">
             <Download className="h-4 w-4" />
             Dışa Aktar
           </TabsTrigger>
           <TabsTrigger value="import" className="flex items-center gap-2">
             <Upload className="h-4 w-4" />
             İçe Aktar
           </TabsTrigger>
         </TabsList>
 
         <TabsContent value="export" className="mt-6">
           <div className="grid gap-6 md:grid-cols-2">
             {/* JSON Export */}
             <Card className="p-6">
               <div className="flex items-start gap-4">
                 <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                   <FileJson className="h-6 w-6 text-amber-600" />
                 </div>
                 <div className="flex-1">
                   <h3 className="font-semibold text-lg">JSON Formatı</h3>
                   <p className="text-sm text-muted-foreground mt-1">
                     Tüm veri alanlarını korur, tekrar içe aktarmak için idealdir.
                   </p>
                   <div className="mt-4 flex items-center justify-between">
                     <Badge variant="secondary">
                       {currentData?.length || 0} kayıt
                     </Badge>
                     <Button onClick={exportToJSON} disabled={!currentData?.length}>
                       <Download className="h-4 w-4 mr-2" />
                       JSON İndir
                     </Button>
                   </div>
                 </div>
               </div>
             </Card>
 
             {/* CSV Export */}
             <Card className="p-6">
               <div className="flex items-start gap-4">
                 <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                   <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                 </div>
                 <div className="flex-1">
                   <h3 className="font-semibold text-lg">CSV Formatı</h3>
                   <p className="text-sm text-muted-foreground mt-1">
                     Excel ve diğer tablolama programlarında açılabilir.
                   </p>
                   <div className="mt-4 flex items-center justify-between">
                     <Badge variant="secondary">
                       {currentData?.length || 0} kayıt
                     </Badge>
                     <Button onClick={exportToCSV} disabled={!currentData?.length}>
                       <Download className="h-4 w-4 mr-2" />
                       CSV İndir
                     </Button>
                   </div>
                 </div>
               </div>
             </Card>
           </div>
 
           {/* Export Preview */}
{currentData && currentData.length > 0 && (
              <Card className="mt-6 p-6">
                <h3 className="font-semibold mb-4">Dışa Aktarılacak Veriler Önizlemesi</h3>
                <div className="max-h-[300px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-2">Başlık</th>
                        <th className="text-left p-2">Slug</th>
                        <th className="text-left p-2">Kategori</th>
                        <th className="text-left p-2">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                       {currentData.slice(0, 10).map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-2 truncate max-w-[200px]">{item.title}</td>
                          <td className="p-2 text-muted-foreground">{item.slug}</td>
                          <td className="p-2">{((item as Record<string, unknown>).categories as { name?: string } | null)?.name || ((item as Record<string, unknown>).blog_categories as { name?: string } | null)?.name || '-'}</td>
                          <td className="p-2">
                            <Badge variant={item.is_published ? 'default' : 'secondary'}>
                              {item.is_published ? 'Yayında' : 'Taslak'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                 {currentData.length > 10 && (
                   <p className="text-sm text-muted-foreground mt-2 text-center">
                     ... ve {currentData.length - 10} kayıt daha
                   </p>
                 )}
               </div>
             </Card>
           )}
         </TabsContent>
 
         <TabsContent value="import" className="mt-6 space-y-6">
           {/* Import Format Selection */}
           <Card className="p-6">
             <div className="flex items-center gap-4 mb-6">
               <Select value={importFormat} onValueChange={(v) => setImportFormat(v as 'json' | 'csv')}>
                 <SelectTrigger className="w-[150px]">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="json">JSON</SelectItem>
                   <SelectItem value="csv">CSV</SelectItem>
                 </SelectContent>
               </Select>
               
               <div className="flex-1">
                 <Label htmlFor="file-upload" className="cursor-pointer">
                   <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted/50 transition-colors">
                     <FileText className="h-4 w-4" />
                     <span>Dosya Yükle</span>
                   </div>
                 </Label>
                 <Input
                   id="file-upload"
                   type="file"
                   accept=".json,.csv"
                   onChange={handleFileUpload}
                   className="hidden"
                 />
               </div>
             </div>
 
             <Textarea
               placeholder={importFormat === 'json' 
                 ? '[\n  {\n    "title": "Örnek Başlık",\n    "content": "İçerik...",\n    "slug": "ornek-baslik"\n  }\n]'
                 : 'title,slug,content,category_name\nÖrnek Başlık,ornek-baslik,İçerik...,Kategori Adı'}
               value={importData}
               onChange={(e) => setImportData(e.target.value)}
               rows={12}
               className="font-mono text-sm"
             />
           </Card>
 
           {/* Import Instructions */}
           <Card className="p-6 bg-muted/30">
             <h3 className="font-semibold mb-4 flex items-center gap-2">
               <AlertCircle className="h-5 w-5 text-amber-500" />
               İçe Aktarma Kuralları
             </h3>
             <ul className="space-y-2 text-sm text-muted-foreground">
               <li className="flex items-start gap-2">
                 <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                 <span><strong>title</strong> ve <strong>content</strong> alanları zorunludur</span>
               </li>
               <li className="flex items-start gap-2">
                 <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                 <span><strong>slug</strong> boş bırakılırsa başlıktan otomatik oluşturulur</span>
               </li>
               <li className="flex items-start gap-2">
                 <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                 <span><strong>category_name</strong> mevcut kategorilerle eşleştirilir</span>
               </li>
               <li className="flex items-start gap-2">
                 <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                 <span><strong>keywords/tags</strong> noktalı virgülle ayrılmalıdır (CSV için)</span>
               </li>
               <li className="flex items-start gap-2">
                 <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                 <span>Aynı slug'a sahip kayıtlar atlanır</span>
               </li>
             </ul>
           </Card>
 
           {/* Import Progress */}
           {isImporting && (
             <Card className="p-6">
               <div className="flex items-center gap-4 mb-4">
                 <Loader2 className="h-5 w-5 animate-spin text-primary" />
                 <span>İçe aktarılıyor...</span>
               </div>
               <Progress value={importProgress} className="h-2" />
               <p className="text-sm text-muted-foreground mt-2 text-right">
                 %{importProgress}
               </p>
             </Card>
           )}
 
           {/* Import Result */}
           {importResult && (
             <Card className="p-6">
               <h3 className="font-semibold mb-4">İçe Aktarma Sonucu</h3>
               <div className="flex gap-6 mb-4">
                 <div className="flex items-center gap-2">
                   <CheckCircle2 className="h-5 w-5 text-green-500" />
                   <span className="text-lg font-semibold">{importResult.success}</span>
                   <span className="text-muted-foreground">başarılı</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <XCircle className="h-5 w-5 text-red-500" />
                   <span className="text-lg font-semibold">{importResult.failed}</span>
                   <span className="text-muted-foreground">başarısız</span>
                 </div>
               </div>
               {importResult.errors.length > 0 && (
                 <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 max-h-[200px] overflow-auto">
                   <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">Hatalar:</p>
                   <ul className="text-sm text-red-600 dark:text-red-300 space-y-1">
                     {importResult.errors.map((error, index) => (
                       <li key={index}>{error}</li>
                     ))}
                   </ul>
                 </div>
               )}
             </Card>
           )}
 
           {/* Import Button */}
           <div className="flex justify-end">
             <Button 
               onClick={handleImport} 
               disabled={isImporting || !importData.trim()}
               size="lg"
             >
               {isImporting ? (
                 <>
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                   İçe Aktarılıyor...
                 </>
               ) : (
                 <>
                   <Upload className="h-4 w-4 mr-2" />
                   İçe Aktar
                 </>
               )}
             </Button>
           </div>
         </TabsContent>
       </Tabs>
     </div>
   );
 }

export default BulkImportExport;
