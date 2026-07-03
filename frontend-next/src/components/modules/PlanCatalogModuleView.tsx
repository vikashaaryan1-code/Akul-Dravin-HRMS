'use client';

import { useState } from 'react';
import { CreditCard, Package, Zap, Crown, Check, TrendingUp, Users } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { useBillingSubscriptions } from '@/hooks/useDomainData';

const PLANS = [
 {
 id: 'starter', name: 'Starter', price: 999, period: 'per seat/month', color: 'from-slate-500 to-slate-600',
 features: ['Up to 10 employees', 'Core HRMS', 'Payroll processing', 'Leave management', 'Basic reports', 'Email support'],
 icon: <Package className="h-5 w-5" />, seats: 10,
 },
 {
 id: 'growth', name: 'Growth', price: 2499, period: 'per seat/month', color: 'from-blue-500 to-violet-600',
 features: ['Up to 100 employees', 'Everything in Starter', 'CRM & Sales tools', 'Recruitment ATS', 'Advanced analytics', 'Custom workflows', 'Priority support'],
 icon: <Zap className="h-5 w-5" />, seats: 100, popular: true,
 },
 {
 id: 'enterprise', name: 'Enterprise', price: 0, period: 'custom pricing', color: 'from-amber-500 to-orange-600',
 features: ['Unlimited employees', 'Everything in Growth', 'AI Hub (GPT-4)', 'White-label platform', 'Dedicated CSM', 'SLA guarantees', 'Custom integrations', 'On-premise option'],
 icon: <Crown className="h-5 w-5" />, seats: 999,
 },
];

export function PlanCatalogModuleView() {
 const { subscriptions, loading } = useBillingSubscriptions();
 const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

 const activeSubscription = subscriptions[0] as any;
 const currentPlanId = activeSubscription?.plan ?? 'starter';

 const totalRevenue = subscriptions.reduce((s: number, sub: any) => s + Number(sub.amount ?? 0), 0);
 const activeCount = subscriptions.filter((s: any) => s.status === 'active').length;

 return (
 <div className="space-y-6 animate-rise">
 <PageTitle title="Plan Catalog" description="Manage subscription tiers, pricing, and feature access." />

 {/* Stats */}
 <section className="grid gap-3 sm:grid-cols-3">
 {[
 { label: 'Active Subscriptions', value: activeCount || 1, icon: <CreditCard className="h-4 w-4 text-blue-500" /> },
 { label: 'Monthly Recurring', value: `₹${((totalRevenue || 999) / 100).toFixed(0)}`, icon: <TrendingUp className="h-4 w-4 text-emerald-500" /> },
 { label: 'Current Plan', value: currentPlanId.charAt(0).toUpperCase() + currentPlanId.slice(1), icon: <Package className="h-4 w-4 text-violet-500" /> },
 ].map((s) => (
 <GlassCard key={s.label}>
 <div className="flex items-start justify-between">
 <div><p className="text-xs uppercase tracking-[0.1em] text-slate-500">{s.label}</p><p className="mt-2 text-2xl font-bold text-slate-900 ">{s.value}</p></div>
 <span className="p-2 rounded-xl bg-slate-100 ">{s.icon}</span>
 </div>
 </GlassCard>
 ))}
 </section>

 {/* Billing toggle */}
 <div className="flex justify-center">
 <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 text-sm">
 {(['monthly', 'annual'] as const).map((b) => (
 <button key={b} onClick={() => setBilling(b)}
 className={`px-4 py-1.5 rounded-lg font-medium transition capitalize ${billing === b ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
 {b} {b === 'annual' && <span className="ml-1 text-xs text-emerald-500 font-semibold">-20%</span>}
 </button>
 ))}
 </div>
 </div>

 {/* Plan cards */}
 <div className="grid gap-4 md:grid-cols-3">
 {PLANS.map((plan) => {
 const price = billing === 'annual' ? Math.round(plan.price * 0.8) : plan.price;
 const isCurrent = plan.id === currentPlanId;
 return (
 <div key={plan.id} className={`relative rounded-2xl border overflow-hidden transition ${plan.popular ? 'border-blue-500 shadow-holo-lg' : 'border-slate-200 '}`}>
 {plan.popular && (
 <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500" />
 )}
 {plan.popular && (
 <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold">Most Popular</div>
 )}
 <div className={`p-5 bg-gradient-to-br ${plan.color} text-white`}>
 <div className="flex items-center gap-2 mb-2">{plan.icon}<span className="font-bold text-lg">{plan.name}</span></div>
 <div className="flex items-baseline gap-1">
 {plan.price === 0 ? (
 <span className="text-2xl font-bold">Custom</span>
 ) : (
 <><span className="text-2xl font-bold">₹{price.toLocaleString()}</span><span className="text-sm opacity-80">/{plan.period}</span></>
 )}
 </div>
 </div>
 <div className="p-5 bg-white ">
 <ul className="space-y-2.5 mb-5">
 {plan.features.map((f) => (
 <li key={f} className="flex items-center gap-2 text-sm text-slate-600 ">
 <Check className="h-4 w-4 text-emerald-500 shrink-0" />{f}
 </li>
 ))}
 </ul>
 <button
 className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
 isCurrent
 ? 'bg-slate-100 text-slate-500 cursor-default'
 : plan.popular
 ? 'bg-blue-600 text-white hover:bg-blue-700'
 : 'border border-slate-200 text-slate-700 hover:bg-slate-50 '
 }`}
 disabled={isCurrent}
 >
 {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Contact Sales' : 'Upgrade Now'}
 </button>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
}
