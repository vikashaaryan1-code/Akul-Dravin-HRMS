'use client';

import { useState } from 'react';
import { CreditCard, Package, Zap, Crown, Check, TrendingUp, Users } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { useBillingSubscriptions } from '@/hooks/useDomainData';

const PLANS = [
  {
    id: 'free', name: 'Free', price: 0, period: 'per month', color: 'from-slate-500 to-slate-600',
    features: ['Employee Records', 'Manual Attendance', 'Leave Management', 'ESS', 'Basic Reports', 'Email Support'],
    icon: <Package className="h-5 w-5" />, seats: 5,
  },
  {
    id: 'hr-lite', name: 'HR Lite', price: 999, period: 'per month', color: 'from-aqua/80 to-aqua',
    features: ['Payroll', 'Mobile App', 'Biometric'],
    icon: <Zap className="h-5 w-5" />, seats: 25,
  },
  {
    id: 'hr-pro', name: 'HR Pro', price: 2499, period: 'per month', color: 'from-gold/80 to-gold',
    features: ['Recruitment', 'Timesheets', 'Helpdesk'],
    icon: <Crown className="h-5 w-5" />, seats: 50, popular: true,
  },
  {
    id: 'hr-payroll', name: 'HR + Payroll', price: 4999, period: 'per month', color: 'from-blue-500 to-blue-600',
    features: ['Compliance', 'Custom Workflows', 'Advanced Analytics'],
    icon: <TrendingUp className="h-5 w-5" />, seats: 100,
  },
  {
    id: 'business', name: 'Business HRMS', price: 9999, period: 'per month', color: 'from-emerald-500 to-emerald-600',
    features: ['Asset Management', 'Performance', 'Multi-Branch'],
    icon: <Users className="h-5 w-5" />, seats: 250,
  },
  {
    id: 'premium', name: 'Premium HRMS', price: 17999, period: 'per month', color: 'from-violet-500 to-violet-600',
    features: ['AI Assistant', 'Dedicated Account Manager', 'API Access'],
    icon: <Crown className="h-5 w-5" />, seats: 500,
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 0, period: 'custom pricing', color: 'from-slate-800 to-slate-900',
    features: ['Custom Development', 'On-Premise Option', 'SLA'],
    icon: <Crown className="h-5 w-5" />, seats: 999,
  },
];

export function PlanCatalogModuleView() {
  const { subscriptions, loading } = useBillingSubscriptions();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const activeSubscription = subscriptions[0] as any;
  const currentPlanId = activeSubscription?.plan ?? 'free';

  const totalRevenue = subscriptions.reduce((s: number, sub: any) => s + Number(sub.amount ?? 0), 0);
  const activeCount = subscriptions.filter((s: any) => s.status === 'active').length;

  return (
    <div className="space-y-6 animate-rise">
      <PageTitle title="Plan Catalog" description="Manage subscription tiers, pricing, and feature access." />

      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Active Subscriptions', value: activeCount || 1, icon: <CreditCard className="h-4 w-4 text-aqua" /> },
          { label: 'Monthly Recurring', value: `₹${((totalRevenue || 2499)).toFixed(0)}`, icon: <TrendingUp className="h-4 w-4 text-jade" /> },
          { label: 'Current Plan', value: currentPlanId.charAt(0).toUpperCase() + currentPlanId.slice(1), icon: <Package className="h-4 w-4 text-gold" /> },
        ].map((s) => (
          <GlassCard key={s.label}>
            <div className="flex items-start justify-between">
              <div><p className="text-xs font-black uppercase tracking-wide text-slate-500">{s.label}</p><p className="mt-2 text-2xl font-black text-navy">{s.value}</p></div>
              <span className="p-2 rounded-xl bg-white/60 shadow-sm border border-slate-200">{s.icon}</span>
            </div>
          </GlassCard>
        ))}
      </section>

      {/* Billing toggle */}
      <div className="flex justify-center my-8">
        <div className="inline-flex items-center gap-1 p-1 rounded-full surface-raised border-subtle">
          {(['monthly', 'annual'] as const).map((b) => (
            <button key={b} onClick={() => setBilling(b)}
              className={`px-5 py-2 rounded-full text-xs font-black tracking-wide uppercase transition-all duration-200 ${billing === b ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}>
              {b} {b === 'annual' && <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] text-jade bg-jade/10 font-black">-20%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {PLANS.map((plan) => {
          const price = billing === 'annual' ? Math.round(plan.price * 0.8) : plan.price;
          const isCurrent = plan.id === currentPlanId;
          return (
            <div key={plan.id} className={`relative flex flex-col rounded-2xl transition-all duration-300 ${plan.popular ? 'glass-holographic scale-[1.02]' : 'glass-3d-panel hover:-translate-y-1'}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-gold to-ember text-white text-[10px] font-black uppercase tracking-wide shadow-gold-sm">
                  Recommended
                </div>
              )}
              <div className={`p-6 rounded-t-2xl bg-gradient-to-br ${plan.color} text-white`}>
                <div className="flex items-center gap-2 mb-2">{plan.icon}<span className="font-black text-lg">{plan.name}</span></div>
                <div className="flex items-baseline gap-1">
                  {plan.price === 0 && plan.id === 'enterprise' ? (
                    <span className="text-2xl font-black">Custom</span>
                  ) : (
                    <><span className="text-3xl font-black">{plan.price === 0 ? '₹0' : `₹${price.toLocaleString()}`}</span><span className="text-sm font-bold opacity-80">/{plan.period}</span></>
                  )}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col bg-white/60">
                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.popular ? 'text-gold' : 'text-jade'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-xl text-sm font-black uppercase tracking-wide transition-all duration-200 ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-inner'
                      : plan.popular
                      ? 'bg-gradient-to-r from-gold to-ember text-white shadow-gold-sm hover:shadow-gold-md hover:scale-[1.02]'
                      : 'border border-slate-200 text-navy bg-white hover:bg-slate-50 hover:shadow-sm hover:-translate-y-0.5'
                  }`}
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Current Plan' : plan.id === 'enterprise' ? 'Contact Sales' : 'Upgrade Now'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
