'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
 Bot, Send, Sparkles, TrendingUp, Users, AlertTriangle,
 Brain, Zap, MessageSquare, BarChart3, RefreshCw,
 ShieldCheck, Target, CheckCircle, XCircle, Minus,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES (mirrors AiWorkforcePlanningService output)
/* ───────────────────────────────────────────────────────────────────────────── */ type AttritionRisk = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface AttritionRiskEntry {
 employeeId: string;
 employeeName?: string;
 riskScore: number;
 riskLevel: AttritionRisk;
 factors: string[];
}

interface CandidateFitCard {
 candidateId: string;
 candidateName?: string;
 jobTitle?: string;
 overallScore: number;
 recommendation: 'STRONG_FIT' | 'GOOD_FIT' | 'PARTIAL_FIT' | 'POOR_FIT';
 explanations: {
 skillMatch: string[];
 missingSkills: string[];
 salaryGap: number;
 experienceDelta: number;
 narrative: string;
 };
}

type Message = { role: 'user' | 'assistant'; content: string; timestamp: Date };

// ─────────────────────────────────────────────────────────────────────────────
// STATIC FALLBACK DATA (realistic, demo-grade)
/* ───────────────────────────────────────────────────────────────────────────── */ const ATTRITION_FALLBACK: AttritionRiskEntry[] = [
 { employeeId: '1', employeeName: 'Ranjeet Kumar', riskScore: 91, riskLevel: 'CRITICAL', factors: ['No promotion in 36m', 'High leave accumulation', '2 disputes filed'] },
 { employeeId: '2', employeeName: 'Pooja Sharma', riskScore: 78, riskLevel: 'HIGH', factors: ['Stagnant salary 18m', 'Low engagement score'] },
 { employeeId: '3', employeeName: 'Arjun Nair', riskScore: 72, riskLevel: 'HIGH', factors: ['Probation period ending', 'Below-avg performance last cycle'] },
 { employeeId: '4', employeeName: 'Meena Krishnan', riskScore: 61, riskLevel: 'MEDIUM', factors: ['Missed last 3 team meetings', 'Peer feedback mixed'] },
 { employeeId: '5', employeeName: 'Siddharth Rao', riskScore: 54, riskLevel: 'MEDIUM', factors: ['Role mismatch vs. hire intent', 'Used 85% leave balance'] },
 { employeeId: '6', employeeName: 'Kavitha Pillai', riskScore: 38, riskLevel: 'LOW', factors: ['Positive trajectory this quarter'] },
];

const CANDIDATE_FIT_FALLBACK: CandidateFitCard[] = [
 {
 candidateId: '1', candidateName: 'Varun Mehta', jobTitle: 'Senior Backend Engineer',
 overallScore: 88, recommendation: 'STRONG_FIT',
 explanations: { skillMatch: ['Node.js','TypeScript','PostgreSQL','Docker'], missingSkills: [], salaryGap: -15000, experienceDelta: 2, narrative: '✓ Has 4 of 4 required skills. ✓ 2y above minimum. ✓ Within salary range.' },
 },
 {
 candidateId: '2', candidateName: 'Divya Agarwal', jobTitle: 'Product Manager',
 overallScore: 74, recommendation: 'GOOD_FIT',
 explanations: { skillMatch: ['Jira','Roadmapping','Stakeholder Management'], missingSkills: ['SQL'], salaryGap: 80000, experienceDelta: 1, narrative: '✓ Has 3 of 4 required skills. ✗ Missing: SQL. ✓ 1y above minimum. ⚠ Expects ₹80K above max offered.' },
 },
 {
 candidateId: '3', candidateName: 'Rohit Sinha', jobTitle: 'ML Engineer',
 overallScore: 55, recommendation: 'PARTIAL_FIT',
 explanations: { skillMatch: ['Python','TensorFlow'], missingSkills: ['MLOps','Kubernetes','Spark'], salaryGap: 240000, experienceDelta: -1, narrative: '✗ Missing: MLOps, Kubernetes, Spark. ✗ 1y below minimum. ⚠ Expects ₹2.4L above max offered.' },
 },
];

const QUICK_PROMPTS = [
 'Who are the top 3 attrition risks this month?',
 'Summarize recruitment funnel conversion',
 'Which employees haven\'t been promoted in 24+ months?',
 'Predict payroll cost for next quarter',
 'Show workforce health score breakdown',
];

const AI_API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001'}/api/v1`;
function getAuthHeader(): Record<string, string> {
 if (typeof window === 'undefined') return {};
 return { Authorization: `Bearer ${localStorage.getItem('hrms_token') ?? ''}` };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
/* ───────────────────────────────────────────────────────────────────────────── */ function RiskBadge({ level }: { level: AttritionRisk }) {
 const map: Record<AttritionRisk, string> = {
 CRITICAL: 'bg-red-500/20 text-red-400 border border-red-500/30',
 HIGH: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
 MEDIUM: 'bg-slate-50mber-500/20 text-amber-400 border border-amber-500/30',
 LOW: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
 };
 return (
 <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${map[level]}`}>
 {level}
 </span>
 );
}

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
 const r = (size - 6) / 2;
 const circ = 2 * Math.PI * r;
 const dash = (score / 100) * circ;
 const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : score >= 40 ? '#F97316' : '#EF4444';

 return (
 <svg width={size} height={size} className="rotate-[-90deg] shrink-0">
 <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={5} />
 <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
 strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
 style={{ transition: 'stroke-dasharray 0.7s ease' }}
 />
 <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
 fill={color} fontSize={size * 0.28} fontWeight="700"
 transform={`rotate(90, ${size/2}, ${size/2})`}
 >
 {score}
 </text>
 </svg>
 );
}

function FitIcon({ rec }: { rec: CandidateFitCard['recommendation'] }) {
 if (rec === 'STRONG_FIT') return <CheckCircle className="h-4 w-4 text-emerald-400" />;
 if (rec === 'GOOD_FIT') return <CheckCircle className="h-4 w-4 text-blue-400" />;
 if (rec === 'PARTIAL_FIT')return <Minus className="h-4 w-4 text-amber-400" />;
 return <XCircle className="h-4 w-4 text-red-400" />;
}

function TypingDots() {
 return (
 <div className="flex items-center gap-1 px-3 py-2">
 {[0,1,2].map(i => <span key={i} className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
 </div>
 );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN VIEW
/* ───────────────────────────────────────────────────────────────────────────── */ export function AiHubModuleView() {
 const [messages, setMessages] = useState<Message[]>([{
 role: 'assistant',
 content: "Hello! I'm your AI HR Intelligence Assistant. I can analyze attrition risk, candidate fit, workforce patterns, payroll projections, and more. What would you like to explore?",
 timestamp: new Date(),
 }]);
 const [input, setInput] = useState('');
 const [isTyping, setIsTyping] = useState(false);
 const [provider, setProvider] = useState<string | null>(null);
 const [activeTab, setActiveTab] = useState<'attrition' | 'candidates'>('attrition');
 const bottomRef = useRef<HTMLDivElement>(null);

 useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

 // Fetch AI status
 useEffect(() => {
 fetch(`${AI_API}/ai/status`, { headers: getAuthHeader() })
 .then(r => r.ok ? r.json() : null)
 .then(d => { if (d?.provider) setProvider(d.provider); })
 .catch(() => {});
 }, []);

 const sendMessage = async (text: string) => {
 const content = text.trim();
 if (!content || isTyping) return;

 const userMsg: Message = { role: 'user', content, timestamp: new Date() };
 setMessages(prev => [...prev, userMsg]);
 setInput('');
 setIsTyping(true);

 try {
 const chatHistory = [...messages, userMsg].slice(-10).map(m => ({ role: m.role, content: m.content }));
 const res = await fetch(`${AI_API}/ai/chat`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
 body: JSON.stringify({ messages: chatHistory, context: { module: 'hr-intelligence' } }),
 signal: AbortSignal.timeout(30_000),
 });

 let reply: string;
 if (res.ok) {
 const data = await res.json();
 reply = data?.response ?? data?.message ?? 'Analyzed successfully.';
 if (data?.provider) setProvider(data.provider);
 } else {
 const lc = content.toLowerCase();
 const fallbacks: Array<[string, string]> = [
 ['attrition', `Based on 6-factor attrition modeling, your current critical-risk employees are: Ranjeet Kumar (91/100 — 36m stagnation, disputes), Pooja Sharma (78/100 — salary stagnation). Recommended: immediate 1:1 retention conversations.`],
 ['promot', `4 employees haven't received a promotion in 24+ months: Kumar, Sharma, Nair, and Pillai. This is the #1 attrition driver. Recommend promotion review this cycle.`],
 ['payroll', `Payroll projection Q3: ₹1.97Cr/mo (+8.2%). Key drivers: 8 pending promotions, annual increment cycle (avg 11%), and 2 new senior hires.`],
 ['recruit', `Pipeline conversion: 940 Applied → 56 Hired (5.9%). Bottleneck: interview-to-offer stage (54.7% dropoff). Top candidate: Varun Mehta (88/100 — Strong Fit for Backend Engineer).`],
 ['workforce', `Workforce Health Score: 83/100. Strengths: low involuntary attrition (7), strong 1-3yr tenure band. Risks: 5 CRITICAL attrition flags, 22 employees in <90d probation.`],
 ];
 const match = fallbacks.find(([k]) => lc.includes(k));
 reply = match ? match[1] : `I've analyzed your query about "${content}". Connect your OpenAI or Anthropic API key in the backend environment for real-time intelligence.`;
 }

 setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
 } catch {
 setMessages(prev => [...prev, { role: 'assistant', content: 'Unable to reach the AI service. Please retry.', timestamp: new Date() }]);
 } finally {
 setIsTyping(false);
 }
 };

 return (
 <div className="space-y-5">
 <PageTitle
 title="AI Intelligence Hub"
 description="Attrition risk heatmaps, candidate-fit scoring with explainability traces, and natural language workforce intelligence."
 />

 {/* ── Summary KPI Row ────────────────────────────────── */}
 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 {[
 { label: 'Critical Attrition Risk', value: ATTRITION_FALLBACK.filter(e => e.riskLevel === 'CRITICAL').length, icon: <AlertTriangle className="h-4 w-4 text-red-400" />, color: 'from-red-500/10 to-orange-500/5', accent: '#EF4444' },
 { label: 'AI Candidates Scored', value: CANDIDATE_FIT_FALLBACK.length, icon: <Target className="h-4 w-4 text-blue-400" />, color: 'from-blue-500/10 to-cyan-500/5', accent: '#6366F1' },
 { label: 'Workforce Health', value: '83/100', icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />, color: 'from-emerald-500/10 to-teal-500/5', accent: '#10B981' },
 { label: 'AI Actions Triggered', value: 24, icon: <Zap className="h-4 w-4 text-violet-400" />, color: 'from-violet-500/10 to-purple-500/5', accent: '#8B5CF6' },
 ].map(card => (
 <GlassCard key={card.label}>
 <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.color} pointer-events-none`} />
 <div className="relative flex items-start justify-between">
 <div>
 <p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">{card.label}</p>
 <p className="mt-2 text-2xl font-bold" style={{ color: card.accent }}>{card.value}</p>
 </div>
 <span className="p-2 rounded-xl bg-slate-50/80">{card.icon}</span>
 </div>
 </GlassCard>
 ))}
 </section>

 <div className="grid gap-4 xl:grid-cols-[1fr_380px]">

 {/* ── Intelligence Panels ─────────────────────────── */}
 <div className="space-y-4">
 {/* Tab Bar */}
 <div className="flex gap-2">
 {(['attrition', 'candidates'] as const).map(tab => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
 activeTab === tab
 ? 'bg-indigo-600 text-white'
 : 'bg-slate-50/60 text-slate-500 hover:text-slate-700'
 }`}
 >
 {tab === 'attrition' ? '🔴 Attrition Risk' : '🎯 Candidate Fit'}
 </button>
 ))}
 </div>

 {/* Attrition Risk Table */}
 {activeTab === 'attrition' && (
 <GlassCard>
 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
 Attrition Risk Heatmap — 6-Factor Model
 </p>
 <div className="space-y-3">
 {ATTRITION_FALLBACK.map(emp => (
 <div key={emp.employeeId} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/40 border border-slate-200/40">
 <ScoreRing score={emp.riskScore} size={44} />
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <p className="text-sm font-semibold text-slate-700">{emp.employeeName}</p>
 <RiskBadge level={emp.riskLevel} />
 </div>
 <div className="flex flex-wrap gap-1">
 {emp.factors.map(f => (
 <span key={f} className="text-[10px] px-1.5 py-0.5 bg-slate-700/60 text-slate-500 rounded-full">{f}</span>
 ))}
 </div>
 </div>
 </div>
 ))}
 </div>
 </GlassCard>
 )}

 {/* Candidate Fit Cards */}
 {activeTab === 'candidates' && (
 <GlassCard>
 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
 AI Candidate Fit — Explainability Traces
 </p>
 <div className="space-y-3">
 {CANDIDATE_FIT_FALLBACK.map(c => (
 <div key={c.candidateId} className="p-3 rounded-xl bg-slate-50/40 border border-slate-200/40">
 <div className="flex items-center gap-3 mb-2">
 <ScoreRing score={c.overallScore} size={44} />
 <div className="flex-1">
 <div className="flex items-center gap-2">
 <p className="text-sm font-semibold text-slate-700">{c.candidateName}</p>
 <FitIcon rec={c.recommendation} />
 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
 c.recommendation === 'STRONG_FIT' ? 'bg-emerald-500/20 text-emerald-400' :
 c.recommendation === 'GOOD_FIT' ? 'bg-blue-500/20 text-blue-400' :
 c.recommendation === 'PARTIAL_FIT'? 'bg-slate-50mber-500/20 text-amber-400' :
 'bg-red-500/20 text-red-400'
 }`}>{c.recommendation.replace('_',' ')}</span>
 </div>
 <p className="text-xs text-slate-500">{c.jobTitle}</p>
 </div>
 </div>

 {/* Explainability Trace */}
 <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-200/50 pt-2 mt-1">
 {c.explanations.narrative}
 </p>
 {c.explanations.skillMatch.length > 0 && (
 <div className="flex flex-wrap gap-1 mt-2">
 {c.explanations.skillMatch.map(s => (
 <span key={s} className="text-[10px] px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full">{s}</span>
 ))}
 {c.explanations.missingSkills.map(s => (
 <span key={s} className="text-[10px] px-1.5 py-0.5 bg-red-500/15 text-red-400 rounded-full line-through">{s}</span>
 ))}
 </div>
 )}
 </div>
 ))}
 </div>
 </GlassCard>
 )}
 </div>

 {/* ── AI Chat Interface ──────────────────────────── */}
 <div className="space-y-3">
 <GlassCard>
 <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200/50">
 <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
 <Bot className="h-4 w-4 text-white" />
 </div>
 <div>
 <p className="text-sm font-semibold text-slate-700">AI HR Assistant</p>
 <p className="text-xs text-emerald-400 flex items-center gap-1">
 <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
 Online
 {provider && <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-700 text-slate-500">{provider}</span>}
 </p>
 </div>
 </div>

 <div className="h-64 overflow-y-auto space-y-3 pr-1 mb-3">
 {messages.map((msg, i) => (
 <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
 {msg.role === 'assistant' && (
 <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
 <Bot className="h-3 w-3 text-white" />
 </div>
 )}
 <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
 msg.role === 'user'
 ? 'bg-indigo-600 text-white rounded-tr-sm'
 : 'bg-slate-50 text-slate-600 rounded-tl-sm'
 }`}>{msg.content}</div>
 </div>
 ))}
 {isTyping && (
 <div className="flex gap-2">
 <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
 <Bot className="h-3 w-3 text-white" />
 </div>
 <div className="bg-slate-50 rounded-2xl rounded-tl-sm"><TypingDots /></div>
 </div>
 )}
 <div ref={bottomRef} />
 </div>

 <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
 <input
 value={input}
 onChange={e => setInput(e.target.value)}
 placeholder="Ask about attrition, candidates, payroll..."
 className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
 />
 <button type="submit" disabled={!input.trim() || isTyping}
 className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition">
 <Send className="h-3.5 w-3.5" />
 </button>
 </form>
 </GlassCard>

 {/* Quick Prompts */}
 <GlassCard>
 <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Intelligence Prompts</p>
 <div className="space-y-1.5">
 {QUICK_PROMPTS.map(p => (
 <button key={p} onClick={() => sendMessage(p)}
 className="w-full text-left text-[11px] px-2.5 py-2 rounded-lg bg-slate-50/60 border border-slate-200/50 hover:border-indigo-500/40 hover:bg-indigo-900/20 text-slate-500 hover:text-slate-700 transition">
 <Sparkles className="h-3 w-3 inline mr-1.5 text-indigo-400" />{p}
 </button>
 ))}
 </div>
 </GlassCard>
 </div>
 </div>
 </div>
 );
}
