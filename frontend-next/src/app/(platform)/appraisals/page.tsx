'use client';

import { useState, useEffect } from 'react';
import { Star, Plus, Edit2, Trash2 } from 'lucide-react';

export default function AppraisalsPage() {
  const [appraisals, setAppraisals] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, draft: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetch('http://localhost:4200/api/v1/appraisals').then(r => r.json()).then(setAppraisals);
    fetch('http://localhost:4200/api/v1/appraisals/stats').then(r => r.json()).then(setStats);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editing ? `http://localhost:4200/api/v1/appraisals/${editing.id}` : 'http://localhost:4200/api/v1/appraisals';
    await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    setShowModal(false);
    setEditing(null);
    fetch('http://localhost:4200/api/v1/appraisals').then(r => r.json()).then(setAppraisals);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Performance Appraisals</h1>
        <button onClick={() => { setShowModal(true); setEditing(null); }} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"><Plus size={20} />Add Appraisal</button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {[{ l: 'Total', v: stats.total, c: 'cyan' }, { l: 'Completed', v: stats.completed, c: 'green' }, { l: 'Draft', v: stats.draft, c: 'orange' }].map((s, i) => (
          <div key={i} className={`bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-${s.c}-100 shadow-sm`}>
            <p className="text-gray-600 text-sm">{s.l}</p>
            <p className={`text-3xl font-bold text-${s.c}-600 mt-1`}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <tr>{['Employee', 'Reviewer', 'Period', 'Rating', 'Status', 'Actions'].map(h => <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {appraisals.map((a) => (
              <tr key={a.id} className="hover:bg-cyan-50/50">
                <td className="px-6 py-4 text-sm text-gray-800">{a.employeeId}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{a.reviewerId}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{a.reviewPeriod}</td>
                <td className="px-6 py-4"><span className="flex items-center gap-1 text-yellow-600 font-bold"><Star size={16} />{a.overallRating}</span></td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${a.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{a.status}</span></td>
                <td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => { setEditing(a); setShowModal(true); }} className="text-blue-600"><Edit2 size={18} /></button><button onClick={async () => { if (confirm('Delete?')) { await fetch(`http://localhost:4200/api/v1/appraisals/${a.id}`, { method: 'DELETE' }); fetch('http://localhost:4200/api/v1/appraisals').then(r => r.json()).then(setAppraisals); }}} className="text-red-600"><Trash2 size={18} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">{editing ? 'Edit' : 'Add'} Appraisal</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input name="employeeId" placeholder="Employee ID *" defaultValue={editing?.employeeId} required className="px-4 py-2 border rounded-lg" />
                <input name="reviewerId" placeholder="Reviewer ID *" defaultValue={editing?.reviewerId} required className="px-4 py-2 border rounded-lg" />
                <input name="reviewPeriod" placeholder="Period (e.g., Q1 2024)" defaultValue={editing?.reviewPeriod} required className="px-4 py-2 border rounded-lg" />
                <input name="reviewDate" type="date" defaultValue={editing?.reviewDate} required className="px-4 py-2 border rounded-lg" />
                <input name="overallRating" type="number" step="0.1" max="5" placeholder="Overall Rating *" defaultValue={editing?.overallRating} required className="px-4 py-2 border rounded-lg" />
                <select name="status" defaultValue={editing?.status || 'draft'} className="px-4 py-2 border rounded-lg"><option value="draft">Draft</option><option value="completed">Completed</option></select>
              </div>
              <textarea name="strengths" placeholder="Strengths" defaultValue={editing?.strengths} rows="2" className="w-full px-4 py-2 border rounded-lg"></textarea>
              <textarea name="areasOfImprovement" placeholder="Areas of Improvement" defaultValue={editing?.areasOfImprovement} rows="2" className="w-full px-4 py-2 border rounded-lg"></textarea>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">{editing ? 'Update' : 'Create'}</button><button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
