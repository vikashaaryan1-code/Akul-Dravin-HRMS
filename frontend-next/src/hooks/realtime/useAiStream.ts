'use client';

/**
 * hooks/realtime/useAiStream.ts
 * SSE-based AI streaming hook for the AI Copilot Workspace.
 *
 * Uses fetch() with ReadableStream over EventSource because:
 * - allows POST bodies (system prompt, context, agent mode)
 * - compatible with NestJS SSE gateway + all enterprise proxies
 * - supports cancellation via AbortController
 *
 * Usage:
 * const { stream, send, cancel, status } = useAiStream({ agentMode: 'hr' });
 */

import { useState, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';

/* ── Types ────────────────────────────────────────────────────────────────────── */ export type AgentMode =
 | 'executive'
 | 'hr'
 | 'payroll'
 | 'security'
 | 'recruitment';

export type CitationSource = {
 system: string; // e.g. "HRMS", "Payroll Engine", "AI Model"
 reference: string; // e.g. "Employee #E-0412", "Payroll Cycle #PC-2026-04"
 confidence:number; /* 0–100 */ };

export type StreamMessage = {
 id: string;
 role: 'user' | 'assistant';
 content: string;
 isStreaming?:boolean;
 agentMode?:AgentMode;
 citations?:CitationSource[];
 action?: PendingAction;
 timestamp: string;
};

export type PendingAction = {
 type: 'approve_leave' | 'run_payroll_audit' | 'generate_report' | 'create_requisition' | 'export_compliance';
 label: string;
 payload: Record<string, unknown>;
};

export type StreamStatus = 'idle' | 'streaming' | 'done' | 'error' | 'cancelled';

export type AiStreamContext = {
 tenantId?: string;
 employeeId?: string;
 activeDashboard?:string;
 timeframe?: string;
};

export type UseAiStreamOptions = {
 agentMode: AgentMode;
 context?: AiStreamContext;
 baseUrl?: string;
};

/* ── Agent system prompts (sent to the API as metadata) ───────────────────────── */ export const AGENT_META: Record<AgentMode, {
 name: string;
 description: string;
 avatar: string;
 accentColor: string;
}> = {
 executive: {
 name: 'Executive Advisor',
 description: 'Strategic insights, KPI analysis, and board-level recommendations',
 avatar: 'EA',
 accentColor: 'jade',
 },
 hr: {
 name: 'HR Intelligence',
 description: 'Employee lifecycle, attrition risk, leave management and workforce planning',
 avatar: 'HR',
 accentColor: 'aqua',
 },
 payroll: {
 name: 'Payroll Auditor',
 description: 'Payroll compliance, variance analysis, statutory obligations and audit trails',
 avatar: 'PA',
 accentColor: 'gold',
 },
 security: {
 name: 'Security Analyst',
 description: 'Threat analysis, session forensics, compliance posture and anomaly detection',
 avatar: 'SA',
 accentColor: 'ember',
 },
 recruitment: {
 name: 'Recruitment Strategist',
 description: 'Pipeline optimization, sourcing ROI, candidate scoring and hiring forecasting',
 avatar: 'RS',
 accentColor: 'aqua',
 },
};

/* ── Hook ─────────────────────────────────────────────────────────────────────── */ export function useAiStream({ agentMode, context, baseUrl = '/api/ai/stream' }: UseAiStreamOptions) {
 const [messages, setMessages] = useState<StreamMessage[]>([]);
 const [status, setStatus] = useState<StreamStatus>('idle');
 const [error, setError] = useState<string | null>(null);
 const abortRef = useRef<AbortController | null>(null);
 const token = useAuthStore((s) => s.token);

 /* ── Send a message and stream the response ────────────────────────────────── */ const send = useCallback(async (userText: string) => {
 if (status === 'streaming') return; /* prevent concurrent streams */ const userMessage: StreamMessage = {
 id: `user-${Date.now()}`,
 role: 'user',
 content: userText,
 agentMode,
 timestamp: new Date().toISOString(),
 };

 // Append user message immediately (optimistic)
 setMessages((prev) => [...prev, userMessage]);
 setStatus('streaming');
 setError(null);

 /* Placeholder assistant message that streams in */ const assistantId = `assistant-${Date.now()}`;
 setMessages((prev) => [...prev, {
 id: assistantId,
 role: 'assistant',
 content: '',
 isStreaming: true,
 agentMode,
 timestamp: new Date().toISOString(),
 }]);

 // Fresh abort controller per request
 abortRef.current = new AbortController();

 try {
 const response = await fetch(baseUrl, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${token ?? ''}`,
 'Accept': 'text/event-stream',
 },
 body: JSON.stringify({
 message: userText,
 agentMode,
 context,
 history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
 }),
 signal: abortRef.current.signal,
 });

 if (!response.ok) {
 throw new Error(`Stream error: ${response.status} ${response.statusText}`);
 }

 const reader = response.body?.getReader();
 if (!reader) throw new Error('No response body reader');

 const decoder = new TextDecoder();
 let accumulated = '';
 let citations: CitationSource[] = [];
 let action: PendingAction | undefined;

 // Read SSE chunks
 while (true) {
 const { done, value } = await reader.read();
 if (done) break;

 const chunk = decoder.decode(value, { stream: true });
 const lines = chunk.split('\n');

 for (const line of lines) {
 if (line.startsWith('data: ')) {
 const raw = line.slice(6).trim();
 if (raw === '[DONE]') break;
 try {
 const parsed = JSON.parse(raw) as {
 delta?: string;
 citations?: CitationSource[];
 action?: PendingAction;
 };

 if (parsed.delta) {
 accumulated += parsed.delta;
 setMessages((prev) =>
 prev.map((m) =>
 m.id === assistantId
 ? { ...m, content: accumulated }
 : m,
 ),
 );
 }
 if (parsed.citations) citations = parsed.citations;
 if (parsed.action) action = parsed.action;
 } catch {
 /* Non-JSON SSE lines (comments) — ignore */ }
 }
 }
 }

 // Finalise the assistant message (no longer streaming)
 setMessages((prev) =>
 prev.map((m) =>
 m.id === assistantId
 ? { ...m, isStreaming: false, citations, action }
 : m,
 ),
 );
 setStatus('done');

 } catch (err: unknown) {
 if (err instanceof Error && err.name === 'AbortError') {
 setStatus('cancelled');
 setMessages((prev) =>
 prev.map((m) =>
 m.id === assistantId
 ? { ...m, isStreaming: false, content: m.content + '\n\n_[Generation cancelled]_' }
 : m,
 ),
 );
 } else {
 const message = err instanceof Error ? err.message : 'Unknown stream error';
 setError(message);
 setStatus('error');
 setMessages((prev) =>
 prev.map((m) =>
 m.id === assistantId
 ? { ...m, isStreaming: false, content: '_Failed to generate response. Please retry._' }
 : m,
 ),
 );
 }
 }
 }, [agentMode, baseUrl, context, messages, status, token]);

 /* ── Cancel the current stream ─────────────────────────────────────────────── */ const cancel = useCallback(() => {
 abortRef.current?.abort();
 }, []);

 /* ── Clear chat history ────────────────────────────────────────────────────── */ const clear = useCallback(() => {
 abortRef.current?.abort();
 setMessages([]);
 setStatus('idle');
 setError(null);
 }, []);

 return { messages, status, error, send, cancel, clear };
}
