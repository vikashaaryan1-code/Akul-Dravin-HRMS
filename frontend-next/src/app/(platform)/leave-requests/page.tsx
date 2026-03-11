'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });

  useEffect(() => {
    fetchRequests();
    fetchLeaveTypes();
  }, []);

  const fetchRequests = async () => {
    const res = await fetch(`${API_BASE}/leave-requests`);
    const data = await res.json();
    setRequests(data);
  };

  const fetchLeaveTypes = async () => {
    const res = await fetch(`${API_BASE}/leave-types`);
    const data = await res.json();
    setLeaveTypes(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_BASE}/leave-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, employeeId: 'current-user-id' }),
    });
    setShowModal(false);
    setForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
    fetchRequests();
  };

  const handleApprove = async (id: string) => {
    await fetch(`${API_BASE}/leave-requests/${id}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approverId: 'current-user-id' }),
    });
    fetchRequests();
  };

  const handleReject = async (id: string) => {
    const remarks = prompt('Rejection reason:');
    if (!remarks) return;
    await fetch(`${API_BASE}/leave-requests/${id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approverId: 'current-user-id', remarks }),
    });
    fetchRequests();
  };

  const stats = {
    pending: requests.filter((r: any) => r.status === 'pending').length,
    approved: requests.filter((r: any) => r.status === 'approved').length,
    rejected: requests.filter((r: any) => r.status === 'rejected').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ink">Leave Requests</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-aqua text-white rounded-lg">Apply Leave</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">Pending</p>
              <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-amber-600/20" />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">Approved</p>
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600/20" />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/60">Rejected</p>
              <p className="text-3xl font-bold text-ember">{stats.rejected}</p>
            </div>
            <XCircle className="w-12 h-12 text-ember/20" />
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-ink/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Leave Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Days</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {requests.map((req: any) => (
              <tr key={req.id}>
                <td className="px-6 py-4 text-sm text-ink">{req.employee?.name || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-ink">{req.leaveType?.name || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-ink">
                  {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-ink">{req.totalDays}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    req.status === 'approved' ? 'bg-green-100 text-green-800' :
                    req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  {req.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(req.id)} className="text-green-600">Approve</button>
                      <button onClick={() => handleReject(req.id)} className="text-ember">Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-ink mb-4">Apply Leave</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Leave Type</label>
                <select value={form.leaveTypeId} onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select</option>
                  {leaveTypes.map((lt: any) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Reason</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} required />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-aqua text-white rounded-lg">Submit</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-ink/10 text-ink rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
