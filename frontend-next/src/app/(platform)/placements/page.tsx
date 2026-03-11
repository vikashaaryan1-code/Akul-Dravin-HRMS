'use client';
import { useState, useEffect } from 'react';
import { Briefcase, Plus } from 'lucide-react';

export default function PlacementsPage() {
  const [data, setData] = useState([]);
  const [show, setShow] = useState(false);

  useEffect(() => { fetch('http://localhost:4200/api/v1/placements').then(r => r.json()).then(setData); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:4200/api/v1/placements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    setShow(false);
    fetch('http://localhost:4200/api/v1/placements').then(r => r.json()).then(setData);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Placements</h1>
        <button onClick={() => setShow(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"><Plus size={20} />Add Placement</button>
      </div>
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <tr>{['Candidate', 'Job', 'Recruiter', 'Joining Date', 'Salary', 'Status'].map(h => <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((d) => (
              <tr key={d.id} className="hover:bg-cyan-50/50">
                <td className="px-6 py-4 text-sm text-gray-800">{d.candidateId}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{d.jobId}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{d.recruiterId}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(d.joiningDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-800">₹{parseFloat(d.salary).toLocaleString()}</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{d.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">Add Placement</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input name="candidateId" placeholder="Candidate ID *" required className="px-4 py-2 border rounded-lg" />
                <input name="jobId" placeholder="Job ID *" required className="px-4 py-2 border rounded-lg" />
                <input name="recruiterId" placeholder="Recruiter ID *" required className="px-4 py-2 border rounded-lg" />
                <input name="joiningDate" type="date" required className="px-4 py-2 border rounded-lg" />
                <input name="salary" type="number" step="0.01" placeholder="Salary *" required className="px-4 py-2 border rounded-lg" />
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
