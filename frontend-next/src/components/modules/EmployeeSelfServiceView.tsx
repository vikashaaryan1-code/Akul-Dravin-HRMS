'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  User, Calendar, FileText, Award, Clock, TrendingUp,
  LogIn, LogOut, CheckCircle2, AlertCircle, Bell,
  ChevronRight, Wallet, BookOpen, Target, Shield
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { useAuthStore } from '@/store/auth-store';
import { platformApi } from '@/services/api/platform-api';
import { formatDateTime } from '@/utils/formatters';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaveBalance {
  type:       string;
  total:      number;
  used:       number;
  available:  number;
  color:      string;
}

interface Payslip {
  id:      string;
  period:  string;
  net:     number;
  status:  string;
}

interface Goal {
  id:         string;
  title:      string;
  progress:   number;
  dueDate:    string;
  status:     'on-track' | 'at-risk' | 'completed';
}

// ─── Mini Components ──────────────────────────────────────────────────────────

function QuickStat({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl p-3 border ${color} bg-white/5`}>
      <div className="p-2 rounded-xl bg-white/10">{icon}</div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-base font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function LeaveBar({ balance }: { balance: LeaveBalance }) {
  const pct = Math.min(100, Math.round((balance.used / balance.total) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-300">{balance.type}</span>
        <span className="text-xs text-slate-400">{balance.available} days left</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${balance.color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{balance.used} used</span>
        <span>{balance.total} total</span>
      </div>
    </div>
  );
}

function GoalRow({ goal }: { goal: Goal }) {
  const colors: Record<Goal['status'], string> = {
    'on-track':  'bg-emerald-500',
    'at-risk':   'bg-amber-500',
    'completed': 'bg-blue-500',
  };
  const pills: Record<Goal['status'], 'success' | 'warning' | 'default'> = {
    'on-track':  'success',
    'at-risk':   'warning',
    'completed': 'default',
  };
  return (
    <div className="rounded-2xl border border-white/8 bg-white/5 p-3 space-y-2 hover:bg-white/8 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-200 leading-snug">{goal.title}</p>
        <StatusPill label={goal.status.replace('-', ' ')} />
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div className={`h-1.5 rounded-full ${colors[goal.status]}`} style={{ width: `${goal.progress}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{goal.progress}% complete</span>
        <span>Due: {goal.dueDate}</span>
      </div>
    </div>
  );
}

// ─── Attendance Clock Widget ──────────────────────────────────────────────────

function AttendanceClock() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState('00:00:00');
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!checkedIn || !checkInTime) return;
    const t = setInterval(() => {
      const ms = Date.now() - checkInTime.getTime();
      const h  = Math.floor(ms / 3600000).toString().padStart(2, '0');
      const m  = Math.floor((ms % 3600000) / 60000).toString().padStart(2, '0');
      const s  = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(t);
  }, [checkedIn, checkInTime]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (!checkedIn) {
        // 1. Get Location
        let lat, lng;
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (e) {
          console.error('Location capture failed', e);
        }

        // 2. Get IP (Simple stub or via service)
        const ipResponse = await fetch('https://api.ipify.org?format=json').catch(() => null);
        const ipData = await ipResponse?.json();
        const ipAddress = ipData?.ip;

        // 3. Punch In
        await platformApi.punchIn({ lat, lng, ipAddress });
        
        setCheckInTime(new Date());
        setCheckedIn(true);
      } else {
        await platformApi.punchOut();
        setCheckedIn(false);
        setCheckInTime(null);
        setElapsed('00:00:00');
      }
    } catch (err: any) {
      console.error('Attendance toggle failed', err);
      alert(err.message || 'Action failed. Please check your connection or permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="relative overflow-hidden">
      {/* Glow backdrop */}
      <div className={`absolute inset-0 rounded-2xl transition-all duration-700 pointer-events-none
        ${checkedIn ? 'bg-emerald-500/8' : 'bg-blue-500/5'}`} />

      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-200">Attendance</p>
          <div className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium
            ${checkedIn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'}`}>
            <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${checkedIn ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            {checkedIn ? 'Working' : 'Not Clocked In'}
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-4xl font-mono font-bold text-white tracking-widest">
            {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          {checkedIn && (
            <p className="text-xs text-emerald-400 mt-2 font-mono">⏱ {elapsed} elapsed</p>
          )}
        </div>

        <button
          id={checkedIn ? 'check-out-btn' : 'check-in-btn'}
          onClick={handleToggle}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-200
            ${checkedIn
              ? 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 active:scale-95'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 active:scale-95'
            } disabled:opacity-50`}
        >
          {loading ? <span className="animate-spin">⏳</span> : checkedIn
            ? <><LogOut className="h-4 w-4" /> Check Out</>
            : <><LogIn className="h-4 w-4" /> Check In</>
          }
        </button>

        {checkInTime && (
          <p className="text-center text-[10px] text-slate-500">
            Checked in at {checkInTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </GlassCard>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const LEAVE_BALANCES: LeaveBalance[] = [
  { type: 'Casual Leave',   total: 12, used: 4,   available: 8,  color: 'bg-blue-500' },
  { type: 'Sick Leave',     total: 8,  used: 1,   available: 7,  color: 'bg-rose-500' },
  { type: 'Earned Leave',   total: 18, used: 5,   available: 13, color: 'bg-emerald-500' },
  { type: 'Loss of Pay',    total: 365, used: 0,  available: 365, color: 'bg-amber-500' },
];

const MY_GOALS: Goal[] = [
  { id: 'g1', title: 'Complete Q2 Sales Target ₹15L', progress: 72, dueDate: 'Jun 30', status: 'on-track' },
  { id: 'g2', title: 'Complete AWS Certification', progress: 45, dueDate: 'May 30', status: 'at-risk' },
  { id: 'g3', title: 'Onboard 5 new Enterprise Clients', progress: 100, dueDate: 'Apr 30', status: 'completed' },
];

const QUICK_LINKS = [
  { label: 'My Payslips',   href: '/payroll',    icon: <FileText className="h-4 w-4" />,  color: 'text-blue-400' },
  { label: 'Apply Leave',   href: '/leave',      icon: <Calendar className="h-4 w-4" />,   color: 'text-violet-400' },
  { label: 'My Documents',  href: '/documents',  icon: <BookOpen className="h-4 w-4" />,   color: 'text-emerald-400' },
  { label: 'Expense Claim', href: '/expense',    icon: <Wallet className="h-4 w-4" />,     color: 'text-amber-400' },
  { label: 'My Goals',      href: '/performance',icon: <Target className="h-4 w-4" />,     color: 'text-rose-400' },
  { label: 'IT & Assets',   href: '/services',   icon: <Shield className="h-4 w-4" />,     color: 'text-cyan-400' },
];

export function EmployeeSelfServiceView() {
  const user = useAuthStore(s => s.user);

  const recentPayslips: Payslip[] = [
    { id: 'PS-2026-05', period: 'May 2026',   net: 84200, status: 'processing' },
    { id: 'PS-2026-04', period: 'April 2026', net: 84200, status: 'paid' },
    { id: 'PS-2026-03', period: 'March 2026', net: 82100, status: 'paid' },
  ];

  return (
    <div className="space-y-5 animate-rise">
      <PageTitle
        title={`Hello, ${user?.fullName?.split(' ')[0] ?? 'Employee'} 👋`}
        description="Your personal workspace — manage attendance, leave, goals, payslips, and more."
      />

      {/* Top Quick Links */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {QUICK_LINKS.map(ql => (
          <Link key={ql.href} href={ql.href}>
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/8 bg-white/5 p-3 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
              <div className={`${ql.color} group-hover:scale-110 transition-transform`}>{ql.icon}</div>
              <p className="text-[10px] text-slate-400 text-center leading-tight">{ql.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 xl:grid-cols-3">

        {/* Col 1: Attendance Clock */}
        <div className="space-y-4">
          <AttendanceClock />

          {/* Quick Stats */}
          <GlassCard className="space-y-3">
            <p className="text-sm font-semibold text-slate-200">My Stats</p>
            <div className="space-y-2">
              <QuickStat icon={<Clock className="h-3.5 w-3.5 text-blue-400" />} label="Working Days (May)" value="21 / 22" color="border-blue-500/20" />
              <QuickStat icon={<Award className="h-3.5 w-3.5 text-amber-400" />} label="Performance Score" value="87 / 100" color="border-amber-500/20" />
              <QuickStat icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-400" />} label="Target Achievement" value="92%" color="border-emerald-500/20" />
            </div>
          </GlassCard>
        </div>

        {/* Col 2: Leave Balances + Goals */}
        <div className="space-y-4">
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-200">Leave Balance</p>
              <Link href="/leave" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                Apply <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-4">
              {LEAVE_BALANCES.map(b => <LeaveBar key={b.type} balance={b} />)}
            </div>
          </GlassCard>

          <GlassCard className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-200">My Goals (Q2)</p>
              <Link href="/performance" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                All <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {MY_GOALS.map(g => <GoalRow key={g.id} goal={g} />)}
            </div>
          </GlassCard>
        </div>

        {/* Col 3: Payslips + Announcements */}
        <div className="space-y-4">
          <GlassCard className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-200">Recent Payslips</p>
              <Link href="/payroll" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                View All <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentPayslips.map(ps => (
                <div key={ps.id} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 hover:bg-white/8 transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{ps.period}</p>
                    <p className="text-xs text-slate-500">₹{ps.net.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill label={ps.status} />
                    {ps.status === 'paid' && (
                      <button className="text-[10px] text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-lg px-2 py-0.5 transition-colors">
                        PDF
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Company Announcements */}
          <GlassCard className="space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              <p className="text-sm font-semibold text-slate-200">Announcements</p>
            </div>
            <div className="space-y-2">
              {[
                { id: 'a1', title: 'Q2 Performance Reviews', date: 'May 20', type: 'info' },
                { id: 'a2', title: 'Office Holiday — May 26 (Monday)', date: 'May 15', type: 'success' },
                { id: 'a3', title: 'New Health Insurance Policy Effective Jun 1', date: 'May 10', type: 'warning' },
              ].map(ann => (
                <div key={ann.id} className={`rounded-xl p-2.5 border text-xs flex items-start gap-2
                  ${ann.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10' :
                    ann.type === 'warning' ? 'border-amber-500/30 bg-amber-500/10' :
                    'border-blue-500/30 bg-blue-500/10'}`}>
                  <div className={`h-1.5 w-1.5 rounded-full mt-1 shrink-0
                    ${ann.type === 'success' ? 'bg-emerald-400' :
                      ann.type === 'warning' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                  <div>
                    <p className="text-slate-200 font-medium">{ann.title}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">{ann.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
