'use client';
import { useState, useEffect } from 'react';
import { UserCheck, Briefcase, TrendingUp } from 'lucide-react';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';
const plans = [{ id: 'starter', name: 'Starter', posts: 10, rate: 15 }, { id: 'pro', name: 'Pro', posts: 50, rate: 15 }, { id: 'enterprise', name: 'Enterprise', posts: 999, rate: 20 }];
export default function RecruitersPage() {
  const [recruiters, setRecruiters] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '' });
  useEffect(() => { fetchRecruiters(); }, []);
  const fetchRecruiters = async () => { const res = await fetch(`${API_BASE}/recruiters`); setRecruiters(await res.json()); };
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/recruiters`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowModal(false);
    setForm({ name: '', email: '', phone: '', company: '' });
    fetchRecruiters();
  };
  const stats = { total: recruiters.length, active: recruiters.filter((r) => r.status === 'active').length };
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ink">Recruiters</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-aqua text-white rounded-lg">Add Recruiter</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-ink/60">Total Recruiters</p><p className="text-3xl font-bold text-ink">{stats.total}</p></div><UserCheck className="w-12 h-12 text-aqua/20" /></div></div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-ink/60">Active</p><p className="text-3xl font-bold text-green-600">{stats.active}</p></div><TrendingUp className="w-12 h-12 text-green-600/20" /></div></div>
      </div>
      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-ink/5"><tr><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Email</th><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Company</th><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Plan</th><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Posts</th><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Status</th></tr></thead>
          <tbody className="divide-y divide-ink/10">
            {recruiters.map((recruiter) => (
              <tr key={recruiter.id}>
                <td className="px-6 py-4 text-sm text-ink">{recruiter.name}</td>
                <td className="px-6 py-4 text-sm text-ink">{recruiter.email}</td>
                <td className="px-6 py-4 text-sm text-ink">{recruiter.company || '-'}</td>
                <td className="px-6 py-4 text-sm text-ink capitalize">{recruiter.planType}</td>
                <td className="px-6 py-4 text-sm text-ink">{recruiter.jobPostsUsed}/{recruiter.jobPostsLimit}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${recruiter.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{recruiter.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-ink mb-4">Add Recruiter</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-ink mb-1">Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Phone</label><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Company</label><input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-aqua text-white rounded-lg">Add</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-ink/10 text-ink rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
