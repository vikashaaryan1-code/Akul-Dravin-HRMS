'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Calendar, Users, Briefcase, Check } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';

const plans = [
  { id: 'starter', name: 'Starter', price: 999, employees: 50, jobs: 10, features: ['Basic HRMS', 'Attendance', 'Leave Management'] },
  { id: 'professional', name: 'Professional', price: 2999, employees: 200, jobs: 50, features: ['All Starter', 'Payroll', 'Performance', 'Recruitment ATS'] },
  { id: 'enterprise', name: 'Enterprise', price: 9999, employees: 1000, jobs: 200, features: ['All Professional', 'AI Matching', 'White Label', 'API Access'] },
];

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    const res = await fetch(`${API_BASE}/subscriptions`);
    const data = await res.json();
    setSubscriptions(data);
  };

  const handleSubscribe = async (plan: any) => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await fetch(`${API_BASE}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: 'current-company-id',
        planId: plan.id,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        amount: plan.price,
        billingCycle: 'monthly',
        employeeLimit: plan.employees,
        jobPostLimit: plan.jobs,
      }),
    });
    setShowModal(false);
    fetchSubscriptions();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-ink">Subscription Plans</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:shadow-lg transition">
            <h3 className="text-2xl font-bold text-ink mb-2">{plan.name}</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-aqua">₹{plan.price}</span>
              <span className="text-ink/60">/month</span>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-ink/60">
                <Users className="w-4 h-4" />
                Up to {plan.employees} employees
              </div>
              <div className="flex items-center gap-2 text-sm text-ink/60">
                <Briefcase className="w-4 h-4" />
                {plan.jobs} job posts/month
              </div>
            </div>
            <div className="space-y-2 mb-6">
              {plan.features.map(feature => (
                <div key={feature} className="flex items-center gap-2 text-sm text-ink">
                  <Check className="w-4 h-4 text-green-600" />
                  {feature}
                </div>
              ))}
            </div>
            <button onClick={() => { setSelectedPlan(plan); setShowModal(true); }} className="w-full py-2 bg-aqua text-white rounded-lg">
              Subscribe
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-ink mb-4">Active Subscriptions</h2>
        <table className="w-full">
          <thead className="bg-ink/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {subscriptions.map((sub: any) => (
              <tr key={sub.id}>
                <td className="px-6 py-4 text-sm text-ink">{sub.planId}</td>
                <td className="px-6 py-4 text-sm text-ink">{new Date(sub.startDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-ink">{new Date(sub.endDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-ink">₹{sub.amount}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {sub.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-ink mb-4">Confirm Subscription</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-ink/60">Plan:</span>
                <span className="font-semibold text-ink">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Amount:</span>
                <span className="font-semibold text-ink">₹{selectedPlan.price}/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Employee Limit:</span>
                <span className="font-semibold text-ink">{selectedPlan.employees}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleSubscribe(selectedPlan)} className="flex-1 px-4 py-2 bg-aqua text-white rounded-lg">Confirm</button>
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-ink/10 text-ink rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
