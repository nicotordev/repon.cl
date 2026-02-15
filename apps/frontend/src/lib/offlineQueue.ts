export type PendingActionType = "sale" | "stock_adjustment" | "price_update";

export type PendingAction = {
  id: string;
  type: PendingActionType;
  payload: unknown;
  createdAt: string;
  retries?: number;
};

export type OfflineQueueState = {
  items: PendingAction[];
  lastSyncAt: string | null;
};

const STORAGE_KEY = "repon-offline-queue";

export function loadQueue(): PendingAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingAction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveQueue(items: PendingAction[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function enqueue(action: Omit<PendingAction, "id" | "createdAt">): PendingAction {
  const items = loadQueue();
  const newAction: PendingAction = {
    ...action,
    id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  items.push(newAction);
  saveQueue(items);
  return newAction;
}

export function removeFromQueue(id: string): void {
  const items = loadQueue().filter((a) => a.id !== id);
  saveQueue(items);
}

export function incrementRetry(id: string): void {
  const items = loadQueue().map((a) =>
    a.id === id ? { ...a, retries: (a.retries ?? 0) + 1 } : a
  );
  saveQueue(items);
}
