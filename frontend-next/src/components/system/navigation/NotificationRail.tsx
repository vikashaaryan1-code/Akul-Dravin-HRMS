'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle2, AlertTriangle, Info, Zap } from 'lucide-react';

type NotificationSeverity = 'info' | 'success' | 'warning' | 'ai';

type Notification = {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  time: string;
  read: boolean;
};

const SEVERITY_CONFIG: Record<NotificationSeverity, { icon: typeof Info; color: string; border: string; bg: string }> = {
  info:    { icon: Info,         color: 'text-aqua',  border: 'border-aqua/20',  bg: 'bg-aqua/5'  },
  success: { icon: CheckCircle2, color: 'text-jade',  border: 'border-jade/20',  bg: 'bg-jade/5'  },
  warning: { icon: AlertTriangle,color: 'text-gold',  border: 'border-gold/20',  bg: 'bg-gold/5'  },
  ai:      { icon: Zap,          color: 'text-ember', border: 'border-ember/20', bg: 'bg-ember/5' },
};

// Mock notifications — Phase 3C will replace with real-time stream
const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', severity: 'ai',      title: 'AI Insight',         message: 'Attrition risk elevated in Engineering (72%). Review recommended.', time: '2m ago',  read: false },
  { id: '2', severity: 'warning', title: 'Payroll Due',         message: 'April payroll cycle closes in 3 hours. 4 records pending approval.', time: '18m ago', read: false },
  { id: '3', severity: 'success', title: 'Onboarding Complete', message: 'Priya Sharma has completed all onboarding tasks.', time: '1h ago',  read: true  },
  { id: '4', severity: 'info',    title: 'Compliance Update',   message: 'ISO 27001 audit log submitted successfully.', time: '3h ago',  read: true  },
];

// ── NotificationItem ──────────────────────────────────────────────────────────
function NotificationItem({ item, onDismiss }: { item: Notification; onDismiss: (id: string) => void }) {
  const cfg = SEVERITY_CONFIG[item.severity];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-xl border ${cfg.border} ${cfg.bg} p-4 ${item.read ? 'opacity-60' : ''}`}
      role="article"
      aria-label={item.title}
    >
      <div className="flex items-start gap-3">
        <cfg.icon className={`h-4 w-4 ${cfg.color} shrink-0 mt-0.5`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-white">{item.title}</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.message}</p>
          <p className="text-[10px] text-slate-600 mt-2">{item.time}</p>
        </div>
        <button
          onClick={() => onDismiss(item.id)}
          aria-label={`Dismiss: ${item.title}`}
          className="shrink-0 text-slate-600 hover:text-white transition-colors"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      {!item.read && (
        <span className="absolute top-3 right-9 h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
      )}
    </motion.div>
  );
}

// ── NotificationRail ──────────────────────────────────────────────────────────
interface NotificationRailProps {
  open: boolean;
  onClose: () => void;
}

/**
 * NotificationRail — CyberGlass 2.0
 * Right-side slide-over notification panel with real-time feed slot.
 * Severity-coded: info (aqua), success (jade), warning (gold), AI (ember).
 * Phase 3C: replace MOCK_NOTIFICATIONS with websocket/SSE stream.
 */
export function NotificationRail({ open, onClose }: NotificationRailProps) {
  const [items, setItems] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const unread = items.filter((n) => !n.read).length;

  const dismiss = (id: string) => setItems((prev) => prev.filter((n) => n.id !== id));
  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] bg-void/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-[90] w-80 border-l border-white/[0.06] bg-depth-1/98 backdrop-blur-2xl flex flex-col shadow-2xl"
            role="dialog"
            aria-label="Notifications"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <Bell className="h-4 w-4 text-gold" aria-hidden="true" />
                <p className="text-sm font-black text-white">Notifications</p>
                {unread > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-ember/20 border border-ember/30 text-[10px] font-black text-ember">
                    {unread} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors"
                    aria-label="Mark all as read"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={onClose}
                  aria-label="Close notifications"
                  className="text-slate-600 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence initial={false}>
                {items.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center gap-3 h-48 text-slate-600"
                  >
                    <Bell className="h-8 w-8 opacity-30" aria-hidden="true" />
                    <p className="text-xs font-semibold">All caught up</p>
                  </motion.div>
                ) : (
                  items.map((item) => (
                    <NotificationItem key={item.id} item={item} onDismiss={dismiss} />
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 px-5 py-4">
              <p className="text-[10px] text-slate-700 text-center">
                Phase 3C: Live stream via WebSocket
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
