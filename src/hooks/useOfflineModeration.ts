import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineAction {
  id: string;
  type: 'approve' | 'reject' | 'delete' | 'feature' | 'unfeature';
  entityType: 'comment' | 'blog_comment' | 'dream' | 'blog_post';
  entityId: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

const DB_NAME = 'admin-offline-db';
const STORE_NAME = 'pending-actions';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export function useOfflineModeration() {
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Load pending actions on mount
  useEffect(() => {
    loadPendingActions();
    window.addEventListener('online', syncPendingActions);
    return () => window.removeEventListener('online', syncPendingActions);
  }, []);

  const loadPendingActions = useCallback(async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      return new Promise<void>((resolve) => {
        request.onsuccess = () => {
          setPendingActions(request.result || []);
          resolve();
        };
        request.onerror = () => resolve();
      });
    } catch {
      // IndexedDB not available
    }
  }, []);

  const saveAction = useCallback(async (action: OfflineAction) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      await new Promise<void>((resolve, reject) => {
        const request = store.put(action);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      setPendingActions(prev => [...prev, action]);
    } catch (error) {
      console.error('Failed to save offline action:', error);
    }
  }, []);

  const removeAction = useCallback(async (id: string) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      setPendingActions(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to remove offline action:', error);
    }
  }, []);

  const syncPendingActions = useCallback(async () => {
    if (isSyncing || pendingActions.length === 0 || !navigator.onLine) return;
    
    setIsSyncing(true);
    let successCount = 0;
    let failCount = 0;

    for (const action of pendingActions) {
      try {
        // Import supabase dynamically to avoid circular deps
        const { supabase } = await import('@/integrations/supabase/client');
        
        let error: Error | null = null;
        
        switch (action.type) {
          case 'approve':
            if (action.entityType === 'comment') {
              const { error: e } = await supabase
                .from('comments')
                .update({ is_approved: true })
                .eq('id', action.entityId);
              error = e;
            } else if (action.entityType === 'blog_comment') {
              const { error: e } = await supabase
                .from('blog_comments')
                .update({ is_approved: true })
                .eq('id', action.entityId);
              error = e;
            }
            break;
          case 'reject':
            if (action.entityType === 'comment') {
              const { error: e } = await supabase
                .from('comments')
                .delete()
                .eq('id', action.entityId);
              error = e;
            } else if (action.entityType === 'blog_comment') {
              const { error: e } = await supabase
                .from('blog_comments')
                .delete()
                .eq('id', action.entityId);
              error = e;
            }
            break;
          case 'feature':
            if (action.entityType === 'dream') {
              const { error: e } = await supabase
                .from('dreams')
                .update({ is_featured: true })
                .eq('id', action.entityId);
              error = e;
            }
            break;
          case 'unfeature':
            if (action.entityType === 'dream') {
              const { error: e } = await supabase
                .from('dreams')
                .update({ is_featured: false })
                .eq('id', action.entityId);
              error = e;
            }
            break;
          case 'delete':
            if (action.entityType === 'dream') {
              const { error: e } = await supabase
                .from('dreams')
                .delete()
                .eq('id', action.entityId);
              error = e;
            } else if (action.entityType === 'blog_post') {
              const { error: e } = await supabase
                .from('blog_posts')
                .delete()
                .eq('id', action.entityId);
              error = e;
            }
            break;
        }

        if (!error) {
          await removeAction(action.id);
          successCount++;
        } else {
          console.error('Sync failed for action:', action.id, error);
          failCount++;
        }
      } catch (error) {
        console.error('Sync error:', error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast({ title: `${successCount} işlem senkronize edildi` });
    }
    if (failCount > 0) {
      toast({ 
        title: `${failCount} işlem başarısız`, 
        variant: 'destructive',
        description: 'İnternet bağlantısı tekrar kontrol edilecek'
      });
    }
    
    setIsSyncing(false);
  }, [pendingActions, isSyncing, toast]);

  const queueAction = useCallback(async (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
    const fullAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    await saveAction(fullAction);
    toast({ title: 'İşlem sıraya alındı', description: 'Çevrimiçi olunca otomatik işlenecek' });
  }, [saveAction, toast]);

  return {
    pendingActions,
    pendingCount: pendingActions.length,
    isSyncing,
    queueAction,
    syncPendingActions,
  };
}

export type { OfflineAction };