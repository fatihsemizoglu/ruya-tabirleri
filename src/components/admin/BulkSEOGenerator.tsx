import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi, adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  type: 'dream' | 'blog';
}

interface ProcessResult {
  id: string;
  title: string;
  success: boolean;
  error?: string;
}

export function BulkSEOGenerator() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [activeTab, setActiveTab] = useState<'dreams' | 'blogs'>('dreams');
  const queryClient = useQueryClient();

  // Fetch dreams without complete SEO
  const { data: dreams, isLoading: dreamsLoading, refetch: refetchDreams } = useQuery({
    queryKey: ['bulk-seo-dreams'],
    queryFn: async () => {
      const response = await fetchApi<ContentItem[]>('/admin/content-without-seo?type=dream');
      if (!response.success) throw new Error(response.error);
      return (response.data || []).map(d => ({ ...d, type: 'dream' as const }));
    },
  });

  // Fetch blog posts without complete SEO
  const { data: blogs, isLoading: blogsLoading, refetch: refetchBlogs } = useQuery({
    queryKey: ['bulk-seo-blogs'],
    queryFn: async () => {
      const response = await fetchApi<ContentItem[]>('/admin/content-without-seo?type=blog');
      if (!response.success) throw new Error(response.error);
      return (response.data || []).map(b => ({ ...b, type: 'blog' as const }));
    },
  });

  const currentItems = activeTab === 'dreams' ? dreams : blogs;
  
  const itemsWithoutSEO = currentItems?.filter(
    item => !item.meta_title || !item.meta_description
  ) || [];

  const itemsWithSEO = currentItems?.filter(
    item => item.meta_title && item.meta_description
  ) || [];

  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const allIds = itemsWithoutSEO.map(item => item.id);
    setSelectedIds(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const generateSEO = async (item: ContentItem): Promise<ProcessResult> => {
    try {
      const response = await fetchApi<{ meta_title: string; meta_description: string }>('/admin/generate-seo', {
        method: 'POST',
        body: JSON.stringify({ 
          title: item.title, 
          content: item.content,
          type: item.type === 'dream' ? 'dream' : 'blog'
        }),
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'SEO oluşturulamadı');
      }

      // Update the database
      const updateResponse = await fetchApi(`/admin/content/${item.id}/seo`, {
        method: 'PUT',
        body: JSON.stringify({
          meta_title: response.data.meta_title,
          meta_description: response.data.meta_description,
          type: item.type,
        }),
      });

      if (!updateResponse.success) {
        throw new Error(updateResponse.error || 'SEO kaydedilemedi');
      }

      return { id: item.id, title: item.title, success: true };
    } catch (error) {
      return { 
        id: item.id, 
        title: item.title, 
        success: false, 
        error: error instanceof Error ? error.message : 'Bilinmeyen hata' 
      };
    }
  };

  const processSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error('Lütfen en az bir içerik seçin');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    const itemsToProcess = itemsWithoutSEO.filter(item => selectedIds.has(item.id));
    const totalItems = itemsToProcess.length;
    const newResults: ProcessResult[] = [];

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      const result = await generateSEO(item);
      newResults.push(result);
      setResults([...newResults]);
      setProgress(((i + 1) / totalItems) * 100);

      // Rate limiting - wait between requests
      if (i < itemsToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    const successCount = newResults.filter(r => r.success).length;
    const failCount = newResults.filter(r => !r.success).length;

    if (failCount === 0) {
      toast.success(`${successCount} içerik için SEO oluşturuldu`);
    } else {
      toast.warning(`${successCount} başarılı, ${failCount} başarısız`);
    }

    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['bulk-seo-dreams'] });
    queryClient.invalidateQueries({ queryKey: ['bulk-seo-blogs'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dreams'] });
    queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
    
    setSelectedIds(new Set());
    setIsProcessing(false);
  };

  const refetchAll = () => {
    refetchDreams();
    refetchBlogs();
    toast.success('Veriler yenilendi');
  };

  const isLoading = dreamsLoading || blogsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-semibold">Toplu SEO Oluşturma</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Eksik meta verisi olan içeriklere AI ile otomatik SEO oluşturun
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetchAll}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Yenile
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v as 'dreams' | 'blogs');
        setSelectedIds(new Set());
        setResults([]);
      }}>
        <TabsList>
          <TabsTrigger value="dreams" className="gap-2">
            Rüya Tabirleri
            {dreams && (
              <Badge variant="secondary" className="ml-1">
                {dreams.filter(d => !d.meta_title || !d.meta_description).length} eksik
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="blogs" className="gap-2">
            Blog Yazıları
            {blogs && (
              <Badge variant="secondary" className="ml-1">
                {blogs.filter(b => !b.meta_title || !b.meta_description).length} eksik
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Items without SEO */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        SEO Eksik İçerikler
                      </CardTitle>
                      <CardDescription>
                        {itemsWithoutSEO.length} içerik SEO verisi bekliyor
                      </CardDescription>
                    </div>
                    {itemsWithoutSEO.length > 0 && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={selectAll}>
                          Tümünü Seç
                        </Button>
                        {selectedIds.size > 0 && (
                          <Button variant="ghost" size="sm" onClick={clearSelection}>
                            Temizle
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {itemsWithoutSEO.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      <p>Tüm içeriklerin SEO verileri tam!</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-2">
                        {itemsWithoutSEO.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                              selectedIds.has(item.id) 
                                ? 'bg-primary/5 border-primary/30' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <Checkbox
                              checked={selectedIds.has(item.id)}
                              onCheckedChange={() => toggleItem(item.id)}
                              disabled={isProcessing}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.title}</p>
                              <div className="flex gap-1 mt-1">
                                {!item.meta_title && (
                                  <Badge variant="outline" className="text-xs">
                                    Başlık yok
                                  </Badge>
                                )}
                                {!item.meta_description && (
                                  <Badge variant="outline" className="text-xs">
                                    Açıklama yok
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Processing & Results */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    SEO Oluşturma
                  </CardTitle>
                  <CardDescription>
                    {selectedIds.size} içerik seçildi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={processSelected}
                    disabled={isProcessing || selectedIds.size === 0}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        İşleniyor...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI ile SEO Oluştur ({selectedIds.size})
                      </>
                    )}
                  </Button>

                  {isProcessing && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>İlerleme</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}

                  {results.length > 0 && (
                    <ScrollArea className="h-[200px] pr-4">
                      <div className="space-y-2">
                        {results.map((result) => (
                          <div
                            key={result.id}
                            className={`flex items-center gap-2 p-2 rounded text-sm ${
                              result.success 
                                ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
                                : 'bg-red-500/10 text-red-700 dark:text-red-400'
                            }`}
                          >
                            {result.success ? (
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span className="truncate">{result.title}</span>
                            {result.error && (
                              <span className="text-xs ml-auto">({result.error})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {/* Stats */}
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {itemsWithSEO.length}
                        </p>
                        <p className="text-xs text-muted-foreground">SEO Tamamlanmış</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-amber-600">
                          {itemsWithoutSEO.length}
                        </p>
                        <p className="text-xs text-muted-foreground">SEO Bekliyor</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
