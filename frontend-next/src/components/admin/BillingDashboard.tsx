'use client';

import React from 'react';
import { 
 CreditCard, 
 TrendingUp, 
 Users, 
 Zap, 
 Download, 
 AlertCircle 
} from 'lucide-react';

const BillingDashboard = () => {
 const revenueStats = [
 { label: 'MRR', value: '$124,500', change: '+12.5%', icon: TrendingUp },
 { label: 'Active Subscriptions', value: '1,240', change: '+4%', icon: Users },
 { label: 'AI Credit Revenue', value: '$12,400', change: '+18%', icon: Zap },
 { label: 'Failed Payments', value: '4', change: '-2%', icon: AlertCircle, color: 'text-rose-500' },
 ];

 const recentInvoices = [
 { id: 'INV-2026-001', tenant: 'TechGlobal Corp', plan: 'Enterprise', amount: '$4,500', status: 'Paid', date: '2026-05-14' },
 { id: 'INV-2026-002', tenant: 'InnovateSoft', plan: 'Professional', amount: '$899', status: 'Pending', date: '2026-05-15' },
 { id: 'INV-2026-003', tenant: 'BlueCollar Logistics', plan: 'FieldForce', amount: '$1,240', status: 'Paid', date: '2026-05-12' },
 ];

 return (
 <div className="p-8 bg-slate-50 min-h-screen text-white cyber-mesh">
 <header className="flex justify-between items-center mb-10">
 <div>
 <h1 className="text-3xl font-bold">Revenue Control Center</h1>
 <p className="text-slate-500">Super Admin Billing & Metering Intelligence</p>
 </div>
 <button className="glass-button px-6 py-2 rounded-xl flex items-center gap-2">
 <Download className="w-4 h-4" /> Export Financial Report
 </button>
 </header>

 {/* Revenue Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
 {revenueStats.map((stat, i) => (
 <div key={i} className="glass-panel p-6 rounded-3xl glow-border">
 <div className="flex justify-between items-start mb-4">
 <div className="p-3 rounded-2xl bg-white/5">
 <stat.icon className={`w-6 h-6 ${stat.color || 'text-orange-500'}`} />
 </div>
 <span className="text-xs font-bold text-emerald-400">{stat.change}</span>
 </div>
 <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
 <p className="text-3xl font-bold mt-1">{stat.value}</p>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Invoices Table */}
 <div className="lg:col-span-2 glass-panel p-8 rounded-[2rem]">
 <h2 className="text-2xl font-semibold mb-6">Recent Transactions</h2>
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="text-slate-500 border-b border-white/5">
 <th className="pb-4 font-medium">Invoice ID</th>
 <th className="pb-4 font-medium">Tenant</th>
 <th className="pb-4 font-medium">Plan</th>
 <th className="pb-4 font-medium">Amount</th>
 <th className="pb-4 font-medium">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/5">
 {recentInvoices.map((inv, i) => (
 <tr key={i} className="group hover:bg-white/5 transition-colors">
 <td className="py-4 font-mono text-sm">{inv.id}</td>
 <td className="py-4">{inv.tenant}</td>
 <td className="py-4">
 <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold">
 {inv.plan}
 </span>
 </td>
 <td className="py-4 font-bold">{inv.amount}</td>
 <td className="py-4">
 <span className={`flex items-center gap-2 text-sm ${inv.status === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
 <div className={`w-1.5 h-1.5 rounded-full ${inv.status === 'Paid' ? 'bg-emerald-400' : 'bg-slate-50mber-400'}`}></div>
 {inv.status}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Plan Distribution */}
 <div className="glass-panel p-8 rounded-[2rem]">
 <h2 className="text-2xl font-semibold mb-6">Plan Distribution</h2>
 <div className="space-y-6">
 {[
 { name: 'Enterprise', percentage: 45, color: 'bg-purple-500' },
 { name: 'Professional', percentage: 30, color: 'bg-blue-500' },
 { name: 'FieldForce', percentage: 15, color: 'bg-emerald-500' },
 { name: 'Starter', percentage: 10, color: 'bg-slate-500' },
 ].map((p, i) => (
 <div key={i}>
 <div className="flex justify-between text-sm mb-2">
 <span>{p.name}</span>
 <span className="text-slate-500">{p.percentage}%</span>
 </div>
 <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
 <div className={`h-full ${p.color} transition-all duration-1000`} style={{ width: `${p.percentage}%` }}></div>
 </div>
 </div>
 ))}
 </div>
 <div className="mt-10 p-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-transparent border border-orange-500/10">
 <h3 className="font-bold flex items-center gap-2">
 <CreditCard className="w-4 h-4 text-orange-500" /> Subscription Health
 </h3>
 <p className="text-sm text-slate-500 mt-2">Retention is up by 8% this month. Churn rate is at an all-time low of 1.2%.</p>
 </div>
 </div>
 </div>
 </div>
 );
};

export default BillingDashboard;
