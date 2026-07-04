'use client';

import { A2zPreview } from '@/lib/a2z-engine';
import { CheckCircle2, Clock, Layers } from 'lucide-react';

interface PreviewPanelProps {
 preview: A2zPreview | null;
 loading: boolean;
}

export function PreviewPanel({ preview, loading }: PreviewPanelProps) {
 if (loading) {
 return (
 <div className="flex animate-pulse items-center justify-center rounded-[2rem] border border-white/10 bg-navy-light/40 p-20">
 <div className="text-sm font-medium text-slate-500">Calculating your Atlas blueprint...</div>
 </div>
 );
 }

 if (!preview) {
 return (
 <div className="flex h-full items-center justify-center rounded-[2rem] border border-white/5 bg-navy-light/20 p-10 text-center">
 <p className="max-w-[200px] text-sm text-slate-500">
 Configure your rollout parameters to see a live implementation blueprint here.
 </p>
 </div>
 );
 }

 return (
 <div className="space-y-6 rounded-[2rem] border border-white/10 bg-navy-light/40 p-8 shadow-2xl backdrop-blur-xl">
 <div className="grid grid-cols-2 gap-4">
 <div className="rounded-2xl bg-white/5 p-4">
 <Layers className="h-5 w-5 text-amber" />
 <p className="mt-3 text-2xl font-bold text-white">{preview.estimatedModules}</p>
 <p className="text-[10px] uppercase tracking-widest text-slate-500">Total Modules</p>
 </div>
 <div className="rounded-2xl bg-white/5 p-4">
 <Clock className="h-5 w-5 text-aqua" />
 <p className="mt-3 text-2xl font-bold text-white">{preview.targetTimeline}</p>
 <p className="text-[10px] uppercase tracking-widest text-slate-500">Est. Timeline</p>
 </div>
 </div>

 <div className="space-y-4">
 <p className="text-[10px] uppercase tracking-widest text-slate-500">Phase Roadmap</p>
 {preview.phases.map((phase, idx) => (
 <div key={idx} className="flex items-center justify-between rounded-xl border border-white/5 bg-navy-light/20 p-4">
 <div className="flex items-center gap-3">
 <CheckCircle2 className={`h-4 w-4 ${phase.status === 'ready' ? 'text-emerald-400' : 'text-slate-600'}`} />
 <span className="text-sm font-medium text-white">{phase.phase}</span>
 </div>
 <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{phase.eta}</span>
 </div>
 ))}
 </div>
 </div>
 );
}
