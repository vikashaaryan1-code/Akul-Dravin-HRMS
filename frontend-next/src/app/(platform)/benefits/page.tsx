'use client';
import { useState, useEffect } from 'react';
import { Gift, Plus } from 'lucide-react';

export default function BenefitsPage() {
  const [data, setData] = useState([]);
  const [show, setShow] = useState(false);

  useEffect(() => { fetch('http://localhost:4200/api/v1/benefits').then(r => r.json()).then(setData); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:4200/api/v1/benefits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    setShow(false);
    fetch('http://localhost:4200/api/v1/benefits').then(r => r.json()).then(setData);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Employee Benefits</h1>
        <button onClick={() => setShow(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"><Plus size={20} />Add Benefit</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.map((d) => (
          <div key={d.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold text-gray-800">{d.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{d.status}</span>
            </div>
            <p className="text-gray-600 mb-3">{d.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 font-medium">{d.type}</span>
              {d.value && <span className="font-bold text-gray-800">₹{parseFloat(d.value).toLocaleString()}</span>}
            </div>
          </div>
        ))}
      </div>
      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">Add Benefit</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input name="name" placeholder="Benefit Name *" required className="w-full px-4 py-2 border rounded-lg" />
              <textarea name="description" placeholder="Description *" required rows="3" className="w-full px-4 py-2 border rounded-lg"></textarea>
              <div className="grid grid-cols-2 gap-4">
                <select name="type" required className="px-4 py-2 border rounded-lg"><option value="">Type</option><option value="health">Health</option><option value="insurance">Insurance</option><option value="allowance">Allowance</option><option value="other">Other</option></select>
                <input name="value" type="number" step="0.01" placeholder="Value (if applicable)" className="px-4 py-2 border rounded-lg" />
                <select name="status" defaultValue="active" className="px-4 py-2 border rounded-lg"><option value="active">Active</option><option value="inactive">Inactive</option></select>
              </div>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">Create</button><button type="button" onClick={() => setShow(false)} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
