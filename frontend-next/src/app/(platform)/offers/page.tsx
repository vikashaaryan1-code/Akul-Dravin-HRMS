'use client';
import { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle } from 'lucide-react';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';
export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ applicationId: '', jobTitle: '', salary: '', joiningDate: '', terms: '' });
  useEffect(() => { fetchOffers(); }, []);
  const fetchOffers = async () => { const res = await fetch(`${API_BASE}/offers`); setOffers(await res.json()); };
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/offers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowModal(false);
    setForm({ applicationId: '', jobTitle: '', salary: '', joiningDate: '', terms: '' });
    fetchOffers();
  };
  const handleAccept = async (id) => {
    await fetch(`${API_BASE}/offers/${id}/accept`, { method: 'PATCH' });
    fetchOffers();
  };
  const stats = { total: offers.length, pending: offers.filter((o) => o.status === 'pending').length, accepted: offers.filter((o) => o.status === 'accepted').length };
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ink">Offers</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-aqua text-white rounded-lg">Create Offer</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-ink/60">Total</p><p className="text-3xl font-bold text-ink">{stats.total}</p></div><FileText className="w-12 h-12 text-aqua/20" /></div></div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-ink/60">Pending</p><p className="text-3xl font-bold text-amber-600">{stats.pending}</p></div><FileText className="w-12 h-12 text-amber-600/20" /></div></div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-ink/60">Accepted</p><p className="text-3xl font-bold text-green-600">{stats.accepted}</p></div><CheckCircle className="w-12 h-12 text-green-600/20" /></div></div>
      </div>
      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-ink/5"><tr><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Job Title</th><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Salary</th><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Joining Date</th><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Actions</th></tr></thead>
          <tbody className="divide-y divide-ink/10">
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td className="px-6 py-4 text-sm text-ink">{offer.jobTitle}</td>
                <td className="px-6 py-4 text-sm font-semibold text-ink">₹{parseFloat(offer.salary).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-ink">{new Date(offer.joiningDate).toLocaleDateString()}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${offer.status === 'accepted' ? 'bg-green-100 text-green-800' : offer.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{offer.status}</span></td>
                <td className="px-6 py-4">{offer.status === 'pending' && <button onClick={() => handleAccept(offer.id)} className="text-green-600">Accept</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-ink mb-4">Create Offer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-ink mb-1">Application ID</label><input type="text" value={form.applicationId} onChange={(e) => setForm({ ...form, applicationId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Job Title</label><input type="text" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Salary</label><input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Joining Date</label><input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-aqua text-white rounded-lg">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-ink/10 text-ink rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
