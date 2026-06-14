'use client';

import React, { useState } from 'react';
import { Button, Card, Badge, LoadingSpinner } from '@/components/ui/core-components';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

/**
 * HR MANAGER DASHBOARD
 * Premium CyberGlass 2.0 design with real-time metrics
 *
 * Features:
 * - Employee overview with key metrics
 * - Attendance analytics
 * - Leave approvals queue
 * - AI-powered insights
 * - Talent analytics
 */
export default function HrDashboard() {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Mock data for charts
  const attendanceData = [
    { date: 'Mon', present: 95, absent: 5 },
    { date: 'Tue', present: 92, absent: 8 },
    { date: 'Wed', present: 98, absent: 2 },
    { date: 'Thu', present: 89, absent: 11 },
    { date: 'Fri', present: 94, absent: 6 },
  ];

  const departmentData = [
    { dept: 'Engineering', employees: 45, avgRating: 4.2 },
    { dept: 'Sales', employees: 32, avgRating: 3.8 },
    { dept: 'HR', employees: 8, avgRating: 4.5 },
    { dept: 'Finance', employees: 12, avgRating: 4.1 },
    { dept: 'Operations', employees: 23, avgRating: 3.9 },
  ];

  const pendingApprovals = [
    { id: 1, employee: 'Rajesh Kumar', type: 'Leave', days: 3, status: 'PENDING', riskFlag: false },
    { id: 2, employee: 'Priya Singh', type: 'Promotion', status: 'PENDING', riskFlag: false },
    { id: 3, employee: 'Amit Patel', type: 'Leave', days: 5, status: 'PENDING', riskFlag: true },
  ];

  const aiInsights = [
    {
      title: 'Attrition Risk',
      value: '12%',
      trend: 'up',
      description: '3 employees identified with high attrition risk',
      icon: AlertCircle,
    },
    {
      title: 'Avg Performance',
      value: '4.2/5',
      trend: 'stable',
      description: 'Team performance rating',
      icon: TrendingUp,
    },
    {
      title: 'Leave Balance',
      value: '8.4 days',
      trend: 'down',
      description: 'Avg per employee',
      icon: Clock,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold gradient-title mb-2">HR Management Dashboard</h1>
        <p className="text-slate-400">Real-time workforce intelligence & AI-powered insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="!bg-slate-800/40 hover:!bg-slate-800/60 border border-slate-700/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Employees</p>
              <p className="text-3xl font-bold text-cyan-400 mt-2">248</p>
            </div>
            <Users className="w-12 h-12 text-cyan-500/40" />
          </div>
        </Card>

        <Card className="!bg-slate-800/40 hover:!bg-slate-800/60 border border-slate-700/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Today Present</p>
              <p className="text-3xl font-bold text-emerald-400 mt-2">234</p>
              <p className="text-xs text-slate-500 mt-1">94.4% attendance</p>
            </div>
            <CheckCircle2 className="w-12 h-12 text-emerald-500/40" />
          </div>
        </Card>

        <Card className="!bg-slate-800/40 hover:!bg-slate-800/60 border border-slate-700/30">
          <div>
            <p className="text-slate-400 text-sm font-medium">Pending Approvals</p>
            <p className="text-3xl font-bold text-amber-400 mt-2">5</p>
          </div>
        </Card>

        <Card className="!bg-slate-800/40 hover:!bg-slate-800/60 border border-slate-700/30">
          <div>
            <p className="text-slate-400 text-sm font-medium">New Hires (Month)</p>
            <p className="text-3xl font-bold text-indigo-400 mt-2">12</p>
          </div>
        </Card>
      </div>

      {/* AI Insights Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">🤖 AI-Powered Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiInsights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <Card key={idx} className="!bg-gradient-to-br !from-slate-800/60 !to-slate-900/40">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-400 text-sm">{insight.title}</p>
                    <p className="text-2xl font-bold text-cyan-400 mt-2">{insight.value}</p>
                  </div>
                  <Icon className="w-8 h-8 text-indigo-400/60" />
                </div>
                <p className="text-xs text-slate-500">{insight.description}</p>
                {insight.trend === 'up' && <Badge variant="warning">↑ Trending up</Badge>}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Attendance Chart */}
        <Card>
          <h3 className="text-lg font-bold mb-4">Weekly Attendance Pattern</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis stroke="rgba(203, 213, 225, 0.5)" />
                <YAxis stroke="rgba(203, 213, 225, 0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="present"
                  stroke="hsl(150, 85%, 45%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(150, 85%, 45%)', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="absent"
                  stroke="hsl(350, 85%, 58%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(350, 85%, 58%)', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Department Performance */}
        <Card>
          <h3 className="text-lg font-bold mb-4">Department Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis stroke="rgba(203, 213, 225, 0.5)" />
                <YAxis stroke="rgba(203, 213, 225, 0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="employees" fill="hsl(250, 89%, 65%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Pending Approvals Table */}
      <Card>
        <h3 className="text-lg font-bold mb-4">Pending Approvals Queue</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/30">
                <th className="text-left py-3 px-4 text-slate-400 font-semibold">Employee</th>
                <th className="text-left py-3 px-4 text-slate-400 font-semibold">Type</th>
                <th className="text-left py-3 px-4 text-slate-400 font-semibold">Details</th>
                <th className="text-left py-3 px-4 text-slate-400 font-semibold">Status</th>
                <th className="text-center py-3 px-4 text-slate-400 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovals.map((approval) => (
                <tr key={approval.id} className="border-b border-slate-700/20 hover:bg-slate-800/40">
                  <td className="py-3 px-4">{approval.employee}</td>
                  <td className="py-3 px-4">
                    <Badge variant="info">{approval.type}</Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {approval.type === 'Leave' ? `${approval.days} days` : 'Engineering → Senior Eng'}
                  </td>
                  <td className="py-3 px-4">
                    {approval.riskFlag ? (
                      <Badge variant="warning">⚠️ Review Recommended</Badge>
                    ) : (
                      <Badge variant="info">Ready</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <Button variant="primary" size="sm" className="!py-1 !px-3 !text-xs">
                        Approve
                      </Button>
                      <Button variant="ghost" size="sm" className="!py-1 !px-3 !text-xs">
                        Review
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8 flex-wrap">
        <Button className="flex items-center gap-2">
          🤖 AI Recommendations
        </Button>
        <Button variant="secondary" className="flex items-center gap-2">
          📊 Generate Report
        </Button>
        <Button variant="secondary" className="flex items-center gap-2">
          👥 Talent Analytics
        </Button>
      </div>
    </div>
  );
}
