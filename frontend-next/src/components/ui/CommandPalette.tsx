'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ArrowRight, Users, Briefcase, DollarSign, BarChart3, Settings, Zap, Shield, FileText, UserCheck, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
  keywords?: string[];
};

const NAV_COMMANDS: Omit<CommandItem, 'action'>[] = [
  { id: 'employees', label: 'Employees', description: 'View all employees', icon: <Users className="h-4 w-4" />, category: 'Navigation', keywords: ['staff', 'people', 'hr'] },
  { id: 'payroll', label: 'Payroll', description: 'Process and view payroll', icon: <DollarSign className="h-4 w-4" />, category: 'Navigation', keywords: ['salary', 'pay', 'wages'] },
  { id: 'recruitment', label: 'Recruitment', description: 'Candidates and job board', icon: <Briefcase className="h-4 w-4" />, category: 'Navigation', keywords: ['hire', 'candidate', 'job'] },
  { id: 'analytics', label: 'Analytics', description: 'Reports and insights', icon: <BarChart3 className="h-4 w-4" />, category: 'Navigation', keywords: ['report', 'data', 'dashboard'] },
  { id: 'ai-hub', label: 'AI Hub', description: 'AI assistant and insights', icon: <Zap className="h-4 w-4" />, category: 'Navigation', keywords: ['ai', 'assistant', 'gpt'] },
  { id: 'compliance', label: 'Compliance', description: 'Legal and statutory compliance', icon: <Shield className="h-4 w-4" />, category: 'Navigation', keywords: ['legal', 'pf', 'esi', 'tax'] },
  { id: 'super-admin', label: 'Super Admin', description: 'Tenant management', icon: <Settings className="h-4 w-4" />, category: 'Admin', keywords: ['tenant', 'admin', 'platform'] },
  { id: 'white-label', label: 'White Label', description: 'Branding configuration', icon: <FileText className="h-4 w-4" />, category: 'Admin', keywords: ['brand', 'domain', 'logo'] },
  { id: 'recruiter-hub', label: 'Recruiter Hub', description: 'Recruiter leaderboard', icon: <UserCheck className="h-4 w-4" />, category: 'Navigation' },
  { id: 'activity', label: 'Activity Feed', description: 'Platform-wide activity', icon: <Activity className="h-4 w-4" />, category: 'Navigation' },
];

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return <>{text.slice(0, idx)}<mark className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>{text.slice(idx + query.length)}</>;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = NAV_COMMANDS.map(cmd => ({
    ...cmd,
    action: () => { router.push(`/${cmd.id}`); onClose(); },
  }));

  const filtered = query
    ? commands.filter(cmd => {
        const q = query.toLowerCase();
        return cmd.label.toLowerCase().includes(q)
          || cmd.description?.toLowerCase().includes(q)
          || cmd.keywords?.some(k => k.includes(q));
      })
    : commands;

  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const flat = Object.values(grouped).flat();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flat.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && flat[selected]) { flat[selected].action(); }
    if (e.key === 'Escape') { onClose(); }
  }, [open, flat, selected, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => setSelected(0), [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-rise"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, actions, settings..."
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none"
          />
          <kbd className="hidden sm:flex px-1.5 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-500">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {flat.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">No results for "{query}"</div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <p className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest">{category}</p>
                {items.map((cmd) => {
                  const globalIdx = flat.findIndex(f => f.id === cmd.id);
                  const isSelected = globalIdx === selected;
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelected(globalIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                    >
                      <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {cmd.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{highlight(cmd.label, query)}</p>
                        {cmd.description && <p className="text-xs text-slate-500 truncate">{cmd.description}</p>}
                      </div>
                      {isSelected && <ArrowRight className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center gap-4 text-xs text-slate-400">
          <span><kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">⏎</kbd> open</span>
          <span><kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook — registers Cmd/Ctrl+K to open the command palette.
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { open, setOpen };
}
