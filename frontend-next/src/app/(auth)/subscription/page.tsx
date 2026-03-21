'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

const plans = [
  {
    name: 'Startup',
    price: '$59',
    period: 'month',
    description: 'For teams digitizing attendance, tasks, and core HR operations quickly.',
    features: ['Up to 75 employees', 'Attendance + Task Tracking', 'Employee Dashboard', 'Email + Chat Support'],
    cta: 'Start 15-Day Free Trial',
    featured: false,
  },
  {
    name: 'Professional',
    price: '$179',
    period: 'month',
    description: 'For growing organizations automating payroll, performance, and manager governance.',
    features: ['Up to 300 employees', 'Performance + Location Tracking', 'Payroll + Commission Sync', 'RBAC Controls'],
    cta: 'Start 15-Day Free Trial',
    featured: true,
  },
  {
    name: 'Business',
    price: '$449',
    period: 'month',
    description: 'For multi-team businesses requiring advanced analytics and workflow orchestration.',
    features: ['Up to 1500 employees', '200+ Workflow Automations', 'AI Workforce Intelligence', 'Priority Success Manager'],
    cta: 'Start 15-Day Free Trial',
    featured: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For global enterprises with multi-company architecture and strict compliance requirements.',
    features: ['Unlimited employees', 'Custom RBAC + SSO + SCIM', 'Dedicated support team', 'Security + SLA controls'],
    cta: 'Contact Sales',
    featured: false,
  },
];

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            ← Back to Home
          </Link>
          <h1 className="mt-6 text-4xl font-bold text-slate-900 sm:text-5xl">Choose Your Plan</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Start with a 15-day free trial. No credit card required. Cancel anytime.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            15-Day Free Trial on All Plans
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl border p-8 shadow-lg transition hover:shadow-xl ${
                plan.featured
                  ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-white ring-2 ring-amber-500'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-ember to-amber px-4 py-1 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  {plan.period && <span className="text-slate-600">/ {plan.period}</span>}
                </div>
                <p className="mt-4 text-sm text-slate-600">{plan.description}</p>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`mt-8 block w-full rounded-full py-3 text-center text-sm font-semibold transition ${
                  plan.featured
                    ? 'bg-gradient-to-r from-ember to-amber text-white shadow-lg hover:opacity-90'
                    : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                {plan.cta}
              </Link>

              {plan.name !== 'Enterprise' && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  Then {plan.price}/{plan.period} after trial
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <h3 className="text-xl font-bold text-slate-900">What's included in the 15-day free trial?</h3>
          <div className="mx-auto mt-6 grid max-w-4xl gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
              <p className="mt-2 text-sm font-semibold text-slate-900">Full Feature Access</p>
              <p className="mt-1 text-xs text-slate-600">Access all features of your chosen plan</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
              <p className="mt-2 text-sm font-semibold text-slate-900">No Credit Card</p>
              <p className="mt-1 text-xs text-slate-600">Start without payment information</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
              <p className="mt-2 text-sm font-semibold text-slate-900">Cancel Anytime</p>
              <p className="mt-1 text-xs text-slate-600">No commitment, cancel before trial ends</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            Need help choosing?{' '}
            <Link href="/#contact" className="font-semibold text-ember hover:text-amber">
              Contact our sales team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
