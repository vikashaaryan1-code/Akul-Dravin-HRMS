/**
 * toast-store.ts
 *
 * Zero-dependency toast state manager using a simple singleton + event emitter pattern.
 * Works in any React component or outside React (service layer, API handlers).
 * No zustand, no additional packages required.
 */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id:       string;
  message:  string;
  variant:  ToastVariant;
  duration: number; // ms
}

type Listener = (toasts: Toast[]) => void;

// ── Singleton store ───────────────────────────────────────────────────────────
let _toasts: Toast[]    = [];
const _listeners        = new Set<Listener>();
const _timers           = new Map<string, ReturnType<typeof setTimeout>>();

function notify() {
  _listeners.forEach((fn) => fn([..._toasts]));
}

export const toastStore = {
  subscribe(fn: Listener): () => void {
    _listeners.add(fn);
    fn([..._toasts]); // seed current state
    return () => _listeners.delete(fn);
  },

  add(message: string, variant: ToastVariant = 'info', duration = 4000): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    _toasts = [..._toasts, { id, message, variant, duration }];
    notify();

    // Auto-remove
    const timer = setTimeout(() => toastStore.remove(id), duration);
    _timers.set(id, timer);
    return id;
  },

  remove(id: string): void {
    const t = _timers.get(id);
    if (t) { clearTimeout(t); _timers.delete(id); }
    _toasts = _toasts.filter((t) => t.id !== id);
    notify();
  },

  clear(): void {
    _timers.forEach(clearTimeout);
    _timers.clear();
    _toasts = [];
    notify();
  },
};

// ── Convenience helpers (callable anywhere, including non-React code) ─────────
export const toast = {
  success: (msg: string, dur?: number) => toastStore.add(msg, 'success', dur),
  error:   (msg: string, dur?: number) => toastStore.add(msg, 'error',   dur ?? 6000),
  warning: (msg: string, dur?: number) => toastStore.add(msg, 'warning', dur),
  info:    (msg: string, dur?: number) => toastStore.add(msg, 'info',    dur),
};
