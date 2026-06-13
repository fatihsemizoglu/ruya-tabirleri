const DB_NAME = 'voice-dream-journal';
const DB_VERSION = 1;
const STORE = 'pending-dreams';

export interface PendingVoiceDream {
  id: string;
  title: string;
  content: string;
  mood: string;
  createdAt: number;
  audioBlob?: Blob;
  interpretation?: unknown;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePendingDream(dream: PendingVoiceDream): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(dream);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingDreams(): Promise<PendingVoiceDream[]> {
  if (typeof indexedDB === 'undefined') return [];
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as PendingVoiceDream[]) || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deletePendingDream(id: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function syncPendingDreams(
  onSync: (dream: PendingVoiceDream) => Promise<void>
): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingDreams();
  let synced = 0;
  let failed = 0;
  for (const dream of pending) {
    try {
      await onSync(dream);
      await deletePendingDream(dream.id);
      synced += 1;
    } catch {
      failed += 1;
    }
  }
  return { synced, failed };
}
