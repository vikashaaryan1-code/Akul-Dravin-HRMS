'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetch('http://localhost:4200/api/v1/clients').then(r => r.json()).then(setClients);
    fetch('http://localhost:4200/api/v1/clients/stats').then(r => r.json()).then(setStats);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editing ? `http://localhost:4200/api/v1/clients/${editing.id}` : 'http://localhost:4200/api/v1/clients';
    await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    setShowModal(false);
    setEditing(null);
    fetch('http://localhost:4200/api/v1/clients').then(r => r.json()).then(setClients);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Clients</h1>
        <button onClick={() => { setShowModal(true); setEditing(null); }} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"><Plus size={20} />Add Client</button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {[{ l: 'Total', v: stats.total, c: 'cyan' }, { l: 'Active', v: stats.active, c: 'green' }, { l: 'Inactive', v: stats.inactive, c: 'red' }].map((s, i) => (
          <div key={i} className={`bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-${s.c}-100 shadow-sm`}><p className="text-gray-600 text-sm">{s.l}</p><p className={`text-3xl font-bold text-${s.c}-600 mt-1`}>{s.v}</p></div>
        ))}
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <tr>{['Name', 'Company', 'Email', 'Phone', 'Industry', 'Status', 'Actions'].map(h => <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-cyan-50/50">
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{c.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.company || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.email}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.phone || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.industry || 'N/A'}</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.status}</span></td>
                <td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => { setEditing(c); setShowModal(true); }} className="text-blue-600"><Edit2 size={18} /></button><button onClick={async () => { if (confirm('Delete?')) { await fetch(`http://localhost:4200/api/v1/clients/${c.id}`, { method: 'DELETE' }); fetch('http://localhost:4200/api/v1/clients').then(r => r.json()).then(setClients); }}} className="text-red-600"><Trash2 size={18} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">{editing ? 'Edit' : 'Add'} Client</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input name="name" placeholder="Name *" defaultValue={editing?.name} required className="px-4 py-2 border rounded-lg" />
                <input name="company" placeholder="Company" defaultValue={editing?.company} className="px-4 py-2 border rounded-lg" />
                <input name="email" type="email" placeholder="Email *" defaultValue={editing?.email} required className="px-4 py-2 border rounded-lg" />
                <input name="phone" placeholder="Phone" defaultValue={editing?.phone} className="px-4 py-2 border rounded-lg" />
                <input name="industry" placeholder="Industry" defaultValue={editing?.industry} className="px-4 py-2 border rounded-lg" />
                <input name="website" placeholder="Website" defaultValue={editing?.website} className="px-4 py-2 border rounded-lg" />
                <input name="city" placeholder="City" defaultValue={editing?.city} className="px-4 py-2 border rounded-lg" />
                <input name="country" placeholder="Country" defaultValue={editing?.country} className="px-4 py-2 border rounded-lg" />
              </div>
              <textarea name="address" placeholder="Address" defaultValue={editing?.address} rows="2" className="w-full px-4 py-2 border rounded-lg"></textarea>
              <select name="status" defaultValue={editing?.status || 'active'} className="w-full px-4 py-2 border rounded-lg"><option value="active">Active</option><option value="inactive">Inactive</option></select>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">{editing ? 'Update' : 'Create'}</button><button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
