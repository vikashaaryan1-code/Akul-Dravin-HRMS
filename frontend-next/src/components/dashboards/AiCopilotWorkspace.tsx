'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Send, StopCircle, Trash2, ChevronDown, Check,
 AlertTriangle, BrainCircuit, Cpu, Shield,
 Users, DollarSign, UserSearch, Zap, Copy,
 ExternalLink, CheckCircle2, XCircle, Loader2,
 RotateCcw, FileText,
} from 'lucide-react';
import { GlassCard } from '@/components/system';
import {
 useAiStream,
 AGENT_META,
 type AgentMode,
 type StreamMessage,
 type PendingAction,
} from '@/hooks/realtime/useAiStream';

/* ── Agent Mode Config ───────────────────────────────────────────────────────── */ const AGENT_ICONS: Record<AgentMode, any> = {
 executive: BrainCircuit,
 hr: Users,
 payroll: DollarSign,
 security: Shield,
 recruitment: UserSearch,
};

const AGENT_ORDER: AgentMode[] = ['executive', 'hr', 'payroll', 'security', 'recruitment'];

/* ── Suggested prompts per agent ─────────────────────────────────────────────── */ const AGENT_SUGGESTIONS: Record<AgentMode, string[]> = {
 executive: [
 'Summarise this quarter\'s KPI performance',
 'Which departments are off-track on OKRs?',
 'What\'s driving the attrition spike in Sales?',
 ],
 hr: [
 'List employees with leave balance expiring soon',
 'Identify attrition risk in Engineering this quarter',
 'Summarise onboarding status for April joiners',
 ],
 payroll: [
 'Audit the April payroll cycle for anomalies',
 'Show statutory compliance gaps for Q1',
 'Which cost centres exceeded payroll budget?',
 ],
 security: [
 'Summarise active threat indicators',
 'Which sessions have elevated risk scores?',
 'Show MFA compliance gaps by department',
 ],
 recruitment: [
 'Which job openings have the highest time-to-fill?',
 'Analyse sourcing ROI for LinkedIn vs Naukri',
 'Identify candidates ready for final stage',
 ],
};

/* ── Markdown-lite renderer ───────────────────────────────────────────────────── */ function renderMarkdown(text: string): React.ReactNode {
 /* Split by code blocks first */ const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
 const parts: React.ReactNode[] = [];
 let lastIndex = 0;
 let match: RegExpExecArray | null;
 let key = 0;

 while ((match = codeBlockRegex.exec(text)) !== null) {
 /* Text before code block */ if (match.index > lastIndex) {
 parts.push(
 <span key={key++}>{renderInline(text.slice(lastIndex, match.index))}</span>
 );
 }
 parts.push(
 <pre key={key++} className="my-2 p-3 rounded-xl bg-black/40 border border-white/8 text-[11px] font-mono text-jade overflow-x-auto whitespace-pre-wrap">
 {match[2].trim()}
 </pre>
 );
 lastIndex = match.index + match[0].length;
 }

 if (lastIndex < text.length) {
 parts.push(<span key={key++}>{renderInline(text.slice(lastIndex))}</span>);
 }

 return <>{parts}</>;
}

function renderInline(text: string): React.ReactNode {
 /* Bold, italic, inline code */ return text.split('\n').map((line, i, arr) => (
 <React.Fragment key={i}>
 {line
 .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
 .replace(/`(.+?)`/g, '<code>$1</code>')
 .split(/(<b>.*?<\/b>|<code>.*?<\/code>)/)
 .map((part, j) => {
 if (part.startsWith('<b>')) return <strong key={j} className="font-black text-navy">{part.slice(3, -4)}</strong>;
 if (part.startsWith('<code>')) return <code key={j} className="px-1 py-0.5 rounded bg-slate-100 text-jade text-[10px] font-mono">{part.slice(6, -7)}</code>;
 return part;
 })
 }
 {i < arr.length - 1 && <br />}
 </React.Fragment>
 ));
}

/* ── Action Confirmation Modal ───────────────────────────────────────────────── */ function ActionModal({ action, onConfirm, onDismiss }: {
 action: PendingAction;
 onConfirm: () => void;
 onDismiss: () => void;
}) {
 return (
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="fixed inset-0 z-50 flex items-center justify-center p-4"
 role="dialog" aria-modal="true" aria-labelledby="action-modal-title"
 >
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onDismiss} aria-hidden="true" />
 <div className="relative z-10 w-full max-w-md surface-raised border-subtle rounded-2xl p-6 space-y-4">
 <div className="flex items-center gap-3">
 <div className="h-10 w-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
 <Zap className="h-5 w-5 text-gold" aria-hidden="true" />
 </div>
 <div>
 <p id="action-modal-title" className="text-sm font-black text-navy">Confirm Action</p>
 <p className="text-xs text-slate-500">{action.label}</p>
 </div>
 </div>

 <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
 <p className="text-[10px] font-black text-slate-600 uppercase tracking-wide mb-2">Action Payload</p>
 <pre className="text-[10px] font-mono text-slate-500 whitespace-pre-wrap">
 {JSON.stringify(action.payload, null, 2)}
 </pre>
 </div>

 <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 flex gap-2">
 <AlertTriangle className="h-4 w-4 text-gold shrink-0 mt-0.5" aria-hidden="true" />
 <p className="text-xs text-gold">This action will be executed against live data and recorded in the audit log.</p>
 </div>

 <div className="flex gap-3 pt-1">
 <button
 onClick={onDismiss}
 className="flex-1 py-2.5 rounded-xl border border-white/8 bg-white/60 text-xs font-black text-slate-500 hover:text-navy transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={onConfirm}
 className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-gold to-ember text-white text-xs font-black hover:scale-105 transition-transform"
 >
 Execute Action
 </button>
 </div>
 </div>
 </motion.div>
 );
}

/* ── Message Bubble ──────────────────────────────────────────────────────────── */ function MessageBubble({ msg, accentColor }: { msg: StreamMessage; accentColor: string }) {
 const [copied, setCopied] = useState(false);
 const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

 const isUser = msg.role === 'user';

 const copyToClipboard = async () => {
 await navigator.clipboard.writeText(msg.content);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

 const ACCENT_RING: Record<string, string> = {
 jade: 'border-jade/20 bg-jade/5',
 aqua: 'border-aqua/20 bg-aqua/5',
 gold: 'border-gold/20 bg-gold/5',
 ember: 'border-ember/20 bg-ember/5',
 };

 return (
 <>
 <motion.div
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
 >
 {/* Avatar */}
 <div
 className={`h-7 w-7 rounded-lg border flex items-center justify-center text-[9px] font-black shrink-0 mt-1 ${
 isUser
 ? 'bg-slate-100 border-slate-200 text-slate-500'
 : `${ACCENT_RING[accentColor] ?? ACCENT_RING.jade} text-${accentColor}`
 }`}
 aria-hidden="true"
 >
 {isUser ? 'YOU' : AGENT_META[msg.agentMode ?? 'executive'].avatar}
 </div>

 {/* Bubble */}
 <div className={`flex-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
 <div
 className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
 isUser
 ? 'bg-white/8 border border-white/8 text-slate-700 ml-auto'
 : 'bg-[#0D0D14] border border-white/[0.05] text-slate-600'
 }`}
 >
 {isUser ? (
 msg.content
 ) : (
 <>
 {renderMarkdown(msg.content)}
 {msg.isStreaming && (
 <span className="inline-block h-3.5 w-0.5 bg-current align-middle ml-0.5 animate-pulse" aria-label="Streaming" />
 )}
 </>
 )}
 </div>

 {/* Citations */}
 {!isUser && !msg.isStreaming && msg.citations && msg.citations.length > 0 && (
 <div className="flex flex-wrap gap-1.5">
 {msg.citations.map((cite, i) => (
 <div
 key={i}
 className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/8 bg-white/[0.03] text-[9px] text-slate-500"
 title={`Confidence: ${cite.confidence}%`}
 >
 <FileText className="h-2.5 w-2.5" aria-hidden="true" />
 {cite.system} · {cite.reference}
 <span className={`font-black ${cite.confidence >= 90 ? 'text-jade' : cite.confidence >= 70 ? 'text-gold' : 'text-ember'}`}>
 {cite.confidence}%
 </span>
 </div>
 ))}
 </div>
 )}

 {/* Action button */}
 {!isUser && !msg.isStreaming && msg.action && (
 <button
 onClick={() => setPendingAction(msg.action!)}
 className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gold/20 bg-gold/8 text-xs font-black text-gold hover:bg-gold/15 transition-colors"
 aria-label={`Execute action: ${msg.action.label}`}
 >
 <Zap className="h-3 w-3" aria-hidden="true" />
 {msg.action.label}
 </button>
 )}

 {/* Timestamp + copy */}
 {!msg.isStreaming && (
 <div className="flex items-center gap-3 text-[9px] text-slate-700">
 <span>{new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
 {!isUser && (
 <button
 onClick={copyToClipboard}
 className="flex items-center gap-1 hover:text-slate-500 transition-colors"
 aria-label="Copy response"
 >
 {copied ? <CheckCircle2 className="h-3 w-3 text-jade" /> : <Copy className="h-3 w-3" />}
 {copied ? 'Copied' : 'Copy'}
 </button>
 )}
 </div>
 )}
 </div>
 </motion.div>

 {/* Action modal */}
 <AnimatePresence>
 {pendingAction && (
 <ActionModal
 action={pendingAction}
 onConfirm={() => {
 // Phase 4: wire to mutation hook
 console.info('[AI Action]', pendingAction);
 setPendingAction(null);
 }}
 onDismiss={() => setPendingAction(null)}
 />
 )}
 </AnimatePresence>
 </>
 );
}

// ── AiCopilotWorkspace (v2 — SSE streaming) ───────────────────────────────────
/**
 * AiCopilotWorkspace v2 — Phase 4 Priority 1
 * Full SSE streaming AI copilot with:
 * - 5 agent modes (Executive / HR / Payroll / Security / Recruitment)
 * - Token-by-token streaming with cancellation
 * - Markdown rendering (code blocks, bold, inline code)
 * - Citation + confidence display per response
 * - Action execution layer with confirmation modal
 * - Context memory (agent mode persisted per session)
 * - Suggested prompts per agent
 */
export function AiCopilotWorkspace() {
 const [agentMode, setAgentMode] = useState<AgentMode>('executive');
 const [agentOpen, setAgentOpen] = useState(false);
 const [input, setInput] = useState('');
 const scrollRef = useRef<HTMLDivElement>(null);
 const inputRef = useRef<HTMLTextAreaElement>(null);

 const { messages, status, error, send, cancel, clear } = useAiStream({
 agentMode,
 context: { activeDashboard: 'executive', timeframe: 'Q2-2026' },
 });

 const agent = AGENT_META[agentMode];
 const AgentIcon = AGENT_ICONS[agentMode];
 const isStreaming = status === 'streaming';

 // Auto-scroll on new content
 useEffect(() => {
 scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
 }, [messages]);

 const handleSend = useCallback(() => {
 const text = input.trim();
 if (!text || isStreaming) return;
 setInput('');
 send(text);
 }, [input, isStreaming, send]);

 const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 handleSend();
 }
 }, [handleSend]);

 const ACCENT = agent.accentColor;

 return (
 <section className="flex flex-col h-[calc(100vh-8rem)] max-h-[900px]" aria-labelledby="copilot-heading">
 <h1 id="copilot-heading" className="sr-only">AI Copilot Workspace</h1>

 {/* Header */}
 <div className="mb-4 flex items-center justify-between gap-4 flex-wrap shrink-0">
 <div className="flex items-center gap-3">
 <div className={`h-10 w-10 rounded-xl border border-${ACCENT}/20 bg-${ACCENT}/10 flex items-center justify-center`}>
 <AgentIcon className={`h-5 w-5 text-${ACCENT}`} aria-hidden="true" />
 </div>
 <div>
 <p className={`section-label text-${ACCENT} mb-0.5`}>AI Copilot Workspace</p>
 <h2 className="text-xl font-black tracking-tighter text-navy">{agent.name}</h2>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {/* Agent Switcher */}
 <div className="relative">
 <button
 onClick={() => setAgentOpen((o) => !o)}
 aria-haspopup="listbox"
 aria-expanded={agentOpen}
 className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 bg-white/[0.04] text-xs font-black text-slate-600 hover:text-navy transition-colors"
 >
 <AgentIcon className="h-3.5 w-3.5" aria-hidden="true" /> {agent.name}
 <ChevronDown className={`h-3 w-3 text-slate-600 transition-transform ${agentOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
 </button>

 <AnimatePresence>
 {agentOpen && (
 <motion.div
 initial={{ opacity: 0, y: -8 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -8 }}
 role="listbox"
 aria-label="Select agent mode"
 className="absolute right-0 top-full mt-2 w-72 surface-raised border-subtle rounded-2xl overflow-hidden z-20 shadow-2xl"
 >
 {AGENT_ORDER.map((mode) => {
 const meta = AGENT_META[mode];
 const Icon = AGENT_ICONS[mode];
 const isActive = agentMode === mode;
 return (
 <button
 key={mode}
 role="option"
 aria-selected={isActive}
 onClick={() => { setAgentMode(mode); setAgentOpen(false); }}
 className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/60 transition-colors ${isActive ? 'bg-white/[0.04]' : ''}`}
 >
 <div className={`h-8 w-8 rounded-lg border border-${meta.accentColor}/20 bg-${meta.accentColor}/10 flex items-center justify-center shrink-0`}>
 <Icon className={`h-4 w-4 text-${meta.accentColor}`} aria-hidden="true" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-black text-navy">{meta.name}</p>
 <p className="text-[10px] text-slate-600 leading-snug mt-0.5 truncate">{meta.description}</p>
 </div>
 {isActive && <Check className="h-3.5 w-3.5 text-jade shrink-0" aria-hidden="true" />}
 </button>
 );
 })}
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 <button
 onClick={clear}
 aria-label="Clear conversation"
 className="h-9 w-9 rounded-xl border border-white/8 bg-white/60 flex items-center justify-center text-slate-500 hover:text-navy transition-colors"
 >
 <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
 </button>
 </div>
 </div>

 {/* Message area */}
 <div
 ref={scrollRef}
 className="flex-1 overflow-y-auto space-y-5 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
 role="log"
 aria-label="AI conversation"
 aria-live="polite"
 >
 {/* Empty state with suggestions */}
 {messages.length === 0 && (
 <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
 <div className={`h-16 w-16 rounded-2xl border border-${ACCENT}/20 bg-${ACCENT}/10 flex items-center justify-center`}>
 <AgentIcon className={`h-8 w-8 text-${ACCENT}`} aria-hidden="true" />
 </div>
 <div className="text-center">
 <p className="text-sm font-black text-navy">{agent.name} ready</p>
 <p className="text-xs text-slate-500 mt-1 max-w-xs">{agent.description}</p>
 </div>
 <div className="grid gap-2 w-full max-w-md">
 {AGENT_SUGGESTIONS[agentMode].map((suggestion) => (
 <button
 key={suggestion}
 onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
 className="px-4 py-3 rounded-xl border border-white/8 bg-white/[0.03] text-xs text-slate-500 hover:text-navy hover:bg-white/[0.05] transition-colors text-left"
 >
 {suggestion}
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Messages */}
 {messages.map((msg) => (
 <MessageBubble key={msg.id} msg={msg} accentColor={ACCENT} />
 ))}

 {/* Error state */}
 {error && (
 <div className="flex items-center gap-2 p-3 rounded-xl border border-ember/20 bg-ember/5 text-xs text-ember">
 <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
 {error}
 </div>
 )}
 </div>

 {/* Input area */}
 <div className="shrink-0 mt-4">
 <GlassCard className="p-3">
 <div className="flex items-end gap-3">
 <textarea
 ref={inputRef}
 value={input}
 onChange={(e) => setInput(e.target.value)}
 onKeyDown={handleKeyDown}
 placeholder={`Ask ${agent.name}… (Enter to send, Shift+Enter for newline)`}
 rows={2}
 className="flex-1 resize-none bg-transparent text-sm text-navy placeholder-slate-600 focus:outline-none leading-relaxed scrollbar-none"
 aria-label="Message input"
 disabled={isStreaming}
 />
 <div className="flex items-center gap-2 shrink-0">
 {isStreaming ? (
 <button
 onClick={cancel}
 aria-label="Cancel generation"
 className="h-9 w-9 rounded-xl bg-ember/15 border border-ember/20 flex items-center justify-center text-ember hover:bg-ember/25 transition-colors"
 >
 <StopCircle className="h-4 w-4" aria-hidden="true" />
 </button>
 ) : (
 <button
 onClick={handleSend}
 disabled={!input.trim()}
 aria-label="Send message"
 className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
 input.trim()
 ? `bg-${ACCENT}/20 border border-${ACCENT}/30 text-${ACCENT} hover:bg-${ACCENT}/30`
 : 'bg-white/60 border border-white/8 text-slate-700 cursor-not-allowed'
 }`}
 >
 {isStreaming
 ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
 : <Send className="h-4 w-4" aria-hidden="true" />
 }
 </button>
 )}
 </div>
 </div>
 {/* Footer info */}
 <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04]">
 <p className="text-[9px] text-slate-700">
 {agent.name} · SSE streaming · All outputs are audited and timestamped
 </p>
 <p className="text-[9px] text-slate-700">
 {messages.length} messages
 </p>
 </div>
 </GlassCard>
 </div>
 </section>
 );
}
