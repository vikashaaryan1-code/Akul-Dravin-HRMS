'use client';
import { useState, useEffect } from 'react';
import { Users, Plus } from 'lucide-react';

export default function CandidatesPage() {
  const [data, setData] = useState([]);
  const [show, setShow] = useState(false);

  useEffect(() => { 
    fetch('http://localhost:4200/api/v1/candidates')
      .then(r => r.json())
      .then(d => setData(Array.isArray(d) ? d : []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:4200/api/v1/candidates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    setShow(false);
    fetch('http://localhost:4200/api/v1/candidates')
      .then(r => r.json())
      .then(d => setData(Array.isArray(d) ? d : []));
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Candidates</h1>
        <button onClick={() => setShow(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"><Plus size={20} />Add Candidate</button>
      </div>
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <tr>{['Name', 'Email', 'Phone', 'Experience', 'Status'].map(h => <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.isArray(data) && data.length > 0 ? data.map((d) => (
              <tr key={d.id} className="hover:bg-cyan-50/50">
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{d.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{d.email}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{d.phone || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{d.experience || 'N/A'}</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{d.status}</span></td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No candidates found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">Add Candidate</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input name="name" placeholder="Name *" required className="w-full px-4 py-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <input name="email" type="email" placeholder="Email *" required className="px-4 py-2 border rounded-lg" />
                <input name="phone" placeholder="Phone" className="px-4 py-2 border rounded-lg" />
                <input name="experience" placeholder="Experience" className="px-4 py-2 border rounded-lg" />
                <select name="status" defaultValue="active" className="px-4 py-2 border rounded-lg"><option value="active">Active</option><option value="inactive">Inactive</option></select>
              </div>
              <textarea name="resume" placeholder="Resume/Bio" rows="3" className="w-full px-4 py-2 border rounded-lg"></textarea>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">Create</button><button type="button" onClick={() => setShow(false)} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
