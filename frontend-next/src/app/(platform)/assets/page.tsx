'use client';
import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';
const categories = ['Laptop', 'Desktop', 'Mobile', 'Monitor', 'Keyboard', 'Mouse', 'Furniture', 'Other'];
export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Laptop', assetCode: '', value: '', purchaseDate: '' });
  useEffect(() => { fetchAssets(); }, []);
  const fetchAssets = async () => { const res = await fetch(`${API_BASE}/assets`); setAssets(await res.json()); };
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/assets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, companyId: 'current-company-id' }) });
    setShowModal(false);
    setForm({ name: '', category: 'Laptop', assetCode: '', value: '', purchaseDate: '' });
    fetchAssets();
  };
  const stats = { total: assets.length, assigned: assets.filter((a) => a.status === 'assigned').length, available: assets.filter((a) => a.status === 'available').length };
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ink">Assets</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-aqua text-white rounded-lg">Add Asset</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-ink/60">Total</p><p className="text-3xl font-bold text-ink">{stats.total}</p></div><Package className="w-12 h-12 text-aqua/20" /></div></div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-ink/60">Assigned</p><p className="text-3xl font-bold text-green-600">{stats.assigned}</p></div><Package className="w-12 h-12 text-green-600/20" /></div></div>
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-ink/60">Available</p><p className="text-3xl font-bold text-amber-600">{stats.available}</p></div><Package className="w-12 h-12 text-amber-600/20" /></div></div>
      </div>
      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-ink/5"><tr><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Category</th><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Code</th><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Value</th><th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Status</th></tr></thead>
          <tbody className="divide-y divide-ink/10">
            {assets.map((asset) => (
              <tr key={asset.id}>
                <td className="px-6 py-4 text-sm text-ink">{asset.name}</td>
                <td className="px-6 py-4 text-sm text-ink">{asset.category}</td>
                <td className="px-6 py-4 text-sm text-ink">{asset.assetCode}</td>
                <td className="px-6 py-4 text-sm text-ink">₹{parseFloat(asset.value || 0).toLocaleString()}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${asset.status === 'assigned' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{asset.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-ink mb-4">Add Asset</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-ink mb-1">Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Asset Code</label><input type="text" value={form.assetCode} onChange={(e) => setForm({ ...form, assetCode: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Value</label><input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-ink mb-1">Purchase Date</label><input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
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
