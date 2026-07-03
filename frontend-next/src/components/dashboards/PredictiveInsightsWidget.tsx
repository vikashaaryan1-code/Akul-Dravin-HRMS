'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { GlassCard } from '@/components/system';
import { useApiResource } from '@/hooks/useApiResource';
import { platformApi } from '@/services/api/platform-api';

export function PredictiveInsightsWidget() {
 const { data, loading, error } = useApiResource<any>({
 loader: async () => platformApi.getPredictiveInsights(),
 fallback: null,
 });

 if (loading || !data) {
 return (
 <GlassCard className="p-5 h-full animate-pulse border-ember/20 bg-ember/5 flex flex-col justify-center gap-3">
 <div className="h-4 w-32 bg-ember/20 rounded"></div>
 <div className="h-10 bg-ember/10 rounded"></div>
 </GlassCard>
 );
 }

 return (
 <GlassCard className="p-5 h-full flex flex-col justify-between border-ember/20 bg-ember/5 overflow-hidden relative group">
 {/* Background glow */}
 <div className="absolute -top-10 -right-10 w-32 h-32 bg-ember/20 rounded-full blur-3xl group-hover:bg-ember/30 transition-colors" />

 <div className="relative z-10 flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <div className="h-8 w-8 rounded-lg bg-ember/20 flex items-center justify-center">
 <BrainCircuit className="h-4 w-4 text-ember animate-pulse" />
 </div>
 <div>
 <p className="text-[10px] font-black text-ember uppercase tracking-wider">AI Copilot</p>
 <p className="text-sm font-bold text-navy">Predictive Intelligence</p>
 </div>
 </div>
 </div>

 <div className="relative z-10 space-y-4">
 {/* Attrition Risk */}
 <div className="flex items-start gap-3">
 <AlertTriangle className="h-4 w-4 text-gold shrink-0 mt-0.5" />
 <div>
 <p className="text-xs font-bold text-slate-600">Attrition Alert</p>
 <p className="text-[10px] text-slate-500">
 <span className="text-ember font-bold">{data.attritionRisk.score}% risk</span> detected in <span className="text-white">{data.attritionRisk.department}</span>. Trending {data.attritionRisk.trend}.
 </p>
 </div>
 </div>

 {/* Skill Gaps */}
 <div className="flex items-start gap-3">
 <TrendingUp className="h-4 w-4 text-aqua shrink-0 mt-0.5" />
 <div>
 <p className="text-xs font-bold text-slate-600">Workforce Gap</p>
 <p className="text-[10px] text-slate-500">
 Missing <span className="text-navy font-bold">{data.skillGaps[0].missingIn} experts</span> in {data.skillGaps[0].skill} (Impact: {data.skillGaps[0].impact}).
 </p>
 </div>
 </div>

 {/* Recommendation */}
 <div className="mt-4 p-3 rounded-xl border border-ember/30 bg-ember/10 flex items-start gap-2">
 <Lightbulb className="h-4 w-4 text-ember shrink-0 mt-0.5" />
 <p className="text-[10px] font-medium text-ember leading-relaxed">
 {data.recommendation}
 </p>
 </div>
 </div>
 </GlassCard>
 );
}
