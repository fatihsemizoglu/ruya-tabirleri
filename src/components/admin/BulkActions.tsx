import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, dreamsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ChevronDown, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star, 
  Check,
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface BulkActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  type: 'dreams' | 'comments' | 'messages';
}

export function BulkActions({ selectedIds, onClearSelection, type }: BulkActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();

  const getQueryKey = () => {
    switch (type) {
      case 'dreams':
        return 'admin-dreams';
      case 'comments':
        return 'admin-comments';
      case 'messages':
        return 'admin-messages';
    }
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.all(
        ids.map(id => {
          if (type === 'dreams') {
            return dreamsApi.delete(id);
          } else if (type === 'comments') {
            return adminApi.deleteComment(id);
          } else {
            return adminApi.deleteMessage(id);
          }
        })
      );
      
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        throw new Error(`${failed.length} öğe silinirken hata oluştu`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getQueryKey()] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(`${selectedIds.length} öğe başarıyla silindi`);
      onClearSelection();
      setShowDeleteDialog(false);
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const bulkPublishMutation = useMutation({
    mutationFn: async ({ ids, publish }: { ids: string[]; publish: boolean }) => {
      const results = await Promise.all(
        ids.map(id => dreamsApi.update(id, { is_published: publish }))
      );
      
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        throw new Error(`${failed.length} rüya güncellenirken hata oluştu`);
      }
    },
    onSuccess: (_, { publish }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-dreams'] });
      toast.success(`${selectedIds.length} rüya ${publish ? 'yayınlandı' : 'taslağa alındı'}`);
      onClearSelection();
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const bulkFeatureMutation = useMutation({
    mutationFn: async ({ ids, feature }: { ids: string[]; feature: boolean }) => {
      const results = await Promise.all(
        ids.map(id => dreamsApi.update(id, { is_featured: feature }))
      );
      
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        throw new Error(`${failed.length} rüya güncellenirken hata oluştu`);
      }
    },
    onSuccess: (_, { feature }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-dreams'] });
      toast.success(`${selectedIds.length} rüya ${feature ? 'öne çıkarıldı' : 'öne çıkarılmadan kaldırıldı'}`);
      onClearSelection();
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async ({ ids, approve }: { ids: string[]; approve: boolean }) => {
      const results = await Promise.all(
        ids.map(id => 
          approve ? adminApi.approveComment(id) : adminApi.rejectComment(id)
        )
      );
      
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        throw new Error(`${failed.length} yorum güncellenirken hata oluştu`);
      }
    },
    onSuccess: (_, { approve }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(`${selectedIds.length} yorum ${approve ? 'onaylandı' : 'reddedildi'}`);
      onClearSelection();
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const bulkMarkReadMutation = useMutation({
    mutationFn: async ({ ids, read }: { ids: string[]; read: boolean }) => {
      const results = await Promise.all(
        ids.map(id => adminApi.markMessageAsRead(id))
      );
      
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        throw new Error(`${failed.length} mesaj güncellenirken hata oluştu`);
      }
    },
    onSuccess: (_, { read }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      toast.success(`${selectedIds.length} mesaj ${read ? 'okundu' : 'okunmadı'} olarak işaretlendi`);
      onClearSelection();
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const isLoading = bulkDeleteMutation.isPending || 
    bulkPublishMutation.isPending || 
    bulkFeatureMutation.isPending ||
    bulkApproveMutation.isPending ||
    bulkMarkReadMutation.isPending;

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
        <Checkbox checked={true} className="pointer-events-none" />
        <span className="text-sm font-medium">
          {selectedIds.length} öğe seçildi
        </span>
        <div className="flex-1" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Toplu İşlem
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {type === 'dreams' && (
              <>
                <DropdownMenuItem onClick={() => bulkPublishMutation.mutate({ ids: selectedIds, publish: true })}>
                  <Eye className="w-4 h-4 mr-2" />
                  Yayınla
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkPublishMutation.mutate({ ids: selectedIds, publish: false })}>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Taslağa Al
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => bulkFeatureMutation.mutate({ ids: selectedIds, feature: true })}>
                  <Star className="w-4 h-4 mr-2" />
                  Öne Çıkar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkFeatureMutation.mutate({ ids: selectedIds, feature: false })}>
                  <Star className="w-4 h-4 mr-2 opacity-50" />
                  Öne Çıkarmayı Kaldır
                </DropdownMenuItem>
              </>
            )}
            {type === 'comments' && (
              <>
                <DropdownMenuItem onClick={() => bulkApproveMutation.mutate({ ids: selectedIds, approve: true })}>
                  <Check className="w-4 h-4 mr-2" />
                  Onayla
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkApproveMutation.mutate({ ids: selectedIds, approve: false })}>
                  <X className="w-4 h-4 mr-2" />
                  Reddet
                </DropdownMenuItem>
              </>
            )}
            {type === 'messages' && (
              <>
                <DropdownMenuItem onClick={() => bulkMarkReadMutation.mutate({ ids: selectedIds, read: true })}>
                  <Eye className="w-4 h-4 mr-2" />
                  Okundu İşaretle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkMarkReadMutation.mutate({ ids: selectedIds, read: false })}>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Okunmadı İşaretle
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Seçilenleri Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearSelection}
          disabled={isLoading}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedIds.length} öğeyi silmek istediğinize emin misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Seçilen tüm öğeler kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => bulkDeleteMutation.mutate(selectedIds)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Hook for managing selection state
export function useSelection<T extends { id: string }>(items: T[] | undefined) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (!items) return;
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  const isSelected = (id: string) => selectedIds.includes(id);
  const isAllSelected = items ? selectedIds.length === items.length && items.length > 0 : false;
  const isSomeSelected = selectedIds.length > 0 && (!items || selectedIds.length < items.length);

  return {
    selectedIds,
    toggleItem,
    toggleAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isSomeSelected,
  };
}
