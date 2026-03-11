'use client';

import { useState, useEffect } from 'react';
import { Users, Briefcase, Calendar, TrendingUp, Clock, FileText } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>({ employees: {}, jobs: {}, leaves: {}, attendance: {} });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const res = await fetch(`${API_BASE}/analytics/dashboard`);
    const data = await res.json();
    setStats(data);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-ink">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-aqua to-aqua/80 text-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-12 h-12 opacity-80" />
            <span className="text-sm opacity-90">Employees</span>
          </div>
          <p className="text-4xl font-bold mb-2">{stats.employees.total || 0}</p>
          <p className="text-sm opacity-90">{stats.employees.active || 0} active</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Briefcase className="w-12 h-12 opacity-80" />
            <span className="text-sm opacity-90">Jobs</span>
          </div>
          <p className="text-4xl font-bold mb-2">{stats.jobs.total || 0}</p>
          <p className="text-sm opacity-90">{stats.jobs.open || 0} open positions</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-12 h-12 opacity-80" />
            <span className="text-sm opacity-90">Leave Requests</span>
          </div>
          <p className="text-4xl font-bold mb-2">{stats.leaves.pending || 0}</p>
          <p className="text-sm opacity-90">pending approval</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-12 h-12 opacity-80" />
            <span className="text-sm opacity-90">Attendance</span>
          </div>
          <p className="text-4xl font-bold mb-2">{stats.attendance.today || 0}</p>
          <p className="text-sm opacity-90">present today</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-ink mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-ink/60">Total Employees</span>
              <span className="font-semibold text-ink">{stats.employees.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink/60">Active Jobs</span>
              <span className="font-semibold text-ink">{stats.jobs.open || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink/60">Pending Leaves</span>
              <span className="font-semibold text-ink">{stats.leaves.pending || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink/60">Today Attendance</span>
              <span className="font-semibold text-ink">{stats.attendance.today || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-ink mb-4">System Health</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-ink/60">Employee Capacity</span>
                <span className="text-sm font-semibold text-ink">75%</span>
              </div>
              <div className="w-full bg-ink/10 rounded-full h-2">
                <div className="bg-aqua h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-ink/60">Job Post Usage</span>
                <span className="text-sm font-semibold text-ink">60%</span>
              </div>
              <div className="w-full bg-ink/10 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-ink/60">Storage Used</span>
                <span className="text-sm font-semibold text-ink">45%</span>
              </div>
              <div className="w-full bg-ink/10 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-ink/5 rounded-lg">
            <Users className="w-5 h-5 text-aqua" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">New employee onboarded</p>
              <p className="text-xs text-ink/60">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-ink/5 rounded-lg">
            <Briefcase className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">New job posted</p>
              <p className="text-xs text-ink/60">5 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-ink/5 rounded-lg">
            <FileText className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">Leave request approved</p>
              <p className="text-xs text-ink/60">1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
