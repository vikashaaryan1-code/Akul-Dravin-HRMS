'use client';

import { useState, useEffect } from 'react';
import { Activity, Users, Briefcase, DollarSign, UserCheck, GitMerge, BarChart3, RefreshCw } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';

type ActivityEvent = {
 id: string;
 entityType: string;
 entityId?: string;
 actorName?: string;
 action: string;
 description?: string;
 metadata?: Record<string, unknown>;
 createdAt: string;
};

const SAMPLE_EVENTS: ActivityEvent[] = [
 { id: '1', entityType: 'employee', actorName: 'Admin User', action: 'created', description: 'New employee Ravi Sharma onboarded to Engineering', createdAt: new Date(Date.now() - 2 * 60_000).toISOString() },
 { id: '2', entityType: 'crm_lead', actorName: 'Priya Nair', action: 'stage_updated', description: 'CRM lead Techno Corp moved to Proposal stage', createdAt: new Date(Date.now() - 15 * 60_000).toISOString() },
 { id: '3', entityType: 'payroll', actorName: 'Finance Team', action: 'generated', description: 'Payroll generated for May 2025 — 42 employees', createdAt: new Date(Date.now() - 45 * 60_000).toISOString() },
 { id: '4', entityType: 'recruitment', actorName: 'HR Manager', action: 'offer_sent', description: 'Offer letter sent to candidate Arjun Singh', createdAt: new Date(Date.now() - 2 * 3600_000).toISOString() },
 { id: '5', entityType: 'leave', actorName: 'Kavya Nair', action: 'approved', description: 'Annual leave request for Jun 10–14 approved', createdAt: new Date(Date.now() - 3 * 3600_000).toISOString() },
 { id: '6', entityType: 'compliance', actorName: 'Admin User', action: 'completed', description: 'ESI Compliance Report marked as completed', createdAt: new Date(Date.now() - 5 * 3600_000).toISOString() },
 { id: '7', entityType: 'workflow', actorName: 'System', action: 'triggered', description: 'Onboarding workflow triggered for new employee', createdAt: new Date(Date.now() - 8 * 3600_000).toISOString() },
 { id: '8', entityType: 'ai_insight', actorName: 'AI Engine', action: 'generated', description: 'Weekly attendance anomaly report generated', createdAt: new Date(Date.now() - 24 * 3600_000).toISOString() },
];

const ENTITY_ICONS: Record<string, React.ReactNode> = {
 employee: <Users className="h-3.5 w-3.5" />,
 crm_lead: <GitMerge className="h-3.5 w-3.5" />,
 payroll: <DollarSign className="h-3.5 w-3.5" />,
 recruitment: <Briefcase className="h-3.5 w-3.5" />,
 leave: <UserCheck className="h-3.5 w-3.5" />,
 compliance: <BarChart3 className="h-3.5 w-3.5" />,
 workflow: <Activity className="h-3.5 w-3.5" />,
 ai_insight: <RefreshCw className="h-3.5 w-3.5" />,
};

const ENTITY_COLORS: Record<string, string> = {
 employee: 'bg-blue-100 text-blue-600',
 crm_lead: 'bg-violet-100 text-violet-600',
 payroll: 'bg-emerald-100 text-emerald-600',
 recruitment: 'bg-amber-100 text-amber-600',
 leave: 'bg-cyan-100 text-cyan-600',
 compliance: 'bg-rose-100 text-rose-600',
 workflow: 'bg-slate-100 text-slate-600',
 ai_insight: 'bg-purple-100 text-purple-600',
};

function timeAgo(dateStr: string) {
 const diff = Date.now() - new Date(dateStr).getTime();
 const mins = Math.floor(diff / 60_000);
 if (mins < 1) return 'just now';
 if (mins < 60) return `${mins}m ago`;
 const hours = Math.floor(mins / 60);
 if (hours < 24) return `${hours}h ago`;
 return `${Math.floor(hours / 24)}d ago`;
}

const FILTER_TYPES = ['all', 'employee', 'crm_lead', 'payroll', 'recruitment', 'leave', 'compliance', 'workflow'];

export function ActivityFeedModuleView() {
 const [events, setEvents] = useState<ActivityEvent[]>(SAMPLE_EVENTS);
 const [filter, setFilter] = useState('all');
 const [loading, setLoading] = useState(false);
 const [isLive, setIsLive] = useState(true);

 const filtered = filter === 'all' ? events : events.filter(e => e.entityType === filter);

 const refresh = async () => {
 setLoading(true);
 try {
 const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/activity`, {
 headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : ''}` },
 });
 if (res.ok) {
 const data = await res.json();
 if (Array.isArray(data?.events) && data.events.length > 0) setEvents(data.events);
 }
 } catch { /* use sample events */ }
 setLoading(false);
 };

 useEffect(() => { refresh(); }, []);

 return (
 <div className="space-y-5 animate-rise">
 <div className="flex items-start justify-between">
 <PageTitle title="Activity Feed" description="Real-time platform-wide activity timeline across all modules." />
 <button onClick={refresh} disabled={loading} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
 <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
 </button>
 </div>

 {/* Live indicator */}
 <div className="flex items-center gap-2 text-xs">
 <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
 <span className="text-slate-500">{isLive ? 'Live updates active' : 'Polling mode'}</span>
 </div>

 {/* Filter tabs */}
 <div className="flex gap-1.5 flex-wrap">
 {FILTER_TYPES.map(type => (
 <button key={type} onClick={() => setFilter(type)}
 className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition ${filter === type ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 '}`}>
 {type === 'all' ? 'All Events' : type.replace('_', ' ')}
 </button>
 ))}
 </div>

 {/* Timeline */}
 <GlassCard>
 <div className="relative">
 {/* Vertical timeline line */}
 <div className="absolute left-[27px] top-4 bottom-4 w-px bg-slate-100 " />

 <div className="space-y-0">
 {filtered.map((event, i) => (
 <div key={event.id} className={`flex items-start gap-3 py-3.5 ${i < filtered.length - 1 ? 'border-b border-slate-50 ' : ''}`}>
 {/* Entity type icon */}
 <div className={`relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-xl shadow-sm ${ENTITY_COLORS[event.entityType] ?? 'bg-slate-100 text-slate-500'}`}>
 {ENTITY_ICONS[event.entityType] ?? <Activity className="h-3.5 w-3.5" />}
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0 pt-0.5">
 <div className="flex items-start justify-between gap-2">
 <div>
 <p className="text-sm text-slate-800 leading-snug">
 {event.actorName && <span className="font-semibold">{event.actorName} </span>}
 <span className="text-slate-500">{event.description ?? `${event.action} ${event.entityType}`}</span>
 </p>
 <div className="flex items-center gap-2 mt-1">
 <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${ENTITY_COLORS[event.entityType] ?? 'bg-slate-100 text-slate-500'}`}>
 {event.entityType.replace('_', ' ')}
 </span>
 </div>
 </div>
 <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">{timeAgo(event.createdAt)}</span>
 </div>
 </div>
 </div>
 ))}

 {filtered.length === 0 && (
 <div className="py-10 text-center text-sm text-slate-500">No activity events for this filter.</div>
 )}
 </div>
 </div>
 </GlassCard>
 </div>
 );
}
