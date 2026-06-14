'use client';

import React, { useState } from 'react';
import { Button, Card, Badge, LoadingSpinner } from '@/components/ui/core-components';
import { Clock, FileText, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

/**
 * EMPLOYEE SELF-SERVICE (ESS) PORTAL
 * Mobile-responsive portal for employee leave, attendance, and payroll management
 *
 * Features:
 * - Attendance check-in/check-out
 * - Leave balance and request form
 * - Payslip view and download
 * - Performance metrics
 * - HR Assistant chat
 */
export default function EmployeePortal() {
  const [activeTab, setActiveTab] = useState('overview');
  const [leaveFormVisible, setLeaveFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock employee data
  const employee = {
    name: 'Rahul Verma',
    id: 'EMP001234',
    department: 'Engineering',
    designation: 'Senior Software Engineer',
    reportingManager: 'Priya Singh',
  };

  const leaveBalance = {
    casualLeave: { used: 2, available: 10, total: 12 },
    sickLeave: { used: 1, available: 7, total: 8 },
    earnedLeave: { used: 5, available: 10, total: 15 },
    maternityPaternity: { used: 0, available: 30, total: 30 },
  };

  const recentPayslips = [
    { month: 'May 2024', ctc: '₹12,50,000', status: 'RELEASED', grossSalary: '₹1,04,167' },
    { month: 'April 2024', ctc: '₹12,50,000', status: 'RELEASED', grossSalary: '₹1,04,167' },
    { month: 'March 2024', ctc: '₹12,50,000', status: 'RELEASED', grossSalary: '₹1,04,167' },
  ];

  const performanceMetrics = {
    rating: 4.5,
    projects: 8,
    tasksCompleted: 156,
    reviewsRating: 4.2,
    upcomingReview: '2024-06-15',
  };

  const recentAttendance = [
    { date: '2024-05-31', checkIn: '09:15 AM', checkOut: '06:30 PM', status: 'PRESENT', location: 'Mumbai Office' },
    { date: '2024-05-30', checkIn: '09:02 AM', checkOut: '06:15 PM', status: 'PRESENT', location: 'Mumbai Office' },
    { date: '2024-05-29', checkIn: '09:45 AM', checkOut: '06:00 PM', status: 'PRESENT', location: 'Work From Home' },
    { date: '2024-05-28', checkIn: null, checkOut: null, status: 'LEAVE', location: 'Medical Leave' },
  ];

  const handleCheckIn = () => {
    setLoading(true);
    setTimeout(() => {
      alert('✅ Checked in successfully at 09:00 AM');
      setLoading(false);
    }, 1000);
  };

  const handleLeaveRequest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert('📧 Leave request submitted for approval');
    setLeaveFormVisible(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Mobile Header */}
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-700/30 p-4 z-10">
        <h1 className="text-2xl font-bold">Employee Portal</h1>
        <p className="text-sm text-slate-400">{employee.name} • {employee.designation}</p>
      </div>

      <div className="p-4 md:p-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Button
            onClick={handleCheckIn}
            disabled={loading}
            className="h-auto py-4 flex flex-col items-center gap-2 !text-sm"
          >
            {loading ? <LoadingSpinner /> : <Clock className="w-5 h-5" />}
            <span>Check In</span>
          </Button>
          <Button variant="secondary" className="h-auto py-4 flex flex-col items-center gap-2 !text-sm">
            <Clock className="w-5 h-5" />
            <span>Check Out</span>
          </Button>
          <Button variant="secondary" className="h-auto py-4 flex flex-col items-center gap-2 !text-sm">
            <Calendar className="w-5 h-5" />
            <span>Leave Request</span>
          </Button>
          <Button variant="secondary" className="h-auto py-4 flex flex-col items-center gap-2 !text-sm">
            <FileText className="w-5 h-5" />
            <span>Payslip</span>
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-slate-700/30 overflow-x-auto">
          {['overview', 'attendance', 'leave', 'payroll', 'performance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Employee Info Card */}
            <Card className="!bg-gradient-to-br !from-slate-800/60 !to-slate-900/40">
              <h3 className="text-lg font-bold mb-4">Employee Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Name</p>
                  <p className="font-semibold">{employee.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Employee ID</p>
                  <p className="font-semibold">{employee.id}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Department</p>
                  <p className="font-semibold">{employee.department}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Reporting Manager</p>
                  <p className="font-semibold">{employee.reportingManager}</p>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card>
              <h3 className="text-lg font-bold mb-4">Today's Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Current Status</span>
                  <Badge variant="success">✓ Checked In</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Check-in Time</span>
                  <span className="font-semibold">09:00 AM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Hours Logged</span>
                  <span className="font-semibold">8h 30m</span>
                </div>
              </div>
            </Card>

            {/* Alerts */}
            <Card className="!bg-amber-500/10 border-amber-500/30">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-400">Leave Balance Alert</p>
                  <p className="text-sm text-slate-300 mt-1">You have 10 casual leaves remaining. Plan your vacation!</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <Card>
              <h3 className="text-lg font-bold mb-4">Recent Attendance</h3>
              <div className="space-y-3">
                {recentAttendance.map((record, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-3 border-b border-slate-700/20 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{record.date}</p>
                      <p className="text-xs text-slate-400">
                        {record.status === 'LEAVE'
                          ? record.location
                          : `${record.checkIn} - ${record.checkOut} (${record.location})`}
                      </p>
                    </div>
                    <Badge variant={record.status === 'PRESENT' ? 'success' : 'info'}>{record.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-bold mb-4">Monthly Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Days Present</span>
                  <span className="font-semibold">20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Days Leave</span>
                  <span className="font-semibold">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Attendance %</span>
                  <span className="font-semibold text-emerald-400">95.2%</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* LEAVE TAB */}
        {activeTab === 'leave' && (
          <div className="space-y-4">
            {/* Leave Balance */}
            <Card>
              <h3 className="text-lg font-bold mb-4">Leave Balance</h3>
              <div className="space-y-3">
                {Object.entries(leaveBalance).map(([type, balance]) => (
                  <div key={type}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-sm font-semibold">
                        {balance.available} / {balance.total}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-2 rounded-full"
                        style={{ width: `${((balance.total - balance.available) / balance.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Request Leave Form */}
            {leaveFormVisible && (
              <Card className="border-indigo-500/40 bg-indigo-500/5">
                <h3 className="text-lg font-bold mb-4">Request Leave</h3>
                <form onSubmit={handleLeaveRequest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Leave Type</label>
                    <select className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white">
                      <option>Casual Leave</option>
                      <option>Sick Leave</option>
                      <option>Earned Leave</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">From Date</label>
                      <input type="date" className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">To Date</label>
                      <input type="date" className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Reason</label>
                    <textarea className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white h-24" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      Submit Request
                    </Button>
                    <Button variant="ghost" onClick={() => setLeaveFormVisible(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {!leaveFormVisible && (
              <Button onClick={() => setLeaveFormVisible(true)} className="w-full">
                + Request Leave
              </Button>
            )}
          </div>
        )}

        {/* PAYROLL TAB */}
        {activeTab === 'payroll' && (
          <div className="space-y-4">
            <Card>
              <h3 className="text-lg font-bold mb-4">Payslips</h3>
              <div className="space-y-3">
                {recentPayslips.map((payslip, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-3 px-3 bg-slate-800/40 rounded border border-slate-700/20"
                  >
                    <div>
                      <p className="font-medium">{payslip.month}</p>
                      <p className="text-xs text-slate-400">{payslip.grossSalary} • {payslip.ctc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">{payslip.status}</Badge>
                      <Button variant="ghost" size="sm" className="!px-2">
                        ⬇
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-bold mb-4">CTC Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Base Salary</span>
                  <span>₹7,50,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">HRA</span>
                  <span>₹1,50,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Special Allowance</span>
                  <span>₹2,00,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Provident Fund</span>
                  <span>₹1,50,000</span>
                </div>
                <div className="border-t border-slate-700 pt-2 flex justify-between font-bold">
                  <span>Total CTC</span>
                  <span className="text-cyan-400">₹12,50,000</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* PERFORMANCE TAB */}
        {activeTab === 'performance' && (
          <div className="space-y-4">
            <Card className="!bg-gradient-to-br !from-slate-800/60 !to-slate-900/40">
              <h3 className="text-lg font-bold mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-400">{performanceMetrics.rating}</div>
                  <p className="text-xs text-slate-400 mt-1">Current Rating</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-400">{performanceMetrics.projects}</div>
                  <p className="text-xs text-slate-400 mt-1">Active Projects</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">{performanceMetrics.tasksCompleted}</div>
                  <p className="text-xs text-slate-400 mt-1">Tasks Completed</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-400">{performanceMetrics.reviewsRating}</div>
                  <p className="text-xs text-slate-400 mt-1">Peer Reviews</p>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-bold mb-4">Performance Review</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Next Review Date</span>
                  <span className="font-semibold">June 15, 2024</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Last Review</span>
                  <span className="font-semibold">March 2024</span>
                </div>
                <div>
                  <Button className="w-full mt-4">View Performance Report</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
