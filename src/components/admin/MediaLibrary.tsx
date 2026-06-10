import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import {
  Image as ImageIcon,
  Search,
  Trash2,
  Copy,
  MoreVertical,
  Upload,
  RefreshCw,
  Grid,
  List,
  Eye,
  Download,
  X,
  FolderOpen,
  HardDrive,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MediaFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  created_at: string;
}

export function MediaLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<MediaFile | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const queryClient = useQueryClient();

  const { data: files, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['media-library'],
    queryFn: async () => {
      // 1) List root to find folders
      const { data: rootItems, error: rootError } = await supabase.storage.from('blog-images').list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (rootError) throw rootError;

      // 2) Collect root-level files and discover subfolders
      const allFiles: { name: string; id: string | null; created_at: string | null; metadata: Record<string, unknown> | null }[] = [];
      const folders: string[] = [];

      (rootItems || []).forEach(item => {
        if (item.name === '.emptyFolderPlaceholder') return;
        if (item.id) {
          // It's a file
          allFiles.push({
            name: item.name,
            id: item.id,
            created_at: item.created_at,
            metadata: item.metadata as Record<string, unknown> | null,
          });
        } else {
          // It's a folder (no id means it's a "directory" entry)
          folders.push(item.name);
        }
      });

      // 3) List files inside each subfolder
      for (const folder of folders) {
        const { data: folderItems } = await supabase.storage.from('blog-images').list(folder, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

        (folderItems || []).forEach(item => {
          if (item.name === '.emptyFolderPlaceholder') return;
          if (item.id) {
            allFiles.push({
              name: `${folder}/${item.name}`,
              id: item.id,
              created_at: item.created_at,
              metadata: item.metadata as Record<string, unknown> | null,
            });
          }
        });
      }

      // 4) Build MediaFile array with public URLs
      const mediaFiles: MediaFile[] = allFiles.map(file => {
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(file.name);

        return {
          id: file.id || file.name,
          name: file.name,
          size: (file.metadata as Record<string, number> | null)?.size || 0,
          type: (file.metadata as Record<string, string> | null)?.mimetype || 'unknown',
          url: urlData.publicUrl,
          created_at: file.created_at || new Date().toISOString(),
        };
      });

      return mediaFiles;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileName: string) => {
      const { error } = await supabase.storage.from('blog-images').remove([fileName]);
      if (error) throw error;
      return fileName;
    },
    onSuccess: (fileName) => {
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
      logAction({
        action: 'delete',
        entityType: 'setting',
        entityTitle: fileName,
        details: { type: 'media_file' },
      });
      toast({
        title: 'Dosya silindi',
        description: `${fileName} başarıyla silindi.`,
      });
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: 'Dosya silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (fileNames: string[]) => {
      const { error } = await supabase.storage.from('blog-images').remove(fileNames);
      if (error) throw error;
      return fileNames;
    },
    onSuccess: (fileNames) => {
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
      logAction({
        action: 'delete',
        entityType: 'setting',
        entityTitle: `${fileNames.length} dosya`,
        details: { type: 'bulk_media_delete', files: fileNames },
      });
      toast({
        title: 'Dosyalar silindi',
        description: `${fileNames.length} dosya başarıyla silindi.`,
      });
      setSelectedFiles(new Set());
    },
    onError: () => {
      toast({
        title: 'Hata',
        description: 'Dosyalar silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast({
        title: 'Kopyalandı',
        description: 'URL panoya kopyalandı.',
      });
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      toast({
        title: 'Hata',
        description: 'URL kopyalanamadı.',
        variant: 'destructive',
      });
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const selectAll = () => {
    if (filteredFiles?.length === selectedFiles.size) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles?.map(f => f.id)));
    }
  };

  const filteredFiles = files?.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSize = files?.reduce((sum, file) => sum + file.size, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-primary" />
            Medya Kütüphanesi
          </h2>
          <p className="text-muted-foreground mt-1">
            Blog görselleri ve medya dosyalarını yönetin
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
            Yenile
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{files?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Toplam Dosya</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <HardDrive className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
              <p className="text-xs text-muted-foreground">Kullanılan Alan</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">
                {files?.filter(f => f.type?.startsWith('image/')).length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Görsel</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Check className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{selectedFiles.size}</p>
              <p className="text-xs text-muted-foreground">Seçili</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Dosya ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              {selectedFiles.size > 0 && (
                <>
                  <Button variant="outline" onClick={selectAll}>
                    {filteredFiles?.length === selectedFiles.size ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const filesToDelete = filteredFiles
                        ?.filter(f => selectedFiles.has(f.id))
                        .map(f => f.name) || [];
                      if (filesToDelete.length > 0) {
                        bulkDeleteMutation.mutate(filesToDelete);
                      }
                    }}
                    disabled={bulkDeleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {selectedFiles.size} Dosya Sil
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Grid/List */}
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredFiles?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz dosya yüklenmemiş</p>
              <p className="text-sm mt-2">Blog yazısı eklerken görsel yükleyebilirsiniz</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredFiles?.map(file => (
                <div
                  key={file.id}
                  className={cn(
                    "group relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
                    selectedFiles.has(file.id) ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/20"
                  )}
                  onClick={() => toggleFileSelection(file.id)}
                >
                  {file.type?.startsWith('image/') ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Selection indicator */}
                  {selectedFiles.has(file.id) && (
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewFile(file);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(file.url);
                      }}
                    >
                      {copiedUrl === file.url ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-red-500/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileToDelete(file);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* File name */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-xs text-white truncate" title={file.name}>{file.name.split('/').pop()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
                {filteredFiles?.map(file => (
                  <div
                    key={file.id}
                    className={cn(
                      "flex items-center gap-4 p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                      selectedFiles.has(file.id) && "bg-primary/5"
                    )}
                    onClick={() => toggleFileSelection(file.id)}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {file.type?.startsWith('image/') ? (
                        <img src={file.url} alt={file.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" title={file.name}>{file.name.split('/').pop()}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{format(new Date(file.created_at), 'dd MMM yyyy', { locale: tr })}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(file.url);
                        }}
                      >
                        {copiedUrl === file.url ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Önizle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(file.url, '_blank')}>
                            <Download className="h-4 w-4 mr-2" />
                            İndir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setFileToDelete(file);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
            <DialogDescription>
              {previewFile && formatFileSize(previewFile.size)} • {previewFile?.type}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            {previewFile?.type?.startsWith('image/') ? (
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-h-[60vh] object-contain rounded-lg"
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Önizleme mevcut değil
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => copyToClipboard(previewFile?.url || '')}>
              <Copy className="h-4 w-4 mr-2" />
              URL Kopyala
            </Button>
            <Button onClick={() => window.open(previewFile?.url, '_blank')}>
              <Download className="h-4 w-4 mr-2" />
              İndir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dosyayı Sil</DialogTitle>
            <DialogDescription>
              "{fileToDelete?.name.split('/').pop()}" dosyasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={() => fileToDelete && deleteMutation.mutate(fileToDelete.name)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Siliniyor...' : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MediaLibrary;
