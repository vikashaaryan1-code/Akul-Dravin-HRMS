'use client';
import { useState, useEffect } from 'react';
import { DollarSign, Plus } from 'lucide-react';

export default function CommissionsPage() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0 });
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch('http://localhost:4200/api/v1/commissions').then(r => r.json()).then(setData);
    fetch('http://localhost:4200/api/v1/commissions/stats').then(r => r.json()).then(setStats);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:4200/api/v1/commissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    setShow(false);
    fetch('http://localhost:4200/api/v1/commissions').then(r => r.json()).then(setData);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Commissions</h1>
        <button onClick={() => setShow(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"><Plus size={20} />Add Commission</button>
      </div>
      <div className="grid grid-cols-3 gap-6 mb-8">
        {[{ l: 'Total', v: stats.total }, { l: 'Pending', v: stats.pending }, { l: 'Paid', v: stats.paid }].map((s, i) => (
          <div key={i} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-cyan-100 shadow-sm"><p className="text-gray-600 text-sm">{s.l}</p><p className="text-3xl font-bold text-cyan-600 mt-1">{s.v}</p></div>
        ))}
      </div>
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <tr>{['Recruiter', 'Placement', 'Amount', 'Rate', 'Status', 'Paid Date'].map(h => <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((d) => (
              <tr key={d.id} className="hover:bg-cyan-50/50">
                <td className="px-6 py-4 text-sm text-gray-800">{d.recruiterId}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{d.placementId}</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-800">₹{parseFloat(d.amount).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{d.rate}%</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${d.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{d.status}</span></td>
                <td className="px-6 py-4 text-sm text-gray-600">{d.paidDate ? new Date(d.paidDate).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">Add Commission</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input name="recruiterId" placeholder="Recruiter ID *" required className="px-4 py-2 border rounded-lg" />
                <input name="placementId" placeholder="Placement ID *" required className="px-4 py-2 border rounded-lg" />
                <input name="amount" type="number" step="0.01" placeholder="Amount *" required className="px-4 py-2 border rounded-lg" />
                <input name="rate" type="number" step="0.01" placeholder="Rate % *" required className="px-4 py-2 border rounded-lg" />
                <select name="status" defaultValue="pending" className="px-4 py-2 border rounded-lg"><option value="pending">Pending</option><option value="paid">Paid</option></select>
                <input name="paidDate" type="date" className="px-4 py-2 border rounded-lg" />
              </div>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">Create</button><button type="button" onClick={() => setShow(false)} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
