'use client';
import { useState, useEffect } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';
export default function OvertimePage() {
  const [overtime, setOvertime] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ employeeId: '', date: '', hours: '', reason: '' });
  useEffect(() => { fetchOvertime(); }, []);
  const fetchOvertime = async () => { const res = await fetch(`${API_BASE}/overtime`); setOvertime(await res.json()); };
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/overtime`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowModal(false);
    setForm({ employeeId: '', date: '', hours: '', reason: '' });
    fetchOvertime();
  };
  const handleApprove = async (id) => {
    await fetch(`${API_BASE}/overtime/${id}/approve`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approverId: 'current-user-id' }) });
    fetchOvertime();
  };
  const stats = { pending: overtime.filter((o) => o.status === 'pending').length, approved: overtime.filter((o) => o.status === 'approved').length, totalHours: overtime.reduce((sum, o) => sum + parseFloat(o.hours || 0), 0) };
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ink">Overtime</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-aqua text-white rounded-lg">Submit Overtime</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-ink/60">Pending</p><p className="text-3xl font-bold text-amber-600">{stats.pending}</p></div><Clock className="w-12 h-12 text-amber-600/20" /></div></div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-ink/60">Approved</p><p className="text-3xl font-bold text-green-600">{stats.approved}</p></div><CheckCircle className="w-12 h-12 text-green-600/20" /></div></div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-ink/60">Total Hours</p><p className="text-3xl font-bold text-ink">{stats.totalHours}</p></div><Clock className="w-12 h-12 text-aqua/20" /></div></div>
      </div>
      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-ink/5"><tr><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Employee</th><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Hours</th><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Actions</th></tr></thead>
          <tbody className="divide-y divide-ink/10">
            {overtime.map((ot) => (
              <tr key={ot.id}>
                <td className="px-6 py-4 text-sm text-ink">{ot.employee?.name || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-ink">{new Date(ot.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-ink">{ot.hours} hrs</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${ot.status === 'approved' ? 'bg-green-100 text-green-800' : ot.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{ot.status}</span></td>
                <td className="px-6 py-4">{ot.status === 'pending' && <button onClick={() => handleApprove(ot.id)} className="text-green-600">Approve</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-ink mb-4">Submit Overtime</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-ink mb-1">Employee ID</label><input type="text" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Hours</label><input type="number" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Reason</label><textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} /></div>
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
