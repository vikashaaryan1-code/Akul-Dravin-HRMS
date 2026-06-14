'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  ShieldAlert, 
  Zap, 
  Activity,
  Search,
  Bell
} from 'lucide-react';

const MasterDashboard = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const stats = [
    { label: 'Active Workforce', value: '12,482', change: '+12%', icon: Users, color: 'text-blue-400' },
    { label: 'Marketplace ROI', value: '$452.8k', change: '+24%', icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Wallet Credits', value: '84,200', change: '-5%', icon: Wallet, color: 'text-amber-400' },
    { label: 'Security Alerts', value: '2', change: 'Stable', icon: ShieldAlert, color: 'text-rose-400' },
  ];

  const recentEvents = [
    { type: 'PAYROLL', message: 'Autonomous Monthly Batch Completed', time: '14m ago', status: 'success' },
    { type: 'MARKETPLACE', message: 'New Job Posting: Senior AI Architect', time: '1h ago', status: 'info' },
    { type: 'SECURITY', message: 'Suspicious Login Blocked (IP: 192.168.1.1)', time: '3h ago', status: 'warning' },
    { type: 'ONBOARDING', message: '5 Blue-Collar Staff Onboarded (Kiosk-1)', time: '5h ago', status: 'success' },
  ];

  return (
    <div className={`min-h-screen bg-slate-950 text-white p-8 cyber-mesh transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">
            PUERI <span className="text-orange-500">ULTRA</span>
          </h1>
          <p className="text-slate-400 mt-1">Autonomous Enterprise Workforce OS</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="NL Query: 'Show payroll risks'..." 
              className="bg-white/5 border border-white/10 rounded-full pl-10 pr-6 py-2 w-80 focus:outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>
          <button className="glass-button p-2 rounded-full relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full border-2 border-slate-950"></span>
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 glow-border"></div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-3xl glow-border">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`text-sm ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-slate-400'}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">{stat.label}</h3>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analytics Area */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-[2rem] border-white/5">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold flex items-center gap-3">
              <Activity className="text-orange-500" /> AI Workforce Intelligence
            </h2>
            <div className="flex gap-2">
              <button className="px-4 py-1.5 rounded-lg bg-white/10 text-sm font-medium">Real-time</button>
              <button className="px-4 py-1.5 rounded-lg text-sm font-medium text-slate-500">History</button>
            </div>
          </div>
          
          <div className="h-64 flex items-end gap-2 px-4 mb-8">
            {[45, 67, 43, 89, 34, 56, 78, 90, 65, 43, 67, 88].map((h, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-orange-500/20 to-orange-500 rounded-t-lg transition-all duration-1000 hover:brightness-125"
                style={{ height: `${h}%` }}
              ></div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Attrition Risk</p>
              <p className="text-xl font-bold text-rose-400">Low (2.4%)</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Hiring Velocity</p>
              <p className="text-xl font-bold text-emerald-400">0.8d / Hire</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Cost / HC</p>
              <p className="text-xl font-bold">$1,240 <span className="text-xs text-slate-500">-2%</span></p>
            </div>
          </div>
        </div>

        {/* Real-time Event Feed */}
        <div className="glass-panel p-8 rounded-[2rem] border-white/5">
          <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3">
            <Zap className="text-amber-400" /> Autonomous Events
          </h2>
          <div className="space-y-6">
            {recentEvents.map((event, i) => (
              <div key={i} className="flex gap-4 group">
                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                  event.status === 'success' ? 'bg-emerald-500' : 
                  event.status === 'warning' ? 'bg-rose-500' : 'bg-blue-500'
                } group-hover:scale-150 transition-transform`}></div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{event.type}</p>
                  <p className="text-sm text-slate-300 mt-0.5">{event.message}</p>
                  <p className="text-[10px] text-slate-600 mt-1">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-semibold">
            View Orchestration Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default MasterDashboard;
