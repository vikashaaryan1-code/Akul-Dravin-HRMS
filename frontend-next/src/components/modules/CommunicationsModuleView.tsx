'use client'; import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Check, CheckCheck, Filter, Search, RefreshCw, Mail, MessageSquare, Smartphone, AlertCircle, Info, CheckCircle2, AlertTriangle, Zap, Users, DollarSign, Calendar, FileText, Clock, Settings, ChevronRight, X, BellRing,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { useNotificationStore } from '@/store/notification-store';

/* ── Types ───────────────────────────────────────────────────────────────────── */ 
type NotifChannel = 'all' | 'in-app' | 'email' | 'sms' | 'whatsapp';
type NotifCategory = 'all' | 'leave' | 'payroll' | 'attendance' | 'recruitment' | 'system' | 'approvals';
type NotifSeverity = 'info' | 'success' | 'warning' | 'error' | 'ai'; 

interface Notification { 
 id: string; 
 title: string; 
 body: string; 
 channel: Exclude<NotifChannel, 'all'>; 
 category: Exclude<NotifCategory, 'all'>; 
 severity: NotifSeverity; 
 timestamp: string; 
 read: boolean; 
 actionLabel?: string; 
 actionHref?: string;
} 

/* ── Mock notification data ───────────────────────────────────────────────────── */ 
const MOCK_NOTIFICATIONS: Notification[] = [ { id: 'n-001', title: 'Leave Request Approved', body: 'Your Casual Leave request for Dec 25–26 has been approved by HR Manager Priya Sharma.', channel: 'in-app', category: 'leave', severity: 'success', timestamp: '2 min ago', read: false, actionLabel: 'View Leave', actionHref: '/leave', }, { id: 'n-002', title: 'Payslip Generated for November', body: 'Your November 2024 payslip is ready. Net payable: ₹82,450. Download or view the breakdown.', channel: 'email', category: 'payroll', severity: 'info', timestamp: '1 hr ago', read: false, actionLabel: 'View Payslip', actionHref: '/payroll', }, { id: 'n-003', title: 'Attendance Anomaly Detected', body: 'AI Security Engine flagged unusual check-in from a new IP address (103.xx.xx.12) at 09:14 AM.', channel: 'in-app', category: 'attendance', severity: 'warning', timestamp: '3 hr ago', read: false, actionLabel: 'Review', actionHref: '/attendance', }, { id: 'n-004', title: 'Interview Scheduled: Arjun Verma', body: 'AI auto-scheduled Technical Interview for SDE-III position on Dec 20 at 11:00 AM. Confirm availability.', channel: 'in-app', category: 'recruitment', severity: 'ai', timestamp: '5 hr ago', read: true, actionLabel: 'View Pipeline', actionHref: '/recruitment', }, { id: 'n-005', title: 'Pending Leave Approval', body: 'Rahul Saxena (Engineering) has submitted a Sick Leave request for Dec 19–21. Action required.', channel: 'in-app', category: 'approvals', severity: 'warning', timestamp: '6 hr ago', read: true, actionLabel: 'Approve/Reject', actionHref: '/leave', }, { id: 'n-006', title: 'System Update Completed', body: 'Platform maintenance window completed successfully. All services restored. No data impact.', channel: 'in-app', category: 'system', severity: 'success', timestamp: '1 day ago', read: true, }, { id: 'n-007', title: 'WhatsApp: Payroll Reminder', body: 'Payroll processing begins Dec 28. Submit attendance corrections before Dec 27, 5PM.', channel: 'whatsapp', category: 'payroll', severity: 'info', timestamp: '1 day ago', read: true, }, { id: 'n-008', title: 'AI Insight: Attrition Risk Detected', body: '3 employees in the Sales department show high attrition signals. Schedule 1:1 reviews recommended.', channel: 'in-app', category: 'system', severity: 'ai', timestamp: '2 days ago', read: true, actionLabel: 'View Insights', actionHref: '/dashboard', }, { id: 'n-009', title: 'SMS: Check-In Confirmed', body: 'Your check-in at Akul Dravin HQ has been recorded at 09:02 AM. Have a productive day!', channel: 'sms', category: 'attendance', severity: 'success', timestamp: '2 days ago', read: true, }, { id: 'n-010', title: 'New Candidate Shortlisted', body: 'AI matched Meera Pillai (Score: 88%) for Product Manager role. Review profile and schedule interview.', channel: 'email', category: 'recruitment', severity: 'ai', timestamp: '3 days ago', read: true, actionLabel: 'View Candidate', actionHref: '/recruitment', },
]; 

/* ── Severity config ───────────────────────────────────────────────────────── */ 
const SEVERITY_CONFIG: Record<NotifSeverity, { icon: any; color: string; bg: string; border: string }> = { 
 info: { icon: Info, color: 'text-aqua', bg: 'bg-aqua/10', border: 'border-aqua/20' }, 
 success: { icon: CheckCircle2, color: 'text-jade', bg: 'bg-jade/10', border: 'border-jade/20' }, 
 warning: { icon: AlertTriangle,color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/20' }, 
 error: { icon: AlertCircle, color: 'text-ember', bg: 'bg-ember/10', border: 'border-ember/20' }, 
 ai: { icon: Zap, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
}; 

const CHANNEL_CONFIG: Record<Exclude<NotifChannel, 'all'>, { icon: any; label: string; color: string }> = { 
 'in-app': { icon: Bell, label: 'In-App', color: 'text-aqua' }, 
 'email': { icon: Mail, label: 'Email', color: 'text-gold' }, 
 'sms': { icon: Smartphone, label: 'SMS', color: 'text-jade' }, 
 'whatsapp': { icon: MessageSquare, label: 'WhatsApp', color: 'text-emerald-400' },
}; 

const CATEGORY_ICONS: Record<Exclude<NotifCategory, 'all'>, any> = { 
 leave: Calendar, payroll: DollarSign, attendance: Clock, recruitment: Users, system: Settings, approvals: FileText,
}; 

/* ── Notification Card ────────────────────────────────────────────────────────── */ 
function NotificationCard({ notif, onMarkRead }: { notif: Notification; onMarkRead: (id: string) => void }) { 
 const sev = SEVERITY_CONFIG[notif.severity]; 
 const SevIcon = sev.icon; 
 const ch = CHANNEL_CONFIG[notif.channel]; 
 const ChIcon = ch.icon; 
 const CatIcon = CATEGORY_ICONS[notif.category]; 
 
 return ( 
 <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className={`group relative flex gap-4 rounded-2xl border p-4 transition-all duration-200 ${notif.read ? 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]' : `border ${sev.border} ${sev.bg} hover:brightness-110` }`} > 
 {/* Unread dot */} 
 {!notif.read && ( <span className={`absolute left-3 top-3 h-2 w-2 rounded-full ${sev.bg.replace('/10', '/80')} ring-2 ring-black/20`} /> )} 
 {/* Severity icon */} 
 <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${sev.bg} ${sev.border} border`}> <SevIcon className={`h-5 w-5 ${sev.color}`} /> </div> 
 {/* Content */} 
 <div className="flex-1 min-w-0"> 
 <div className="flex items-start gap-2"> 
 <p className={`text-sm font-semibold leading-snug ${notif.read ? 'text-slate-600' : 'text-white'}`}> {notif.title} </p> 
 <span className={`ml-auto shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-white/5 ${ch.color}`}> <ChIcon className="h-3 w-3"/> {ch.label} </span> 
 </div> 
 <p className="mt-1 text-xs text-slate-500 line-clamp-2">{notif.body}</p> 
 <div className="mt-2 flex items-center gap-3"> 
 <span className="flex items-center gap-1 text-[10px] text-slate-600"> <Clock className="h-3 w-3"/> {notif.timestamp} </span> 
 {(notif.category as string) !== 'all' && ( <span className="flex items-center gap-1 text-[10px] text-slate-600"> <CatIcon className="h-3 w-3"/> {notif.category.charAt(0).toUpperCase() + notif.category.slice(1)} </span> )} 
 {notif.actionLabel && notif.actionHref && ( <a href={notif.actionHref} className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-aqua hover:text-aqua/80 transition-colors"> {notif.actionLabel} <ChevronRight className="h-3 w-3"/> </a> )} 
 {!notif.read && ( <button onClick={() => onMarkRead(notif.id)} className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-jade transition-colors"> <Check className="h-3 w-3"/> Mark read </button> )} 
 </div> 
 </div> 
 </motion.div> 
 );
} 

/* ── Channel Stats ────────────────────────────────────────────────────────────── */ 
const CHANNEL_STATS = [ { label: 'In-App Alerts', count: 6, unread: 3, icon: Bell, color: 'text-aqua', bg: 'bg-aqua/10' }, { label: 'Email', count: 2, unread: 1, icon: Mail, color: 'text-gold', bg: 'bg-gold/10' }, { label: 'WhatsApp', count: 1, unread: 0, icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-400/10' }, { label: 'SMS', count: 1, unread: 0, icon: Smartphone, color: 'text-jade', bg: 'bg-jade/10' },
]; 

/* ── Notification Preferences ───────────────────────────────────────────────── */ 
const PREF_CATEGORIES = [ { label: 'Leave Requests', desc: 'Approvals, rejections, and balance alerts', enabled: true }, { label: 'Payroll Updates', desc: 'Payslip generation, salary changes', enabled: true }, { label: 'Attendance Alerts', desc: 'Check-in/out, anomaly flags', enabled: true }, { label: 'Recruitment', desc: 'Interview schedules, offers, pipeline updates', enabled: true }, { label: 'AI Insights', desc: 'Predictive alerts, workforce recommendations', enabled: true }, { label: 'System Updates', desc: 'Maintenance windows, platform news', enabled: false },
]; 

function PreferencesPanel() { 
 const [prefs, setPrefs] = useState(PREF_CATEGORIES); 
 const toggle = (i: number) => setPrefs((p) => p.map((x, idx) => idx === i ? { ...x, enabled: !x.enabled } : x)); 
 return ( 
 <GlassCard className="p-5"> 
 <h3 className="mb-4 text-sm font-bold text-navy flex items-center gap-2"> <Settings className="h-4 w-4 text-gold"/> Notification Preferences </h3> 
 <div className="space-y-3"> {prefs.map((pref, i) => ( 
 <div key={pref.label} className="flex items-start gap-3"> 
 <button onClick={() => toggle(i)} className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${pref.enabled ? 'bg-gold' : 'bg-white/10'}`} role="switch"aria-checked={pref.enabled} aria-label={`Toggle ${pref.label}`} > 
 <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${pref.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} /> 
 </button> 
 <div> 
 <p className="text-xs font-semibold text-slate-700">{pref.label}</p> 
 <p className="text-[10px] text-slate-500">{pref.desc}</p> 
 </div> 
 </div> ))} 
 </div> 
 </GlassCard> 
 );
} 

/* ── Main Component ───────────────────────────────────────────────────────────── */ 
export function CommunicationsModuleView() { 
 const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS); 
 const [activeChannel, setActiveChannel] = useState<NotifChannel>('all'); 
 const [activeCategory, setActiveCategory] = useState<NotifCategory>('all'); 
 const [search, setSearch] = useState(''); 
 const [showUnreadOnly, setShowUnreadOnly] = useState(false); 
 const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]); 
 
 const filtered = useMemo(() => { 
 return notifications.filter((n) => { 
 if (activeChannel !== 'all' && n.channel !== activeChannel) return false; 
 if (activeCategory !== 'all' && n.category !== activeCategory) return false; 
 if (showUnreadOnly && n.read) return false; 
 if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.body.toLowerCase().includes(search.toLowerCase())) return false; 
 return true; 
 }); 
 }, [notifications, activeChannel, activeCategory, showUnreadOnly, search]); 
 
 const markRead = (id: string) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n)); 
 const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))); 
 const channels: NotifChannel[] = ['all', 'in-app', 'email', 'sms', 'whatsapp']; 
 const categories: NotifCategory[] = ['all', 'leave', 'payroll', 'attendance', 'recruitment', 'approvals', 'system']; 
 
 return ( 
 <div className="space-y-6"> 
 <PageTitle title="Communications Hub" description="All notifications, alerts, and messages in one place" /> 
 {/* Channel Stats */} 
 <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"> {CHANNEL_STATS.map((stat) => { const Icon = stat.icon; return ( 
 <GlassCard key={stat.label} className="p-4"> 
 <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg}`}> <Icon className={`h-5 w-5 ${stat.color}`} /> </div> 
 <p className="text-xl font-bold text-navy">{stat.count}</p> 
 <p className="text-xs text-slate-500">{stat.label}</p> 
 {stat.unread > 0 && ( <span className="mt-1 inline-flex rounded-full bg-ember/20 px-2 py-0.5 text-[10px] font-semibold text-ember"> {stat.unread} unread </span> )} 
 </GlassCard> ); })} 
 </div> 
 <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"> 
 {/* Notification Feed */} 
 <div className="lg:col-span-2 space-y-4"> 
 {/* Controls */} 
 <GlassCard className="p-4"> 
 <div className="flex flex-wrap items-center gap-3"> 
 {/* Search */} 
 <div className="relative flex-1 min-w-[180px]"> 
 <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"/> 
 <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notifications…"className="w-full rounded-xl bg-white/5 border border-white/8 pl-9 pr-3 py-2 text-xs text-slate-700 placeholder:text-slate-600 focus:outline-none focus:border-gold/40"/> 
 </div> 
 {/* Unread filter */} 
 <button onClick={() => setShowUnreadOnly(!showUnreadOnly)} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${showUnreadOnly ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-white/5 text-slate-500 border border-white/8 hover:text-white'}`} > <Bell className="h-3.5 w-3.5"/> Unread only </button> 
 {/* Mark all read */} 
 {unreadCount > 0 && ( <button onClick={markAllRead} className="flex items-center gap-1.5 rounded-xl bg-jade/10 border border-jade/20 px-3 py-2 text-xs font-medium text-jade hover:bg-jade/20 transition-colors"> <CheckCheck className="h-3.5 w-3.5"/> Mark all read </button> )} 
 </div> 
 {/* Channel tabs */} 
 <div className="mt-3 flex flex-wrap gap-1.5"> {channels.map((ch) => ( 
 <button key={ch} onClick={() => setActiveChannel(ch)} className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors capitalize ${activeChannel === ch ? 'bg-gold text-void' : 'bg-white/5 text-slate-500 hover:text-white border border-white/8'}`} > {ch === 'all' ? 'All Channels' : ch === 'in-app' ? 'In-App' : ch} </button> ))} 
 </div> 
 {/* Category tabs */} 
 <div className="mt-2 flex flex-wrap gap-1.5"> {categories.map((cat) => { const CatIcon = cat !== 'all' ? CATEGORY_ICONS[cat] : Filter; return ( 
 <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors capitalize ${activeCategory === cat ? 'bg-aqua/20 text-aqua border border-aqua/30' : 'bg-white/5 text-slate-500 hover:text-white border border-white/8'}`} > <CatIcon className="h-3 w-3"/> {cat === 'all' ? 'All Types' : cat} </button> ); })} 
 </div> 
 </GlassCard> 
 {/* Notification list */} 
 <div className="space-y-2"> 
 <AnimatePresence> {filtered.length === 0 ? ( 
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] py-16 text-center"> 
 <BellOff className="mb-3 h-10 w-10 text-slate-700"/> 
 <p className="text-sm font-semibold text-slate-500">No notifications found</p> 
 <p className="mt-1 text-xs text-slate-600">Try adjusting filters or check back later</p> 
 </motion.div> ) : ( filtered.map((notif) => ( <NotificationCard key={notif.id} notif={notif} onMarkRead={markRead} /> )) )} 
 </AnimatePresence> 
 </div> 
 </div> 
 {/* Sidebar */} 
 <div className="space-y-4"> 
 <PreferencesPanel /> 
 {/* Quick summary */} 
 <GlassCard className="p-5"> 
 <h3 className="mb-4 text-sm font-bold text-navy flex items-center gap-2"> <Info className="h-4 w-4 text-aqua"/> Notification Summary </h3> 
 <div className="space-y-2"> {(['leave', 'payroll', 'attendance', 'recruitment', 'system', 'approvals'] as const).map((cat) => { const count = notifications.filter((n) => n.category === cat).length; const unread = notifications.filter((n) => n.category === cat && !n.read).length; const CatIcon = CATEGORY_ICONS[cat]; return ( 
 <button key={cat} onClick={() => setActiveCategory(cat)} className="flex w-full items-center justify-between rounded-xl px-3 py-2 hover:bg-white/5 transition-colors"> 
 <span className="flex items-center gap-2 text-xs text-slate-500 capitalize"> <CatIcon className="h-3.5 w-3.5"/> {cat} </span> 
 <span className="flex items-center gap-1.5"> 
 <span className="text-xs font-semibold text-slate-600">{count}</span> 
 {unread > 0 && ( <span className="rounded-full bg-ember/20 px-1.5 py-0.5 text-[10px] font-bold text-ember"> {unread} </span> )} 
 </span> 
 </button> ); })} 
 </div> 
 </GlassCard> 
 </div> 
 </div> 
 </div> 
 );
}
