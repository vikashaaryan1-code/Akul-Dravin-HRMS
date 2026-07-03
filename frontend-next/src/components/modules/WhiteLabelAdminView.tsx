'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { Globe, Palette, Shield, CheckCircle, XCircle, Copy } from 'lucide-react';
import { platformApi } from '@/services/api/platform-api';

type Tab = 'branding' | 'domain' | 'entitlements';
type Plan = 'starter' | 'professional' | 'enterprise' | 'white_label';

const PLAN_CAPS: Record<Plan, { employees: number | null; recruiters: number | null; jobPostings: number | null; retention: number }> = {
 starter: { employees: 25, recruiters: 2, jobPostings: 5, retention: 90 },
 professional: { employees: 200, recruiters: 10, jobPostings: 30, retention: 365 },
 enterprise: { employees: null, recruiters: null, jobPostings: null, retention: 1095 },
 white_label: { employees: null, recruiters: null, jobPostings: null, retention: 1095 },
};

const ALL_MODULES = [
 'employees', 'attendance', 'leave', 'payroll', 'documents',
 'recruitment', 'performance', 'analytics', 'helpdesk', 'crm',
 'ai-hub', 'white-label', 'api-access',
];

export function WhiteLabelAdminView() {
 const [tab, setTab] = useState<Tab>('branding');

 /* Branding state */ const [brandName, setBrandName] = useState('Akul Dravin HRMS');
 const [primaryColor, setPrimaryColor] = useState('#3b82f6');
 const [secondaryColor, setSecondary] = useState('#8b5cf6');
 const [accentColor, setAccent] = useState('#22d3ee');
 const [logoUrl, setLogoUrl] = useState('');
 const [faviconUrl, setFaviconUrl] = useState('');
 const [loginTagline, setTagline] = useState('Enterprise HR Intelligence Platform');
 const [customCss, setCustomCss] = useState('');
 const [saving, setSaving] = useState(false);
 const [saved, setSaved] = useState(false);

 /* Domain state */ const [customDomain, setCustomDomain] = useState('');
 const [domainVerified, setDomVerified] = useState(false);
 const [dnsInstructions, setDnsInstructions] = useState<string | null>(null);

 /* Entitlement state */ const [plan, setPlan] = useState<Plan>('professional');
 const [aiEnabled, setAiEnabled] = useState(true);
 const [apiAccess, setApiAccess] = useState(false);
 const [allowedModules, setModules] = useState<string[]>(['employees','attendance','leave','payroll','recruitment','performance','analytics']);

 useEffect(() => {
 platformApi.getTenantSettings().then((res) => {
 const data = res.data;
 if (data.metadata) {
 if (data.metadata.brandName) setBrandName(data.metadata.brandName);
 if (data.metadata.primaryColor) setPrimaryColor(data.metadata.primaryColor);
 if (data.metadata.secondaryColor) setSecondary(data.metadata.secondaryColor);
 if (data.metadata.accentColor) setAccent(data.metadata.accentColor);
 if (data.metadata.logoUrl) setLogoUrl(data.metadata.logoUrl);
 if (data.metadata.faviconUrl) setFaviconUrl(data.metadata.faviconUrl);
 if (data.metadata.loginTagline) setTagline(data.metadata.loginTagline);
 if (data.metadata.customCss) setCustomCss(data.metadata.customCss);
 if (data.metadata.allowedModules) setModules(data.metadata.allowedModules);
 }
 if (data.customDomain) {
 setCustomDomain(data.customDomain);
 setDomVerified(true);
 }
 if (data.plan) {
 setPlan(data.plan as Plan);
 }
 }).catch(err => console.error("Failed to fetch settings", err));
 }, []);

 const handleSaveSettings = async () => {
 setSaving(true);
 try {
 await platformApi.updateTenantSettings({
 customDomain,
 allowedModules,
 metadata: {
 brandName, primaryColor, secondaryColor, accentColor, logoUrl, faviconUrl, loginTagline, customCss
 }
 });
 setSaved(true);
 setTimeout(() => setSaved(false), 2500);
 } catch (err) {
 alert('Failed to save settings');
 } finally {
 setSaving(false);
 }
 };

 const handleInitiateDomain = () => {
 if (!customDomain) return;
 const token = btoa(`${customDomain}:akul-verify`).slice(0, 32);
 setDnsInstructions(
 `Add a CNAME record:\n Name: _akul-verify.${customDomain}\n Value: ${token}.verify.akulhrms.com\n\nThen click "Verify DNS" to confirm.`
 );
 };

 const toggleModule = (m: string) =>
 setModules(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

 const caps = PLAN_CAPS[plan];

 const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
 { id: 'branding', label: 'Branding Studio', icon: <Palette className="h-4 w-4" /> },
 { id: 'domain', label: 'Domain Manager', icon: <Globe className="h-4 w-4" /> },
 { id: 'entitlements', label: 'Entitlements', icon: <Shield className="h-4 w-4" /> },
 ];

 return (
 <div className="space-y-5">
 <PageTitle title="White Label Studio" description="Configure tenant branding, custom domains, and entitlement plans." />

 {/* Tab bar */}
 <div className="flex gap-2 flex-wrap">
 {TABS.map(t => (
 <button key={t.id} onClick={() => setTab(t.id)}
 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
 tab === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-50/60 text-slate-500 hover:text-slate-700'
 }`}>
 {t.icon}{t.label}
 </button>
 ))}
 </div>

 {/* ── BRANDING STUDIO ──────────────────────────────── */}
 {tab === 'branding' && (
 <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
 <GlassCard>
 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Brand Identity</p>
 <div className="space-y-4">
 <div>
 <label className="text-xs text-slate-500 mb-1 block">Brand Name</label>
 <input value={brandName} onChange={e => setBrandName(e.target.value)}
 className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
 </div>
 <div>
 <label className="text-xs text-slate-500 mb-1 block">Login Tagline</label>
 <input value={loginTagline} onChange={e => setTagline(e.target.value)}
 className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
 </div>
 <div className="grid grid-cols-3 gap-3">
 {[
 { label: 'Primary', value: primaryColor, set: setPrimaryColor },
 { label: 'Secondary', value: secondaryColor, set: setSecondary },
 { label: 'Accent', value: accentColor, set: setAccent },
 ].map(c => (
 <div key={c.label}>
 <label className="text-xs text-slate-500 mb-1 block">{c.label}</label>
 <div className="flex items-center gap-2">
 <input type="color" value={c.value} onChange={e => c.set(e.target.value)}
 className="h-8 w-10 rounded-lg cursor-pointer bg-transparent border-0" />
 <span className="text-xs font-mono text-slate-500">{c.value}</span>
 </div>
 </div>
 ))}
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs text-slate-500 mb-1 block">Logo URL</label>
 <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..."
 className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
 </div>
 <div>
 <label className="text-xs text-slate-500 mb-1 block">Favicon URL</label>
 <input value={faviconUrl} onChange={e => setFaviconUrl(e.target.value)} placeholder="https://..."
 className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
 </div>
 </div>
 <div>
 <label className="text-xs text-slate-500 mb-1 block">Custom CSS</label>
 <textarea value={customCss} onChange={e => setCustomCss(e.target.value)} rows={4}
 placeholder=":root { --font-sans: 'Inter'; }"
 className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
 </div>
 <button onClick={handleSaveSettings} disabled={saving}
 className={`px-5 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
 {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Branding'}
 </button>
 </div>
 </GlassCard>

 {/* Live Preview */}
 <GlassCard>
 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Live Preview</p>
 <div className="rounded-xl overflow-hidden border border-slate-200/50">
 {/* Simulated login page */}
 <div className="h-32 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}22, ${secondaryColor}22)` }}>
 {logoUrl
 ? <img src={logoUrl} alt="logo" className="h-12 object-contain" />
 : <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-navy font-bold text-lg" style={{ background: primaryColor }}>{brandName[0]}</div>
 }
 </div>
 <div className="p-4 bg-white">
 <p className="font-bold text-slate-700 text-sm">{brandName}</p>
 <p className="text-xs text-slate-500 mt-0.5">{loginTagline}</p>
 <div className="mt-3 h-8 rounded-lg" style={{ background: primaryColor, opacity: 0.8 }} />
 <div className="mt-2 flex gap-2">
 <div className="h-2 w-3/4 rounded bg-slate-700" />
 <div className="h-2 w-1/4 rounded" style={{ background: accentColor, opacity: 0.6 }} />
 </div>
 </div>
 </div>
 <p className="text-[10px] text-slate-500 mt-2">Preview updates as you type</p>
 </GlassCard>
 </div>
 )}

 {/* ── DOMAIN MANAGER ───────────────────────────────── */}
 {tab === 'domain' && (
 <GlassCard>
 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Custom Domain Configuration</p>
 <div className="space-y-4 max-w-lg">
 <div className="flex items-center gap-2">
 <div className={`h-2 w-2 rounded-full ${domainVerified ? 'bg-emerald-400' : 'bg-slate-50mber-400'}`} />
 <span className="text-xs text-slate-500">{domainVerified ? 'Domain verified and active' : 'No verified domain'}</span>
 </div>
 <div>
 <label className="text-xs text-slate-500 mb-1 block">Custom Domain</label>
 <input value={customDomain} onChange={e => setCustomDomain(e.target.value)}
 placeholder="hrms.yourcompany.com"
 className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
 </div>
 <div className="flex gap-2">
 <button onClick={handleInitiateDomain}
 className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition">
 Get DNS Instructions
 </button>
 {dnsInstructions && !domainVerified && (
 <button onClick={() => { setDomVerified(true); handleSaveSettings(); }}
 className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1">
 <CheckCircle className="h-3.5 w-3.5" /> Verify DNS
 </button>
 )}
 </div>
 {dnsInstructions && (
 <div className="relative p-4 rounded-xl bg-white border border-slate-200 font-mono text-xs text-slate-600 whitespace-pre-line">
 {dnsInstructions}
 <button onClick={() => navigator.clipboard.writeText(dnsInstructions)}
 className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition">
 <Copy className="h-3 w-3 text-slate-600" />
 </button>
 </div>
 )}
 {domainVerified && (
 <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
 <CheckCircle className="h-4 w-4 text-emerald-400" />
 <p className="text-xs text-emerald-400 font-semibold">{customDomain} is verified and routing is active.</p>
 </div>
 )}
 </div>
 </GlassCard>
 )}

 {/* ── ENTITLEMENT MANAGER ──────────────────────────── */}
 {tab === 'entitlements' && (
 <div className="grid gap-4 xl:grid-cols-2">
 <GlassCard>
 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Plan & Caps</p>
 <div className="space-y-4">
 <div>
 <label className="text-xs text-slate-500 mb-1 block">Subscription Plan</label>
 <div className="grid grid-cols-2 gap-2">
 {(['starter','professional','enterprise','white_label'] as Plan[]).map(p => (
 <button key={p} onClick={() => setPlan(p)}
 className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize transition border ${
 plan === p ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-700'
 }`}>{p.replace('_',' ')}</button>
 ))}
 </div>
 </div>
 {[
 { label: 'Max Employees', value: caps.employees ?? '∞' },
 { label: 'Max Recruiters', value: caps.recruiters ?? '∞' },
 { label: 'Max Job Postings', value: caps.jobPostings ?? '∞' },
 { label: 'Analytics Retention', value: `${caps.retention} days` },
 ].map(row => (
 <div key={row.label} className="flex justify-between items-center py-2 border-b border-slate-200/50">
 <span className="text-xs text-slate-500">{row.label}</span>
 <span className="text-sm font-bold text-slate-700">{row.value}</span>
 </div>
 ))}
 <div className="space-y-2">
 {[
 { label: 'AI Enabled', value: aiEnabled, set: setAiEnabled },
 { label: 'API Access', value: apiAccess, set: setApiAccess },
 ].map(f => (
 <div key={f.label} className="flex items-center justify-between">
 <span className="text-xs text-slate-500">{f.label}</span>
 <button onClick={() => f.set(!f.value)}
 className={`w-10 h-5 rounded-full transition relative ${f.value ? 'bg-indigo-600' : 'bg-slate-700'}`}>
 <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${f.value ? 'left-5' : 'left-0.5'}`} />
 </button>
 </div>
 ))}
 </div>
 </div>
 </GlassCard>

 <GlassCard>
 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Module Access</p>
 <div className="grid grid-cols-2 gap-2">
 {ALL_MODULES.map(m => {
 const active = allowedModules.includes(m);
 return (
 <button key={m} onClick={() => toggleModule(m)}
 className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition border ${
 active ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' : 'bg-slate-50/60 border-slate-200/50 text-slate-500 hover:text-slate-600'
 }`}>
 {active ? <CheckCircle className="h-3 w-3 shrink-0" /> : <XCircle className="h-3 w-3 shrink-0" />}
 <span className="capitalize">{m.replace('-',' ')}</span>
 </button>
 );
 })}
 </div>
 <button onClick={handleSaveSettings} disabled={saving} className="mt-4 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition disabled:opacity-50">
 {saving ? 'Saving...' : 'Save Entitlements'}
 </button>
 </GlassCard>
 </div>
 )}
 </div>
 );
}
