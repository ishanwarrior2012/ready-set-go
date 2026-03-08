import { useState, useEffect, useCallback } from "react";

export interface QueuedAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = "safetrack_offline_queue";
const MAX_RETRIES = 3;

function loadQueue(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedAction[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full - silently fail
  }
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedAction[]>(loadQueue);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  // Persist queue to localStorage on change
  useEffect(() => { saveQueue(queue); }, [queue]);

  const enqueue = useCallback((type: string, payload: unknown) => {
    const action: QueuedAction = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type, payload, timestamp: Date.now(), retries: 0,
    };
    setQueue(prev => [...prev, action]);
    return action.id;
  }, []);

  const dequeue = useCallback((id: string) => {
    setQueue(prev => prev.filter(a => a.id !== id));
  }, []);

  const processQueue = useCallback(async (
    handlers: Record<string, (payload: unknown) => Promise<void>>
  ) => {
    if (!isOnline || syncing || queue.length === 0) return;
    setSyncing(true);

    const toProcess = [...queue];
    for (const action of toProcess) {
      const handler = handlers[action.type];
      if (!handler) {
        setQueue(prev => prev.filter(a => a.id !== action.id));
        continue;
      }
      try {
        await handler(action.payload);
        setQueue(prev => prev.filter(a => a.id !== action.id));
      } catch {
        if (action.retries >= MAX_RETRIES) {
          setQueue(prev => prev.filter(a => a.id !== action.id));
        } else {
          setQueue(prev => prev.map(a => a.id === action.id ? { ...a, retries: a.retries + 1 } : a));
        }
      }
    }
    setSyncing(false);
  }, [isOnline, syncing, queue]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem(QUEUE_KEY);
  }, []);

  return {
    queue,
    queueSize: queue.length,
    isOnline,
    syncing,
    enqueue,
    dequeue,
    processQueue,
    clearQueue,
  };
}
